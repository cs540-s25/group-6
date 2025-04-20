// src/services/apiService.js
const API_BASE_URL = 'http://localhost:5001';

// Helper function to handle API responses
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');

  if (!contentType || !contentType.includes('application/json')) {
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    return { success: true };
  }

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data?.error || response.statusText;
    throw new Error(errorMessage);
  }

  return data;
};

// Get auth headers
const getAuthHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };

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
  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/signup`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData),
        credentials: 'include',
      });

      const data = await handleResponse(response);

      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await handleResponse(response);

      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/logout`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      localStorage.removeItem('token');

      return await handleResponse(response);
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('token');
      throw error;
    }
  }

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
  async getFoodListings(filters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.status) params.append('status', filters.status);
      if (filters.food_type) params.append('food_type', filters.food_type);
      if (filters.q) params.append('q', filters.q);
      if (filters.max_distance) params.append('max_distance', filters.max_distance);
      if (filters.min_expiration_days !== undefined)
        params.append('min_expiration_days', filters.min_expiration_days);
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
   * Get all food listings posted by a specific user
   */
  async getFoodListingsByUser(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${userId}/posts`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Get food listings by user error:', error);
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

  // Chat methods
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
}

const apiService = new ApiService();
export default apiService;