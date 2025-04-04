import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';



// Default position for Atlanta
const DEFAULT_POSITION = [33.749, -84.388]; // Atlanta coordinates
const DEFAULT_ZOOM = 13;

const LocationMap = ({ 
  position = DEFAULT_POSITION, 
  zoom = DEFAULT_ZOOM,
  foodItems = [], 
  onSelectLocation,
  selectable = false
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const [currentPosition, setCurrentPosition] = useState(position);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize map when component mounts
  useEffect(() => {
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(currentPosition, zoom);
      
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);
     
      markersLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
      
      // If selectable is true, add click event to select location
      if (selectable) {
        mapInstanceRef.current.on('click', (e) => {
          const { lat, lng } = e.latlng;
          setCurrentPosition([lat, lng]);
          
          // Clear previous markers
          markersLayerRef.current.clearLayers();
          
          // Add new marker
          const marker = L.marker([lat, lng]).addTo(markersLayerRef.current);
          
          // Get address for selected location 
          getAddressFromCoordinates(lat, lng).then(address => {
            if (onSelectLocation) {
              onSelectLocation({ lat, lng, address });
            }
          });
        });
      }
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when foodItems change
  useEffect(() => {
    if (mapInstanceRef.current && markersLayerRef.current && foodItems.length > 0) {
      // Clear existing markers
      markersLayerRef.current.clearLayers();
      
      // Add markers for each food item
      foodItems.forEach(item => {
        if (item.latitude && item.longitude) {
          const marker = L.marker([item.latitude, item.longitude])
            .addTo(markersLayerRef.current)
            .bindPopup(`
              <div>
                <strong>${item.title}</strong><br>
                ${item.foodType} • ${item.distance}<br>
                Expires in ${item.expirationDays} day${item.expirationDays !== 1 ? 's' : ''}
              </div>
            `);
        }
      });
    }
  }, [foodItems]);

  // Handle getting user's current location
  const handleGetCurrentLocation = () => {
    setIsLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentPosition([latitude, longitude]);
          
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([latitude, longitude], zoom);
            
            // If selectable, also update the marker and call onSelectLocation
            if (selectable && onSelectLocation) {
              // Clear previous markers
              markersLayerRef.current.clearLayers();
              
              // Add new marker
              L.marker([latitude, longitude]).addTo(markersLayerRef.current);
              
              // Get address for current location
              getAddressFromCoordinates(latitude, longitude).then(address => {
                onSelectLocation({ lat: latitude, lng: longitude, address });
              });
            }
          }
          
          setIsLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLoading(false);
          alert('Unable to retrieve your location. Please check your browser permissions.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
      setIsLoading(false);
    }
  };

  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      return data.display_name || 'Unknown location';
    } catch (error) {
      console.error('Error getting address:', error);
      return 'Unknown location';
    }
  };

  return (
    <div className="map-wrapper">
      <div ref={mapRef} className="map-container"></div>
      
      {selectable && (
        <div className="map-controls">
          <button 
            className="location-button" 
            onClick={handleGetCurrentLocation}
            disabled={isLoading}
          >
            <MapPin size={16} />
            {isLoading ? 'Getting location...' : 'Use my current location'}
          </button>
        </div>
      )}
      
      <div className="map-overlay">
        OpenStreetMap
      </div>
    </div>
  );
};

export default LocationMap;