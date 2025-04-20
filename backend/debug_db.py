from app import create_app, db
from app.models.user import User, Role
from app.models.food import FoodListing
from app.models.chat import Chat
from app.models.rating import Rating
import os

app = create_app()

with app.app_context():
    db_path = os.path.abspath(app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', ''))
    print("💾 Using DB file:", db_path)

    if os.path.exists(db_path):
        os.remove(db_path)
        print("🧹 Removed existing DB")

    print("🛠 Creating tables...")
    db.create_all()

    # Confirm persistence
    db.session.commit()

    # Insert 1 user manually
    test_user = User(
        email="demo@emory.edu",
        password_hash="hashed",
        first_name="Demo",
        last_name="User",
        is_active=True,
        role_id=1
    )
    db.session.add(test_user)
    db.session.commit()
    print("✅ Inserted demo user")

    # Inspect
    from sqlalchemy import inspect
    tables = inspect(db.engine).get_table_names()
    print("📋 Tables:", tables)

    users = User.query.all()
    print("👤 Users:", users)
