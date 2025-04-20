"""
Rating model for the FoodShare application.
"""
from datetime import datetime
from app import db

class Rating(db.Model):
    """Rating model for storing user and item ratings."""
    
    __tablename__ = 'ratings'

    rating_id = db.Column(db.Integer, primary_key=True)
    giver_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    resource_id = db.Column(db.Integer, nullable=False)
    resource_type = db.Column(db.String, nullable=False)  # 'food', 'book', 'delivery', 'user'
    score = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    giver = db.relationship("User", foreign_keys=[giver_id], back_populates="ratings_given")
    receiver = db.relationship("User", foreign_keys=[receiver_id], back_populates="ratings_received")
    
    def __repr__(self):
        return f"<Rating {self.rating_id}: {self.giver_id} -> {self.receiver_id} ({self.score})>"
    
    def to_dict(self):
        """Convert rating model to dictionary."""
        return {
            'rating_id': self.rating_id,
            'giver_id': self.giver_id,
            'receiver_id': self.receiver_id,
            'resource_id': self.resource_id,
            'resource_type': self.resource_type,
            'score': self.score,
            'comment': self.comment,
            'created_at': self.created_at.isoformat()
        }