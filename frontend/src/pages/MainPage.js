import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, MessageCircle, Clock, Package, Tag, MapPin, Heart, Share2, User, Bell, Filter, ShoppingBag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';
import '../MainPage.css';

const MainPage = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(0);
  const [activeTab, setActiveTab] = useState('recommended');
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch food listings on component mount
  useEffect(() => {
    fetchFoodListings();
  }, []);

  const fetchFoodListings = async () => {
    try {
      setLoading(true);
      const response = await apiService.getFoodListings();

      if (response && response.food_listings) {
        // Transform the API response to match our UI format
        const transformedListings = response.food_listings.map(item => ({
          id: item.food_id,
          type: 'food',
          title: item.title,
          foodType: item.food_type || 'Food',
          quantity: item.quantity || 1,
          expirationDays: calculateDaysRemaining(item.expiration_date),
          distance: calculateDistance(item) || '0.5 miles',
          owner: `${item.provider?.first_name || 'Anonymous'} ${item.provider?.last_name?.charAt(0) || ''}`.trim(),
          ownerRating: 4.8, // Placeholder until we implement ratings
          image: getFoodEmoji(item.food_type),
          timePosted: formatTimeAgo(item.created_at),
          featured: false // We could set this based on some criteria
        }));

        setRecommendations(transformedListings);
      }
    } catch (err) {
      console.error('Error fetching food listings:', err);
      setError('Failed to load food listings');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate days remaining until expiration
  const calculateDaysRemaining = (expirationDateStr) => {
    if (!expirationDateStr) return 5; // Default value

    const expirationDate = new Date(expirationDateStr);
    const currentDate = new Date();

    // Calculate the difference in days
    const diffTime = expirationDate - currentDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  };

  // Helper function to calculate distance (placeholder)
  const calculateDistance = (item) => {
    // In a real app, you would use the user's location and the item's location
    // to calculate the actual distance
    return `${(Math.random() * 2).toFixed(1)} miles`;
  };

  // Helper function to get an emoji based on food type
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

  // Helper function to format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'recently';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffMins > 0) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      return 'just now';
    }
  };

  const foodCategories = [
    { name: 'All', icon: '🍽️' },
    { name: 'Fruits', icon: '🍎' },
    { name: 'Vegetables', icon: '🥦' },
    { name: 'Dairy', icon: '🥛' },
    { name: 'Bakery', icon: '🍞' },
    { name: 'Prepared', icon: '🍲' }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
  };

  const handleAddPost = () => {
    if (!currentUser) {
      // Redirect to login if user is not authenticated
      navigate('/login');
      return;
    }
    navigate('/add-food');
  };

  const handleViewPost = (item) => {
    navigate(`/food/${item.id}`);
  };

  const toggleFavorite = (e, itemId) => {
    e.stopPropagation();
    if (favorites.includes(itemId)) {
      setFavorites(favorites.filter(id => id !== itemId));
    } else {
      setFavorites([...favorites, itemId]);
    }
  };

  const shareItem = (e, item) => {
    e.stopPropagation();
    console.log('Sharing item:', item);
  };

  const getExpirationClass = (days) => {
    if (days <= 1) return 'expiration-urgent';
    if (days <= 3) return 'expiration-warning';
    return 'expiration-normal';
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const changeTab = (tab) => {
    setActiveTab(tab);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleProfileClick = () => {
    if (currentUser) {
      navigate('/profile');
    } else {
      navigate('/login');
    }
  };

  const handleChatList = () => {
    if (currentUser && currentUser.user_id) {
      // Navigate to the chat list for the current user
      navigate(`/chat-list/${currentUser.user_id}`);
    } else {
      console.error('User not authenticated');
    }
  };    

  return (
    <div className="app-container">
      <div className="main-page">
        <header className="app-header">
          <div className="header-content">
            <div className="location-selector">
              <MapPin size={16} />
              <span>Atlanta</span>
            </div>

            <h1 className="app-title">foodshare</h1>

            <div className="user-actions">
              <button className="notification-btn">
                <Bell size={22} />
                {notifications > 0 && <span className="notification-badge">{notifications}</span>}
              </button>
              <button className="profile-btn" onClick={handleProfileClick}>
                <User size={22} />
              </button>
            </div>
          </div>
        </header>

        <div className="search-container">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for food items nearby..."
                className="search-input"
              />
            </div>
          </form>
        </div>

        <div className="categories-scroll">
          {foodCategories.map((category, index) => (
            <button
              key={index}
              className={`category-pill ${index === 0 ? 'active' : ''}`}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.name}</span>
            </button>
          ))}
        </div>

        <div className="tabs-container">
          <button
            className={`tab-button ${activeTab === 'recommended' ? 'active' : ''}`}
            onClick={() => changeTab('recommended')}
          >
            Recommended
          </button>
          <button
            className={`tab-button ${activeTab === 'nearby' ? 'active' : ''}`}
            onClick={() => changeTab('nearby')}
          >
            Nearby
          </button>
          <button
            className={`tab-button ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => changeTab('favorites')}
          >
            Favorites
          </button>
        </div>

        <div className="actions-container">
          <button className="filter-button" onClick={toggleFilters}>
            <Filter size={16} />
            <span>Filters</span>
          </button>
          <button className="add-button" onClick={handleAddPost}>
            <Plus size={20} />
          </button>
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div className="filter-group">
              <h4>Distance</h4>
              <div className="filter-options">
                <button className="filter-option active">0.5 mi</button>
                <button className="filter-option">1 mi</button>
                <button className="filter-option">3 mi</button>
                <button className="filter-option">5+ mi</button>
              </div>
            </div>
            <div className="filter-group">
              <h4>Expiration</h4>
              <div className="filter-options">
                <button className="filter-option active">Any</button>
                <button className="filter-option">Today</button>
                <button className="filter-option">3+ days</button>
              </div>
            </div>
            <div className="filter-actions">
              <button className="filter-reset">Reset</button>
              <button className="filter-apply">Apply Filters</button>
            </div>
          </div>
        )}

        <div className="feed-container">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <p className="text-gray-500">Loading food items...</p>
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          ) : recommendations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="text-5xl mb-4">🍽️</div>
              <p className="text-xl font-medium text-gray-700 mb-2">No food items available</p>
              <p className="text-gray-500 mb-4">Be the first to share food in your community!</p>
              <button
                onClick={handleAddPost}
                className="bg-primary-color text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Plus size={16} className="mr-2" />
                Add Food Item
              </button>
            </div>
          ) : (
            <div className="recommendations-list">
              {recommendations.map((item, index) => (
                <div
                  key={item.id}
                  className={`recommendation-card ${item.type === 'unavailable' ? 'unavailable' : ''} ${item.featured ? 'featured' : ''}`}
                  onClick={() => handleViewPost(item)}
                  style={{ '--animation-order': index }}
                >
                  <div className="card-content">
                    <div className="card-left">
                      <div className="card-icon">
                        <span>{item.image}</span>
                      </div>
                      {item.featured && <div className="featured-badge">Featured</div>}
                    </div>

                    <div className="card-details">
                      <div className="card-header">
                        <h3 className="item-title">{item.title}</h3>
                        <div className="card-actions">
                          <button
                            className={`action-button favorite-btn ${favorites.includes(item.id) ? 'active' : ''}`}
                            onClick={(e) => toggleFavorite(e, item.id)}
                          >
                            <Heart size={18} />
                          </button>
                          <button
                            className="action-button share-btn"
                            onClick={(e) => shareItem(e, item)}
                          >
                            <Share2 size={18} />
                          </button>
                        </div>
                      </div>

                      {item.type === 'food' && (
                        <>
                          <div className="item-meta">
                            <div className="meta-row">
                              <Tag size={14} className="meta-icon" />
                              <span>{item.foodType}</span>
                            </div>

                            <div className="meta-row">
                              <Package size={14} className="meta-icon" />
                              <span>Qty: {item.quantity}</span>
                            </div>

                            <div className={`meta-row ${getExpirationClass(item.expirationDays)}`}>
                              <Clock size={14} className="meta-icon" />
                              <span>Expires in {item.expirationDays} {item.expirationDays === 1 ? 'day' : 'days'}</span>
                            </div>
                          </div>

                          <div className="card-footer">
                            <div className="location-time">
                              <div className="distance">
                                <MapPin size={12} />
                                <span>{item.distance}</span>
                              </div>
                              <div className="time-posted">
                                <span>{item.timePosted}</span>
                              </div>
                            </div>

                            <div className="owner-info">
                              <div className="owner-avatar">
                                {item.owner.charAt(0)}
                              </div>
                              <div className="owner-details">
                                <span className="owner-name">{item.owner}</span>
                                <div className="owner-rating">
                                  <span className="star">★</span>
                                  <span>{item.ownerRating}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {item.type === 'unavailable' && (
                        <div className="unavailable-message">
                          <span>This item has been claimed</span>
                          <span className="time-ago">{item.timePosted}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="app-footer">
        <nav className="footer-nav">
          <button className="nav-button active">
            <ShoppingBag size={20} />
            <span>Browse</span>
          </button>
          <button className="nav-button">
            <MapPin size={20} />
            <span>Nearby</span>
          </button>
          <button className="add-listing-button" onClick={handleAddPost}>
            <Plus size={24} />
          </button>
          <button className="nav-button" onClick={handleChatList}>
            <MessageCircle size={20} />
            <span>Messages</span>
            {notifications > 0 && <span className="nav-badge">{notifications}</span>}
          </button>
          <button className="nav-button" onClick={handleProfileClick}>
            <User size={20} />
            <span>Profile</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default MainPage;