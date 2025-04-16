# app.py
from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from flask_mail import Mail, Message
from flask_cors import CORS
import re
import os
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import func


load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'default_development_secret_key')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///resource_sharing.db'
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME', '')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', '')


# Enable CORS for the React frontend
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"])

db = SQLAlchemy(app)
mail = Mail(app)
s = URLSafeTimedSerializer(app.secret_key)

# [!] Temporal; since get_current_user() not working
user_session = {'user_id':None, 
                'username':None}

# User and Role models (imported from resource_db_setup.py)
class Role(db.Model):
    __tablename__ = 'roles'
    role_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    users = db.relationship('User', back_populates='role')


class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String, nullable=False, unique=True)
    password_hash = db.Column(db.String, nullable=False)
    first_name = db.Column(db.String, nullable=False)
    last_name = db.Column(db.String, nullable=False)
    major = db.Column(db.String)
    phone_number = db.Column(db.String)
    is_active = db.Column(db.Boolean, default=True)  # Changed from False to True
    verification_token = db.Column(db.String)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.role_id'))
    role = db.relationship("Role", back_populates="users")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    profile_picture = db.Column(db.String)
    address = db.Column(db.String)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)

    ratings_given = db.relationship("Rating", foreign_keys='Rating.giver_id', back_populates="giver")
    ratings_received = db.relationship("Rating", foreign_keys='Rating.receiver_id', back_populates="receiver")


class FoodListing(db.Model):
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
    provider = db.relationship("User", backref="food_listings")

# app.py
class Chat(db.Model):
    __tablename__ = 'chats'
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    food_id = db.Column(db.Integer, db.ForeignKey('food_listings.food_id'))
    message = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'senderId': self.sender_id,
            'receiverId': self.receiver_id,
            'foodId': self.food_id,
            'message': self.message,
            'timestamp': self.timestamp.isoformat()
        }

class Rating(db.Model):
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




# Helper functions
def get_current_user():
    # Check JWT token or session cookie
    user_id = session.get('user_id')

    if not user_id and request.headers.get('Authorization'):
        # Extract user_id from Authorization header if present
        try:
            token = request.headers.get('Authorization').replace('Bearer ', '')
            # Add your token validation logic here
            # This is a simplified example
            data = s.loads(token, salt='auth', max_age=3600)
            user_id = data.get('user_id')
        except Exception as e:
            app.logger.error(f"Token validation error: {str(e)}")
            return None

    # Use fallback to global variable if needed
    if not user_id and 'user_id' in user_session:
        user_id = user_session['user_id']

    if user_id:
        return User.query.get(user_id)
    return None


def user_to_dict(user):
    return {
        'user_id': user.user_id,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'role': user.role.name if user.role else None,
        'phone_number': user.phone_number,
        'major': user.major,
        'profile_picture': user.profile_picture,
        'address': user.address,
        'latitude': user.latitude,
        'longitude': user.longitude
    }


def food_listing_to_dict(food):
    provider = User.query.get(food.provider_id)
    return {
        'food_id': food.food_id,
        'title': food.title,
        'description': food.description,
        'food_type': food.food_type,
        'quantity': food.quantity,
        'unit': food.unit,
        'expiration_date': food.expiration_date.isoformat() if food.expiration_date else None,
        'available_from': food.available_from.isoformat() if food.available_from else None,
        'available_until': food.available_until.isoformat() if food.available_until else None,
        'pickup_location': food.pickup_location,
        'pickup_latitude': food.pickup_latitude,
        'pickup_longitude': food.pickup_longitude,
        'status': food.status,
        'created_at': food.created_at.isoformat(),
        'provider': {
            'user_id': provider.user_id,
            'first_name': provider.first_name,
            'last_name': provider.last_name
        } if provider else None
    }


# Traditional routes (for direct browser access)
@app.route('/')
def entry():
    return render_template('entry.html')


# API routes for React frontend
@app.route('/api/signup', methods=['POST'])
def api_signup():
    data = request.json
    email = data.get('email')

    if not email.endswith('@emory.edu'):
        return jsonify({'error': 'Only @emory.edu emails are allowed.'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered.'}), 400

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
        is_active=True  # User is active by default
    )

    db.session.add(user)
    db.session.commit()
    

    # Log the user in immediately
    session['user_id'] = user.user_id

    return jsonify({
        'message': 'Registration successful',
        'user': user_to_dict(user)
    }), 201


@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    if user and check_password_hash(user.password_hash, password):
        # Set Flask session
        session['user_id'] = user.user_id

        # Update global variable (for backward compatibility)
        global user_session
        user_session["user_id"] = user.user_id
        user_session["username"] = f"{user.first_name} {user.last_name}"

        # Generate JWT token for API access
        token = s.dumps({'user_id': user.user_id}, salt='auth')

        return jsonify({
            'message': 'Logged in successfully',
            'user': user_to_dict(user),
            'token': token
        }), 200

    return jsonify({'error': 'Invalid credentials'}), 401


@app.route('/api/logout', methods=['GET'])
def api_logout():
    user_session = {} # [!]
    session.pop('user_id', None)
    return jsonify({'message': 'Logged out successfully'}), 200


@app.route('/api/reset_password_request', methods=['POST'])
def api_reset_password_request():
    data = request.json
    email = data.get('email')

    user = User.query.filter_by(email=email).first()
    if user:
        token = s.dumps(email, salt='password-reset')
        reset_url = url_for('reset_password', token=token, _external=True)
        msg = Message('Reset Your Password', sender=app.config['MAIL_USERNAME'], recipients=[email])
        msg.body = f'Click the link to reset your password: {reset_url}'
        mail.send(msg)
        return jsonify({'message': 'Password reset email sent'}), 200

    return jsonify({'error': 'Email not found'}), 404





@app.route('/api/user/profile', methods=['GET'])
def api_get_profile():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401

    return jsonify({'user': user_to_dict(user)}), 200


@app.route('/api/user/profile', methods=['PUT'])
def api_update_profile():
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Not authenticated'}), 401

        data = request.json
        
        # Validate location data if provided
        if 'latitude' in data or 'longitude' in data:
            if 'latitude' not in data or 'longitude' not in data:
                return jsonify({'error': 'Both latitude and longitude must be provided together'}), 400
            
            try:
                lat = float(data['latitude'])
                lng = float(data['longitude'])
                if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
                    raise ValueError
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid latitude/longitude values'}), 400

        # Update all allowed fields
        update_fields = [
            'first_name', 'last_name', 'phone_number',
            'major', 'address', 'latitude', 'longitude'
        ]

        updates = {}
        for field in update_fields:
            if field in data:
                setattr(user, field, data[field])
                updates[field] = data[field]

        db.session.commit()
        
        # Return the updated user data
        return jsonify({
            'message': 'Profile updated successfully',
            'updates': updates,
            'user': user_to_dict(user)
        }), 200

    except Exception as e:
        db.session.rollback()
        app.logger.error(f'Profile update error: {str(e)}')
        return jsonify({'error': 'Failed to update profile'}), 500

@app.route('/api/food_listings', methods=['GET'])
def get_food_listings():
    try:
        food_type = request.args.get('food_type')
        search_query = request.args.get('q')
        status = request.args.get('status', 'available')

        query = FoodListing.query.filter_by(status=status)

        # Exact match filtering (case-insensitive)
        if food_type and food_type.lower() != 'all':
            query = query.filter(FoodListing.food_type.ilike(food_type))  # Removed wildcards
        
        if search_query:
            search = f"%{search_query}%"
            query = query.filter(
                FoodListing.title.ilike(search) |
                FoodListing.description.ilike(search)
            )

        food_listings = query.order_by(FoodListing.created_at.desc()).all()
        
        return jsonify({
            'food_listings': [food_listing_to_dict(food) for food in food_listings]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/food_listings', methods=['POST'])
def api_create_food_listing():
    print("[POST] food_listings")
    user = get_current_user() ## Not working
    print(f"[user] {user}")
    
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401

    data = request.json
    print("[POST] Received data:", data)
    
    # Create new food listing
    new_food = FoodListing(
        provider_id=user.user_id,
        #provider_id=user_session['user_id'],
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

    # Handle date fields
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
        'food': food_listing_to_dict(new_food)
    }), 201


@app.route('/api/food_listings/<int:food_id>', methods=['GET'])
def api_get_food_listing(food_id):
    food = FoodListing.query.get(food_id)
    if not food:
        return jsonify({'error': 'Food listing not found'}), 404

    return jsonify({'food': food_listing_to_dict(food)}), 200


@app.route('/api/food_listings/<int:food_id>', methods=['PUT'])
def api_update_food_listing(food_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401

    food = FoodListing.query.get(food_id)
    if not food:
        return jsonify({'error': 'Food listing not found'}), 404

    # Check if user is the provider
    if food.provider_id != user.user_id:
        return jsonify({'error': 'Not authorized to update this listing'}), 403

    data = request.json

    # Update fields
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

    # Handle date fields
    if 'expiration_date' in data and data['expiration_date']:
        food.expiration_date = datetime.fromisoformat(data['expiration_date'].replace('Z', '+00:00'))

    if 'available_from' in data and data['available_from']:
        food.available_from = datetime.fromisoformat(data['available_from'].replace('Z', '+00:00'))

    if 'available_until' in data and data['available_until']:
        food.available_until = datetime.fromisoformat(data['available_until'].replace('Z', '+00:00'))

    db.session.commit()

    return jsonify({
        'message': 'Food listing updated successfully',
        'food': food_listing_to_dict(food)
    }), 200


@app.route('/api/food_listings/<int:food_id>', methods=['DELETE'])
def api_delete_food_listing(food_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401

    food = FoodListing.query.get(food_id)
    if not food:
        return jsonify({'error': 'Food listing not found'}), 404

    # Check if user is the provider
    if food.provider_id != user.user_id:
        return jsonify({'error': 'Not authorized to delete this listing'}), 403

    db.session.delete(food)
    db.session.commit()

    return jsonify({'message': 'Food listing deleted successfully'}), 200


# Maintain the original routes to work with templates
@app.route('/signup', methods=['POST'])
def signup():
    # Check if this is an API request (JSON) or a form submission
    if request.is_json:
        # Handle JSON data (from React)
        data = request.json
    else:
        # Handle form data (from HTML form)
        data = request.form

    email = data.get('email')
    if not email:
        if request.is_json:
            return jsonify({'error': 'Email is required'}), 400
        else:
            flash('Email is required.')
            return redirect(url_for('signup'))

    if not email.endswith('@emory.edu'):
        if request.is_json:
            return jsonify({'error': 'Only @emory.edu emails are allowed'}), 400
        else:
            flash('Only @emory.edu emails are allowed.')
            return redirect(url_for('signup'))

    if User.query.filter_by(email=email).first():
        if request.is_json:
            return jsonify({'error': 'Email already registered'}), 400
        else:
            flash('Email already registered.')
            return redirect(url_for('signup'))

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
        is_active=True  # User is active by default
    )
    db.session.add(user)
    db.session.commit()

    # Log the user in immediately
    session['user_id'] = user.user_id

    if request.is_json:
        return jsonify({
            'message': 'Registration successful',
            'user': user_to_dict(user)
        }), 201
    else:
        flash('Registration successful.')
        return redirect(url_for('entry'))




@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        if request.is_json:
            # Handle JSON data (from React)
            data = request.json
            email = data.get('email')
            password = data.get('password')
        else:
            # Handle form data (from HTML form)
            email = request.form['email']
            password = request.form['password']

        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password_hash, password):
            session['user_id'] = user.user_id

            global user_session # [!]
            user_session["user_id"] = user.user_id  # [!] Store user ID in session
            user_session["username"] = user.first_name  # [!] Store username in session (optional)            
            
            if request.is_json:
                return jsonify({
                    'message': 'Logged in successfully',
                    'user': {
                        'user_id': user.user_id,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'role': user.role.name if user.role else None
                    }
                }), 200
            else:
                flash('Logged in successfully.')
                return redirect(url_for('entry'))

        if request.is_json:
            return jsonify({'error': 'Invalid credentials'}), 401
        else:
            flash('Invalid credentials.')

    return render_template('login.html')


@app.route('/logout')
def logout():
    session.pop('user_id', None)
    user_session = {'user_id':None, 'username':None} # [!]
    flash('You have been logged out.')
    return redirect(url_for('login'))


@app.route('/reset_password_request', methods=['GET', 'POST'])
def reset_password_request():
    if request.method == 'POST':
        email = request.form['email']
        user = User.query.filter_by(email=email).first()
        if user:
            token = s.dumps(email, salt='password-reset')
            reset_url = url_for('reset_password', token=token, _external=True)
            msg = Message('Reset Your Password', sender=app.config['MAIL_USERNAME'], recipients=[email])
            msg.body = f'Click the link to reset your password: {reset_url}'
            mail.send(msg)
            flash('A password reset email has been sent.')
        else:
            flash('Email not found.')
    return render_template('reset_password_request.html')


@app.route('/reset_password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    try:
        email = s.loads(token, salt='password-reset', max_age=3600)
    except Exception as e:
        flash('The password reset link is invalid or has expired.')
        return redirect(url_for('reset_password_request'))
    if request.method == 'POST':
        new_password = request.form['password']
        user = User.query.filter_by(email=email).first()
        if user:
            user.password_hash = generate_password_hash(new_password)
            db.session.commit()
            flash('Your password has been reset. You can now log in.')
            return redirect(url_for('login'))
    return render_template('reset_password.html')

# ALTERNATIVE VERSION (using URL parameters)
@app.route('/api/sometemp/<category>/', methods=['GET'], strict_slashes=False)
def filter_items(category):
    # Your existing implementation
    query = FoodListing.query.filter_by(status='available')
    query = query.filter(FoodListing.food_type.ilike(f'%{category}%'))
    food_listings = query.order_by(FoodListing.created_at.desc()).all()
    return jsonify({'food_listings': [food_listing_to_dict(food) for food in food_listings]})

def setup_roles():
    # Seed roles if not present
    roles = ['undergrad', 'master', 'phd', 'employee', 'professor']
    for r in roles:
        if not Role.query.filter_by(name=r).first():
            db.session.add(Role(name=r))
    db.session.commit()

# Chatting
@app.route('/api/chat/<int:food_id>', methods=['GET'])
def get_chat_messages(food_id):
    food = FoodListing.query.get(food_id)
    if not food:
        return jsonify({'error': 'Food item not found'}), 404

    provider_id = food.provider_id  # Get the provider_id from FoodListing
    messages = Chat.query.filter(
        (Chat.food_id == food_id) & 
        ((Chat.sender_id == provider_id) | (Chat.receiver_id == provider_id))
    ).all()

    return jsonify({'messages': [msg.to_dict() for msg in messages]}), 200

@app.route('/api/chat/send', methods=['POST'])
def send_chat_message():
    data = request.json
    sender_id = data['senderId']
    food_id = data['foodId']  # Now we get the foodId from the request

    # Fetch the food listing based on foodId to get the providerId (receiver)
    food = FoodListing.query.get(food_id)
    if not food:
        return jsonify({'error': 'Food item not found'}), 404

    receiver_id = food.provider_id  # The provider of the food item is the receiver

    message_content = data['message']
    
    # Save the message to the database
    new_message = Chat(sender_id=sender_id, receiver_id=receiver_id, food_id=food_id, message=message_content)
    db.session.add(new_message)
    db.session.commit()
    
    return jsonify({'message': new_message.to_dict()}), 201

# fetching chats by userId
@app.route('/api/chats/<int:user_id>', methods=['GET'])
def get_chats_by_user(user_id):
    try:
        # Fetch all chats for this user, either sent or received
        chats = Chat.query.filter(
            (Chat.sender_id == user_id) | (Chat.receiver_id == user_id)
        ).all()

        # Group chats by food_id
        grouped_chats = {}
        for chat in chats:
            food_id = chat.food_id
            if food_id not in grouped_chats:
                grouped_chats[food_id] = []
            grouped_chats[food_id].append(chat)

        # Fetch food details (name, etc.) for each food_id
        grouped_chats_with_food = []
        for food_id, food_chats in grouped_chats.items():
            food = FoodListing.query.get(food_id)
            if food:
                grouped_chats_with_food.append({
                    'food_id': food_id,
                    'food_title': food.title,
                    'chats': [
                        {
                            'sender_id': chat.sender_id,
                            'receiver_id': chat.receiver_id,
                            'message': chat.message,
                            'timestamp': chat.timestamp.isoformat()
                        }
                        for chat in food_chats
                    ]
                })

        return jsonify({'chats': grouped_chats_with_food}), 200

    except Exception as e:
        print(f"Error fetching chats: {e}")
        return jsonify({'error': 'Failed to fetch chats'}), 500

# Load all the chat
@app.route('/api/chat-list/<int:user_id>', methods=['GET'])
def get_chat_list(user_id):
    chats = Chat.query.filter(
        (Chat.sender_id == user_id) | (Chat.receiver_id == user_id)
    ).all()

    food_chats = {}
    for chat in chats:
        if chat.food_id not in food_chats:
            food_chats[chat.food_id] = {
                'foodId': chat.food_id,
                'messages': [],
            }
        food_chats[chat.food_id]['messages'].append({
            'senderId': chat.sender_id,
            'receiverId': chat.receiver_id,
            'message': chat.message,
            'timestamp': chat.timestamp,
        })

    result = []
    for food_id, chat_data in food_chats.items():
        food_item = FoodListing.query.get(food_id)
        if food_item:
            result.append({
                'foodId': food_item.food_id,
                'foodTitle': food_item.title,
                'messages': chat_data['messages']
            })

    return jsonify({'chats': result}), 200

@app.route('/api/food-postings', methods=['GET'])
def get_user_food_postings():
    posted_food = FoodListing.query.filter_by(provider_id=user_session['user_id']).all()
    postings = [{
        'id': food.food_id,
        'title': food.title,
        'status': food.status,
        'created_at': food.created_at
    } for food in posted_food]
    return jsonify({'postings': postings}), 200

@app.route('/api/food-interested', methods=['GET'])
def get_user_food_interested():
    interacted_food = FoodListing.query.filter(
        FoodListing.food_id.in_(
            [chat.food_id for chat in Chat.query.filter_by(sender_id=user_session['user_id']).all()]
        )
    ).all()
    chats = Chat.query.filter_by(sender_id=user_session['user_id']).all()

    food_list = [{
        'id': food.food_id,
        'title': food.title,
        'status': food.status,
        'created_at': food.created_at
    } for food in interacted_food]

    return jsonify({'interacted': food_list}), 200

## To add test data
@app.route('/add_test_data', methods=['GET'])
def add_test_data():
    # Create a new role if it doesn't exist
    if not Role.query.filter_by(name="Undergrad").first():
        new_role = Role(name="Undergrad")
        db.session.add(new_role)
        db.session.commit()
    
    # Create a test user
    test_user = User(
        email='testuser@emory.edu',
        password_hash=generate_password_hash('password123'),
        first_name='John',
        last_name='Doe',
        is_active=True,
        role_id=Role.query.filter_by(name="Undergrad").first().role_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.session.add(test_user)
    db.session.commit()

    # Create a food listing for the user
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

    return jsonify({'message': 'Test data added successfully!'}), 200

@app.route('/api/ratings', methods=['POST'])
def submit_rating():
    data = request.json

    try:
        rating = Rating(
            giver_id=data['giver_id'],
            receiver_id=data['receiver_id'],
            resource_id=data['resource_id'],
            resource_type=data['resource_type'],
            score=data['score'],
            comment=data.get('comment', '')
        )
        db.session.add(rating)
        db.session.commit()
        return jsonify({'message': 'Rating submitted successfully'}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
    
@app.route('/api/users/<int:user_id>/rating', methods=['GET'])
def get_average_user_rating(user_id):
    try:
        avg_rating = db.session.query(func.avg(Rating.score)) \
            .filter(Rating.receiver_id == user_id) \
            .scalar()

        count = db.session.query(func.count(Rating.rating_id)) \
            .filter(Rating.receiver_id == user_id) \
            .scalar()

        return jsonify({
            'average_rating': round(avg_rating, 1) if avg_rating else 0,
            'rating_count': count
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 400

@app.route('/api/ratings/check', methods=['POST'])
def check_rating_exists():
    data = request.get_json()
    giver_id = data.get("giver_id")
    receiver_id = data.get("receiver_id")
    resource_id = data.get("resource_id")
    resource_type = data.get("resource_type")

    existing_rating = Rating.query.filter_by(
        giver_id=giver_id,
        receiver_id=receiver_id,
        resource_id=resource_id,
        resource_type=resource_type
    ).first()

    return jsonify({"already_rated": existing_rating is not None})

    
    
if __name__ == '__main__':
    with app.app_context():
        #db.drop_all()
        db.create_all()
        setup_roles()
        #add_test_data()
    app.run(debug=True, port=5001)

