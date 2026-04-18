# Frontend Search API Integration Guide

## Overview
This guide provides frontend developers with complete information on how to integrate with the healthcare search API endpoints. The API now includes full location data for centers while maintaining privacy protection for users.

## Base URL
```
https://api.unlimtedhealth.com/api
```

## Authentication
All endpoints are **public** and do not require authentication for search functionality.

---

## 1. User Search Endpoint

### Endpoint
```
GET /users/search
```

### Purpose
Search for healthcare providers (doctors, specialists) by specialty and location.

### Query Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `type` | string | Yes | User type to search for | `doctor`, `specialist`, `nurse` |
| `specialty` | string | No | Medical specialty filter | `cardiology`, `dermatology`, `pediatrics` |
| `city` | string | No | City filter | `New York`, `Los Angeles` |
| `state` | string | No | State filter | `NY`, `CA` |
| `country` | string | No | Country filter | `United States` |
| `page` | number | No | Page number (default: 1) | `1`, `2`, `3` |
| `limit` | number | No | Results per page (default: 10, max: 50) | `5`, `10`, `20` |

### Example Request
```javascript
// Search for cardiologists in New York
const response = await fetch('https://api.unlimtedhealth.com/api/users/search?type=doctor&specialty=cardiology&city=New York&state=NY&page=1&limit=10');

// Search for all doctors
const response = await fetch('https://api.unlimtedhealth.com/api/users/search?type=doctor&page=1&limit=5');
```

### Example Response
```json
{
  "users": [
    {
      "publicId": "DR651842456",
      "displayName": "Dr. John Smith",
      "specialty": "Cardiology",
      "location": {
        "city": "New York",
        "state": "NY",
        "country": "United States"
      },
      "rating": 4.5,
      "avatar": "https://example.com/avatar.jpg",
      "qualifications": ["MD", "Board Certified Cardiologist"],
      "experience": "10+ years",
      "availability": {
        "timezone": "America/New_York",
        "generalAvailability": "Monday-Friday, 9AM-5PM"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "hasMore": false
}
```

### Important Notes for Users
- **Privacy Protected**: No personal addresses, phone numbers, or exact coordinates
- **General Location Only**: Only city, state, country information is provided
- **Safe for Discovery**: Perfect for matching patients with providers by specialty and general area

---

## 2. Center Search Endpoint

### Endpoint
```
GET /centers/search
```

### Purpose
Search for healthcare facilities (hospitals, clinics, labs) with full location data for navigation.

### Query Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `type` | string | No | Center type filter | `hospital`, `clinic`, `laboratory`, `pharmacy` |
| `city` | string | No | City filter | `New York`, `Los Angeles` |
| `state` | string | No | State filter | `NY`, `CA` |
| `country` | string | No | Country filter | `United States` |
| `service` | string | No | Service category filter | `emergency`, `surgery`, `cardiology` |
| `acceptingNewPatients` | boolean | No | Filter by new patient acceptance | `true`, `false` |
| `page` | number | No | Page number (default: 1) | `1`, `2`, `3` |
| `limit` | number | No | Results per page (default: 10, max: 50) | `5`, `10`, `20` |

### Example Request
```javascript
// Search for hospitals in New York
const response = await fetch('https://api.unlimtedhealth.com/api/centers/search?type=hospital&city=New York&state=NY&page=1&limit=10');

// Search for all centers accepting new patients
const response = await fetch('https://api.unlimtedhealth.com/api/centers/search?acceptingNewPatients=true&page=1&limit=5');
```

### Example Response
```json
{
  "centers": [
    {
      "publicId": "HSP563335216",
      "name": "City General Hospital",
      "type": "hospital",
      "address": "123 Medical Center Dr, New York, NY 10001",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "generalLocation": {
        "city": "New York",
        "state": "NY",
        "country": "United States"
      },
      "locationMetadata": {
        "building": "Main Building",
        "floor": "Ground Floor",
        "entrance": "Main Entrance"
      },
      "imageUrl": "https://example.com/hospital-image.jpg",
      "hours": "24/7",
      "rating": 4.2,
      "serviceCategories": ["Emergency Care", "Surgery", "Cardiology"],
      "acceptingNewPatients": true
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "hasMore": false
}
```

### Important Notes for Centers
- **Full Location Data**: Complete address, coordinates, and metadata for navigation
- **Mapping Ready**: Latitude/longitude provided for map integration
- **Navigation Support**: Full address for GPS and routing applications

---

## 3. Center Type Endpoints

### Endpoints
```
GET /centers/hospital
GET /centers/clinic
GET /centers/laboratory
GET /centers/pharmacy
GET /centers/eye
GET /centers/maternity
```

### Purpose
Get all centers of a specific type with full location data.

### Example Request
```javascript
// Get all hospitals
const response = await fetch('https://api.unlimtedhealth.com/api/centers/hospital');

// Get all clinics
const response = await fetch('https://api.unlimtedhealth.com/api/centers/clinic');
```

### Example Response
```json
[
  {
    "publicId": "HSP563335216",
    "name": "City General Hospital",
    "type": "hospital",
    "address": "123 Medical Center Dr, New York, NY 10001",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "generalLocation": {
      "city": "New York",
      "state": "NY",
      "country": "United States"
    },
    "locationMetadata": {
      "building": "Main Building",
      "floor": "Ground Floor",
      "entrance": "Main Entrance"
    },
    "imageUrl": "https://example.com/hospital-image.jpg",
    "hours": "24/7",
    "rating": 4.2,
    "serviceCategories": ["Emergency Care", "Surgery", "Cardiology"],
    "acceptingNewPatients": true
  }
]
```

---

## 4. Nearby Centers Endpoint

### Endpoint
```
GET /centers/nearby
```

### Purpose
Find healthcare centers within a specified radius of given coordinates.

### Query Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `lat` | number | Yes | Latitude coordinate | `40.7128` |
| `lng` | number | Yes | Longitude coordinate | `-74.0060` |
| `radius` | number | No | Search radius in miles (default: 25) | `10`, `25`, `50` |
| `type` | string | No | Center type filter | `hospital`, `clinic` |

### Example Request
```javascript
// Find hospitals within 10 miles of NYC
const response = await fetch('https://api.unlimtedhealth.com/api/centers/nearby?lat=40.7128&lng=-74.0060&radius=10&type=hospital');

// Find all centers within 25 miles
const response = await fetch('https://api.unlimtedhealth.com/api/centers/nearby?lat=40.7128&lng=-74.0060&radius=25');
```

### Example Response
```json
[
  {
    "publicId": "HSP863209282",
    "name": "City Eye Clinic",
    "type": "eye",
    "address": "123 Medical Center Dr, New York, NY 10001",
    "latitude": "40.71280000",
    "longitude": "-74.00600000",
    "generalLocation": {
      "city": "New York",
      "state": "NY",
      "country": "United States"
    },
    "locationMetadata": null,
    "imageUrl": null,
    "hours": "24/7",
    "rating": 0,
    "serviceCategories": [],
    "acceptingNewPatients": true
  }
]
```

---

## Frontend Integration Examples

### 1. React/JavaScript Example

```javascript
class HealthcareSearchAPI {
  constructor(baseURL = 'https://api.unlimtedhealth.com/api') {
    this.baseURL = baseURL;
  }

  // Search for doctors
  async searchDoctors(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.type) params.append('type', filters.type);
    if (filters.specialty) params.append('specialty', filters.specialty);
    if (filters.city) params.append('city', filters.city);
    if (filters.state) params.append('state', filters.state);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await fetch(`${this.baseURL}/users/search?${params}`);
    return await response.json();
  }

  // Search for centers
  async searchCenters(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.type) params.append('type', filters.type);
    if (filters.city) params.append('city', filters.city);
    if (filters.state) params.append('state', filters.state);
    if (filters.service) params.append('service', filters.service);
    if (filters.acceptingNewPatients !== undefined) {
      params.append('acceptingNewPatients', filters.acceptingNewPatients);
    }
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await fetch(`${this.baseURL}/centers/search?${params}`);
    return await response.json();
  }

  // Find nearby centers
  async findNearbyCenters(lat, lng, radius = 25, type = null) {
    const params = new URLSearchParams();
    params.append('lat', lat);
    params.append('lng', lng);
    params.append('radius', radius);
    if (type) params.append('type', type);

    const response = await fetch(`${this.baseURL}/centers/nearby?${params}`);
    return await response.json();
  }
}

// Usage examples
const api = new HealthcareSearchAPI();

// Search for cardiologists in New York
const doctors = await api.searchDoctors({
  type: 'doctor',
  specialty: 'cardiology',
  city: 'New York',
  state: 'NY',
  page: 1,
  limit: 10
});

// Search for hospitals
const hospitals = await api.searchCenters({
  type: 'hospital',
  city: 'New York',
  acceptingNewPatients: true
});

// Find nearby centers
const nearbyCenters = await api.findNearbyCenters(40.7128, -74.0060, 10, 'hospital');
```

### 2. Map Integration Example

```javascript
// Using the center data for map markers
function createMapMarkers(centers) {
  return centers.map(center => ({
    id: center.publicId,
    name: center.name,
    type: center.type,
    position: {
      lat: parseFloat(center.latitude),
      lng: parseFloat(center.longitude)
    },
    address: center.address,
    hours: center.hours,
    rating: center.rating,
    acceptingNewPatients: center.acceptingNewPatients
  }));
}

// Example with Google Maps
function initializeMap(centers) {
  const map = new google.maps.Map(document.getElementById('map'), {
    zoom: 10,
    center: { lat: 40.7128, lng: -74.0060 }
  });

  const markers = createMapMarkers(centers);
  
  markers.forEach(markerData => {
    const marker = new google.maps.Marker({
      position: markerData.position,
      map: map,
      title: markerData.name
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div>
          <h3>${markerData.name}</h3>
          <p>${markerData.address}</p>
          <p>Hours: ${markerData.hours || 'Not specified'}</p>
          <p>Rating: ${markerData.rating || 'Not rated'}</p>
          <p>Accepting New Patients: ${markerData.acceptingNewPatients ? 'Yes' : 'No'}</p>
        </div>
      `
    });

    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });
  });
}
```

### 3. Error Handling

```javascript
async function searchWithErrorHandling(filters) {
  try {
    const response = await fetch(`https://api.unlimtedhealth.com/api/users/search?${new URLSearchParams(filters)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Search failed:', error);
    return {
      users: [],
      total: 0,
      page: 1,
      limit: 10,
      hasMore: false,
      error: error.message
    };
  }
}
```

---

## Data Structure Reference

### User Object (Privacy Protected)
```typescript
interface User {
  publicId: string;           // Safe public identifier
  displayName: string;        // Display name only
  specialty?: string;         // Medical specialty
  location?: {               // General location only
    city: string;
    state: string;
    country: string;
  };
  rating?: number;           // User rating
  avatar?: string;           // Avatar URL
  qualifications?: string[]; // Professional qualifications
  experience?: string;       // Years of experience
  availability?: {           // General availability
    timezone: string;
    generalAvailability: string;
  };
}
```

### Center Object (Full Location Data)
```typescript
interface Center {
  publicId: string;          // Safe public identifier
  name: string;              // Center name
  type: string;              // Center type
  address: string;           // Full address for navigation
  latitude: number;          // Latitude coordinate
  longitude: number;         // Longitude coordinate
  generalLocation: {         // General location info
    city: string;
    state: string;
    country: string;
  };
  locationMetadata?: {       // Additional location details
    building?: string;
    floor?: string;
    entrance?: string;
    [key: string]: unknown;
  };
  imageUrl?: string;         // Center image
  hours?: string;            // Operating hours
  rating?: number;           // Center rating
  serviceCategories?: string[]; // Available services
  acceptingNewPatients?: boolean; // New patient status
}
```

---

## Best Practices

### 1. Caching
- Cache search results for better performance
- Implement pagination for large result sets
- Use appropriate cache TTL based on data freshness needs

### 2. User Experience
- Show loading states during API calls
- Implement proper error handling and user feedback
- Use the location data appropriately:
  - **Users**: Show general area for specialty matching
  - **Centers**: Enable full navigation and mapping features

### 3. Privacy Compliance
- Never store or log sensitive user data
- Respect the privacy boundaries between users and centers
- Use the provided public IDs, not internal database IDs

### 4. Performance
- Implement debouncing for search inputs
- Use pagination to limit initial load
- Consider implementing infinite scroll for better UX

---

## Support

For API support or questions, contact the backend development team or refer to the API documentation at `https://api.unlimtedhealth.com/docs`.
