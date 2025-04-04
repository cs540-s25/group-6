import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/apiService';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuthentication = async () => {
      setLoading(true);
      const storedUser = localStorage.getItem('currentUser');

      if (storedUser) {
        try {
          // First try to parse the stored user
          const parsedUser = JSON.parse(storedUser);
          setCurrentUser(parsedUser);

          // Then try to validate with the server
          try {
            const response = await apiService.getCurrentUser();
            if (response.user && response.token) {
              const userWithToken = { ...response.user, token: response.token };
              setCurrentUser(userWithToken);
              localStorage.setItem('currentUser', JSON.stringify(userWithToken));
            } else {
              // If the server doesn't recognize the user, clear localStorage
              localStorage.removeItem('currentUser');
              setCurrentUser(null);
            }
          } catch (err) {
            console.warn('Could not validate user with server, using cached data');
            // Keep using the parsed user if server validation fails
          }
        } catch (err) {
          console.error('Error parsing stored user data', err);
          localStorage.removeItem('currentUser');
          setCurrentUser(null);
        }
      }

      setLoading(false);
      setAuthChecked(true);
    };

    checkAuthentication();
  }, []);

  // Login function with improved error handling
  const login = async (email, password) => {
    setError(null);
    try {
      const response = await apiService.login(email, password);
      if (response.user && response.token) {
        const userWithToken = { ...response.user, token: response.token };
        setCurrentUser(userWithToken);
        localStorage.setItem('currentUser', JSON.stringify(userWithToken));
        return userWithToken;
      } else {
        throw new Error('Login response missing user data');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid login credentials');
      throw err;
    }
  };

  // Register function - updated to handle immediate login
  const register = async (userData) => {
    setError(null);
    try {
      const response = await apiService.register(userData);
      if (response.user && response.token) {
        const userWithToken = { ...response.user, token: response.token };
        setCurrentUser(userWithToken);
        localStorage.setItem('currentUser', JSON.stringify(userWithToken));
        return response;
      } else {
        throw new Error('Registration successful but user data is missing');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  // Logout function with improved error handling
  const logout = async () => {
    try {
      await apiService.logout();
    } catch (err) {
      console.error('Logout API error:', err);
      // Continue with local logout even if API call fails
    } finally {
      // Always clear local user state
      setCurrentUser(null);
      localStorage.removeItem('currentUser');
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    setError(null);
    try {
      const response = await apiService.updateProfile(profileData);
      if (response.user && response.token) {
        const userWithToken = { ...response.user, token: response.token };
        setCurrentUser(userWithToken);
        localStorage.setItem('currentUser', JSON.stringify(userWithToken));
        return userWithToken;
      } else {
        throw new Error('Profile update successful but user data is missing');
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
      throw err;
    }
  };

  // Request password reset
  const requestPasswordReset = async (email) => {
    setError(null);
    try {
      return await apiService.requestPasswordReset(email);
    } catch (err) {
      setError(err.message || 'Failed to request password reset');
      throw err;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    requestPasswordReset,
    authChecked
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;