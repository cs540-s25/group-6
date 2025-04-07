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
    
    console.log('Attempting to save:', { 
      lat: selectedLocation.lat, 
      lng: selectedLocation.lng 
    });
  
    setIsSaving(true);
    try {
      const payload = {
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        address: selectedLocation.address || 'Unknown address'
      };
  
      console.log('Sending payload:', payload);
      
      const response = await apiService.updateProfile(payload);
      console.log('Backend response:', response);
      
      onSelectLocation(selectedLocation);
      onClose();
    } catch (error) {
      console.error('Full error:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      
      // Only show alert if it's not a network error
      if (!error.message.includes('Network')) {
        alert(`Save failed: ${error.response?.error || error.message}`);
      }
    } finally {
      setIsSaving(false);
    }
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
