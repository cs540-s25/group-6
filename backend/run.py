#!/usr/bin/env python3
"""
Application entry point for FoodShare.
This script initializes and runs the Flask application with Socket.IO.
"""
import eventlet
print("Starting application...")
eventlet.monkey_patch()  # Patch standard library functions to use eventlet
print("Eventlet monkey patch applied")

try:
    from app import create_app, socketio
    print("Imported application modules")

    # Create the application instance
    print("Creating application instance...")
    app = create_app()
    print("Application instance created successfully")

    if __name__ == '__main__':
        # Run the application with Socket.IO support
        print("Starting Socket.IO server on port 5001...")
        socketio.run(app, host='127.0.0.1', port=5001, debug=True, use_reloader=False, allow_unsafe_werkzeug=True)

except Exception as e:
    print(f"Error starting application: {e}")
    import traceback
    traceback.print_exc()