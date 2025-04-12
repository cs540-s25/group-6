// src/pages/FoodDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Heart, Share2, MapPin, Calendar, Package, Tag, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';

const FoodDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [ratingScore, setRatingScore] = useState('');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);


  // Fetch food item on component mount
  useEffect(() => {
    fetchFoodItem();
  }, [id]);

  const fetchFoodItem = async () => {
    try {
      setLoading(true);
      const response = await apiService.getFoodListing(id);

      if (response.food) {
        setFood(response.food);
      }
    } catch (err) {
      console.error(`Error fetching food item ${id}:`, err);
      setError('Failed to load food item');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const shareItem = () => {
    // Implement share functionality
    console.log('Sharing food item:', food);
  };

  const handleContactOwner = () => {
    if (!currentUser) {
      navigate('/login');  // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
      return;
    }

    if (food) {
      // food_id만 넘기기
      navigate(`/chat/${food.food_id}`);
    } else {
      console.error('Food item data is missing');
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Helper function to format time
  const formatTime = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get food emoji based on type
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

  
  const [providerRating, setProviderRating] = useState(0);

  useEffect(() => {
    async function fetchRating() {
      if (!food?.provider?.user_id) return;
      try {
        const response = await fetch(`http://localhost:5001/api/users/${food.provider.user_id}/rating`);
        const data = await response.json();
        setProviderRating(data.average_rating);
      } catch (error) {
        console.error("Error fetching rating:", error);
      }
    }
  
    fetchRating();
  }, [food]);
  
  useEffect(() => {
    async function checkIfUserRated() {
      if (!currentUser?.user_id || !food?.food_id || !food?.provider?.user_id) return;
  
      try {
        const res = await fetch(`http://localhost:5001/api/ratings/check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            giver_id: currentUser.user_id,
            receiver_id: food.provider.user_id,
            resource_id: food.food_id,
            resource_type: "food"
          }),
        });
  
        const data = await res.json();
        if (data.already_rated) setSubmitted(true);
      } catch (err) {
        console.error("Failed to check rating:", err);
      }
    }
  
    checkIfUserRated();
  }, [currentUser, food]);
  
  // ✅ Only now return
  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen p-4 flex justify-center items-center">
        <p className="text-gray-500">Loading food item...</p>
      </div>
    );
  }
  
  if (error || !food) {
    return (
      <div className="bg-gray-50 min-h-screen p-4">
        <button
          onClick={() => navigate('/home')}
          className="flex items-center text-blue-600 mb-6 hover:text-blue-800"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Home
        </button>
  
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {error || 'Food item not found'}
        </div>
      </div>
    );
  }

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
  
    const payload = {
      giver_id: currentUser?.user_id,
      receiver_id: food?.provider?.user_id,
      resource_id: food?.food_id,
      resource_type: "food",
      score: parseInt(ratingScore),
      comment
    };
  
    try {
      const res = await fetch("http://localhost:5001/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      const data = await res.json();
      console.log(data);
      setSubmitted(true);
    } catch (err) {
      console.error("Rating submission failed:", err);
    }
  };
  
  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      <div className="sticky top-0 bg-white shadow-sm z-10">
        <div className="container mx-auto p-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center text-gray-600"
          >
            <ArrowLeft size={20} />
          </button>

          <h1 className="text-xl font-semibold text-center">Food Details</h1>

          <div className="flex space-x-3">
            <button onClick={toggleFavorite} className={`${isFavorite ? 'text-red-500' : 'text-gray-400'}`}>
              <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
            </button>
            <button onClick={shareItem} className="text-gray-400">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-4xl mr-4">
                {getFoodEmoji(food.food_type)}
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">{food.title}</h2>
                <div className="flex items-center text-gray-500 text-sm">
                  <Tag size={14} className="mr-1" />
                  <span>{food.food_type}</span>
                </div>
              </div>
            </div>

            {food.description && (
              <div className="mt-4 mb-6">
                <p className="text-gray-600">{food.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center text-blue-700 mb-1">
                  <Package size={16} className="mr-2" />
                  <span className="font-medium">Quantity</span>
                </div>
                <p className="text-gray-700">
                  {food.quantity} {food.unit || 'item(s)'}
                </p>
              </div>

              <div className="bg-amber-50 rounded-lg p-3">
                <div className="flex items-center text-amber-700 mb-1">
                  <Calendar size={16} className="mr-2" />
                  <span className="font-medium">Expires On</span>
                </div>
                <p className="text-gray-700">
                  {formatDate(food.expiration_date)}
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-3">
                <div className="flex items-center text-green-700 mb-1">
                  <Clock size={16} className="mr-2" />
                  <span className="font-medium">Available From</span>
                </div>
                <p className="text-gray-700">
                  {formatDate(food.available_from)} {formatTime(food.available_from)}
                </p>
              </div>

              <div className="bg-purple-50 rounded-lg p-3">
                <div className="flex items-center text-purple-700 mb-1">
                  <Clock size={16} className="mr-2" />
                  <span className="font-medium">Available Until</span>
                </div>
                <p className="text-gray-700">
                  {formatDate(food.available_until)} {formatTime(food.available_until)}
                </p>
              </div>
            </div>

            {food.allergens && (
              <div className="mb-6">
                <h3 className="text-gray-700 font-medium mb-2">Allergens:</h3>
                <p className="text-gray-600">{food.allergens}</p>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center text-gray-700 mb-2">
                <MapPin size={16} className="mr-2" />
                <h3 className="font-medium">Pickup Location</h3>
              </div>
              <p className="text-gray-600">{food.pickup_location || 'Not specified'}</p>

              {/* Map placeholder - would be implemented with a mapping library */}
              {food.pickup_latitude && food.pickup_longitude && (
                <div className="mt-2 bg-gray-200 rounded h-32 flex items-center justify-center">
                  <p className="text-gray-500">Map would be displayed here</p>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 font-semibold mr-3">
                  {food.provider?.first_name?.charAt(0) || 'U'}
                </div>
                <div className="flex items-center text-amber-500">
                  <span>{"★".repeat(Math.round(providerRating))}</span>
                  <span className="text-gray-600 text-sm ml-1">{providerRating.toFixed(1)}</span>
                </div>
              </div>
              <button
                onClick={handleContactOwner}
                className="w-full flex items-center justify-center bg-white border border-blue-500 text-blue-500 py-2 rounded-lg font-medium"
              >
                <MessageCircle size={18} className="mr-2" />
                Contact
              </button>
              {currentUser?.user_id !== food.provider.user_id && (
              <div className="mt-4">
                {!submitted ? (
                  <form onSubmit={handleRatingSubmit}>
                    <h4 className="font-medium text-gray-700 mb-2">Rate this user</h4>
                    <div className="flex items-center mb-2">
                      <label className="mr-2 text-sm text-gray-600">Your Rating:</label>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          onClick={() => setRatingScore(star)}
                          className={`cursor-pointer text-2xl ${
                            star <= ratingScore ? "text-yellow-400" : "text-gray-300"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>

                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Leave a comment"
                      className="w-full border p-2 rounded mb-2 text-sm"
                    />
                    <button
                      type="submit"
                      className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                    >
                      Submit Rating
                    </button>
                  </form>
                ) : (
                  <p className="text-green-600 text-sm mt-2"> Thank you for rating!</p>
                )}
              </div>
            )}


            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodDetailPage;