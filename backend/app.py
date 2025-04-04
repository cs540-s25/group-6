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

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///resource_sharing.db'
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')

# Enable CORS for the React frontend
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

db = SQLAlchemy(app)
mail = Mail(app)
s = URLSafeTimedSerializer(app.secret_key)


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
    is_active = db.Column(db.Boolean, default=False)
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

    # Relationships
    provider = db.relationship("User", backref="food_listings")


# Helper functions
def get_current_user():
    user_id = session.get('user_id')
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
    token = s.dumps(email, salt='email-confirm')
    role = Role.query.filter_by(name=data.get('role')).first()

    user = User(
        email=email,
        password_hash=hashed_pw,
    
        first_name=data.get('first_name'),
        last_name=data.get('last_name'),
        phone_number=data.get('phone_number'),
        major=data.get('major'),
        verification_token=token,
        role=role
    )

    db.session.add(user)
    db.session.commit()
    

    # Send verification email
    confirm_url = url_for('verify_email', token=token, _external=True)
    msg = Message('Verify your email', sender=app.config['MAIL_USERNAME'], recipients=[email])
    msg.body = f'Click the link to verify your email: {confirm_url}'
    mail.send(msg)

    return jsonify({'message': 'Verification email sent. Please check your inbox.'}), 201


@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    if user and user.is_active and check_password_hash(user.password_hash, password):
        session['user_id'] = user.user_id
        return jsonify({
            'message': 'Logged in successfully',
            'user': user_to_dict(user)
        }), 200

    return jsonify({'error': 'Invalid credentials or email not verified'}), 401


@app.route('/api/logout', methods=['GET'])
def api_logout():
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


@app.route('/api/resend_verification', methods=['POST'])
def api_resend_verification():
    data = request.json
    email = data.get('email')

    user = User.query.filter_by(email=email).first()
    if user and not user.is_active:
        token = s.dumps(email, salt='email-confirm')
        user.verification_token = token
        db.session.commit()

        confirm_url = url_for('verify_email', token=token, _external=True)
        msg = Message('Verify your email', sender=app.config['MAIL_USERNAME'], recipients=[email])
        msg.body = f'Click the link to verify your email: {confirm_url}'
        mail.send(msg)

        return jsonify({'message': 'A new verification email has been sent'}), 200

    return jsonify({'error': 'Invalid email or account already verified'}), 400


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
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401

    data = request.json

    # Create new food listing
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
    token = s.dumps(email, salt='email-confirm')
    role = Role.query.filter_by(name=data.get('role')).first()

    user = User(
        email=email,
        password_hash=hashed_pw,
        first_name=data.get('first_name'),
        last_name=data.get('last_name'),
        phone_number=data.get('phone_number'),
        major=data.get('major'),
        verification_token=token,
        role=role
    )
    db.session.add(user)
    db.session.commit()

    confirm_url = url_for('verify_email', token=token, _external=True)
    msg = Message('Verify your email', sender=app.config['MAIL_USERNAME'], recipients=[email])
    msg.body = f'Click the link to verify your email: {confirm_url}'
    mail.send(msg)

    if request.is_json:
        return jsonify({'message': 'Verification email sent. Please check your inbox.'}), 201
    else:
        flash('Verification email sent.')
        return redirect(url_for('login'))


@app.route('/verify/<token>')
def verify_email(token):
    try:
        email = s.loads(token, salt='email-confirm', max_age=3600)
        user = User.query.filter_by(email=email).first()
        if user:
            user.is_active = True
            user.verification_token = None
            db.session.commit()
            flash('Email verified. You can now log in.')
    except Exception as e:
        flash('Verification link expired or invalid.')
    return redirect(url_for('login'))


@app.route('/resend_verification', methods=['GET', 'POST'])
def resend_verification():
    if request.method == 'POST':
        email = request.form['email']
        user = User.query.filter_by(email=email).first()
        if user and not user.is_active:
            token = s.dumps(email, salt='email-confirm')
            user.verification_token = token
            db.session.commit()
            confirm_url = url_for('verify_email', token=token, _external=True)
            msg = Message('Verify your email', sender=app.config['MAIL_USERNAME'], recipients=[email])
            msg.body = f'Click the link to verify your email: {confirm_url}'
            mail.send(msg)
            flash('A new verification email has been sent.')
        else:
            flash('Invalid email or account already verified.')
    return render_template('resend_verification.html')


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
        if user and user.is_active and check_password_hash(user.password_hash, password):
            session['user_id'] = user.user_id

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
            return jsonify({'error': 'Invalid credentials or email not verified'}), 401
        else:
            flash('Invalid credentials or email not verified.')

    return render_template('login.html')


@app.route('/logout')
def logout():
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



if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        setup_roles()
    app.run(debug=True)