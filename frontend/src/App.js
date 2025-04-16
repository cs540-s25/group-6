import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import EntryPage from './pages/EntryPage';
import MainPage from './pages/MainPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ResetPasswordRequestPage from './pages/ResetPasswordRequestPage';
import ResendVerificationPage from './pages/ResendVerificationPage';
import AddFoodItemPage from './pages/AddFoodItemPage';
import FoodDetailPage from './pages/FoodDetailPage';
import ProfilePage from './pages/ProfilePage';
import LocationMap from './pages/LocationMap';
import LocationModal from './pages/LocationModal';
import ChatPage from './pages/ChatPage';
import ChatListPage from './pages/ChatListPage';
import UserPostsPage from './pages/UserPostsPage';

import { AuthProvider, useAuth } from './contexts/AuthContext';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<EntryPage />} />
      <Route path="/home" element={<MainPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/reset-password-request" element={<ResetPasswordRequestPage />} />
      <Route path="/resend-verification" element={<ResendVerificationPage />} />
      <Route path="/user/:userId/posts" element={<UserPostsPage />} />
      <Route
        path="/add-food"
        element={
          <ProtectedRoute>
            <AddFoodItemPage />
          </ProtectedRoute>
        }
      />
      <Route path="/food/:id" element={<FoodDetailPage />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route path="/chat-list/:userId" element={<ChatListPage />} />
      <Route path="/chat/:foodId" element={<ChatPage />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
