// src/pages/ProfilePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Edit, Package, Mail, Phone, BookOpen, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';

const ProfilePage = () => {
  const { currentUser, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [userFoodPostings, setUserFoodPostings] = useState([]);
  const [userFoodInterested, setUserFoodInterested] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    major: '',
    address: ''
  });

  // Load current user data into the form
  useEffect(() => {
    if (currentUser) {
      setProfileData({
        first_name: currentUser.first_name || '',
        last_name: currentUser.last_name || '',
        phone_number: currentUser.phone_number || '',
        major: currentUser.major || '',
        address: currentUser.address || ''
      });

      // Fetch user's food postings and food interactions
      fetchUserFoodPostings();
      fetchUserFoodInteractions();
    }
  }, [currentUser]);

  const fetchUserFoodPostings = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUserFoodPostings();
      setUserFoodPostings(response.postings);
    } catch (err) {
      console.error('Error fetching user food postings:', err);
      setError('Failed to load your food postings');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserFoodInteractions = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUserFoodInteractions();
      setUserFoodInterested(response.interacted);
    } catch (err) {
      console.error('Error fetching user food interactions:', err);
      setError('Failed to load your food interactions');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await updateProfile(profileData);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleViewFoodDetail = (id) => {
    navigate(`/food/${id}`);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="sticky top-0 bg-white shadow-sm z-10">
        <div className="container mx-auto p-4 flex items-center justify-between">
          <button onClick={() => navigate('/home')} className="flex items-center text-gray-600">
            <ArrowLeft size={20} />
          </button>

          <h1 className="text-xl font-semibold text-center">My Profile</h1>

          <button onClick={handleLogout} className="text-gray-600">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="container mx-auto p-4">
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 text-2xl font-semibold mr-4">
                  {currentUser.first_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {currentUser.first_name} {currentUser.last_name}
                  </h2>
                  <p className="text-gray-500">{currentUser.role}</p>
                </div>
              </div>

              <button onClick={() => setIsEditing(!isEditing)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-full">
                <Edit size={18} />
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      id="first_name"
                      name="first_name"
                      type="text"
                      value={profileData.first_name}
                      onChange={handleChange}
                      className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      id="last_name"
                      name="last_name"
                      type="text"
                      value={profileData.last_name}
                      onChange={handleChange}
                      className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    value={profileData.phone_number}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="major" className="block text-sm font-medium text-gray-700 mb-1">Major</label>
                  <input
                    id="major"
                    name="major"
                    type="text"
                    value={profileData.major}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={profileData.address}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex space-x-3">
                  <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium">Cancel</button>
                  <button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium">Save Changes</button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start">
                  <Mail size={18} className="text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-700">{currentUser.email}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Phone size={18} className="text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-700">{currentUser.phone_number || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <BookOpen size={18} className="text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Major</p>
                    <p className="text-gray-700">{currentUser.major || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <MapPin size={18} className="text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-gray-700">{currentUser.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* My Food Postings Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">My Food Postings</h2>
            </div>

            {loading ? (
              <p className="text-gray-500 text-center p-4">Loading your listings...</p>
            ) : userFoodPostings.length === 0 ? (
              <div className="text-center py-6">
                <Package size={48} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">You haven't posted any food items yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userFoodPostings.map(item => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 cursor-pointer"
                    onClick={() => handleViewFoodDetail(item.id)}
                  >
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">Posted on {formatDate(item.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Food Interested Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Foods of Interest</h2>
            </div>

            {loading ? (
              <p className="text-gray-500 text-center p-4">Loading your foods of interest...</p>
            ) : userFoodInterested.length === 0 ? (
              <div className="text-center py-6">
                <Package size={48} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">You haven't shown interest in any food items yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userFoodInterested.map(item => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 cursor-pointer"
                    onClick={() => handleViewFoodDetail(item.id)}
                  >
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">Posted on {formatDate(item.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
