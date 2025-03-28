// src/services/apiService.js
const API_BASE_URL = 'http://localhost:5000';

/**
 * API Service for handling all backend requests
 */
class ApiService {
  // Authentication methods

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} - Response from API
   */
  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} - Response from API with user data
   */
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Logout the current user
   * @returns {Promise} - Response from API
   */
  async logout() {
    try {
      const response = await fetch(`${API_BASE_URL}/logout`, {
        method: 'GET',
        credentials: 'include',
      });

      return await response.json();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise} - Response from API
   */
  async requestPasswordReset(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/reset_password_request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      return await response.json();
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise} - Response from API
   */
  async resetPassword(token, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/reset_password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      return await response.json();
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  /**
   * Resend verification email
   * @param {string} email - User email
   * @returns {Promise} - Response from API
   */
  async resendVerification(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/resend_verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      return await response.json();
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  }

  // Food Listing methods

  /**
   * Get all food listings
   * @returns {Promise} - Response with food listings
   */
  async getFoodListings() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/food_listings`, {
        credentials: 'include',
      });

      return await response.json();
    } catch (error) {
      console.error('Get food listings error:', error);
      throw error;
    }
  }

  /**
   * Create a new food listing
   * @param {Object} foodData - Food listing data
   * @returns {Promise} - Response from API
   */
  async createFoodListing(foodData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/food_listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(foodData),
        credentials: 'include',
      });

      return await response.json();
    } catch (error) {
      console.error('Create food listing error:', error);
      throw error;
    }
  }

  /**
   * Get a single food listing
   * @param {number} id - Food listing ID
   * @returns {Promise} - Response with food listing
   */
  async getFoodListing(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/food_listings/${id}`, {
        credentials: 'include',
      });

      return await response.json();
    } catch (error) {
      console.error(`Get food listing ${id} error:`, error);
      throw error;
    }
  }

  /**
   * Update a food listing
   * @param {number} id - Food listing ID
   * @param {Object} foodData - Updated food listing data
   * @returns {Promise} - Response from API
   */
  async updateFoodListing(id, foodData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/food_listings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(foodData),
        credentials: 'include',
      });

      return await response.json();
    } catch (error) {
      console.error(`Update food listing ${id} error:`, error);
      throw error;
    }
  }

  /**
   * Delete a food listing
   * @param {number} id - Food listing ID
   * @returns {Promise} - Response from API
   */
  async deleteFoodListing(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/food_listings/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      return await response.json();
    } catch (error) {
      console.error(`Delete food listing ${id} error:`, error);
      throw error;
    }
  }

  /**
   * Reserve a food item
   * @param {number} foodId - Food listing ID
   * @param {Object} reservationData - Reservation details
   * @returns {Promise} - Response from API
   */
  async reserveFood(foodId, reservationData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/food_listings/${foodId}/reserve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData),
        credentials: 'include',
      });

      return await response.json();
    } catch (error) {
      console.error(`Reserve food ${foodId} error:`, error);
      throw error;
    }
  }

  // User Profile methods

  /**
   * Get current user profile
   * @returns {Promise} - Response with user profile
   */
  async getCurrentUser() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        credentials: 'include',
      });

      return await response.json();
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {Object} profileData - Updated profile data
   * @returns {Promise} - Response from API
   */
  async updateProfile(profileData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
        credentials: 'include',
      });

      return await response.json();
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Rating methods

  /**
   * Add a rating
   * @param {Object} ratingData - Rating data
   * @returns {Promise} - Response from API
   */
  async addRating(ratingData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ratingData),
        credentials: 'include',
      });

      return await response.json();
    } catch (error) {
      console.error('Add rating error:', error);
      throw error;
    }
  }
}

// Create and export a single instance
const apiService = new ApiService();
export default apiService;