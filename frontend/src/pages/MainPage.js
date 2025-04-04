import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, MessageCircle, Clock, Package, Tag, MapPin, Heart, Share2, User, Bell, Filter, ShoppingBag, Map } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';
import '../MainPage.css';
import '../MapStyles.css';
import LocationModal from '../pages/LocationModal';
import LocationMap from '../pages/LocationMap';

const MainPage = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(3);
  const [activeTab, setActiveTab] = useState('recommended');
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All'); // Track selected category
  const [showMap, setShowMap] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [mapKey, setMapKey] = useState(Date.now()); // For forcing map re-renders
  const [currentCity, setCurrentCity] = useState('San Francisco');
  // Fetch food listings on component mount

useEffect(() => {
  const debounceTimer = setTimeout(() => {
    fetchFoodListings({ 
      food_type: selectedCategory === 'All' ? null : selectedCategory,
      q: searchQuery 
    });
  }, 500);
  fetchUserLocation();
  return () => clearTimeout(debounceTimer);
}, [searchQuery]);

  // Update fetchFoodListings to use filters
  // const fetchFoodListings = async (filters = {}) => {
  //   try {
  //     setLoading(true);
  //     const response = await apiService.getFoodListings({
  //       status: 'available',  // Explicitly request available items
  //       food_type: filters.food_type || undefined,
  //       q: filters.q || undefined
  //     });
  
  //     if (response?.food_listings) {
  //       const transformedListings = response.food_listings.map((item) => ({
  //         id: item.food_id,
  //         type: 'food',
  //         title: item.title,
  //         foodType: item.food_type || 'Food',
  //         quantity: item.quantity || 1,
  //         expirationDays: calculateDaysRemaining(item.expiration_date),
  //         distance: calculateDistance(item) || '0.5 miles',
  //         owner: `${item.provider?.first_name || 'Anonymous'} ${item.provider?.last_name?.charAt(0) || ''}`.trim(),
  //         ownerRating: 4.8,
  //         image: getFoodEmoji(item.food_type),
  //         timePosted: formatTimeAgo(item.created_at),
  //         featured: false,
  //       }));
  //       setRecommendations(transformedListings);
  //     }
  //   } catch (err) {
  //     console.error('API Error:', err.response?.data || err.message);
  //     setError('Failed to load food listings. Please try again later.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Keep the transformation logic ONLY in fetchFoodListings
const fetchFoodListings = async (filters = {}) => {
  try {
    setLoading(true);
    console.log('Sending filters:', filters); 
    const response = await apiService.getFoodListings({
      status: 'available',
      food_type: filters.food_type || undefined,
      q: filters.q || undefined
    });
    console.log('API Response:', response);
    if (response?.food_listings) {
      const transformedListings = response.food_listings.map((item) => ({
        id: item.food_id,
        type: 'food',
        title: item.title,
        foodType: item.food_type || 'Food',
        quantity: item.quantity || 1,
        expirationDays: calculateDaysRemaining(item.expiration_date),
        distance: calculateDistance(item) || '0.5 miles',
        owner: `${item.provider?.first_name || 'Anonymous'} ${item.provider?.last_name?.charAt(0) || ''}`.trim(),
        ownerRating: 4.8,
        image: getFoodEmoji(item.food_type),
        timePosted: formatTimeAgo(item.created_at),
        featured: false,
      }));
      setRecommendations(transformedListings);
    }
  } catch (err) {
    console.error('API Error:', err.response?.data || err.message);
    setError('Failed to load food listings. Please try again later.');
  } finally {
    setLoading(false);
  }
};
const fetchUserLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        
        // Get city name from coordinates
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          .then(response => response.json())
          .then(data => {
            if (data.address) {
              const city = data.address.city || data.address.town || data.address.village || 'Unknown';
              setCurrentCity(city);
            }
          })
          .catch(error => {
            console.error('Error getting location name:', error);
          });
      },
      (error) => {
        console.error('Error getting location:', error);
      }
    );
  }
};
  // Helper function to calculate days remaining until expiration
  const calculateDaysRemaining = (expirationDateStr) => {
    if (!expirationDateStr) return 5; // Default value
    const expirationDate = new Date(expirationDateStr);
    const currentDate = new Date();
    const diffTime = expirationDate - currentDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Helper function to calculate distance using Haversine formula
  const calculateDistance = (item) => {
    // In a real app, you would use the user's location and the item's location
    // to calculate the actual distance
    if (userLocation && item.latitude && item.longitude) {
      // Calculate distance using Haversine formula
      const distance = calculateHaversineDistance(
        userLocation.lat, 
        userLocation.lng, 
        item.latitude, 
        item.longitude
      );
      return `${distance.toFixed(1)} miles`;
    }
    return `${(Math.random() * 2).toFixed(1)} miles`;
  };
  // distance from user location to the persons location who added the post will be calculated by this
  const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3958.8; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
};

  // Helper function to get an emoji based on food type
  const getFoodEmoji = (foodType) => {
    const typeToEmoji = {
      'Fruit': '🍎',
      'Vegetable': '🥦',
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
    { name: 'Fruit', icon: '🍎' },
    { name: 'Vegetable', icon: '🥦' },
    { name: 'Dairy', icon: '🥛' },
    { name: 'Bakery', icon: '🍞' },
    { name: 'Prepared', icon: '🍲' }
  ];

  
  

  // Update handleSearch to fetch filtered data
  const handleSearch = (e) => {
    e.preventDefault();
    fetchFoodListings({ 
      food_type: selectedCategory === 'All' ? null : selectedCategory,
      q: searchQuery 
    });
  };

 // Updated handleCategoryClick with proper API handling
// const handleCategoryClick = async (categoryName) => {
//   setSelectedCategory(categoryName);
//   try {
//     const filters = {
//       food_type: categoryName === 'All' ? null : categoryName,
//       q: searchQuery
//     };
    
//     // Clear previous results while loading
//     setRecommendations([]);
//     setLoading(true);
    
//     const response = await apiService.getFoodListings(filters);
    
//     if (response?.food_listings) {
//       const transformed = response.food_listings.map(item => ({
//         id: item.food_id,
//         title: item.title,
//         foodType: item.food_type,
//         // ... other transformations
//       }));
//       setRecommendations(transformed);
//     }
//   } catch (error) {
//     setError('Failed to load items');
//     console.error('API Error:', error);
//   } finally {
//     setLoading(false);
//   }
// };

const handleCategoryClick = (categoryName) => {
  setSelectedCategory(categoryName);
  setRecommendations([]);
  fetchFoodListings({ 
    food_type: categoryName === 'All' ? null : categoryName,
    q: searchQuery 
  });
};

// Remove the duplicate API call version of handleCategoryClick
  const handleAddPost = () => {
    if (!currentUser) {
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

  // Add these with your other handler functions
  const toggleMap = () => {
    setShowMap(!showMap);
  };

const handleLocationSelect = (location) => {
  setUserLocation(location);
  setCurrentCity(location.address.split(',')[0] || 'Selected Location');
  
  // In a real app, you would make an API call to get food listings near this location
  // For now, we'll just close the modal
  setShowLocationModal(false);
  
  // Refresh listings with new location
  fetchFoodListings();
};


  return (
    <div className="app-container">
      <div className="main-page">
        <header className="app-header">
          <div className="header-content">
          <div 
              className="location-selector"
              onClick={() => setShowLocationModal(true)}
            >
              <MapPin size={16} />
              <span>{currentCity}</span>
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
            className={`category-pill ${selectedCategory === category.name ? 'active' : ''}`}
            onClick={() => handleCategoryClick(category.name)}
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
          <button className="map-toggle-button" onClick={toggleMap}>
            <Map size={16} />
            <span>{showMap ? "List View" : "Map View"}</span>
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
        
        {/* Location Modal */}
        {showLocationModal && (
          <LocationModal 
            isOpen={showLocationModal} 
            onClose={() => setShowLocationModal(false)} 
            onSelectLocation={handleLocationSelect} 
            initialLocation={userLocation}
          />
        )}
        
        {/* Map View */}
        {showMap && (
          <div className="map-view-container">
            <LocationMap 
              position={userLocation ? [userLocation.lat, userLocation.lng] : undefined}
              foodItems={recommendations}
              zoom={13}
              selectable={false}
            />
          </div>
        )}
{/* List View */}
{!showMap && (
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
        )}
      </div>

      <div className="app-footer">
        <nav className="footer-nav">
          <button className="nav-button active">
            <ShoppingBag size={20} />
            <span>Browse</span>
          </button>
          <button className="nav-button" onClick={toggleMap}>
            <Map size={20} />
            <span>Map</span>
          </button>
          <button className="add-listing-button" onClick={handleAddPost}>
            <Plus size={24} />
          </button>
          <button className="nav-button">
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