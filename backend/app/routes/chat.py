"""
Chat routes for the FoodShare application.
"""
from flask import Blueprint, request, jsonify
from app import db
from app.models.chat import Chat
from app.models.user import User
from app.models.food import FoodListing
from app.utils.auth import get_current_user

chat_bp = Blueprint('chat', __name__, url_prefix='/api')

@chat_bp.route('/chat-list/<int:user_id>', methods=['GET'])
def get_chat_list(user_id):
    """
    Get a list of conversations for a specific user.
    
    Args:
        user_id: ID of the user
        
    Returns:
        JSON response with conversations list
    """
    try:
        # Get all chats involving the user
        chats = Chat.query.filter(
            (Chat.sender_id == user_id) | (Chat.receiver_id == user_id)
        ).order_by(Chat.timestamp.desc()).all()
        
        # Group chats by conversation (other user)
        conversations = {}
        for chat in chats:
            # Determine the other user in the conversation
            other_user_id = chat.receiver_id if chat.sender_id == user_id else chat.sender_id
            
            # Add to conversation dictionary if not already present
            if other_user_id not in conversations:
                conversations[other_user_id] = {
                    'otherUserId': other_user_id,
                    'messages': [],
                    'foodId': chat.food_id
                }
            
            # Add message to conversation
            conversations[other_user_id]['messages'].append(chat.to_dict())
        
        # Format conversations for response
        result = []
        for other_user_id, convo in conversations.items():
            # Get other user and food info
            other_user = User.query.get(other_user_id)
            food = FoodListing.query.get(convo['foodId']) if convo['foodId'] else None
            
            if other_user:
                result.append({
                    'otherUser': {
                        'user_id': other_user.user_id,
                        'first_name': other_user.first_name,
                        'last_name': other_user.last_name
                    },
                    'latestMessage': convo['messages'][0],
                    'foodTitle': food.title if food else None
                })
        
        return jsonify({'conversations': result}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch conversations: {str(e)}'}), 500