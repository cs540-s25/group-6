"""
Authentication utilities for the FoodShare application.
"""
from flask import session, request
from app.models.user import User
from app import serializer

# Global user session (for backward compatibility)
user_session = {'user_id': None, 'username': None}

def get_current_user():
    """
    Get the currently authenticated user.
    
    Checks for user ID in session, then in the Authorization header,
    and finally in the global user_session.
    
    Returns:
        User: The current user or None if not authenticated
    """
    user_id = session.get('user_id')
    
    # Check Authorization header if no session
    if not user_id and request.headers.get('Authorization'):
        try:
            token = request.headers.get('Authorization').replace('Bearer ', '')
            data = serializer.loads(token, salt='auth', max_age=3600)
            user_id = data.get('user_id')
        except Exception as e:
            print(f"Token validation error: {str(e)}")
            return None
    
    # Check global user_session if no session or token
    if not user_id and 'user_id' in user_session:
        user_id = user_session['user_id']
    
    # Get user from database
    if user_id:
        return User.query.get(user_id)
    
    return None


def set_user_session(user):
    """
    Set both Flask session and global user_session.
    
    Args:
        user: User model instance
    """
    session['user_id'] = user.user_id
    global user_session
    user_session['user_id'] = user.user_id
    user_session['username'] = f"{user.first_name} {user.last_name}"


def clear_user_session():
    """
    Clear both Flask session and global user_session.
    """
    session.pop('user_id', None)
    global user_session
    user_session['user_id'] = None
    user_session['username'] = None


def generate_auth_token(user_id):
    """
    Generate an authentication token for a user.
    
    Args:
        user_id: User ID to encode in the token
        
    Returns:
        str: Generated token
    """
    return serializer.dumps({'user_id': user_id}, salt='auth')