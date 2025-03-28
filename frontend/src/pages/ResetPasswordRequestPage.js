// src/pages/ResetPasswordRequestPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ResetPasswordRequestPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const { requestPasswordReset } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      await requestPasswordReset(email);
      setMessage('A password reset email has been sent.');
    } catch (err) {
      console.error('Password reset request error:', err);
      setMessage('Failed to send reset email. Please try again.');
    }
  };

  return (
    <div className="bg-gray-50 flex flex-col justify-center items-center min-h-screen">
      <div className="w-full max-w-md">
        <h2 className="text-3xl font-semibold text-blue-600 text-center mb-6">Reset Your Password</h2>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full bg-blue-500 text-white p-3 rounded-md font-medium hover:bg-blue-600 transition-colors"
              >
                Send Reset Link
              </button>
            </div>

            {message && (
              <div className="text-blue-500 text-center text-sm">
                {message}
              </div>
            )}
          </form>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 hover:underline"
          >
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordRequestPage;