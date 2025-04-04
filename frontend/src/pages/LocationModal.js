import React, { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react'; // Added Loader import
import LocationMap from './LocationMap';
import apiService from '../services/apiService'; // Import apiService
import { useAuth } from '../contexts/AuthContext'; // Import useAuth for currentUser

const LocationModal = ({ isOpen, onClose, onSelectLocation, initialLocation }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isSaving, setIsSaving] = useState(false); // Moved inside component
  const { currentUser } = useAuth(); // Get currentUser from auth context

  useEffect(() => {
    // Set initial location if provided
    if (initialLocation) {
      setSelectedLocation(initialLocation);
    }
  }, [initialLocation]);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
  };

  const handleConfirm = async () => {
    if (!selectedLocation) return; 
    setIsSaving(true);
    try {
      // Update user's location in backend
      await apiService.updateProfile({
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        address: selectedLocation.address
      });
      
      // Update local state
      onSelectLocation(selectedLocation);
      
      // Optionally refresh user data
      if (currentUser) {
        const updatedUser = await apiService.getCurrentUser();
        // Update your auth context here if needed
      }
      
    } catch (error) {
      console.error('Failed to save location:', error);
      alert('Failed to save location. Please try again.');
    } finally {
      setIsSaving(false);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="location-modal">
      <div className="location-modal-content">
        <div className="location-modal-header">
          <h2>Select Location</h2>
          <button className="location-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="location-modal-map">
          <LocationMap 
            position={initialLocation ? [initialLocation.lat, initialLocation.lng] : undefined}
            onSelectLocation={handleLocationSelect}
            selectable={true}
          />
        </div>

        {selectedLocation && (
          <div className="location-address">
            <p><strong>Selected Address:</strong></p>
            <p>{selectedLocation.address}</p>
          </div>
        )}

        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose}>Cancel</button>
          <button 
            className="primary-button" 
            onClick={handleConfirm}
            disabled={!selectedLocation || isSaving}
          >
            {isSaving ? (
              <>
                <Loader size={14} className="saving-animation" />
                Saving...
              </>
            ) : (
              'Confirm Location'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;