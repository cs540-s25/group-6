"""
Authentication routes for the FoodShare application.
"""
from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from app import db, serializer, mail
from app.models.user import User, Role
from app.utils.auth import get_current_user
from flask_mail import Message

auth_bp = Blueprint('auth', __name__, url_prefix='/api')

@auth_bp.route('/signup', methods=['POST'])
def signup():
    """
    Register a new user.
    
    Returns:
        JSON response with user data on success or error message.
    """
    try:
        data = request.json
        email = data.get('email')
        
        # Validate Emory email
        if not email.endswith('@emory.edu'):
            return jsonify({'error': 'Only @emory.edu emails are allowed.'}), 400
        
        # Check if email already exists
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered.'}), 400
        
        # Create new user
        hashed_pw = generate_password_hash(data.get('password'))
        role = Role.query.filter_by(name=data.get('role')).first()
        
        user = User(
            email=email,
            password_hash=hashed_pw,
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            phone_number=data.get('phone_number'),
            major=data.get('major'),
            role=role,
            is_active=True
        )
        
        db.session.add(user)
        db.session.commit()
        
        # Log user in
        session['user_id'] = user.user_id
        
        # Generate token for returning
        token = serializer.dumps({'user_id': user.user_id}, salt='auth')
        
        return jsonify({
            'message': 'Registration successful',
            'user': user.to_dict(),
            'token': token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Log in a user.
    
    Returns:
        JSON response with user data and token on success or error message.
    """
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        user = User.query.filter_by(email=email).first()
        
        # Check credentials
        if user and check_password_hash(user.password_hash, password):
            session['user_id'] = user.user_id
            
            # Generate token
            token = serializer.dumps({'user_id': user.user_id}, salt='auth')
            
            return jsonify({
                'message': 'Logged in successfully',
                'user': user.to_dict(),
                'token': token
            }), 200
        
        return jsonify({'error': 'Invalid credentials'}), 401
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/logout', methods=['GET'])
def logout():
    """
    Log out the current user.
    
    Returns:
        JSON response confirming logout.
    """
    session.pop('user_id', None)
    return jsonify({'message': 'Logged out successfully'}), 200


@auth_bp.route('/reset_password_request', methods=['POST'])
def reset_password_request():
    """
    Request a password reset.
    
    Returns:
        JSON response confirming email sent.
    """
    try:
        data = request.json
        email = data.get('email')
        user = User.query.filter_by(email=email).first()
        
        if user:
            # Generate token
            token = serializer.dumps(email, salt='password-reset')
            
            # Create reset URL (would use url_for with _external=True in production)
            reset_url = f"{request.host_url}reset_password/{token}"
            
            # Send email
            msg = Message(
                'Reset Your Password',
                sender=mail.username,
                recipients=[email]
            )
            msg.body = f'Click the link to reset your password: {reset_url}'
            mail.send(msg)
            
            return jsonify({'message': 'Password reset email sent'}), 200
        
        return jsonify({'error': 'Email not found'}), 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500