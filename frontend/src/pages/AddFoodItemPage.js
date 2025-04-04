// src/pages/AddFoodItemPage.js check
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';

const AddFoodItemPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    food_type: '',
    quantity: 1,
    unit: 'item(s)',
    allergens: '',
    expiration_date: '',
    pickup_location: '',
    pickup_latitude: null,
    pickup_longitude: null,
    available_from: '',
    available_until: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if user is logged in
  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseInt(value) || '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic validation
    if (!formData.title || !formData.food_type) {
      setError('Title and food type are required');
      return;
    }

    try {
      setLoading(true);

      // Use browser geolocation API for user's current location if it exists
      if (navigator.geolocation && !formData.pickup_latitude) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setFormData(prev => ({
              ...prev,
              pickup_latitude: position.coords.latitude,
              pickup_longitude: position.coords.longitude
            }));
          },
          (err) => {
            console.error('Geolocation error:', err);
          }
        );
      }

      const response = await apiService.createFoodListing(formData);
      setSuccess('Food item added successfully!');

      // Navigate back to home page after a delay
      setTimeout(() => {
        navigate('/home');
      }, 2000);
    } catch (err) {
      console.error('Error adding food item:', err);
      setError('Failed to add food item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const foodTypes = [
    'Fruit',
    'Vegetables',
    'Dairy',
    'Bakery',
    'Prepared',
    'Meat',
    'Seafood',
    'Snack',
    'Beverage',
    'Canned',
    'Frozen',
    'Grain',
    'Dessert',
    'Other'
  ];

  return (
    <div className="bg-gray-50 min-h-screen py-6 px-4">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => navigate('/home')}
          className="flex items-center text-blue-600 mb-6 hover:text-blue-800"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Home
        </button>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-semibold text-blue-600 mb-6">Add Food Item</h2>

          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
          {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g. Homemade Pasta Sauce"
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Describe your food item (ingredients, condition, etc.)"
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>

            <div className="flex gap-4">
              <div className="w-1/2">
                <label htmlFor="food_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Food Type *
                </label>
                <select
                  id="food_type"
                  name="food_type"
                  value={formData.food_type}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" disabled>Select type</option>
                  {foodTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="w-1/4">
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={handleNumberChange}
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="w-1/4">
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="item(s)">Item(s)</option>
                  <option value="lb">lb</option>
                  <option value="kg">kg</option>
                  <option value="serving(s)">serving(s)</option>
                  <option value="container(s)">container(s)</option>
                  <option value="bottle(s)">bottle(s)</option>
                  <option value="box(es)">box(es)</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="allergens" className="block text-sm font-medium text-gray-700 mb-1">
                Allergens
              </label>
              <input
                id="allergens"
                name="allergens"
                type="text"
                value={formData.allergens}
                onChange={handleChange}
                placeholder="e.g. nuts, dairy, gluten"
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="expiration_date" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Calendar size={16} className="mr-1" />
                Expiration Date
              </label>
              <input
                id="expiration_date"
                name="expiration_date"
                type="date"
                value={formData.expiration_date}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="pickup_location" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <MapPin size={16} className="mr-1" />
                Pickup Location
              </label>
              <input
                id="pickup_location"
                name="pickup_location"
                type="text"
                value={formData.pickup_location}
                onChange={handleChange}
                placeholder="e.g. Woodruff Library, Emory University"
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex gap-4">
              <div className="w-1/2">
                <label htmlFor="available_from" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Clock size={16} className="mr-1" />
                  Available From
                </label>
                <input
                  id="available_from"
                  name="available_from"
                  type="datetime-local"
                  value={formData.available_from}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="w-1/2">
                <label htmlFor="available_until" className="block text-sm font-medium text-gray-700 mb-1">
                  Available Until
                </label>
                <input
                  id="available_until"
                  name="available_until"
                  type="datetime-local"
                  value={formData.available_until}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-blue-500 text-white p-3 rounded-lg font-medium ${
                  loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-600'
                }`}
              >
                {loading ? 'Adding Item...' : 'Share Food Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddFoodItemPage;