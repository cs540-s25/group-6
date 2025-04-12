# app.py
from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from flask_mail import Mail, Message
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import re
import os
from datetime import datetime
from dotenv import load_dotenv

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

# Initialize Flask-SocketIO
socketio = SocketIO(app, cors_allowed_origins="http://localhost:3000")

db = SQLAlchemy(app)
mail = Mail(app)
s = URLSafeTimedSerializer(app.secret_key)

# Store user_id to socket_id mapping
user_socket_map = {}  # {user_id: socket_id}

# Temporal user_session (for backward compatibility)
user_session = {'user_id': None, 'username': None}

# Models
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
    provider = db.relationship("User", backref="food_listings")

class Chat(db.Model):
    __tablename__ = 'chats'
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    message = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)
    food_id = db.Column(db.Integer, db.ForeignKey('food_listings.food_id'), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'senderId': self.sender_id,
            'receiverId': self.receiver_id,
            'message': self.message,
            'timestamp': self.timestamp.isoformat(),
            'isRead': self.is_read,
            'foodId': self.food_id
        }

# Helper functions
def get_current_user():
    user_id = session.get('user_id')
    if not user_id and request.headers.get('Authorization'):
        try:
            token = request.headers.get('Authorization').replace('Bearer ', '')
            data = s.loads(token, salt='auth', max_age=3600)
            user_id = data.get('user_id')
        except Exception as e:
            app.logger.error(f"Token validation error: {str(e)}")
            return None
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

# SocketIO connection events
@socketio.on('connect')
def handle_connect():
    user_id = request.args.get('userId')
    if user_id:
        user_socket_map[user_id] = request.sid
        app.logger.info(f"User {user_id} connected with socket ID {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    for user_id, sid in list(user_socket_map.items()):
        if sid == request.sid:
            del user_socket_map[user_id]
            app.logger.info(f"User {user_id} disconnected")
            break

# SocketIO messaging events
@socketio.on('join_conversation')
def handle_join_conversation(data):
    user_id = data.get('userId')
    other_user_id = data.get('otherUserId')
    # Send conversation history to the requesting user
    chats = Chat.query.filter(
        ((Chat.sender_id == user_id) & (Chat.receiver_id == other_user_id)) |
        ((Chat.sender_id == other_user_id) & (Chat.receiver_id == user_id))
    ).order_by(Chat.timestamp.asc()).all()
    emit('conversation_history', {'messages': [chat.to_dict() for chat in chats]})

@socketio.on('send_message')
def handle_send_message(data):
    user_id = data.get('userId')
    receiver_id = data.get('receiverId')
    message = data.get('message')
    food_id = data.get('foodId', None)
    # Save message to database
    new_message = Chat(
        sender_id=user_id,
        receiver_id=receiver_id,
        message=message,
        food_id=food_id,
        is_read=False
    )
    db.session.add(new_message)
    db.session.commit()
    message_data = new_message.to_dict()
    # Send to sender
    emit('new_message', message_data)
    # Send to receiver if online
    receiver_sid = user_socket_map.get(str(receiver_id))
    if receiver_sid:
        socketio.emit('new_message', message_data, to=receiver_sid)

@socketio.on('typing')
def handle_typing(data):
    user_id = data.get('userId')
    other_user_id = data.get('otherUserId')
    receiver_sid = user_socket_map.get(str(other_user_id))
    if receiver_sid:
        socketio.emit('user_typing', {'userId': user_id}, to=receiver_sid)

@socketio.on('stop_typing')
def handle_stop_typing(data):
    user_id = data.get('userId')
    other_user_id = data.get('otherUserId')
    receiver_sid = user_socket_map.get(str(other_user_id))
    if receiver_sid:
        socketio.emit('user_stop_typing', {'userId': user_id}, to=receiver_sid)

@socketio.on('read_message')
def handle_read_message(data):
    message_id = data.get('messageId')
    user_id = data.get('userId')
    other_user_id = data.get('otherUserId')
    message = Chat.query.get(message_id)
    if message and not message.is_read:
        message.is_read = True
        db.session.commit()
        # Notify sender
        sender_sid = user_socket_map.get(str(other_user_id))
        if sender_sid:
            socketio.emit('message_read', {'messageId': message_id}, to=sender_sid)
        # Notify receiver (self)
        emit('message_read', {'messageId': message_id})

# Traditional routes
@app.route('/')
def entry():
    return render_template('entry.html')

# API routes
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
        is_active=True
    )
    db.session.add(user)
    db.session.commit()
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
        session['user_id'] = user.user_id
        global user_session
        user_session["user_id"] = user.user_id
        user_session["username"] = f"{user.first_name} {user.last_name}"
        token = s.dumps({'user_id': user.user_id}, salt='auth')
        return jsonify({
            'message': 'Logged in successfully',
            'user': user_to_dict(user),
            'token': token
        }), 200
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/logout', methods=['GET'])
def api_logout():
    global user_session
    user_session = {'user_id': None, 'username': None}
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
        if food_type and food_type.lower() != 'all':
            query = query.filter(FoodListing.food_type.ilike(food_type))
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
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401
    data = request.json
    new_food = FoodListing(
        provider_id=user.user_id,
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
    if food.provider_id != user.user_id:
        return jsonify({'error': 'Not authorized to update this listing'}), 403
    data = request.json
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
    if food.provider_id != user.user_id:
        return jsonify({'error': 'Not authorized to delete this listing'}), 403
    db.session.delete(food)
    db.session.commit()
    return jsonify({'message': 'Food listing deleted successfully'}), 200

# Traditional routes
@app.route('/signup', methods=['POST'])
def signup():
    if request.is_json:
        data = request.json
    else:
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
        is_active=True
    )
    db.session.add(user)
    db.session.commit()
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
            data = request.json
            email = data.get('email')
            password = data.get('password')
        else:
            email = request.form['email']
            password = request.form['password']
        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password_hash, password):
            session['user_id'] = user.user_id
            global user_session
            user_session["user_id"] = user.user_id
            user_session["username"] = user.first_name
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
    global user_session
    user_session = {'user_id': None, 'username': None}
    session.pop('user_id', None)
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

@app.route('/api/sometemp/<category>/', methods=['GET'], strict_slashes=False)
def filter_items(category):
    query = FoodListing.query.filter_by(status='available')
    query = query.filter(FoodListing.food_type.ilike(f'%{category}%'))
    food_listings = query.order_by(FoodListing.created_at.desc()).all()
    return jsonify({'food_listings': [food_listing_to_dict(food) for food in food_listings]})

@app.route('/api/chat-list/<int:user_id>', methods=['GET'])
def get_chat_list(user_id):
    try:
        chats = Chat.query.filter(
            (Chat.sender_id == user_id) | (Chat.receiver_id == user_id)
        ).order_by(Chat.timestamp.desc()).all()
        conversations = {}
        for chat in chats:
            other_user_id = chat.receiver_id if chat.sender_id == user_id else chat.sender_id
            if other_user_id not in conversations:
                conversations[other_user_id] = {
                    'otherUserId': other_user_id,
                    'messages': [],
                    'foodId': chat.food_id
                }
            conversations[other_user_id]['messages'].append(chat.to_dict())
        result = []
        for other_user_id, convo in conversations.items():
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
        app.logger.error(f"Error fetching chat list: {str(e)}")
        return jsonify({'error': 'Failed to fetch conversations'}), 500

def setup_roles():
    roles = ['undergrad', 'master', 'phd', 'employee', 'professor']
    for r in roles:
        if not Role.query.filter_by(name=r).first():
            db.session.add(Role(name=r))
    db.session.commit()

@app.route('/add_test_data', methods=['GET'])
def add_test_data():
    if not Role.query.filter_by(name="Undergrad").first():
        new_role = Role(name="Undergrad")
        db.session.add(new_role)
        db.session.commit()
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

if __name__ == '__main__':
    with app.app_context():
        # db.drop_all()
        db.create_all()
        setup_roles()
    socketio.run(app,port=5000,debug=True)