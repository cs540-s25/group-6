"""
Geolocation utilities for the FoodShare application.
"""
from math import radians, cos, sin, asin, sqrt

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points
    on the earth (specified in decimal degrees).
    
    Args:
        lat1, lon1: Latitude and longitude of first point
        lat2, lon2: Latitude and longitude of second point
        
    Returns:
        float: Distance in miles
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 3956  # Radius of earth in miles
    
    return c * r


def format_distance(distance):
    """
    Format a distance for display.
    
    Args:
        distance: Distance in miles
        
    Returns:
        str: Formatted distance string
    """
    if distance < 0.1:
        return "Nearby"
    elif distance < 1:
        return f"{distance:.1f} miles"
    else:
        return f"{int(distance)} miles"