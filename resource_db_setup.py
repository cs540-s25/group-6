# resource_db_setup.py
import os
import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

# Create base class for our models
Base = declarative_base()


# Define models according to the ER diagram
class Role(Base):
    __tablename__ = 'roles'

    role_id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String)

    # Relationship
    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = 'users'

    user_id = Column(Integer, primary_key=True)
    email = Column(String, nullable=False, unique=True)
    password_hash = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    phone_number = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    is_active = Column(Boolean, default=True)
    profile_picture = Column(String)
    address = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    role_id = Column(Integer, ForeignKey('roles.role_id'))

    # Relationships
    role = relationship("Role", back_populates="users")
    food_listings = relationship("FoodListing", back_populates="provider")
    book_listings = relationship("BookListing", back_populates="donor")
    reservations_made = relationship("Reservation", foreign_keys="Reservation.requester_id", back_populates="requester")
    deliveries_performed = relationship("Delivery", foreign_keys="Delivery.rider_id", back_populates="rider")
    ratings_given = relationship("Rating", foreign_keys="Rating.giver_id", back_populates="giver")
    ratings_received = relationship("Rating", foreign_keys="Rating.receiver_id", back_populates="receiver")
    impacts = relationship("Impact", back_populates="user")
    messages_sent = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    messages_received = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")


class FoodListing(Base):
    __tablename__ = 'food_listings'

    food_id = Column(Integer, primary_key=True)
    provider_id = Column(Integer, ForeignKey('users.user_id'))
    title = Column(String, nullable=False)
    description = Column(Text)
    expiration_date = Column(DateTime)
    food_type = Column(String)
    allergens = Column(Text)
    quantity = Column(Integer)
    unit = Column(String)
    pickup_location = Column(String)
    pickup_latitude = Column(Float)
    pickup_longitude = Column(Float)
    available_from = Column(DateTime)
    available_until = Column(DateTime)
    status = Column(String, default="available")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    provider = relationship("User", back_populates="food_listings")
    reservations = relationship("Reservation",
                                primaryjoin="and_(Reservation.resource_type=='food', Reservation.resource_id==FoodListing.food_id)",
                                back_populates="food_listing")
    ratings = relationship("Rating",
                           primaryjoin="and_(Rating.resource_type=='food', Rating.resource_id==FoodListing.food_id)",
                           back_populates="food_listing")
    images = relationship("Image",
                          primaryjoin="and_(Image.resource_type=='food', Image.resource_id==FoodListing.food_id)",
                          back_populates="food_listing")


class BookListing(Base):
    __tablename__ = 'book_listings'

    book_id = Column(Integer, primary_key=True)
    donor_id = Column(Integer, ForeignKey('users.user_id'))
    title = Column(String, nullable=False)
    author = Column(String)
    condition = Column(String)
    genre = Column(String)
    educational_level = Column(String)
    subject = Column(String)
    pickup_location = Column(String)
    pickup_latitude = Column(Float)
    pickup_longitude = Column(Float)
    status = Column(String, default="available")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    donor = relationship("User", back_populates="book_listings")
    reservations = relationship("Reservation",
                                primaryjoin="and_(Reservation.resource_type=='book', Reservation.resource_id==BookListing.book_id)",
                                back_populates="book_listing")
    ratings = relationship("Rating",
                           primaryjoin="and_(Rating.resource_type=='book', Rating.resource_id==BookListing.book_id)",
                           back_populates="book_listing")
    images = relationship("Image",
                          primaryjoin="and_(Image.resource_type=='book', Image.resource_id==BookListing.book_id)",
                          back_populates="book_listing")


class Reservation(Base):
    __tablename__ = 'reservations'

    reservation_id = Column(Integer, primary_key=True)
    resource_id = Column(Integer, nullable=False)
    resource_type = Column(String, nullable=False)  # 'food' or 'book'
    requester_id = Column(Integer, ForeignKey('users.user_id'))
    reservation_time = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="pending")  # pending, confirmed, cancelled, completed
    pickup_time = Column(DateTime)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    requester = relationship("User", foreign_keys=[requester_id], back_populates="reservations_made")
    food_listing = relationship("FoodListing",
                                primaryjoin="and_(Reservation.resource_type=='food', Reservation.resource_id==FoodListing.food_id)",
                                back_populates="reservations")
    book_listing = relationship("BookListing",
                                primaryjoin="and_(Reservation.resource_type=='book', Reservation.resource_id==BookListing.book_id)",
                                back_populates="reservations")
    delivery = relationship("Delivery", uselist=False, back_populates="reservation")


class Delivery(Base):
    __tablename__ = 'deliveries'

    delivery_id = Column(Integer, primary_key=True)
    reservation_id = Column(Integer, ForeignKey('reservations.reservation_id'), unique=True)
    rider_id = Column(Integer, ForeignKey('users.user_id'))
    scheduled_time = Column(DateTime)
    actual_pickup_time = Column(DateTime)
    actual_delivery_time = Column(DateTime)
    status = Column(String, default="scheduled")  # scheduled, in_progress, completed, cancelled
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    reservation = relationship("Reservation", back_populates="delivery")
    rider = relationship("User", foreign_keys=[rider_id], back_populates="deliveries_performed")
    ratings = relationship("Rating",
                           primaryjoin="and_(Rating.resource_type=='delivery', Rating.resource_id==Delivery.delivery_id)",
                           back_populates="delivery")


class Rating(Base):
    __tablename__ = 'ratings'

    rating_id = Column(Integer, primary_key=True)
    giver_id = Column(Integer, ForeignKey('users.user_id'))
    receiver_id = Column(Integer, ForeignKey('users.user_id'))
    resource_id = Column(Integer, nullable=False)
    resource_type = Column(String, nullable=False)  # 'food', 'book', 'delivery', 'user'
    score = Column(Integer, nullable=False)
    comment = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    giver = relationship("User", foreign_keys=[giver_id], back_populates="ratings_given")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="ratings_received")
    food_listing = relationship("FoodListing",
                                primaryjoin="and_(Rating.resource_type=='food', Rating.resource_id==FoodListing.food_id)",
                                back_populates="ratings")
    book_listing = relationship("BookListing",
                                primaryjoin="and_(Rating.resource_type=='book', Rating.resource_id==BookListing.book_id)",
                                back_populates="ratings")
    delivery = relationship("Delivery",
                            primaryjoin="and_(Rating.resource_type=='delivery', Rating.resource_id==Delivery.delivery_id)",
                            back_populates="ratings")


class Image(Base):
    __tablename__ = 'images'

    image_id = Column(Integer, primary_key=True)
    resource_id = Column(Integer, nullable=False)
    resource_type = Column(String, nullable=False)  # 'food', 'book', 'impact'
    image_url = Column(String, nullable=False)
    caption = Column(String)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    food_listing = relationship("FoodListing",
                                primaryjoin="and_(Image.resource_type=='food', Image.resource_id==FoodListing.food_id)",
                                back_populates="images")
    book_listing = relationship("BookListing",
                                primaryjoin="and_(Image.resource_type=='book', Image.resource_id==BookListing.book_id)",
                                back_populates="images")
    impact = relationship("Impact",
                          primaryjoin="and_(Image.resource_type=='impact', Image.resource_id==Impact.impact_id)",
                          back_populates="images")


class Impact(Base):
    __tablename__ = 'impacts'

    impact_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.user_id'))
    story_title = Column(String, nullable=False)
    story_content = Column(Text, nullable=False)
    people_helped = Column(Integer)
    resources_saved = Column(Integer)
    event_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="impacts")
    images = relationship("Image",
                          primaryjoin="and_(Image.resource_type=='impact', Image.resource_id==Impact.impact_id)",
                          back_populates="impact")


class Message(Base):
    __tablename__ = 'messages'

    message_id = Column(Integer, primary_key=True)
    sender_id = Column(Integer, ForeignKey('users.user_id'))
    receiver_id = Column(Integer, ForeignKey('users.user_id'))
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    sent_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], back_populates="messages_sent")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="messages_received")


# Create the database and tables
def create_database(db_file='resource_sharing.db'):
    # Delete the database file if it exists
    if os.path.exists(db_file):
        os.remove(db_file)

    # Create engine and bind it to the models
    engine = create_engine(f'sqlite:///{db_file}')
    Base.metadata.create_all(engine)
    print(f"Database created: {db_file}")
    return engine


# Create session factory
def get_session_factory(engine):
    Session = sessionmaker(bind=engine)
    return Session


if __name__ == "__main__":
    engine = create_database()
    Session = get_session_factory(engine)
    print("Database schema created successfully.")