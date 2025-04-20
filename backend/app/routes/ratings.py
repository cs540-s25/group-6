"""
Rating routes for the FoodShare application.
"""
from flask import Blueprint, request, jsonify
from sqlalchemy import func
from app import db
from app.models.rating import Rating
from app.utils.auth import get_current_user

ratings_bp = Blueprint('ratings', __name__, url_prefix='/api')

@ratings_bp.route('/ratings', methods=['POST'])
def submit_rating():
    """
    Submit a new rating.
    
    Returns:
        JSON response confirming the rating submission
    """
    try:
        data = request.json
        
        # Create rating
        rating = Rating(
            giver_id=data['giver_id'],
            receiver_id=data['receiver_id'],
            resource_id=data['resource_id'],
            resource_type=data['resource_type'],
            score=data['score'],
            comment=data.get('comment', '')
        )
        
        db.session.add(rating)
        db.session.commit()
        
        return jsonify({'message': 'Rating submitted successfully'}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@ratings_bp.route('/users/<int:user_id>/rating', methods=['GET'])
def get_average_user_rating(user_id):
    """
    Get the average rating for a specific user.
    
    Args:
        user_id: ID of the user
        
    Returns:
        JSON response with the user's average rating
    """
    try:
        # Calculate average rating
        avg_rating = db.session.query(func.avg(Rating.score)) \
            .filter(Rating.receiver_id == user_id) \
            .scalar()
        
        # Count total ratings
        count = db.session.query(func.count(Rating.rating_id)) \
            .filter(Rating.receiver_id == user_id) \
            .scalar()
        
        return jsonify({
            'average_rating': round(avg_rating, 1) if avg_rating else 0,
            'rating_count': count
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@ratings_bp.route('/ratings/check', methods=['POST'])
def check_rating_exists():
    """
    Check if a rating already exists.
    
    Returns:
        JSON response indicating whether the rating exists
    """
    data = request.get_json()
    giver_id = data.get("giver_id")
    receiver_id = data.get("receiver_id")
    resource_id = data.get("resource_id")
    resource_type = data.get("resource_type")

    # Check if rating exists
    existing_rating = Rating.query.filter_by(
        giver_id=giver_id,
        receiver_id=receiver_id,
        resource_id=resource_id,
        resource_type=resource_type
    ).first()

    return jsonify({"already_rated": existing_rating is not None})