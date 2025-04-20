"""
Chat model for the FoodShare application.
"""
from datetime import datetime
from app import db

class Chat(db.Model):
    """Chat model for storing messages between users."""
    
    __tablename__ = 'chats'
    
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    message = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)
    food_id = db.Column(db.Integer, db.ForeignKey('food_listings.food_id'), nullable=True)
    
    def __repr__(self):
        return f"<Chat {self.id}: {self.sender_id} -> {self.receiver_id}>"
    
    def to_dict(self):
        """Convert chat model to dictionary."""
        return {
            'id': self.id,
            'senderId': self.sender_id,
            'receiverId': self.receiver_id,
            'message': self.message,
            'timestamp': self.timestamp.isoformat(),
            'isRead': self.is_read,
            'foodId': self.food_id
        }