import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';

const ChatPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { foodId } = useParams(); // Get foodId from the URL

  const [food, setFood] = useState(null); // State to store the food item details
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');

  // Use useCallback to memoize the fetch functions
  const fetchFoodItem = useCallback(async () => {
    try {
      const response = await apiService.getFoodListing(foodId); // Fetch the food item based on foodId
      if (response.food) {
        setFood(response.food);
      } else {
        setError('Food item not found');
      }
    } catch (err) {
      console.error("Error fetching food item:", err);
      setError('Failed to load food item');
    }
  }, [foodId]);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await apiService.getChatMessages(foodId); // Fetch messages for the chat
      setMessages(response.messages);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError('Failed to load chat messages');
    }
  }, [foodId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;  // Empty message check
    
    try {
      const messageData = {
        senderId: currentUser.user_id,
        foodId: food.food_id,  // Send only the foodId
        message: newMessage,
      };

      const response = await apiService.sendChatMessage(messageData);
      setMessages((prevMessages) => [...prevMessages, response.message]);
      setNewMessage('');  // Clear input after sending
    } catch (err) {
      console.error("Error sending message:", err);
      setError('Failed to send message');
    }
  };

  const handleBack = () => {
    navigate(-1);  // Navigate back to the previous page (FoodDetailPage)
  };

  useEffect(() => {
    fetchFoodItem();
    fetchMessages();
  }, [fetchFoodItem, fetchMessages]); // Adding functions to dependencies to avoid eslint warnings

  // Correct return statement to be inside the function
  if (!food) {
    return (
      <div className="chat-page">
        <p>Loading food details...</p>
      </div>
    );
  }

  return (
    <div className="chat-page bg-gray-50 min-h-screen p-4">
      <div className="header flex items-center justify-between bg-white shadow-sm py-4 px-6 sticky top-0 z-10">
        <button onClick={handleBack} className="back-button text-blue-600">
          &lt; Back
        </button>
        <h2 className="text-xl font-semibold">Chat with {food.provider?.first_name} {food.provider?.last_name}</h2>
        <div className="flex space-x-2">
          {/* Add any actions here (like Share or Favorite) */}
        </div>
      </div>

      <div className="chat-box bg-white p-4 rounded-lg shadow-md mb-6 max-h-[60vh] overflow-auto">
        {error && <div className="error-message text-red-500">{error}</div>}

        {messages.length === 0 ? (
          <div className="no-messages p-4 bg-gray-100 rounded-lg">
            <p className="text-center text-gray-500">No messages yet. Be the first to start the conversation.</p>
          </div>
        ) : (
          <div className="messages space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message p-3 rounded-lg max-w-xs ${
                  msg.senderId === currentUser.user_id ? 'bg-blue-100 self-end ml-auto' : 'bg-gray-200 self-start'
                }`}
              >
                {/* Display sender name above the message */}
                <div className="message-sender text-sm font-semibold text-gray-700 text-center mb-2">
                  {msg.senderId === currentUser.user_id ? 'You' : food.provider?.first_name}
                </div>
                <div className="message-content text-gray-800">{msg.message}</div>
                <div className="message-time text-sm text-gray-400">{new Date(msg.timestamp).toLocaleTimeString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message input box */}
      <div className="input-box flex items-center bg-white p-4 shadow-sm rounded-lg fixed bottom-0 left-0 right-0">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          rows="3"
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
