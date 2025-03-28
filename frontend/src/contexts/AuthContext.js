// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/apiService';

// Create the authentication context
const AuthContext = createContext();

// Hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component that wraps the app
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user data from local storage on initial render
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error parsing stored user data', err);
        localStorage.removeItem('currentUser');
      }
    }
    setLoading(false);

    // Attempt to fetch current user data from API
    fetchCurrentUser();
  }, []);

  // Fetch the current user data from the API
  const fetchCurrentUser = async () => {
    try {
      const response = await apiService.getCurrentUser();
      if (response.user) {
        setCurrentUser(response.user);
        localStorage.setItem('currentUser', JSON.stringify(response.user));
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
      // Don't set error state here to avoid showing error on initial load
    }
  };

  // Login function
  const login = async (email, password) => {
    setError(null);
    try {
      const response = await apiService.login(email, password);
      if (response.user) {
        setCurrentUser(response.user);
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        return response.user;
      }
    } catch (err) {
      setError('Invalid login credentials');
      throw err;
    }
  };

  // Register function
  const register = async (userData) => {
    setError(null);
    try {
      const response = await apiService.register(userData);
      return response;
    } catch (err) {
      setError('Registration failed');
      throw err;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await apiService.logout();
      setCurrentUser(null);
      localStorage.removeItem('currentUser');
    } catch (err) {
      console.error('Logout error:', err);
      // Still remove user from local state even if API call fails
      setCurrentUser(null);
      localStorage.removeItem('currentUser');
    }
  };

  // Reset password request
  const requestPasswordReset = async (email) => {
    setError(null);
    try {
      const response = await apiService.requestPasswordReset(email);
      return response;
    } catch (err) {
      setError('Password reset request failed');
      throw err;
    }
  };

  // Reset password with token
  const resetPassword = async (token, password) => {
    setError(null);
    try {
      const response = await apiService.resetPassword(token, password);
      return response;
    } catch (err) {
      setError('Password reset failed');
      throw err;
    }
  };

  // Resend verification email
  const resendVerification = async (email) => {
    setError(null);
    try {
      const response = await apiService.resendVerification(email);
      return response;
    } catch (err) {
      setError('Failed to resend verification email');
      throw err;
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    setError(null);
    try {
      const response = await apiService.updateProfile(profileData);
      if (response.user) {
        setCurrentUser(response.user);
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        return response.user;
      }
    } catch (err) {
      setError('Failed to update profile');
      throw err;
    }
  };

  // The value provided to the context
  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    requestPasswordReset,
    resetPassword,
    resendVerification,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;