from app import create_app, db
import os

# Import all models explicitly to register them
from app.models.user import User, Role
from app.models.food import FoodListing
from app.models.chat import Chat
from app.models.rating import Rating

app = create_app()

with app.app_context():
    # Show DB path
    db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
    print("DB path:", db_path)

    # Delete existing DB to start fresh
    if os.path.exists(db_path):
        os.remove(db_path)
        print("Removed old DB")

    db.create_all()
    print("✅ Tables created")

    # Print all tables using inspector
    from sqlalchemy import inspect
    inspector = inspect(db.engine)
    print("📋 Tables now in DB:", inspector.get_table_names())
