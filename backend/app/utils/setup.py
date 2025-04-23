"""
Setup utilities for the FoodShare application.
"""
from app import db
from app.models.user import Role
from werkzeug.security import generate_password_hash
from datetime import datetime

def setup_roles():
    """
    Create default roles if they don't exist.
    """
    roles = ['undergrad', 'master', 'phd', 'employee', 'professor']
    for role_name in roles:
        if not Role.query.filter_by(name=role_name).first():
            db.session.add(Role(name=role_name))
    db.session.commit()


def add_test_data():
    """
    Add test data for development and testing.
    """
    from app.models.food import FoodListing
    from app.models.user import User
    
    # Ensure 'Undergrad' role exists
    undergrad_role = Role.query.filter_by(name="Undergrad").first()
    if not undergrad_role:
        undergrad_role = Role(name="Undergrad")
        db.session.add(undergrad_role)
        db.session.commit()
    
    # Create test user if it doesn't exist
    test_user = User.query.filter_by(email='testuser@emory.edu').first()
    if not test_user:
        test_user = User(
            email='testuser@emory.edu',
            password_hash=generate_password_hash('password123'),
            first_name='John',
            last_name='Doe',
            is_active=True,
            role_id=undergrad_role.role_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.session.add(test_user)
        db.session.commit()
    
    # Create test food listing if it doesn't exist
    if not FoodListing.query.filter_by(title='Fresh Apples').first():
        test_food = FoodListing(
            provider_id=test_user.user_id,
            title='Fresh Apples',
            description='A batch of fresh apples.',
            food_type='Fruit',
            quantity=10,
            unit='item(s)',
            pickup_location='Woodruff Library',
            available_from=datetime(2025, 3, 31, 12, 0),
            available_until=datetime(2025, 4, 2, 12, 0),
            status='available',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.session.add(test_food)
        db.session.commit()