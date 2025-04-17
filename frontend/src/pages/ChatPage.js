// src/pages/ChatPage.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import io from 'socket.io-client';

const ChatPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { otherUserId } = useParams();
  const location = useLocation();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [foodTitle, setFoodTitle] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!currentUser || !otherUserId) {
      setError('Please log in to chat.');
      return;
    }

    // Initialize other user & food title from navigation state
    if (location.state?.otherUser) {
      setOtherUser(location.state.otherUser);
    } else {
      setOtherUser({ first_name: 'User', last_name: '' });
    }
    setFoodTitle(location.state?.foodTitle || '');

    // 1) Connect to Socket.IO
    socketRef.current = io('http://localhost:5000', {
      query: { userId: currentUser.user_id },
    });

    // 2) Handle connection errors
    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Failed to connect to chat server');
    });

    // 3) Register listeners *before* emitting join
    socketRef.current.on('conversation_history', (data) => {
      setMessages(data.messages);
    });

    socketRef.current.on('new_message', (message) => {
      setMessages((prev) => [...prev, message]);
      // Mark as read if appropriate
      if (
        message.senderId !== currentUser.user_id &&
        document.visibilityState === 'visible'
      ) {
        socketRef.current.emit('read_message', {
          messageId: message.id,
          userId: currentUser.user_id,
          otherUserId: message.senderId,
        });
      }
    });

    socketRef.current.on('user_typing', ({ userId }) => {
      if (userId === parseInt(otherUserId)) {
        setIsTyping(true);
      }
    });

    socketRef.current.on('user_stop_typing', ({ userId }) => {
      if (userId === parseInt(otherUserId)) {
        setIsTyping(false);
      }
    });

    socketRef.current.on('message_read', ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    });

    // 4) Now ask the server to join this conversation
    socketRef.current.emit('join_conversation', {
      userId: currentUser.user_id,
      otherUserId: parseInt(otherUserId),
    });

    // Visibility handler to mark unread as read
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        messages.forEach((msg) => {
          if (msg.senderId !== currentUser.user_id && !msg.isRead) {
            socketRef.current.emit('read_message', {
              messageId: msg.id,
              userId: currentUser.user_id,
              otherUserId: msg.senderId,
            });
          }
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      socketRef.current.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [currentUser, otherUserId, location.state]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const messageData = {
      userId: currentUser.user_id,
      receiverId: parseInt(otherUserId),
      message: newMessage,
      foodId: location.state?.foodId || null,
    };
    socketRef.current.emit('send_message', messageData);
    setNewMessage('');
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!socketRef.current) return;

    socketRef.current.emit('typing', {
      userId: currentUser.user_id,
      otherUserId: parseInt(otherUserId),
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('stop_typing', {
        userId: currentUser.user_id,
        otherUserId: parseInt(otherUserId),
      });
    }, 1000);
  };

  const handleBack = () => navigate(-1);

  if (error) {
    return (
      <div className="chat-page">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="chat-page bg-gray-50 min-h-screen p-4">
      <div className="header flex items-center justify-between bg-white shadow-sm py-4 px-6 sticky top-0 z-10">
        <button onClick={handleBack} className="text-blue-600">&lt; Back</button>
        <h2 className="text-xl font-semibold">
          Chat with {otherUser?.first_name} {otherUser?.last_name}
          {foodTitle && ` (About: ${foodTitle})`}
        </h2>
        <div />
      </div>

      <div className="chat-box bg-white p-4 rounded-lg shadow-md mb-6 max-h-[60vh] overflow-auto">
        {messages.length === 0 ? (
          <div className="no-messages p-4 bg-gray-100 rounded-lg">
            <p className="text-center text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="messages space-y-4 flex flex-col">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message p-3 rounded-lg max-w-xs ${
                  msg.senderId === currentUser.user_id
                    ? 'bg-blue-100 self-end ml-auto'
                    : 'bg-gray-200 self-start'
                }`}
              >
                <div className="text-sm font-semibold text-center mb-1">
                  {msg.senderId === currentUser.user_id ? 'You' : otherUser?.first_name}
                </div>
                <div className="text-gray-800">{msg.message}</div>
                <div className="text-sm text-gray-400 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                  {msg.senderId === currentUser.user_id && (
                    <span className="ml-2">{msg.isRead ? '✓✓' : '✓'}</span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
        {isTyping && (
          <div className="typing-indicator text-gray-500 text-sm mt-2">
            {otherUser?.first_name} is typing...
          </div>
        )}
      </div>

      <div className="input-box flex items-center bg-white p-4 shadow-sm rounded-lg fixed bottom-0 left-0 right-0">
        <textarea
          value={newMessage}
          onChange={handleTyping}
          placeholder="Type a message..."
          rows="2"
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none"
        />
        <button
          onClick={handleSendMessage}
          className="send-button bg-blue-500 text-white py-2 px-4 ml-4 rounded-lg hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
