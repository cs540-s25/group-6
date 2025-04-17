import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';
import { ArrowRight, ChevronLeft, Search, User, MessageCircle } from 'lucide-react';

const ChatListPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChatList = async () => {
      setLoading(true);
      try {
        const response = await apiService.getChatList(currentUser.user_id);
        if (response.conversations) {
          setConversations(response.conversations);
        }
      } catch (err) {
        console.error('Error fetching chat list:', err);
        setError('Failed to load chat list');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.user_id) {
      fetchChatList();
    }
  }, [currentUser?.user_id]);

  const handleChatClick = (otherUserId, otherUser) => {
    navigate(`/chat/${otherUserId}`, { state: { otherUser, foodTitle: otherUser.foodTitle } });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const filteredConversations = conversations.filter(convo => {
    const fullName = `${convo.otherUser.first_name} ${convo.otherUser.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           (convo.foodTitle && convo.foodTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
           (convo.latestMessage && convo.latestMessage.message.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-5">
      <div className="sticky top-0 z-10 flex flex-col space-y-4 bg-gray-50 pt-2 pb-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={handleBack} 
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
          >
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>
          
          <h2 className="text-2xl font-semibold text-gray-800">
            Messages
          </h2>
          
          <div className="w-10"></div> {/* Spacer for alignment */}
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-5 shadow-sm border border-red-200 flex items-center">
          <span className="mr-2">⚠️</span>
          {error}
        </div>
      )}

      <div className="space-y-3 mt-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-pulse text-gray-400">Loading conversations...</div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
            {searchTerm ? (
              <div>
                <p className="text-gray-600 text-lg">No conversations match your search</p>
                <button 
                  onClick={() => setSearchTerm('')}
                  className="mt-3 text-blue-500 hover:text-blue-700"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <MessageCircle size={40} className="text-gray-300 mb-3" />
                <p className="text-gray-600 text-lg">No chats available yet</p>
                <p className="text-gray-500 text-sm mt-1">Start a conversation by exploring listings</p>
              </div>
            )}
          </div>
        ) : (
          filteredConversations.map((convo) => (
            <div
              key={convo.otherUser.user_id}
              onClick={() => handleChatClick(convo.otherUser.user_id, convo.otherUser)}
              className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-blue-50 flex justify-between items-center border border-gray-100"
            >
              <div className="flex items-center flex-1 min-w-0">
                <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 mr-3 flex-shrink-0">
                  {convo.otherUser.avatar ? (
                    <img 
                      src={convo.otherUser.avatar} 
                      alt={`${convo.otherUser.first_name}'s avatar`}
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    <User size={24} />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-lg font-medium text-gray-800 truncate">
                      {convo.otherUser.first_name} {convo.otherUser.last_name}
                    </h3>
                    {convo.latestMessage && convo.latestMessage.timestamp && (
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {formatTimestamp(convo.latestMessage.timestamp)}
                      </span>
                    )}
                  </div>
                  
                  {convo.foodTitle && (
                    <p className="text-sm text-gray-500 truncate">
                      About: {convo.foodTitle}
                    </p>
                  )}
                  
                  {convo.latestMessage && (
                    <p className="text-gray-600 mt-1 truncate">
                      <span className="font-medium">
                        {convo.latestMessage.senderId === currentUser.user_id ? 'You: ' : ''}
                      </span>
                      {convo.latestMessage.message}
                    </p>
                  )}
                </div>
              </div>
              
              <ArrowRight size={18} className="text-blue-500 flex-shrink-0 ml-3" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatListPage;