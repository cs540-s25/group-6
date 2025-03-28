# resource_db_test.py
import datetime
from resource_db_setup import (
    create_database, get_session_factory,
    Role, User, FoodListing, BookListing, Reservation, Delivery, Rating, Image, Impact, Message,
    get_food_reservations, get_book_reservations, get_resource_for_reservation
)


def populate_test_data(session):
    # Create roles
    admin_role = Role(name="Admin", description="System administrator")
    donor_role = Role(name="Donor", description="Food or book donor")
    recipient_role = Role(name="Recipient", description="Resource recipient")
    rider_role = Role(name="Rider", description="Delivery volunteer")
    session.add_all([admin_role, donor_role, recipient_role, rider_role])
    session.commit()

    # Create users
    admin = User(
        email="admin@example.com",
        password_hash="hashed_password",
        first_name="Admin",
        last_name="User",
        phone_number="1234567890",
        address="123 Admin St",
        latitude=37.7749,
        longitude=-122.4194,
        role_id=admin_role.role_id
    )

    donor1 = User(
        email="donor1@example.com",
        password_hash="hashed_password",
        first_name="John",
        last_name="Donor",
        phone_number="2345678901",
        address="456 Donor Ave",
        latitude=37.7833,
        longitude=-122.4167,
        role_id=donor_role.role_id
    )

    recipient1 = User(
        email="recipient1@example.com",
        password_hash="hashed_password",
        first_name="Sarah",
        last_name="Recipient",
        phone_number="3456789012",
        address="789 Recipient Blvd",
        latitude=37.7825,
        longitude=-122.4204,
        role_id=recipient_role.role_id
    )

    rider1 = User(
        email="rider1@example.com",
        password_hash="hashed_password",
        first_name="Mike",
        last_name="Rider",
        phone_number="4567890123",
        address="101 Rider Rd",
        latitude=37.7858,
        longitude=-122.4156,
        role_id=rider_role.role_id
    )

    session.add_all([admin, donor1, recipient1, rider1])
    session.commit()

    # Create food listing
    food1 = FoodListing(
        provider_id=donor1.user_id,
        title="Fresh Vegetables",
        description="Assorted vegetables from local garden",
        expiration_date=datetime.datetime.now() + datetime.timedelta(days=5),
        food_type="Vegetables",
        allergens="None",
        quantity=10,
        unit="pounds",
        pickup_location="456 Donor Ave",
        pickup_latitude=37.7833,
        pickup_longitude=-122.4167,
        available_from=datetime.datetime.now(),
        available_until=datetime.datetime.now() + datetime.timedelta(days=2)
    )
    session.add(food1)

    # Create book listing
    book1 = BookListing(
        donor_id=donor1.user_id,
        title="Python Programming",
        author="John Smith",
        condition="Good",
        genre="Educational",
        educational_level="Intermediate",
        subject="Computer Science",
        pickup_location="456 Donor Ave",
        pickup_latitude=37.7833,
        pickup_longitude=-122.4167
    )
    session.add(book1)
    session.commit()

    # Create reservation
    food_reservation = Reservation(
        resource_id=food1.food_id,
        resource_type="food",
        requester_id=recipient1.user_id,
        status="confirmed",
        pickup_time=datetime.datetime.now() + datetime.timedelta(days=1)
    )
    session.add(food_reservation)
    session.commit()

    # Create delivery
    delivery = Delivery(
        reservation_id=food_reservation.reservation_id,
        rider_id=rider1.user_id,
        scheduled_time=datetime.datetime.now() + datetime.timedelta(days=1, hours=2),
        status="scheduled"
    )
    session.add(delivery)
    session.commit()

    # Create rating
    rating = Rating(
        giver_id=recipient1.user_id,
        receiver_id=donor1.user_id,
        resource_id=food1.food_id,
        resource_type="food",
        score=5,
        comment="Great quality vegetables!"
    )
    session.add(rating)

    # Create image
    image = Image(
        resource_id=food1.food_id,
        resource_type="food",
        image_url="https://example.com/images/vegetables.jpg",
        caption="Fresh vegetables"
    )
    session.add(image)

    # Create impact
    impact = Impact(
        user_id=donor1.user_id,
        story_title="Helping Local Families",
        story_content="I was able to share excess produce from my garden with 5 families in my neighborhood.",
        people_helped=20,
        resources_saved=50,
        event_date=datetime.datetime.now() - datetime.timedelta(days=7)
    )
    session.add(impact)

    # Create message
    message = Message(
        sender_id=recipient1.user_id,
        receiver_id=donor1.user_id,
        content="Thank you for the vegetables! They were delicious.",
        is_read=False
    )
    session.add(message)

    session.commit()
    print("Test data populated successfully.")


def test_queries(session):
    print("\n--- Running Test Queries ---")

    # Test 1: Get all users with their roles
    print("\nTest 1: All Users with Roles")
    users = session.query(User).all()
    for user in users:
        print(f"User: {user.first_name} {user.last_name}, Role: {user.role.name}")

    # Test 2: Get all food listings with their providers
    print("\nTest 2: Food Listings")
    food_listings = session.query(FoodListing).all()
    for food in food_listings:
        print(f"Food: {food.title}, Provider: {food.provider.first_name} {food.provider.last_name}")

    # Test 3: Get reservations with associated resources
    print("\nTest 3: Reservations")
    reservations = session.query(Reservation).all()
    for res in reservations:
        resource = get_resource_for_reservation(session, res)
        resource_name = resource.title if resource else "Unknown"
        print(f"Reservation for {resource_name} by {res.requester.first_name} {res.requester.last_name}")

    # Test 4: Check delivery status
    print("\nTest 4: Deliveries")
    deliveries = session.query(Delivery).all()
    for delivery in deliveries:
        print(f"Delivery #{delivery.delivery_id} Status: {delivery.status}")
        print(f"Rider: {delivery.rider.first_name} {delivery.rider.last_name}")
        resource = get_resource_for_reservation(session, delivery.reservation)
        if resource:
            print(f"Delivering: {resource.title}")

    # Test 5: Test ratings
    print("\nTest 5: Ratings")
    ratings = session.query(Rating).all()
    for rating in ratings:
        print(f"Rating from {rating.giver.first_name} to {rating.receiver.first_name}: {rating.score}/5")
        print(f"Comment: {rating.comment}")

    # Test 6: Test impact stories
    print("\nTest 6: Impact Stories")
    impacts = session.query(Impact).all()
    for impact in impacts:
        print(f"Impact Story: {impact.story_title} by {impact.user.first_name}")
        print(f"People Helped: {impact.people_helped}, Resources Saved: {impact.resources_saved}")

    # Test 7: Messages
    print("\nTest 7: Messages")
    messages = session.query(Message).all()
    for message in messages:
        print(f"From {message.sender.first_name} to {message.receiver.first_name}: {message.content}")
        print(f"Read: {'Yes' if message.is_read else 'No'}")


def run_tests():
    # Create the database
    engine = create_database('test_resource_sharing.db')
    Session = get_session_factory(engine)
    session = Session()

    try:
        # Populate with test data
        populate_test_data(session)

        # Run test queries
        test_queries(session)

        print("\nAll tests completed successfully!")
    except Exception as e:
        print(f"Error during testing: {str(e)}")
    finally:
        session.close()


if __name__ == "__main__":
    run_tests()