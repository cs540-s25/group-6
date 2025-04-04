// src/pages/LoginPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Navigate to the main page after successful login
      navigate('/home');
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid credentials. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 flex flex-col justify-center items-center min-h-screen">
      <h2 className="text-3xl font-semibold text-blue-600 mb-6">Login to FoodShare</h2>
      <form method="POST" onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md w-full max-w-md space-y-4">
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="w-full p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          className="w-full p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className={`w-full ${loading ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'} text-white p-2 rounded`}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>

        <div className="flex justify-between mt-2 text-sm">
          <Link to="/signup" className="text-blue-600 hover:underline">
            Create an account
          </Link>
          <Link to="/reset-password-request" className="text-blue-600 hover:underline">
            Forgot password?
          </Link>
        </div>
      </form>
      {error && <div className="text-red-500 mt-4">{error}</div>}
    </div>
  );
};

export default LoginPage;