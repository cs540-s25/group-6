import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';
import { ArrowRight } from 'lucide-react';

const ChatListPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [chats, setChats] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChatList = async () => {
      try {
        const response = await apiService.getChatList(currentUser.user_id);
        if (response.chats) {
          setChats(response.chats);
        }
      } catch (err) {
        console.error("Error fetching chat list:", err);
        setError('Failed to load chat list');
      }
    };
    
    fetchChatList();
  }, [currentUser.user_id]);

  const handleChatClick = (foodId) => {
    navigate(`/chat/${foodId}`);
  };

  const handleBack = () => {
    navigate(-1); 
  };    
    
  return (
    <div style={{ padding: '20px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      
      <div className="header flex items-center justify-between top-0 z-10">
        <button onClick={handleBack} className="back-button text-blue-600">
          &lt; Back
        </button>
        <div className="flex space-x-2"></div>
      </div>
    
      <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#333', marginBottom: '20px' }}>
        Your Chats
      </h2>

      {error && (
        <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {chats.length === 0 ? (
          <p style={{ color: '#666', fontSize: '18px' }}>No chats available. Start a conversation!</p>
        ) : (
          chats.map((chat) => (
            <div 
              key={chat.foodId}
              onClick={() => handleChatClick(chat.foodId)}
              style={{
                backgroundColor: '#ffffff',
                padding: '15px',
                marginBottom: '10px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, background-color 0.2s ease',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f1f1'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
            >
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '20px', fontWeight: '500', color: '#333', margin: 0 }}>
                  {chat.foodTitle}
                </h3>
                
                {chat.messages.length > 0 && (
                  <p style={{ fontSize: '16px', color: '#666', margin: '5px 0' }}>
                    <strong>{chat.messages[chat.messages.length - 1].senderId === currentUser.user_id ? 'You' : 'Provider'}:</strong>
                    {` ${chat.messages[chat.messages.length - 1].message}`} (Last message)
                  </p>
                )}
              </div>

              <ArrowRight size={24} color="#3498db" style={{ cursor: 'pointer' }} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatListPage;
