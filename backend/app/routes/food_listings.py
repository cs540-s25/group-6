"""
Food listing routes for the FoodShare application.
"""
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from sqlalchemy import func
from math import radians, cos, sin, asin, sqrt
from app import db
from app.models.food import FoodListing
from app.models.user import User
from app.utils.auth import get_current_user

food_bp = Blueprint('food', __name__, url_prefix='/api')

@food_bp.route('/food_listings', methods=['GET'])
def get_food_listings():
    """
    Get food listings with optional filtering.
    
    Query parameters:
        food_type: Filter by food type
        q: Search query
        status: Filter by status (default: available)
        max_distance: Maximum distance from user in miles
        min_expiration_days: Minimum days until expiration
        latitude: User latitude for distance calculation
        longitude: User longitude for distance calculation
        
    Returns:
        JSON response with filtered food listings
    """
    try:
        # Parse query parameters
        food_type = request.args.get('food_type')
        search_query = request.args.get('q')
        status = request.args.get('status', 'available')
        max_distance = request.args.get('max_distance', type=float)
        min_expiration_days = request.args.get('min_expiration_days', type=int)
        latitude = request.args.get('latitude', type=float)
        longitude = request.args.get('longitude', type=float)

        # Build base query
        query = FoodListing.query.filter_by(status=status)
        
        # Apply food type filter
        if food_type and food_type.lower() != 'all':
            query = query.filter(FoodListing.food_type.ilike(food_type))
        
        # Apply search filter
        if search_query:
            search = f"%{search_query}%"
            query = query.join(User).filter(
                FoodListing.title.ilike(search) |
                FoodListing.description.ilike(search) |
                User.first_name.ilike(search) |
                User.last_name.ilike(search) |
                (User.first_name + ' ' + User.last_name).ilike(search)
            )
        
        # Apply expiration filter
        if min_expiration_days is not None:
            min_expiration_date = datetime.utcnow() + timedelta(days=min_expiration_days)
            query = query.filter(FoodListing.expiration_date >= min_expiration_date)

        # Get all listings before distance filtering
        all_listings = query.all()
        
        # Apply distance filter
        if max_distance is None or latitude is None or longitude is None:
            filtered_listings = all_listings
        else:
            filtered_listings = []
            
            for listing in all_listings:
                # Include listings without location data
                if listing.pickup_latitude is None or listing.pickup_longitude is None:
                    filtered_listings.append(listing)
                    continue
                
                # Calculate Haversine distance
                try:
                    lat1, lon1 = radians(latitude), radians(longitude)
                    lat2, lon2 = radians(listing.pickup_latitude), radians(listing.pickup_longitude)
                    
                    dlon = lon2 - lon1
                    dlat = lat2 - lat1
                    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                    c = 2 * asin(sqrt(a))
                    r = 3956  # Radius of Earth in miles
                    dist = c * r
                    
                    if dist <= max_distance:
                        filtered_listings.append(listing)
                        
                except Exception as e:
                    # Include the listing if there's an error in calculation
                    filtered_listings.append(listing)
        
        # Sort by created_at
        filtered_listings.sort(key=lambda x: x.created_at, reverse=True)
        
        return jsonify({
            'food_listings': [food.to_dict() for food in filtered_listings]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@food_bp.route('/food_listings', methods=['POST'])
def create_food_listing():
    """
    Create a new food listing.
    
    Returns:
        JSON response with created food listing data
    """
    # Check authentication
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        data = request.json
        
        # Create new food listing
        new_food = FoodListing(
            provider_id=current_user.user_id,
            title=data.get('title'),
            description=data.get('description'),
            food_type=data.get('food_type'),
            quantity=data.get('quantity'),
            unit=data.get('unit'),
            allergens=data.get('allergens'),
            pickup_location=data.get('pickup_location'),
            pickup_latitude=data.get('pickup_latitude'),
            pickup_longitude=data.get('pickup_longitude'),
            status='available'
        )
        
        # Parse date strings
        if 'expiration_date' in data and data['expiration_date']:
            new_food.expiration_date = datetime.fromisoformat(data['expiration_date'].replace('Z', '+00:00'))
        if 'available_from' in data and data['available_from']:
            new_food.available_from = datetime.fromisoformat(data['available_from'].replace('Z', '+00:00'))
        if 'available_until' in data and data['available_until']:
            new_food.available_until = datetime.fromisoformat(data['available_until'].replace('Z', '+00:00'))
        
        db.session.add(new_food)
        db.session.commit()
        
        return jsonify({
            'message': 'Food listing created successfully',
            'food': new_food.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@food_bp.route('/food_listings/<int:food_id>', methods=['GET'])
def get_food_listing(food_id):
    """
    Get a specific food listing by ID.
    
    Args:
        food_id: ID of the food listing
        
    Returns:
        JSON response with food listing data
    """
    food = FoodListing.query.get(food_id)
    if not food:
        return jsonify({'error': 'Food listing not found'}), 404
    
    return jsonify({'food': food.to_dict()}), 200


@food_bp.route('/food_listings/<int:food_id>', methods=['PUT'])
def update_food_listing(food_id):
    """
    Update a specific food listing.
    
    Args:
        food_id: ID of the food listing to update
        
    Returns:
        JSON response with updated food listing data
    """
    # Check authentication
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Get food listing
    food = FoodListing.query.get(food_id)
    if not food:
        return jsonify({'error': 'Food listing not found'}), 404
    
    # Check authorization
    if food.provider_id != current_user.user_id:
        return jsonify({'error': 'Not authorized to update this listing'}), 403
    
    try:
        data = request.json
        
        # Update fields if provided
        if 'title' in data:
            food.title = data['title']
        if 'description' in data:
            food.description = data['description']
        if 'food_type' in data:
            food.food_type = data['food_type']
        if 'quantity' in data:
            food.quantity = data['quantity']
        if 'unit' in data:
            food.unit = data['unit']
        if 'allergens' in data:
            food.allergens = data['allergens']
        if 'pickup_location' in data:
            food.pickup_location = data['pickup_location']
        if 'pickup_latitude' in data:
            food.pickup_latitude = data['pickup_latitude']
        if 'pickup_longitude' in data:
            food.pickup_longitude = data['pickup_longitude']
        if 'status' in data:
            food.status = data['status']
            
        # Parse date strings
        if 'expiration_date' in data and data['expiration_date']:
            food.expiration_date = datetime.fromisoformat(data['expiration_date'].replace('Z', '+00:00'))
        if 'available_from' in data and data['available_from']:
            food.available_from = datetime.fromisoformat(data['available_from'].replace('Z', '+00:00'))
        if 'available_until' in data and data['available_until']:
            food.available_until = datetime.fromisoformat(data['available_until'].replace('Z', '+00:00'))
        
        db.session.commit()
        
        return jsonify({
            'message': 'Food listing updated successfully',
            'food': food.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@food_bp.route('/food_listings/<int:food_id>', methods=['DELETE'])
def delete_food_listing(food_id):
    """
    Delete a specific food listing.
    
    Args:
        food_id: ID of the food listing to delete
        
    Returns:
        JSON response confirming deletion
    """
    # Check authentication
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Get food listing
    food = FoodListing.query.get(food_id)
    if not food:
        return jsonify({'error': 'Food listing not found'}), 404
    
    # Check authorization
    if food.provider_id != current_user.user_id:
        return jsonify({'error': 'Not authorized to delete this listing'}), 403
    
    try:
        db.session.delete(food)
        db.session.commit()
        
        return jsonify({'message': 'Food listing deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@food_bp.route('/user/<int:user_id>/posts', methods=['GET'])
def get_posts_by_user(user_id):
    """
    Get all food listings posted by a specific user.
    
    Args:
        user_id: ID of the user
        
    Returns:
        JSON response with user's food listings
    """
    try:
        listings = FoodListing.query.filter_by(provider_id=user_id).order_by(FoodListing.created_at.desc()).all()
        
        return jsonify({
            'food_listings': [food.to_dict() for food in listings]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500