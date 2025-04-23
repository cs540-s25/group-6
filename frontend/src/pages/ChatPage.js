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
  const [socketConnected, setSocketConnected] = useState(false);
  const [debugInfo, setDebugInfo] = useState(''); // Added for debugging

  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  const addDebugInfo = (info) => {
    console.log(info); // Log to console for browser debugging
    setDebugInfo(prev => `${prev}\n${info}`); // Add to visible debug info
  };

  useEffect(() => {
    if (!currentUser || !otherUserId) {
      setError('Please log in to chat.');
      return;
    }

    addDebugInfo(`Starting chat with userID: ${currentUser.user_id}, otherUserID: ${otherUserId}`);

    // Initialize other user & food title from navigation state
    if (location.state?.otherUser) {
      setOtherUser(location.state.otherUser);
      addDebugInfo(`Other user info set from navigation: ${JSON.stringify(location.state.otherUser)}`);
    } else {
      setOtherUser({ first_name: 'User', last_name: '' });
      addDebugInfo('No other user info in navigation state, using default');
    }
    setFoodTitle(location.state?.foodTitle || '');
    
    // Disable any previous socket connection
    if (socketRef.current) {
      addDebugInfo('Cleaning up previous socket connection');
      socketRef.current.disconnect();
    }

    // 1) Connect to Socket.IO
    addDebugInfo('Attempting to connect to socket server at http://localhost:5001');
    socketRef.current = io('http://localhost:5001', {
      query: { userId: currentUser.user_id },
      transports: ['websocket'], // Force WebSocket transport
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // 2) Handle connection events
    socketRef.current.on('connect', () => {
      addDebugInfo(`Socket connected successfully with ID: ${socketRef.current.id}`);
      addDebugInfo(`Using transport: ${socketRef.current.io.engine.transport.name}`);
      setSocketConnected(true);

      // Join the conversation after connection is established
      const joinData = {
        userId: currentUser.user_id,
        otherUserId: parseInt(otherUserId),
      };
      addDebugInfo(`Joining conversation with data: ${JSON.stringify(joinData)}`);
      socketRef.current.emit('join_conversation', joinData);
    });

    socketRef.current.on('connect_error', (err) => {
      addDebugInfo(`Socket connection error: ${err.message}`);
      console.error('Socket connection error details:', err);
      setError(`Failed to connect to chat server: ${err.message}`);
    });

    socketRef.current.on('reconnect_attempt', (attemptNumber) => {
      addDebugInfo(`Attempting to reconnect (${attemptNumber})...`);
    });

    socketRef.current.on('reconnect', (attemptNumber) => {
      addDebugInfo(`Reconnected after ${attemptNumber} attempts`);
      setSocketConnected(true);
      
      // Re-join the conversation after reconnection
      socketRef.current.emit('join_conversation', {
        userId: currentUser.user_id,
        otherUserId: parseInt(otherUserId),
      });
    });

    socketRef.current.on('reconnect_error', (err) => {
      addDebugInfo(`Reconnection error: ${err.message}`);
    });

    socketRef.current.on('reconnect_failed', () => {
      addDebugInfo('Failed to reconnect after multiple attempts');
      setError('Connection to chat server lost. Please refresh the page.');
    });

    // 3) Register message listeners
    socketRef.current.on('conversation_history', (data) => {
      addDebugInfo(`Received conversation history with ${data.messages?.length || 0} messages`);
      console.log('Conversation history data:', data);
      
      if (data.messages && Array.isArray(data.messages)) {
        setMessages(data.messages);
      } else {
        addDebugInfo('Warning: Received invalid conversation history format');
        setMessages([]);
      }
    });

    socketRef.current.on('new_message', (message) => {
      addDebugInfo(`Received new message: ${JSON.stringify(message)}`);

      // Use a functional update to avoid closure issues with the messages state
      setMessages((prevMessages) => {
        // Check if this is a message we just sent (to avoid duplicates)
        const alreadyExists = prevMessages.some(
          msg => (msg.id === message.id) ||
                 (msg.isOptimistic &&
                  msg.senderId === message.senderId &&
                  msg.message === message.message)
        );

        if (alreadyExists) {
          addDebugInfo('Message already exists, updating optimistic message');
          // Replace optimistic messages with the real ones or skip duplicates
          return prevMessages.map(msg =>
            (msg.isOptimistic &&
             msg.senderId === message.senderId &&
             msg.message === message.message)
              ? { ...message, isOptimistic: false }
              : msg
          );
        } else {
          addDebugInfo('Adding new message to conversation');
          // It's a new message, add it
          return [...prevMessages, message];
        }
      });

      // Mark as read if appropriate
      if (
        message.senderId !== currentUser.user_id &&
        document.visibilityState === 'visible'
      ) {
        addDebugInfo(`Marking message ${message.id} as read`);
        socketRef.current.emit('read_message', {
          messageId: message.id,
          userId: currentUser.user_id,
          otherUserId: message.senderId,
        });
      }
    });

    socketRef.current.on('user_typing', ({ userId }) => {
      if (userId === parseInt(otherUserId)) {
        addDebugInfo(`User ${userId} is typing...`);
        setIsTyping(true);
      }
    });

    socketRef.current.on('user_stop_typing', ({ userId }) => {
      if (userId === parseInt(otherUserId)) {
        addDebugInfo(`User ${userId} stopped typing`);
        setIsTyping(false);
      }
    });

    socketRef.current.on('message_read', ({ messageId }) => {
      addDebugInfo(`Message ${messageId} marked as read`);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    });

    // Visibility handler to mark unread as read
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        messages.forEach((msg) => {
          if (msg.senderId !== currentUser.user_id && !msg.isRead) {
            addDebugInfo(`Marking message ${msg.id} as read (visibility change)`);
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
      addDebugInfo('Cleaning up socket connection...');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [currentUser, otherUserId, location.state]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Track last sent message to prevent duplicates
  const lastSentMessageRef = useRef({ text: '', timestamp: 0 });

  const handleSendMessage = (e) => {
    e.preventDefault(); // Prevent form submission
    if (!newMessage.trim() || !socketConnected) {
      addDebugInfo(`Cannot send message: ${!newMessage.trim() ? 'empty message' : 'socket disconnected'}`);
      return;
    }

    // Prevent duplicate sends within a short time period
    const currentTime = Date.now();
    if (newMessage === lastSentMessageRef.current.text &&
        currentTime - lastSentMessageRef.current.timestamp < 2000) {
      addDebugInfo('Preventing duplicate message send');
      return;
    }

    // Update last sent message reference
    lastSentMessageRef.current = {
      text: newMessage,
      timestamp: currentTime
    };

    addDebugInfo(`Sending message: "${newMessage}"`);

    const messageData = {
      userId: currentUser.user_id,
      receiverId: parseInt(otherUserId),
      message: newMessage,
      foodId: location.state?.foodId || null,
    };

    // Send through socket
    socketRef.current.emit('send_message', messageData);
    addDebugInfo(`Emitted send_message event: ${JSON.stringify(messageData)}`);

    // Clear input immediately for better UX
    setNewMessage('');

    // Only add optimistic message if we're using that approach
    const messageToDisplay = newMessage; // Store message text since we're clearing the input

    // For better UX, we'll add an optimistic message with a temporary ID and flag
    const tempId = `temp-${currentTime}`;
    const optimisticMessage = {
      id: tempId,
      senderId: currentUser.user_id,
      receiverId: parseInt(otherUserId),
      message: messageToDisplay,
      timestamp: new Date().toISOString(),
      isRead: false,
      foodId: location.state?.foodId || null,
      isOptimistic: true // Flag to identify this as an optimistic message
    };

    addDebugInfo(`Adding optimistic message: ${JSON.stringify(optimisticMessage)}`);
    setMessages(prevMessages => [...prevMessages, optimisticMessage]);
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!socketRef.current || !socketConnected) return;

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
        {/* Show socket debugging in development mode */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg">
            <h3 className="font-bold">Socket Debugging Info:</h3>
            <pre className="whitespace-pre-wrap text-xs mt-2">{debugInfo}</pre>
          </div>
        )}
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
        <div className="text-xs text-gray-400">
          {socketConnected ? 'Connected' : 'Disconnected'}
        </div>
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
                } ${msg.isOptimistic ? 'opacity-70' : ''}`}
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

      <form onSubmit={handleSendMessage} className="input-box flex items-center bg-white p-4 shadow-sm rounded-lg fixed bottom-0 left-0 right-0">
        <textarea
          value={newMessage}
          onChange={handleTyping}
          placeholder="Type a message..."
          rows="2"
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none"
        />
        <button
          type="submit"
          className="send-button bg-blue-500 text-white py-2 px-4 ml-4 rounded-lg hover:bg-blue-600"
          disabled={!socketConnected}
        >
          Send
        </button>
      </form>

      {/* Debugging panel - only shown in development mode */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-panel fixed right-4 bottom-24 bg-white p-2 border border-gray-200 rounded shadow-md">
          <button 
            onClick={() => document.getElementById('debug-info').classList.toggle('hidden')}
            className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
          >
            Toggle Debug Info
          </button>
          <div id="debug-info" className="hidden mt-2">
            <pre className="whitespace-pre-wrap text-xs max-h-40 overflow-auto">{debugInfo}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;