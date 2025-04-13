import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Package, Tag, MessageCircle, Bell, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';

const UserPostsPage = () => {
  const { userId } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const response = await apiService.getFoodListingsByUser(userId);
        setPosts(response.food_listings);
      } catch (err) {
        console.error('Failed to fetch user posts', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, [userId]);

  const handleContactOwner = (foodId) => {
    if (!currentUser) {
      navigate('/login');
    } else {
      navigate(`/chat/${foodId}`);
    }
  };

  const getFoodEmoji = (foodType) => {
    const typeToEmoji = {
      'Fruit': '🍎',
      'Vegetables': '🥦',
      'Dairy': '🥛',
      'Bakery': '🍞',
      'Prepared': '🍲',
      'Meat': '🥩',
      'Seafood': '🐟',
      'Snack': '🍿',
      'Beverage': '🍹',
      'Canned': '🥫',
      'Frozen': '🧊',
      'Grain': '🌾',
      'Dessert': '🍰'
    };
    return typeToEmoji[foodType] || '🍽️';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
        <div className="sticky top-0 bg-white shadow-sm z-10">
        <div className="container mx-auto p-4 flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-600">
            <ArrowLeft size={20} />
            </button>

            <h1 className="text-xl font-semibold text-center">
                {posts[0]?.provider?.first_name
                    ? `${posts[0].provider.first_name}'s Food Listings`
                    : "User's Food Listings"}

            </h1>

            <div className="flex space-x-3">
            <button className="text-gray-400">
                <Bell size={20} />
            </button>
            <button
                onClick={() => (currentUser ? navigate('/profile') : navigate('/login'))}
                className="text-gray-400"
            >
                <User size={20} />
            </button>
            </div>
        </div>
        </div>
    
        <div className="container mx-auto px-4 py-6">
            {loading ? (
                <p className="text-gray-500 text-center">Loading...</p>
            ) : posts.length === 0 ? (
                <p className="text-center text-gray-500">No posts found for this user.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                    <div
                    key={post.food_id}
                    className="bg-white border border-gray-200 rounded-xl shadow-sm p-4"
                  >
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl mr-4">
                        {getFoodEmoji(post.food_type)}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">{post.title}</h3>
                        <div className="flex items-center text-gray-500 text-sm">
                          <Tag size={14} className="mr-1" />
                          <span>{post.food_type}</span>
                        </div>
                      </div>
                    </div>
      
                    {post.description && (
                      <p className="text-gray-600 text-sm mb-4">{post.description}</p>
                    )}
      
                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="bg-blue-50 rounded-lg p-3">
                          <div className="flex items-center text-blue-700 mb-1">
                          <Package size={14} className="mr-2" />
                          <span className="font-medium">Quantity</span>
                          </div>
                          <p className="text-gray-700">
                          {post.quantity || 1} {post.unit || 'items'}
                          </p>
                      </div>
      
                      <div className="bg-amber-50 rounded-lg p-3">
                          <div className="flex items-center text-amber-700 mb-1">
                          <Calendar size={14} className="mr-2" />
                          <span className="font-medium">Expires</span>
                          </div>
                          <p className="text-gray-700">{formatDate(post.expiration_date)}</p>
                      </div>
      
                      <div className="bg-green-50 rounded-lg p-3">
                          <div className="flex items-center text-green-700 mb-1">
                          <Calendar size={14} className="mr-2" />
                          <span className="font-medium">Available From</span>
                          </div>
                          <p className="text-gray-700">
                          {formatDate(post.available_from)} {formatTime(post.available_from)}
                          </p>
                      </div>
      
                      <div className="bg-purple-50 rounded-lg p-3">
                          <div className="flex items-center text-purple-700 mb-1">
                          <Calendar size={14} className="mr-2" />
                          <span className="font-medium">Available Until</span>
                          </div>
                          <p className="text-gray-700">
                          {formatDate(post.available_until)} {formatTime(post.available_until)}
                          </p>
                      </div>
                      </div>
      
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 font-semibold mr-3">
                        {post.provider?.first_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-gray-800 text-sm font-medium">
                          {post.provider
                            ? `${post.provider.first_name} ${post.provider.last_name}`
                            : 'Anonymous'}
                        </p>
                      </div>
                    </div>
      
                    <div className="bg-white border border-gray-200 rounded-lg p-4 mt-4">
                      <div className="flex items-center mb-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 font-semibold mr-3">
                          {post.provider?.first_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                          <h3 className="font-medium">
                              {post.provider ? `${post.provider.first_name} ${post.provider.last_name}` : 'Anonymous'}
                          </h3>
                          <div className="flex items-center text-amber-500">
                              <span>★★★★★</span>
                              <span className="text-gray-600 text-sm ml-1">5.0</span>
                          </div>
                          </div>
                      </div>
      
                          <button
                          onClick={() => handleContactOwner(post.food_id)}
                          className="w-full flex items-center justify-center bg-white border border-blue-500 text-blue-500 py-2 rounded-lg font-medium hover:bg-blue-50 transition"
                          >
                          <MessageCircle size={18} className="mr-2" />
                          Contact
                          </button>
                      </div>
      
                  </div>
                ))}
                </div>
            )}
            </div>
    </div>
  );
};

export default UserPostsPage;
