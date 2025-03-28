import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import EntryPage from './pages/EntryPage';
import MainPage from './pages/MainPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ResetPasswordRequestPage from './pages/ResetPasswordRequestPage';
import ResendVerificationPage from './pages/ResendVerificationPage';
import PostUploadPage from './pages/PostUploadPage';
import PostViewingPage from './pages/PostViewingPage';
import ProfilePage from './pages/ProfilePage';
import { AuthProvider, useAuth } from './contexts/AuthContext';

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
      <Route
        path="/posts/new"
        element={
          <ProtectedRoute>
            <PostUploadPage />
          </ProtectedRoute>
        }
      />
      <Route path="/posts/:postId" element={<PostViewingPage />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
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