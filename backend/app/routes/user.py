"""
User profile routes for the FoodShare application.
"""
from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from app.models.food import FoodListing
from app.utils.auth import get_current_user

user_bp = Blueprint('user', __name__, url_prefix='/api')

@user_bp.route('/user/profile', methods=['GET'])
def get_profile():
    """
    Get the current user's profile.
    
    Returns:
        JSON response with user profile data
    """
    current_user = get_current_user()
    
    if not current_user:
        return jsonify({'error': 'Not authenticated'}), 401
    
    return jsonify({'user': current_user.to_dict()}), 200


@user_bp.route('/user/profile', methods=['PUT'])
def update_profile():
    """
    Update the current user's profile.
    
    Returns:
        JSON response with updated user profile data
    """
    try:
        current_user = get_current_user()
        
        if not current_user:
            return jsonify({'error': 'Not authenticated'}), 401
        
        data = request.json
        
        # Validate latitude/longitude
        if 'latitude' in data or 'longitude' in data:
            if 'latitude' not in data or 'longitude' not in data:
                return jsonify({'error': 'Both latitude and longitude must be provided together'}), 400
            
            try:
                lat = float(data['latitude'])
                lng = float(data['longitude'])
                
                if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
                    raise ValueError
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid latitude/longitude values'}), 400
        
        # Update user fields
        update_fields = [
            'first_name', 'last_name', 'phone_number',
            'major', 'address', 'latitude', 'longitude'
        ]
        
        updates = {}
        for field in update_fields:
            if field in data:
                setattr(current_user, field, data[field])
                updates[field] = data[field]
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'updates': updates,
            'user': current_user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update profile: {str(e)}'}), 500


@user_bp.route('/food-postings', methods=['GET'])
def get_user_food_postings():
    """
    Get food listings posted by the current user.
    
    Returns:
        JSON response with user's food listings
    """
    current_user = get_current_user()
    
    if not current_user:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        posted_food = FoodListing.query.filter_by(provider_id=current_user.user_id).all()
        
        postings = [{
            'id': food.food_id,
            'title': food.title,
            'status': food.status,
            'created_at': food.created_at
        } for food in posted_food]
        
        return jsonify({'postings': postings}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@user_bp.route('/food-interested', methods=['GET'])
def get_user_food_interested():
    """
    Get food listings that the current user has interacted with.
    
    Returns:
        JSON response with food listings the user has interacted with
    """
    current_user = get_current_user()
    
    if not current_user:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        # Query for foods the user has chatted about
        from app.models.chat import Chat
        
        interacted_food_ids = db.session.query(Chat.food_id) \
            .filter(Chat.sender_id == current_user.user_id, Chat.food_id.isnot(None)) \
            .distinct().all()
        
        food_ids = [id[0] for id in interacted_food_ids if id[0] is not None]
        
        interacted_food = FoodListing.query.filter(FoodListing.food_id.in_(food_ids)).all()
        
        food_list = [{
            'id': food.food_id,
            'title': food.title,
            'status': food.status,
            'created_at': food.created_at
        } for food in interacted_food]
        
        return jsonify({'interacted': food_list}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500