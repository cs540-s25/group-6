from app import create_app, db
import os

# ✅ Explicit model imports
from app.models.user import User, Role
from app.models.food import FoodListing
from app.models.chat import Chat
from app.models.rating import Rating

from app.utils.setup import setup_roles, add_test_data

app = create_app()

with app.app_context():
    db_path = os.path.abspath(app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', ''))
    print("🔧 Database path:", db_path)

    # Remove DB file if it exists (start clean)
    if os.path.exists(db_path):
        os.remove(db_path)
        print("🧹 Old database removed.")

    try:
        print("🛠 Creating tables...")
        db.create_all()

        # Confirm table names after creation
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()
        print("📋 Tables created:", tables)

        print("📌 Seeding roles...")
        setup_roles()

        print("🍏 Seeding test data...")
        add_test_data()

        print("🎉 Done!")
    except Exception as e:
        print("❌ Error during DB setup:", str(e))
