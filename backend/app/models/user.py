"""
User and Role models for the FoodShare application.
"""
from datetime import datetime
from app import db

class Role(db.Model):
    """Role model defining user permissions and access levels."""
    
    __tablename__ = 'roles'
    
    role_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    users = db.relationship('User', back_populates='role')
    
    def __repr__(self):
        return f"<Role {self.name}>"


class User(db.Model):
    """User model for authentication and profile information."""
    
    __tablename__ = 'users'
    
    user_id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String, nullable=False, unique=True)
    password_hash = db.Column(db.String, nullable=False)
    first_name = db.Column(db.String, nullable=False)
    last_name = db.Column(db.String, nullable=False)
    major = db.Column(db.String)
    phone_number = db.Column(db.String)
    is_active = db.Column(db.Boolean, default=True)
    verification_token = db.Column(db.String)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.role_id'))
    role = db.relationship("Role", back_populates="users")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    profile_picture = db.Column(db.String)
    address = db.Column(db.String)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    
    # Relationships
    ratings_given = db.relationship("Rating", foreign_keys='Rating.giver_id', back_populates="giver")
    ratings_received = db.relationship("Rating", foreign_keys='Rating.receiver_id', back_populates="receiver")
    food_listings = db.relationship("FoodListing", back_populates="provider")
    
    def __repr__(self):
        return f"<User {self.email}>"
    
    def to_dict(self):
        """Convert user model to dictionary."""
        return {
            'user_id': self.user_id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'role': self.role.name if self.role else None,
            'phone_number': self.phone_number,
            'major': self.major,
            'profile_picture': self.profile_picture,
            'address': self.address,
            'latitude': self.latitude,
            'longitude': self.longitude
        }