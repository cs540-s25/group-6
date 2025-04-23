"""
FoodShare application factory module.

This module initializes the Flask application and its extensions,
registers blueprints, and configures the application.
"""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail
from flask_cors import CORS
from flask_socketio import SocketIO
from itsdangerous import URLSafeTimedSerializer
import eventlet

# Initialize extensions
db = SQLAlchemy()
mail = Mail()
serializer = URLSafeTimedSerializer('dev-secret-key-replace-in-production')
socketio = SocketIO()

def create_app():
    """
    Create and configure the Flask application.
    
    Returns:
        Flask application instance
    """
    app = Flask(__name__)
    
    # Configure the app
    app.config['SECRET_KEY'] = 'dev-secret-key-replace-in-production'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///resource_sharing.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USERNAME'] = 'noreply@example.com'  # Replace for production use
    app.config['MAIL_PASSWORD'] = 'password'  # Replace for production use
    app.config['CORS_ALLOWED_ORIGINS'] = '*'  # For development only
    
    # Initialize extensions with the app
    db.init_app(app)
    mail.init_app(app)
    
    # Initialize Socket.IO with eventlet
    socketio.init_app(
        app, 
        cors_allowed_origins='*',  # For development only
        async_mode='eventlet'  # Explicitly set async mode
    )
    
    # Setup CORS
    CORS(
        app,
        resources={r"/*": {"origins": '*'}},  # For development only
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"]
    )
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.food_listings import food_bp
    from app.routes.user import user_bp
    from app.routes.chat import chat_bp
    from app.routes.ratings import ratings_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(food_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(ratings_bp)
    
    # Create database tables if they don't exist
    with app.app_context():
        from app.models.user import Role
        from app.utils.setup import setup_roles
        
        db.create_all()
        setup_roles()
    
    # Add a basic route for testing
    @app.route('/')
    def index():
        return {"message": "Welcome to FoodShare API", "status": "online"}
    
    @app.route('/api/test')
    def test_api():
        return {"message": "API is working properly"}
    
    return app