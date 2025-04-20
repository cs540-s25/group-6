import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Default position for Atlanta
const DEFAULT_POSITION = [33.749, -84.388]; // Atlanta coordinates
const DEFAULT_ZOOM = 13;

// Create a cache for location data to reduce API calls
const locationCache = {};

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
      
      // Use a map tile service that's more reliable for development
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        // Add additional parameters to reduce rate limiting issues
        maxZoom: 19,
        tileSize: 512,
        zoomOffset: -1
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
          
          // Get address for selected location with debounce
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
        if (item.pickup_latitude && item.pickup_longitude) {
          const marker = L.marker([item.pickup_latitude, item.pickup_longitude])
            .addTo(markersLayerRef.current)
            .bindPopup(`
              <div>
                <strong>${item.title}</strong><br>
                ${item.foodType || 'Food'} • ${item.distance || 'Unknown distance'}<br>
                ${item.expirationDays ? `Expires in ${item.expirationDays} day${item.expirationDays !== 1 ? 's' : ''}` : ''}
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
              
              // Use a simpler approach for the address to avoid API rate limits
              const address = 'My Current Location';
              onSelectLocation({ lat: latitude, lng: longitude, address });
              
              // Optionally get the actual address in the background
              getAddressFromCoordinates(latitude, longitude, true)
                .then(fullAddress => {
                  if (fullAddress && fullAddress !== 'Unknown location') {
                    onSelectLocation({ lat: latitude, lng: longitude, address: fullAddress });
                  }
                })
                .catch(error => {
                  console.warn('Address lookup failed silently:', error);
                });
            }
          }
          
          setIsLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLoading(false);
          alert('Unable to retrieve your location. Please check your browser permissions.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
      setIsLoading(false);
    }
  };

  const getAddressFromCoordinates = async (lat, lng, silent = false) => {
    // Create a cache key
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    
    // Check if we have this location in cache
    if (locationCache[cacheKey]) {
      return locationCache[cacheKey];
    }
    
    // For immediate response, return a generic address
    if (!silent) {
      setTimeout(() => {
        fetchAddressInBackground(lat, lng, cacheKey);
      }, 100);
      
      return 'Selected Location';
    }

    try {
      return await fetchAddressInBackground(lat, lng, cacheKey);
    } catch (error) {
      console.error('Error getting address:', error);
      return 'Unknown location';
    }
  };
  
  // Separate function to fetch address in background to not block UI
  const fetchAddressInBackground = async (lat, lng, cacheKey) => {
    try {
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'User-Agent': 'FoodShare App (Educational Project)',
            'Accept-Language': 'en'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Address lookup failed: ${response.status}`);
      }
      
      const data = await response.json();
      const address = data.display_name || 'Selected Location';
      
      // Store in cache
      locationCache[cacheKey] = address;
      
      return address;
    } catch (error) {
      console.warn('Background address fetch failed:', error);
      return 'Selected Location';
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