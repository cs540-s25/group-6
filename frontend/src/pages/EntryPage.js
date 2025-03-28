// src/pages/EntryPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const EntryPage = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-50 text-center flex flex-col justify-center items-center h-screen">
      <h1 className="text-4xl font-bold text-blue-600 mb-8">Welcome to FoodShare</h1>
      <div className="flex gap-4">
        <button
          onClick={() => navigate('/login')}
          className="bg-blue-500 text-white px-6 py-2 rounded-xl shadow"
        >
          Log In
        </button>
        <button
          onClick={() => navigate('/signup')}
          className="bg-green-500 text-white px-6 py-2 rounded-xl shadow"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
};

export default EntryPage;