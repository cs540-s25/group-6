import React, { useState, useEffect } from 'react';
import { Search, Plus, MessageCircle, Clock, Package, Tag, MapPin, Heart, Share2, User, Bell, Filter, ShoppingBag } from 'lucide-react';
import './MainPage.css';

const MainPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(3);
  const [activeTab, setActiveTab] = useState('recommended');
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState([3, 5]);
  
  const [recommendations, setRecommendations] = useState([
    {
      id: 1,
      type: 'food',
      title: 'Fresh Organic Apples',
      foodType: 'Fruit',
      quantity: 4,
      expirationDays: 5,
      distance: '0.3 miles',
      owner: 'Sarah K.',
      ownerRating: 4.8,
      image: '🍎',
      timePosted: '2 hours ago'
    },
    {
      id: 2,
      type: 'unavailable',
      title: 'Homemade Chocolate Cake',
      image: '🍰',
      timePosted: '1 day ago'
    },
    {
      id: 3,
      type: 'food',
      title: 'Artisan Sourdough Bread',
      foodType: 'Bakery',
      quantity: 1,
      expirationDays: 2,
      distance: '0.5 miles',
      owner: 'Mike T.',
      ownerRating: 4.9,
      image: '🍞',
      timePosted: '3 hours ago',
      featured: true
    },
    {
      id: 4,
      type: 'food',
      title: 'Homemade Pasta Sauce',
      foodType: 'Prepared',
      quantity: 2,
      expirationDays: 4,
      distance: '1.2 miles',
      owner: 'Julia M.',
      ownerRating: 4.6,
      image: '🍝',
      timePosted: '5 hours ago'
    },
    {
      id: 5,
      type: 'food',
      title: 'Organic Milk',
      foodType: 'Dairy',
      quantity: 1,
      expirationDays: 3,
      distance: '0.8 miles',
      owner: 'David L.',
      ownerRating: 4.7,
      image: '🥛',
      timePosted: '1 hour ago',
      featured: true
    }
  ]);

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
    console.log('Navigating to Post Upload page');
  };

  const handleViewPost = (item) => {
    console.log('Viewing post:', item);
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

  return (
    <div className="app-container">
      <div className="main-page">
        <header className="app-header">
          <div className="header-content">
            <div className="location-selector">
              <MapPin size={16} />
              <span>San Francisco</span>
            </div>
            
            <h1 className="app-title">foodshare</h1>
            
            <div className="user-actions">
              <button className="notification-btn">
                <Bell size={22} />
                {notifications > 0 && <span className="notification-badge">{notifications}</span>}
              </button>
              <button className="profile-btn">
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
          <button className="nav-button">
            <MessageCircle size={20} />
            <span>Messages</span>
            {notifications > 0 && <span className="nav-badge">{notifications}</span>}
          </button>
          <button className="nav-button">
            <User size={20} />
            <span>Profile</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default MainPage;