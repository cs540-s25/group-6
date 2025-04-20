#!/usr/bin/env python3
"""
Integration test script for the FoodShare application.

This script tests:
1. User registration and authentication
2. Creating, viewing, updating, and deleting food listings
3. User profile management
4. Ratings
5. Chat functionality

Usage:
    python test_app.py
"""
import requests
import json
from datetime import datetime, timedelta

from app import create_app, db
from app.utils.setup import setup_roles

# Setup roles before any test runs
app = create_app()
with app.app_context():
    db.create_all()
    setup_roles()

# ✅ Correct base URL for your backend
BASE_URL = 'http://localhost:5001/api'

# Test users
USERS = {
    'user1': {
        'email': 'user1@emory.edu',
        'password': 'password123',
        'first_name': 'Alice',
        'last_name': 'Johnson',
        'role': 'undergrad',
        'major': 'Computer Science',
        'phone_number': '123-456-7890'
    },
    'user2': {
        'email': 'user2@emory.edu',
        'password': 'password123',
        'first_name': 'Bob',
        'last_name': 'Smith',
        'role': 'master',
        'major': 'Biology',
        'phone_number': '098-765-4321'
    }
}

tokens = {}
user_ids = {}
food_listing_id = None

def print_header(title):
    print(f"\n{'='*80}\n{title.center(80)}\n{'='*80}")

def print_response(response):
    """Print HTTP response details."""
    print(f"Status code: {response.status_code}")
    try:
        print(f"Response headers: {dict(response.headers)}")
        print(f"Response body: {response.text}")
    except:
        print("Could not print response details")

def test_signup():
    print_header("TESTING USER REGISTRATION")
    for user_key, user_data in USERS.items():
        print(f"\nRegistering {user_key}...")
        response = requests.post(f"{BASE_URL}/signup", json=user_data)
        print_response(response)
        if response.status_code == 201:
            data = response.json()
            tokens[user_key] = data.get('token')
            user_ids[user_key] = data.get('user', {}).get('user_id')
            print(f"✅ Registration successful for {user_key}")
        else:
            print(f"❌ Registration failed for {user_key}")

def test_login():
    print_header("TESTING USER LOGIN")
    for user_key, user_data in USERS.items():
        print(f"\nLogging in as {user_key}...")
        response = requests.post(f"{BASE_URL}/login", json={
            'email': user_data['email'],
            'password': user_data['password']
        })
        print_response(response)
        if response.status_code == 200:
            data = response.json()
            tokens[user_key] = data.get('token')
            user_ids[user_key] = data.get('user', {}).get('user_id')
            print(f"✅ Login successful for {user_key}")
        else:
            print(f"❌ Login failed for {user_key}")

# Stub to prevent NameError
def test_user_profile():
    print_header("TESTING USER PROFILE")
    print("Skipping test_user_profile (not yet implemented)")

# Entry point
if __name__ == "__main__":
    try:
        test_signup()
        test_login()
        test_user_profile()

        # Add calls to other tests here, when implemented
        # test_create_food_listing()
        # test_get_food_listings()
        # test_update_food_listing()
        # test_ratings()
        # test_chat()
        # test_delete_food_listing()
        # test_logout()

        print_header("ALL TESTS COMPLETED")
        print("Note: Some tests may be skipped or stubbed.")
    except Exception as e:
        print(f"\nError running tests: {str(e)}")
