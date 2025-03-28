// src/pages/LoginPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      // Navigate to the main page after successful login
      navigate('/home');
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid credentials or account not verified');
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
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">Log In</button>
      </form>
      {error && <div className="text-red-500 mt-4">{error}</div>}
    </div>
  );
};

export default LoginPage;