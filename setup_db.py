#!/usr/bin/env python3
"""
Database setup script for FoodShare.

This script initializes the database, creates tables, and adds test data.
"""
import os
import sys

# Add the backend directory to the Python path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
sys.path.append(backend_dir)

try:
    from app import create_app, db
    from app.models.user import User, Role
    from app.models.food import FoodListing
    from app.models.chat import Chat
    from app.models.rating import Rating
    from app.utils.setup import setup_roles
    from werkzeug.security import generate_password_hash
    from datetime import datetime, timedelta

    def setup_database():
        """Set up the database with initial data."""
        print("Setting up database...")
        
        # Create app context
        app = create_app()
        with app.app_context():
            # Create tables
            print("Creating database tables...")
            db.create_all()
            
            # Set up roles
            print("Setting up roles...")
            setup_roles()
            
            # Add test users if they don't exist
            print("Adding test users...")
            add_test_users()
            
            # Add test food listings
            print("Adding test food listings...")
            add_test_food_listings()
            
            # Add test ratings
            print("Adding test ratings...")
            add_test_ratings()
            
            # Add test chat messages
            print("Adding test chat messages...")
            add_test_chat_messages()
            
            print("Database setup complete!")

    def add_test_users():
        """Add test users to the database."""
        # Get roles
        undergrad_role = Role.query.filter_by(name="undergrad").first()
        master_role = Role.query.filter_by(name="master").first()
        
        # Create test users if they don't exist
        test_users = [
            {
                'email': 'alice@emory.edu',
                'password': 'password123',
                'first_name': 'Alice',
                'last_name': 'Johnson',
                'role_id': undergrad_role.role_id,
                'major': 'Computer Science',
                'phone_number': '123-456-7890'
            },
            {
                'email': 'bob@emory.edu',
                'password': 'password123',
                'first_name': 'Bob',
                'last_name': 'Smith',
                'role_id': master_role.role_id,
                'major': 'Biology',
                'phone_number': '098-765-4321'
            }
        ]
        
        for user_data in test_users:
            if not User.query.filter_by(email=user_data['email']).first():
                user = User(
                    email=user_data['email'],
                    password_hash=generate_password_hash(user_data['password']),
                    first_name=user_data['first_name'],
                    last_name=user_data['last_name'],
                    role_id=user_data['role_id'],
                    major=user_data['major'],
                    phone_number=user_data['phone_number'],
                    is_active=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.session.add(user)
        
        db.session.commit()

    def add_test_food_listings():
        """Add test food listings to the database."""
        # Get users
        alice = User.query.filter_by(email='alice@emory.edu').first()
        bob = User.query.filter_by(email='bob@emory.edu').first()
        
        if not alice or not bob:
            print("Users not found. Skipping food listings.")
            return
        
        # Create test food listings
        test_foods = [
            {
                'provider_id': alice.user_id,
                'title': 'Fresh Apples',
                'description': 'A batch of fresh apples from the farmers market.',
                'food_type': 'Fruit',
                'quantity': 10,
                'unit': 'item(s)',
                'allergens': None,
                'pickup_location': 'Woodruff Library',
                'pickup_latitude': 33.789,
                'pickup_longitude': -84.326,
                'expiration_date': datetime.utcnow() + timedelta(days=5),
                'available_from': datetime.utcnow(),
                'available_until': datetime.utcnow() + timedelta(days=2)
            },
            {
                'provider_id': bob.user_id,
                'title': 'Leftover Pizza',
                'description': 'Leftover pizza from department event. Still fresh!',
                'food_type': 'Prepared',
                'quantity': 8,
                'unit': 'slice(s)',
                'allergens': 'Dairy, Gluten',
                'pickup_location': 'Biology Department Lounge',
                'pickup_latitude': 33.792,
                'pickup_longitude': -84.324,
                'expiration_date': datetime.utcnow() + timedelta(days=1),
                'available_from': datetime.utcnow(),
                'available_until': datetime.utcnow() + timedelta(hours=6)
            },
            {
                'provider_id': alice.user_id,
                'title': 'Organic Bananas',
                'description': 'Organic bananas, perfect for smoothies.',
                'food_type': 'Fruit',
                'quantity': 6,
                'unit': 'item(s)',
                'allergens': None,
                'pickup_location': 'Student Center',
                'pickup_latitude': 33.790,
                'pickup_longitude': -84.322,
                'expiration_date': datetime.utcnow() + timedelta(days=3),
                'available_from': datetime.utcnow(),
                'available_until': datetime.utcnow() + timedelta(days=1)
            }
        ]
        
        # Add food listings if they don't exist
        for food_data in test_foods:
            if not FoodListing.query.filter_by(
                provider_id=food_data['provider_id'], 
                title=food_data['title']
            ).first():
                food = FoodListing(
                    provider_id=food_data['provider_id'],
                    title=food_data['title'],
                    description=food_data['description'],
                    food_type=food_data['food_type'],
                    quantity=food_data['quantity'],
                    unit=food_data['unit'],
                    allergens=food_data['allergens'],
                    pickup_location=food_data['pickup_location'],
                    pickup_latitude=food_data['pickup_latitude'],
                    pickup_longitude=food_data['pickup_longitude'],
                    expiration_date=food_data['expiration_date'],
                    available_from=food_data['available_from'],
                    available_until=food_data['available_until'],
                    status='available',
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.session.add(food)
        
        db.session.commit()

    def add_test_ratings():
        """Add test ratings to the database."""
        # Get users
        alice = User.query.filter_by(email='alice@emory.edu').first()
        bob = User.query.filter_by(email='bob@emory.edu').first()
        
        if not alice or not bob:
            print("Users not found. Skipping ratings.")
            return
        
        # Get food listings
        food_listings = FoodListing.query.all()
        if not food_listings:
            print("No food listings found. Skipping ratings.")
            return
        
        # Create test ratings
        test_ratings = [
            {
                'giver_id': alice.user_id,
                'receiver_id': bob.user_id,
                'resource_id': food_listings[1].food_id if len(food_listings) > 1 else food_listings[0].food_id,
                'resource_type': 'food',
                'score': 5,
                'comment': 'Great pizza, prompt communication!'
            },
            {
                'giver_id': bob.user_id,
                'receiver_id': alice.user_id,
                'resource_id': food_listings[0].food_id,
                'resource_type': 'food',
                'score': 4,
                'comment': 'Apples were fresh and delicious.'
            }
        ]
        
        # Add ratings if they don't exist
        for rating_data in test_ratings:
            if not Rating.query.filter_by(
                giver_id=rating_data['giver_id'],
                receiver_id=rating_data['receiver_id'],
                resource_id=rating_data['resource_id']
            ).first():
                rating = Rating(
                    giver_id=rating_data['giver_id'],
                    receiver_id=rating_data['receiver_id'],
                    resource_id=rating_data['resource_id'],
                    resource_type=rating_data['resource_type'],
                    score=rating_data['score'],
                    comment=rating_data['comment'],
                    created_at=datetime.utcnow()
                )
                db.session.add(rating)
        
        db.session.commit()

    def add_test_chat_messages():
        """Add test chat messages to the database."""
        # Get users
        alice = User.query.filter_by(email='alice@emory.edu').first()
        bob = User.query.filter_by(email='bob@emory.edu').first()
        
        if not alice or not bob:
            print("Users not found. Skipping chat messages.")
            return
        
        # Get food listings
        food_listings = FoodListing.query.all()
        if not food_listings:
            print("No food listings found. Skipping chat messages.")
            return
        
        # Create test chat messages
        test_messages = [
            {
                'sender_id': bob.user_id,
                'receiver_id': alice.user_id,
                'message': 'Hi Alice, are the apples still available?',
                'food_id': food_listings[0].food_id,
                'timestamp': datetime.utcnow() - timedelta(hours=2),
                'is_read': True
            },
            {
                'sender_id': alice.user_id,
                'receiver_id': bob.user_id,
                'message': 'Yes, they are! When would you like to pick them up?',
                'food_id': food_listings[0].food_id,
                'timestamp': datetime.utcnow() - timedelta(hours=1, minutes=45),
                'is_read': True
            },
            {
                'sender_id': bob.user_id,
                'receiver_id': alice.user_id,
                'message': 'Could I come by around 3pm today?',
                'food_id': food_listings[0].food_id,
                'timestamp': datetime.utcnow() - timedelta(hours=1, minutes=30),
                'is_read': True
            },
            {
                'sender_id': alice.user_id,
                'receiver_id': bob.user_id,
                'message': 'That works for me! See you then.',
                'food_id': food_listings[0].food_id,
                'timestamp': datetime.utcnow() - timedelta(hours=1),
                'is_read': False
            },
            {
                'sender_id': alice.user_id,
                'receiver_id': bob.user_id,
                'message': 'Hi Bob, is your pizza still available?',
                'food_id': food_listings[1].food_id if len(food_listings) > 1 else food_listings[0].food_id,
                'timestamp': datetime.utcnow() - timedelta(minutes=45),
                'is_read': True
            },
            {
                'sender_id': bob.user_id,
                'receiver_id': alice.user_id,
                'message': 'Yes, it is! Would you like some?',
                'food_id': food_listings[1].food_id if len(food_listings) > 1 else food_listings[0].food_id,
                'timestamp': datetime.utcnow() - timedelta(minutes=30),
                'is_read': False
            }
        ]
        
        # Add chat messages
        for message_data in test_messages:
            message = Chat(
                sender_id=message_data['sender_id'],
                receiver_id=message_data['receiver_id'],
                message=message_data['message'],
                food_id=message_data['food_id'],
                timestamp=message_data['timestamp'],
                is_read=message_data['is_read']
            )
            db.session.add(message)
        
        db.session.commit()

    if __name__ == '__main__':
        setup_database()
        
except ImportError as e:
    print(f"Error importing modules: {e}")
    print("Make sure you have the correct structure and all required packages are installed.")
    print(f"Current Python path: {sys.path}")
    sys.exit(1)