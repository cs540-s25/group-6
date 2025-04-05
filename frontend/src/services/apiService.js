// src/services/apiService.js - comprehensive authentication solution
const API_BASE_URL = 'http://localhost:5000';

// Helper function to handle API responses
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');

  if (!contentType || !contentType.includes('application/json')) {
    // Handle non-JSON responses
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    return { success: true };
  }

  const data = await response.json();

  if (!response.ok) {
    // Extract error message from response or use status text
    const errorMessage = data?.error || response.statusText;
    throw new Error(errorMessage);
  }

  return data;
};

// Get auth headers - centralized function for consistency
const getAuthHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };

  // Add token if available (for token-based auth)
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

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
      const response = await fetch(`${API_BASE_URL}/api/signup`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData),
        credentials: 'include',
      });

      const data = await handleResponse(response);

      // Store token if returned
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      return data;
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
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await handleResponse(response);

      // Store token if returned
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      return data;
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
      const response = await fetch(`${API_BASE_URL}/api/logout`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      // Clear stored token
      localStorage.removeItem('token');

      return await handleResponse(response);
    } catch (error) {
      console.error('Logout error:', error);
      // Clear token even if API fails
      localStorage.removeItem('token');
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
      const response = await fetch(`${API_BASE_URL}/api/reset_password_request`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email }),
        credentials: 'include',
      });

      return await handleResponse(response);
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
        headers: getAuthHeaders(),
        body: JSON.stringify({ password }),
        credentials: 'include',
      });

      return await handleResponse(response);
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
        headers: getAuthHeaders(),
        body: JSON.stringify({ email }),
        credentials: 'include',
      });

      return await handleResponse(response);
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
  async getFoodListings(filters = {}) {
    try {
      const params = new URLSearchParams();

      // Existing filters
      if (filters.status) params.append('status', filters.status);
      if (filters.food_type) params.append('food_type', filters.food_type);
      if (filters.q) params.append('q', filters.q);

      // Add new filter parameters
      if (filters.max_distance) params.append('max_distance', filters.max_distance);
      if (filters.min_expiration_days !== undefined) params.append('min_expiration_days', filters.min_expiration_days);
      if (filters.latitude) params.append('latitude', filters.latitude);
      if (filters.longitude) params.append('longitude', filters.longitude);

      const response = await fetch(`${API_BASE_URL}/api/food_listings?${params.toString()}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      return await handleResponse(response);
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
        headers: getAuthHeaders(),
        body: JSON.stringify(foodData),
        credentials: 'include',
      });

      return await handleResponse(response);
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
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      return await handleResponse(response);
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
        headers: getAuthHeaders(),
        body: JSON.stringify(foodData),
        credentials: 'include',
      });

      return await handleResponse(response);
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
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      return await handleResponse(response);
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
        headers: getAuthHeaders(),
        body: JSON.stringify(reservationData),
        credentials: 'include',
      });

      return await handleResponse(response);
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
        headers: {
          ...getAuthHeaders(),
          'Cache-Control': 'no-cache',
        },
        credentials: 'include',
      });

      return await handleResponse(response);
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
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData),
        credentials: 'include',
      });

      return await handleResponse(response);

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
        headers: getAuthHeaders(),
        body: JSON.stringify(ratingData),
        credentials: 'include',
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('Add rating error:', error);
      throw error;
    }
  }

  /**
   * Get chat messages between the current user and the provider
   * @param {number} foodId - The food listing ID
   * @returns {Promise} - Response with chat messages
   */
  async getChatMessages(foodId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/${foodId}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      throw error;
    }
  }

  /**
   * Send a chat message
   * @param {Object} messageData - The message data
   * @returns {Promise} - Response with sent message
   */
  async sendChatMessage(messageData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/send`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(messageData),
        credentials: 'include',
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get the food postings made by the current user
   * @returns {Promise} - Response with food postings
   */
  async getUserFoodPostings() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/food-postings`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching food postings:', error);
      throw error;
    }
  }

  /**
   * Get the food items the current user has interacted with (either posted or started a conversation)
   * @returns {Promise} - Response with interacted food items
   */
  async getUserFoodInteractions() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/food-interested`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching food interactions:', error);
      throw error;
    }
  }

  /**
   * Get the chat list for a user
   * @param {number} userId - The user ID to fetch chats for
   * @returns {Promise} - Response with chat list
   */
  async getChatList(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-list/${userId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('Get chat list error:', error);
      throw error;
    }
  }
}

// Create and export a single instance
const apiService = new ApiService();
export default apiService;