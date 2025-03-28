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

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.token) {
          setCurrentUser(userData);
        }
      } catch (err) {
        console.error('Error parsing stored user data', err);
        localStorage.removeItem('currentUser');
      }
    }
    setLoading(false);
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await apiService.getCurrentUser();
      if (response.user && response.token) {
        const userWithToken = { ...response.user, token: response.token };
        setCurrentUser(userWithToken);
        localStorage.setItem('currentUser', JSON.stringify(userWithToken));
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await apiService.login(email, password);
      if (response.user && response.token) {
        const userWithToken = { ...response.user, token: response.token };
        setCurrentUser(userWithToken);
        localStorage.setItem('currentUser', JSON.stringify(userWithToken));
        return userWithToken;
      }
    } catch (err) {
      setError('Invalid login credentials');
      throw err;
    }
  };

  // Keep other functions the same but ensure token handling

  const value = {
    currentUser,
    loading,
    error,
    login,
    // ... rest of the methods
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;