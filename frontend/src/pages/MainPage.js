import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, MessageCircle, Clock, Package, Tag, MapPin, Heart, Share2, User, Bell, Filter, ShoppingBag, Map, Copy, Share } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';
import '../MainPage.css';
import '../MapStyles.css';
import LocationModal from '../pages/LocationModal';
import LocationMap from '../pages/LocationMap';
import { Link } from 'react-router-dom';
import FoodSkeleton from '../pages/FoodSkeleton';

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
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showMap, setShowMap] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [mapKey, setMapKey] = useState(Date.now());
  const [currentCity, setCurrentCity] = useState('San Francisco');
  const [selectedDistance, setSelectedDistance] = useState(null);
  const [selectedExpiration, setSelectedExpiration] = useState(null);
  const [sortOption, setSortOption] = useState('Newest');

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchFoodListings({
        food_type: selectedCategory === 'All' ? null : selectedCategory,
        q: searchQuery,
      });
    }, 500);
    fetchUserLocation();
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedCategory, selectedDistance, selectedExpiration, userLocation, sortOption]);

  const fetchFoodListings = async (filters = {}) => {
    try {
      setLoading(true);
      const response = await apiService.getFoodListings({
        status: 'available',
        food_type: filters.food_type || undefined,
        q: filters.q || undefined,
        max_distance: filters.distance || undefined,
        min_expiration_days: filters.expiration !== null ? filters.expiration : undefined,
        latitude: userLocation?.lat,
        longitude: userLocation?.lng,
      });
      if (response?.food_listings) {
        let listings = response.food_listings;

        // Sort listings based on sortOption
        if (sortOption === 'Expiring') {
          listings.sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date));
        } else if (sortOption === 'Distance' && userLocation) {
          listings.sort((a, b) => {
            const distA = calculateHaversineDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
            const distB = calculateHaversineDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
            return distA - distB;
          });
        } else {
          listings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Default: Newest
        }

        const transformedListings = listings.map((item) => ({
          id: item.food_id,
          type: 'food',
          title: item.title,
          foodType: item.food_type || 'Food',
          quantity: item.quantity || 1,
          expirationDays: calculateDaysRemaining(item.expiration_date),
          distance: calculateDistance(item) || '0.5 miles',
          owner: `${item.provider?.first_name || 'Anonymous'} ${item.provider?.last_name?.charAt(0) || ''}`.trim(),
          provider_id: item.provider?.user_id,
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

          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
            .then((response) => response.json())
            .then((data) => {
              if (data.address) {
                const city = data.address.city || data.address.town || data.address.village || 'Unknown';
                setCurrentCity(city);
              }
            })
            .catch((error) => {
              console.error('Error getting location name:', error);
            });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const calculateDaysRemaining = (expirationDateStr) => {
    if (!expirationDateStr) return 5;
    const expirationDate = new Date(expirationDateStr);
    const currentDate = new Date();
    const diffTime = expirationDate - currentDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const calculateDistance = (item) => {
    if (userLocation && item.latitude && item.longitude) {
      const distance = calculateHaversineDistance(userLocation.lat, userLocation.lng, item.latitude, item.longitude);
      return `${distance.toFixed(1)} miles`;
    }
    return `${(Math.random() * 2).toFixed(1)} miles`;
  };

  const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3958.8;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  const getFoodEmoji = (foodType) => {
    const typeToEmoji = {
      Fruit: '🍎',
      Vegetable: '🥦',
      Dairy: '🥛',
      Bakery: '🍞',
      Prepared: '🍲',
      Meat: '🥩',
      Seafood: '🐟',
      Snack: '🍿',
      Beverage: '🍹',
      Canned: '🥫',
      Frozen: '🧊',
      Grain: '🌾',
      Dessert: '🍰',
    };
    return typeToEmoji[foodType] || '🍽️';
  };

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
    { name: 'Prepared', icon: '🍲' },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    fetchFoodListings({
      food_type: selectedCategory === 'All' ? null : selectedCategory,
      q: searchQuery,
    });
  };

  const handleCategoryClick = (categoryName) => {
    setSelectedCategory(categoryName);
    setRecommendations([]);
    fetchFoodListings({
      food_type: categoryName === 'All' ? null : categoryName,
      q: searchQuery,
    });
  };

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
      setFavorites(favorites.filter((id) => id !== itemId));
    } else {
      setFavorites([...favorites, itemId]);
    }
  };

  // const shareItem = (e, item) => {
  //   e.stopPropagation();
  //   console.log('Sharing item:', item);
  // };

  const shareMenuRef = useRef(null);
  const [activeShareId, setActiveShareId] = useState(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target)) {
        setActiveShareId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleShareMenu = (e, itemId) => {
    e.stopPropagation();
    setActiveShareId(prev => (prev === itemId ? null : itemId));
  };

  const handleShareOption = async (type, item) => {
    const shareUrl = `${window.location.origin}/food/${item.id}`;
    setActiveShareId(null);

    if (type === 'copy') {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard!");
      } catch (err) {
        console.error("Clipboard failed:", err);
      }
    }

    if (type === 'native') {
      try {
        if (navigator.share) {
          await navigator.share({
            title: item.title,
            text: `Check out this food on FoodShare!`,
            url: shareUrl,
          });
        } else {
          alert("Native share not supported.");
        }
      } catch (err) {
        console.error("Native share failed:", err);
      }
    }
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

  const toggleMap = () => {
    setShowMap(!showMap);
  };

  const handleLocationSelect = (location) => {
    setUserLocation(location);
    setCurrentCity(location.address.split(',')[0] || 'Selected Location');
    setShowLocationModal(false);
    fetchFoodListings();
  };

  const handleChatList = () => {
    if (currentUser && currentUser.user_id) {
      navigate(`/chat-list/${currentUser.user_id}`);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="app-container">
      <div className="main-page">
        <header className="app-header">
          <div className="header-content">
            <div className="location-selector" onClick={() => setShowLocationModal(true)}>
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

          <div className="sort-dropdown">
            <label htmlFor="sort-select" style={{ marginRight: '8px' }}>Sort by:</label>
            <select
              id="sort-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="filter-button"
            >
              <option value="Newest">Newest</option>
              <option value="Expiring">Expiring Soon</option>
              <option value="Distance">Distance</option>
            </select>
          </div>
          <button className="filter-button" onClick={toggleFilters}>
            <Filter size={16} />
            <span>Filters</span>
          </button>
          <button className="map-toggle-button" onClick={toggleMap}>
            <Map size={16} />
            <span>{showMap ? 'List View' : 'Map View'}</span>
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
                <button
                  className={`filter-option ${selectedDistance === 0.5 ? 'active' : ''}`}
                  onClick={() => setSelectedDistance(0.5)}
                >
                  0.5 mi
                </button>
                <button
                  className={`filter-option ${selectedDistance === 1 ? 'active' : ''}`}
                  onClick={() => setSelectedDistance(1)}
                >
                  1 mi
                </button>
                <button
                  className={`filter-option ${selectedDistance === 3 ? 'active' : ''}`}
                  onClick={() => setSelectedDistance(3)}
                >
                  3 mi
                </button>
                <button
                  className={`filter-option ${selectedDistance === 5 ? 'active' : ''}`}
                  onClick={() => setSelectedDistance(5)}
                >
                  5+ mi
                </button>
              </div>
            </div>

            <div className="filter-group">
              <h4>Expiration</h4>
              <div className="filter-options">
                <button
                  className={`filter-option ${selectedExpiration === null ? 'active' : ''}`}
                  onClick={() => setSelectedExpiration(null)}
                >
                  Any
                </button>
                <button
                  className={`filter-option ${selectedExpiration === 0 ? 'active' : ''}`}
                  onClick={() => setSelectedExpiration(0)}
                >
                  Today
                </button>
                <button
                  className={`filter-option ${selectedExpiration === 3 ? 'active' : ''}`}
                  onClick={() => setSelectedExpiration(3)}
                >
                  3+ days
                </button>
              </div>
            </div>

            <div className="filter-actions">
              <button
                className="filter-reset"
                onClick={() => {
                  setSelectedDistance(null);
                  setSelectedExpiration(null);
                  fetchFoodListings({});
                }}
              >
                Reset
              </button>
              <button
                className="filter-apply"
                onClick={() => {
                  setShowFilters(false);
                  fetchFoodListings({
                    distance: selectedDistance,
                    expiration: selectedExpiration
                  });
                }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {showLocationModal && (
          <LocationModal
            isOpen={showLocationModal}
            onClose={() => setShowLocationModal(false)}
            onSelectLocation={handleLocationSelect}
            initialLocation={userLocation}
          />
        )}

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

        {!showMap && (
          <div className="feed-container">
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <>
                  {[...Array(4)].map((_, i) => (
                    <FoodSkeleton key={i} />
                  ))}
                </>
              </div>
            ) : error ? (
              <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>
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
                    className={`recommendation-card ${item.type === 'unavailable' ? 'unavailable' : ''} ${item.featured ? 'featured' : ''
                      }`}
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
                            {/* <button
                              className="action-button share-btn"
                              onClick={(e) => shareItem(e, item)}
                            >
                              <Share2 size={18} />
                            </button> */}
                            <button
                              className="action-button share-btn"
                              onClick={(e) => {
                                // e.stopPropagation();
                                toggleShareMenu(e, item.id);
                              }}
                              title="Share this post"
                            >
                              <Share2 size={18} />
                            </button>

                            {activeShareId === item.id && (
                              <div ref={shareMenuRef} className="absolute right-0 mt-2 w-40 bg-white border rounded shadow z-50 text-sm" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleShareOption('copy', item)}
                                  className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100"
                                >
                                  <Copy size={16} />
                                  <span>Copy link</span>
                                </button>
                                <button
                                  onClick={() => handleShareOption('native', item)}
                                  className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100"
                                >
                                  <Share size={16} />
                                  <span>Share on…</span>
                                </button>
                              </div>
                            )}
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
                                <span>
                                  Expires in {item.expirationDays} {item.expirationDays === 1 ? 'day' : 'days'}
                                </span>
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
                                <div className="owner-avatar">{item.owner.charAt(0)}</div>
                                <div className="owner-details">
                                  <Link
                                    to={`/user/${item.provider_id}/posts`}
                                    className="owner-name text-blue-600 hover:underline"
                                    onClick={(e) => e.stopPropagation()} // Prevent card click from firing
                                  >
                                    {item.owner}
                                  </Link>
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