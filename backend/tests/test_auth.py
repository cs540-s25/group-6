"""
Tests for authentication functionality.
"""
import unittest
from app import create_app, db
from app.models.user import User, Role
from flask import session

class AuthTestCase(unittest.TestCase):
    """Test case for authentication routes."""
    
    def setUp(self):
        """Set up test environment."""
        self.app = create_app('testing')
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()
        
        # Create test role
        role = Role(name='undergrad')
        db.session.add(role)
        db.session.commit()
    
    def tearDown(self):
        """Clean up after tests."""
        db.session.remove()
        db.drop_all()
        self.app_context.pop()
    
    def test_signup(self):
        """Test user registration."""
        # Test valid signup
        response = self.client.post('/api/signup', json={
            'email': 'testuser@emory.edu',
            'password': 'password123',
            'first_name': 'Test',
            'last_name': 'User',
            'role': 'undergrad'
        })
        
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertIn('user', data)
        self.assertIn('token', data)
        self.assertEqual(data['user']['email'], 'testuser@emory.edu')
        
        # Verify user was created in database
        user = User.query.filter_by(email='testuser@emory.edu').first()
        self.assertIsNotNone(user)
        self.assertEqual(user.first_name, 'Test')
        
        # Test duplicate email
        response = self.client.post('/api/signup', json={
            'email': 'testuser@emory.edu',
            'password': 'password456',
            'first_name': 'Another',
            'last_name': 'User',
            'role': 'undergrad'
        })
        
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertIn('error', data)
        
        # Test non-Emory email
        response = self.client.post('/api/signup', json={
            'email': 'testuser@gmail.com',
            'password': 'password123',
            'first_name': 'Test',
            'last_name': 'User',
            'role': 'undergrad'
        })
        
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertIn('error', data)
    
    def test_login(self):
        """Test user login."""
        # Create test user
        from werkzeug.security import generate_password_hash
        role = Role.query.filter_by(name='undergrad').first()
        user = User(
            email='testuser@emory.edu',
            password_hash=generate_password_hash('password123'),
            first_name='Test',
            last_name='User',
            role=role,
            is_active=True
        )
        db.session.add(user)
        db.session.commit()
        
        # Test valid login
        response = self.client.post('/api/login', json={
            'email': 'testuser@emory.edu',
            'password': 'password123'
        })
        
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('user', data)
        self.assertIn('token', data)
        
        # Test invalid password
        response = self.client.post('/api/login', json={
            'email': 'testuser@emory.edu',
            'password': 'wrongpassword'
        })
        
        self.assertEqual(response.status_code, 401)
        
        # Test non-existent user
        response = self.client.post('/api/login', json={
            'email': 'nonexistent@emory.edu',
            'password': 'password123'
        })
        
        self.assertEqual(response.status_code, 401)
    
    def test_logout(self):
        """Test user logout."""
        # Create test user and log in
        from werkzeug.security import generate_password_hash
        role = Role.query.filter_by(name='undergrad').first()
        user = User(
            email='testuser@emory.edu',
            password_hash=generate_password_hash('password123'),
            first_name='Test',
            last_name='User',
            role=role,
            is_active=True
        )
        db.session.add(user)
        db.session.commit()
        
        with self.client.session_transaction() as sess:
            sess['user_id'] = user.user_id
        
        # Test logout
        response = self.client.get('/api/logout')
        
        self.assertEqual(response.status_code, 200)
        with self.client.session_transaction() as sess:
            self.assertNotIn('user_id', sess)


if __name__ == '__main__':
    unittest.main()