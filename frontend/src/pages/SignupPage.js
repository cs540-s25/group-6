// src/pages/SignupPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone_number: '',
    role: '',
    major: '',
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate email
    if (!formData.email.endsWith('@emory.edu')) {
      setError('Only @emory.edu emails are allowed.');
      return;
    }

    try {
      const response = await register(formData);
      // Upon successful registration, user is automatically logged in
      // Redirect to the home page
      navigate('/home');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="bg-gray-50 flex flex-col justify-center items-center min-h-screen">
      <div className="w-full max-w-md">
        <h2 className="text-3xl font-semibold text-green-600 text-center mb-6">Create Your Account</h2>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  name="first_name"
                  type="text"
                  placeholder="First Name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <input
                  name="last_name"
                  type="text"
                  placeholder="Last Name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <input
                name="email"
                type="email"
                placeholder="Email (@emory.edu)"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <input
                name="password"
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <input
                name="phone_number"
                type="text"
                placeholder="Phone Number (optional)"
                value={formData.phone_number}
                onChange={handleChange}
                className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="" disabled>Select your role</option>
                <option value="undergrad">Undergrad</option>
                <option value="master">Master</option>
                <option value="phd">PhD</option>
                <option value="employee">Employee</option>
                <option value="professor">Professor</option>
              </select>
            </div>

            <div>
              <input
                name="major"
                type="text"
                placeholder="Major (if applicable)"
                value={formData.major}
                onChange={handleChange}
                className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full bg-green-500 text-white p-3 rounded-md font-medium hover:bg-green-600 transition-colors"
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="text-red-500 text-center text-sm">
                {error}
              </div>
            )}
          </form>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 hover:underline"
          >
            Already have an account? Log in
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;