"""
Simple test script to verify that the Flask server is running correctly.
"""
import requests
import json

def test_server_connection():
    """Test basic connectivity to the Flask server."""
    print("Testing server connection...")
    
    try:
        # Test the root endpoint
        response = requests.get('http://localhost:5001/')
        print(f"Root endpoint status code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Test the API test endpoint
        response = requests.get('http://localhost:5001/api/test')
        print(f"API test endpoint status code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        print("Server is running correctly!")
        return True
    except Exception as e:
        print(f"Error connecting to server: {e}")
        return False

if __name__ == "__main__":
    test_server_connection()