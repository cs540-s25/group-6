"""
Food listing model for the FoodShare application.
"""
from datetime import datetime
from app import db
from app.models.user import User

class FoodListing(db.Model):
    """FoodListing model for storing food sharing posts."""
    
    __tablename__ = 'food_listings'
    
    food_id = db.Column(db.Integer, primary_key=True)
    provider_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    title = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    expiration_date = db.Column(db.DateTime)
    food_type = db.Column(db.String)
    allergens = db.Column(db.Text)
    quantity = db.Column(db.Integer)
    unit = db.Column(db.String)
    pickup_location = db.Column(db.String)
    pickup_latitude = db.Column(db.Float)
    pickup_longitude = db.Column(db.Float)
    available_from = db.Column(db.DateTime)
    available_until = db.Column(db.DateTime)
    status = db.Column(db.String, default="available")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    provider = db.relationship("User", back_populates="food_listings")
    
    def __repr__(self):
        return f"<FoodListing {self.food_id}: {self.title}>"
    
    def to_dict(self):
        """Convert food listing model to dictionary."""
        provider = User.query.get(self.provider_id)
        return {
            'food_id': self.food_id,
            'title': self.title,
            'description': self.description,
            'food_type': self.food_type,
            'quantity': self.quantity,
            'unit': self.unit,
            'expiration_date': self.expiration_date.isoformat() if self.expiration_date else None,
            'available_from': self.available_from.isoformat() if self.available_from else None,
            'available_until': self.available_until.isoformat() if self.available_until else None,
            'pickup_location': self.pickup_location,
            'pickup_latitude': self.pickup_latitude,
            'pickup_longitude': self.pickup_longitude,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'provider': {
                'user_id': provider.user_id,
                'first_name': provider.first_name,
                'last_name': provider.last_name
            } if provider else None
        }