### File: backend/app/sockets/chat_events.py

from flask import request
from app import socketio, db
from app.models.chat import Chat

# Store user_id to socket_id mapping
user_socket_map = {}  # {user_id: socket_id}

@socketio.on('connect')
def handle_connect():
    user_id = request.args.get('userId')
    if user_id:
        user_socket_map[user_id] = request.sid
        print(f"User {user_id} connected with socket ID {request.sid}")
        print(f"Current connected users: {user_socket_map}")


@socketio.on('disconnect')
def handle_disconnect():
    for user_id, sid in list(user_socket_map.items()):
        if sid == request.sid:
            del user_socket_map[user_id]
            print(f"User {user_id} disconnected")
            print(f"Current connected users: {user_socket_map}")
            break


@socketio.on('join_conversation')
def handle_join_conversation(data):
    user_id = data.get('userId')
    other_user_id = data.get('otherUserId')

    print(f"User {user_id} joining conversation with user {other_user_id}")

    if isinstance(user_id, str) and user_id.isdigit():
        user_id = int(user_id)
    if isinstance(other_user_id, str) and other_user_id.isdigit():
        other_user_id = int(other_user_id)

    chats = Chat.query.filter(
        ((Chat.sender_id == user_id) & (Chat.receiver_id == other_user_id)) |
        ((Chat.sender_id == other_user_id) & (Chat.receiver_id == user_id))
    ).order_by(Chat.timestamp.asc()).all()

    messages = [chat.to_dict() for chat in chats]
    print(f"Sending {len(messages)} messages to user {user_id}")
    socketio.emit('conversation_history', {'messages': messages}, to=request.sid)


@socketio.on('send_message')
def handle_send_message(data):
    user_id = data.get('userId')
    receiver_id = data.get('receiverId')
    message_text = data.get('message')
    food_id = data.get('foodId', None)

    print(f"User {user_id} sending message to user {receiver_id}: {message_text}")

    if isinstance(user_id, str) and user_id.isdigit():
        user_id = int(user_id)
    if isinstance(receiver_id, str) and receiver_id.isdigit():
        receiver_id = int(receiver_id)
    if food_id and isinstance(food_id, str) and food_id.isdigit():
        food_id = int(food_id)

    new_message = Chat(
        sender_id=user_id,
        receiver_id=receiver_id,
        message=message_text,
        food_id=food_id,
        is_read=False
    )
    db.session.add(new_message)
    db.session.commit()

    message_data = new_message.to_dict()
    print(f"Message saved with ID {new_message.id}")

    socketio.emit('new_message', message_data, to=request.sid)

    receiver_sid = user_socket_map.get(str(receiver_id))
    if not receiver_sid:
        receiver_sid = user_socket_map.get(receiver_id)

    if receiver_sid:
        print(f"Sending message to receiver {receiver_id} with socket ID {receiver_sid}")
        socketio.emit('new_message', message_data, to=receiver_sid)
    else:
        print(f"Receiver {receiver_id} is not online. Message will be seen when they connect.")


@socketio.on('typing')
def handle_typing(data):
    user_id = data.get('userId')
    other_user_id = data.get('otherUserId')

    receiver_sid = user_socket_map.get(str(other_user_id))
    if not receiver_sid:
        receiver_sid = user_socket_map.get(other_user_id)

    if receiver_sid:
        socketio.emit('user_typing', {'userId': user_id}, to=receiver_sid)


@socketio.on('stop_typing')
def handle_stop_typing(data):
    user_id = data.get('userId')
    other_user_id = data.get('otherUserId')

    receiver_sid = user_socket_map.get(str(other_user_id))
    if not receiver_sid:
        receiver_sid = user_socket_map.get(other_user_id)

    if receiver_sid:
        socketio.emit('user_stop_typing', {'userId': user_id}, to=receiver_sid)


@socketio.on('read_message')
def handle_read_message(data):
    message_id = data.get('messageId')
    user_id = data.get('userId')
    other_user_id = data.get('otherUserId')

    message = Chat.query.get(message_id)
    if message and not message.is_read:
        message.is_read = True
        db.session.commit()

        sender_sid = user_socket_map.get(str(other_user_id))
        if not sender_sid:
            sender_sid = user_socket_map.get(other_user_id)

        if sender_sid:
            socketio.emit('message_read', {'messageId': message_id}, to=sender_sid)

        socketio.emit('message_read', {'messageId': message_id}, to=request.sid)
