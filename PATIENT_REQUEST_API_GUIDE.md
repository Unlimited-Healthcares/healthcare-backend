# Patient Request API Guide for Frontend Developers

## Overview
This guide provides complete documentation for implementing patient request functionality in the healthcare management system. Patients can send requests to healthcare centers, doctors, or medical practitioners for various services.

## Base URL
```
https://api.unlimtedhealth.com/api
```

## Authentication
All request endpoints require authentication with a valid JWT token.

---

## 1. Search for Healthcare Providers

### Search Doctors/Medical Practitioners
```http
GET /users/search
```

**Query Parameters:**
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `type` | string | Yes | User type to search for | `doctor`, `specialist`, `nurse` |
| `specialty` | string | No | Medical specialty filter | `cardiology`, `dermatology`, `pediatrics` |
| `location` | string | No | Location filter (city, state, or country) | `New York`, `NY`, `United States` |
| `page` | number | No | Page number (default: 1) | `1`, `2`, `3` |
| `limit` | number | No | Results per page (default: 20, max: 100) | `10`, `20`, `50` |

**Example Request:**
```javascript
// Search for cardiologists in New York
const searchDoctors = async (token) => {
  const response = await fetch('https://api.unlimtedhealth.com/api/users/search?type=doctor&specialty=cardiology&location=New York&page=1&limit=10', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  return await response.json();
};
```

**Example Response:**
```json
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "publicId": "usr_123456789",
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

### Search Healthcare Centers
```http
GET /centers/search
```

**Query Parameters:**
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

**Example Request:**
```javascript
// Search for hospitals in New York
const searchCenters = async (token) => {
  const response = await fetch('https://api.unlimtedhealth.com/api/centers/search?type=hospital&city=New York&state=NY&page=1&limit=10', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  return await response.json();
};
```

**Example Response:**
```json
{
  "centers": [
    {
      "id": "center-uuid-1",
      "displayId": "HSP123456789",
      "name": "City General Hospital",
      "type": "hospital",
      "address": "123 Medical Center Dr, New York, NY 10001",
      "phone": "+1-555-123-4567",
      "email": "info@citygeneral.com",
      "website": "https://citygeneral.com",
      "services": ["emergency", "surgery", "cardiology", "pediatrics"],
      "acceptingNewPatients": true,
      "rating": 4.2,
      "location": {
        "latitude": 40.7128,
        "longitude": -74.0060,
        "city": "New York",
        "state": "NY",
        "country": "United States"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "hasMore": false
}
```

---

## 2. Create Patient Request

### Endpoint
```http
POST /requests
```

**Request Body:**
```typescript
interface CreateRequestDto {
  recipientId: string;           // ID of the doctor/center to send request to
  requestType: 'patient_request'; // Must be 'patient_request'
  message: string;               // Request message from patient
  metadata?: {                   // Optional additional data
    appointmentType?: string;    // 'consultation', 'follow-up', 'emergency'
    preferredDate?: string;      // ISO date string
    preferredTime?: string;      // Time preference
    urgency?: 'low' | 'medium' | 'high';
    symptoms?: string;           // Brief description of symptoms
    insuranceInfo?: {
      provider: string;
      policyNumber: string;
    };
    medicalHistory?: string;     // Brief medical history
    currentMedications?: string[]; // List of current medications
  };
}
```

**Example Request:**
```javascript
const createPatientRequest = async (recipientId, message, metadata, token) => {
  const response = await fetch('https://api.unlimtedhealth.com/api/requests', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipientId: recipientId,
      requestType: 'patient_request',
      message: message,
      metadata: metadata
    })
  });
  return await response.json();
};

// Example usage
const requestData = {
  recipientId: 'usr_123456789', // Doctor's user ID
  requestType: 'patient_request',
  message: 'I would like to schedule a consultation for chest pain I\'ve been experiencing.',
  metadata: {
    appointmentType: 'consultation',
    preferredDate: '2024-02-15',
    preferredTime: 'morning',
    urgency: 'medium',
    symptoms: 'Chest pain, shortness of breath',
    insuranceInfo: {
      provider: 'Blue Cross Blue Shield',
      policyNumber: 'BC123456789'
    },
    medicalHistory: 'No previous heart conditions',
    currentMedications: ['Aspirin 81mg daily']
  }
};

const result = await createPatientRequest(
  requestData.recipientId,
  requestData.message,
  requestData.metadata,
  token
);
```

**Example Response:**
```json
{
  "id": "req-uuid-123",
  "senderId": "patient-uuid-456",
  "recipientId": "usr_123456789",
  "requestType": "patient_request",
  "status": "pending",
  "message": "I would like to schedule a consultation for chest pain I've been experiencing.",
  "metadata": {
    "appointmentType": "consultation",
    "preferredDate": "2024-02-15",
    "preferredTime": "morning",
    "urgency": "medium",
    "symptoms": "Chest pain, shortness of breath",
    "insuranceInfo": {
      "provider": "Blue Cross Blue Shield",
      "policyNumber": "BC123456789"
    },
    "medicalHistory": "No previous heart conditions",
    "currentMedications": ["Aspirin 81mg daily"]
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "respondedAt": null,
  "responseMessage": null,
  "createdBy": "patient-uuid-456",
  "updatedAt": "2024-01-15T10:30:00Z",
  "sender": {
    "id": "patient-uuid-456",
    "displayId": "PAT123456",
    "email": "patient@example.com",
    "roles": ["patient"],
    "profile": {
      "firstName": "Jane",
      "lastName": "Doe",
      "displayName": "Jane Doe"
    }
  },
  "recipient": {
    "id": "usr_123456789",
    "displayId": "DOC123456",
    "email": "doctor@example.com",
    "roles": ["doctor"],
    "profile": {
      "firstName": "John",
      "lastName": "Smith",
      "displayName": "Dr. John Smith",
      "specialization": "Cardiology"
    }
  }
}
```

---

## 3. Get Patient Requests

### Get Sent Requests (Patient's Outgoing Requests)
```http
GET /requests/sent
```

**Query Parameters:**
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `status` | string | No | Filter by status | `pending`, `approved`, `rejected`, `cancelled` |
| `type` | string | No | Filter by request type | `patient_request` |
| `page` | number | No | Page number (default: 1) | `1`, `2`, `3` |
| `limit` | number | No | Results per page (default: 20) | `10`, `20`, `50` |

**Example Request:**
```javascript
const getSentRequests = async (token, filters = {}) => {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value);
    }
  });
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/requests/sent?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  return await response.json();
};

// Example usage
const sentRequests = await getSentRequests(token, {
  status: 'pending',
  type: 'patient_request',
  page: 1,
  limit: 10
});
```

**Example Response:**
```json
{
  "requests": [
    {
      "id": "req-uuid-123",
      "senderId": "patient-uuid-456",
      "recipientId": "usr_123456789",
      "requestType": "patient_request",
      "status": "pending",
      "message": "I would like to schedule a consultation for chest pain I've been experiencing.",
      "metadata": {
        "appointmentType": "consultation",
        "preferredDate": "2024-02-15",
        "urgency": "medium"
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "respondedAt": null,
      "responseMessage": null,
      "createdBy": "patient-uuid-456",
      "updatedAt": "2024-01-15T10:30:00Z",
      "sender": {
        "id": "patient-uuid-456",
        "displayId": "PAT123456",
        "email": "patient@example.com",
        "roles": ["patient"],
        "profile": {
          "firstName": "Jane",
          "lastName": "Doe",
          "displayName": "Jane Doe"
        }
      },
      "recipient": {
        "id": "usr_123456789",
        "displayId": "DOC123456",
        "email": "doctor@example.com",
        "roles": ["doctor"],
        "profile": {
          "firstName": "John",
          "lastName": "Smith",
          "displayName": "Dr. John Smith",
          "specialization": "Cardiology"
        }
      }
    }
  ],
  "total": 1,
  "page": 1,
  "hasMore": false
}
```

### Get Received Requests (For Doctors/Centers)
```http
GET /requests/received
```

**Example Request:**
```javascript
const getReceivedRequests = async (token, filters = {}) => {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value);
    }
  });
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/requests/received?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  return await response.json();
};
```

---

## 4. Respond to Patient Request

### Endpoint (For Doctors/Centers)
```http
PATCH /requests/{requestId}/respond
```

**Request Body:**
```typescript
interface RespondRequestDto {
  action: 'approve' | 'reject';  // Response action
  message?: string;               // Optional response message
}
```

**Example Request:**
```javascript
const respondToRequest = async (requestId, action, message, token) => {
  const response = await fetch(`https://api.unlimtedhealth.com/api/requests/${requestId}/respond`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: action,
      message: message
    })
  });
  return await response.json();
};

// Example usage - Approve request
const approveRequest = await respondToRequest(
  'req-uuid-123',
  'approve',
  'I can see you on February 15th at 10:00 AM. Please bring your insurance card and a list of current medications.',
  token
);

// Example usage - Reject request
const rejectRequest = await respondToRequest(
  'req-uuid-123',
  'reject',
  'I\'m not accepting new patients at this time. I recommend contacting Dr. Smith at City General Hospital.',
  token
);
```

**Example Response (Approved):**
```json
{
  "id": "req-uuid-123",
  "senderId": "patient-uuid-456",
  "recipientId": "usr_123456789",
  "requestType": "patient_request",
  "status": "approved",
  "message": "I would like to schedule a consultation for chest pain I've been experiencing.",
  "metadata": {
    "appointmentType": "consultation",
    "preferredDate": "2024-02-15",
    "urgency": "medium"
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "respondedAt": "2024-01-15T14:45:00Z",
  "responseMessage": "I can see you on February 15th at 10:00 AM. Please bring your insurance card and a list of current medications.",
  "createdBy": "patient-uuid-456",
  "updatedAt": "2024-01-15T14:45:00Z",
  "sender": {
    "id": "patient-uuid-456",
    "displayId": "PAT123456",
    "email": "patient@example.com",
    "roles": ["patient"],
    "profile": {
      "firstName": "Jane",
      "lastName": "Doe",
      "displayName": "Jane Doe"
    }
  },
  "recipient": {
    "id": "usr_123456789",
    "displayId": "DOC123456",
    "email": "doctor@example.com",
    "roles": ["doctor"],
    "profile": {
      "firstName": "John",
      "lastName": "Smith",
      "displayName": "Dr. John Smith",
      "specialization": "Cardiology"
    }
  }
}
```

---

## 5. Get Specific Request Details

### Endpoint
```http
GET /requests/{requestId}
```

**Example Request:**
```javascript
const getRequestById = async (requestId, token) => {
  const response = await fetch(`https://api.unlimtedhealth.com/api/requests/${requestId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  return await response.json();
};
```

---

## 6. Cancel Patient Request

### Endpoint
```http
DELETE /requests/{requestId}
```

**Example Request:**
```javascript
const cancelRequest = async (requestId, token) => {
  const response = await fetch(`https://api.unlimtedhealth.com/api/requests/${requestId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  return response.ok;
};
```

---

## Complete Frontend Implementation Example

### React Component for Patient Request System

```jsx
import React, { useState, useEffect } from 'react';

const PatientRequestSystem = ({ userId, token }) => {
  const [providers, setProviders] = useState([]);
  const [centers, setCenters] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestMetadata, setRequestMetadata] = useState({});

  // Search for doctors
  const searchDoctors = async (specialty, location) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        type: 'doctor',
        ...(specialty && { specialty }),
        ...(location && { location }),
        page: '1',
        limit: '20'
      });
      
      const response = await fetch(`https://api.unlimtedhealth.com/api/users/search?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setProviders(data.users);
    } catch (error) {
      console.error('Error searching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search for centers
  const searchCenters = async (type, city) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        ...(type && { type }),
        ...(city && { city }),
        page: '1',
        limit: '20'
      });
      
      const response = await fetch(`https://api.unlimtedhealth.com/api/centers/search?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setCenters(data.centers);
    } catch (error) {
      console.error('Error searching centers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Send patient request
  const sendPatientRequest = async (recipientId, message, metadata) => {
    try {
      const response = await fetch('https://api.unlimtedhealth.com/api/requests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId,
          requestType: 'patient_request',
          message,
          metadata
        })
      });
      
      if (response.ok) {
        const newRequest = await response.json();
        setSentRequests(prev => [newRequest, ...prev]);
        alert('Request sent successfully!');
        setSelectedProvider(null);
        setRequestMessage('');
        setRequestMetadata({});
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error sending request:', error);
      alert('Failed to send request');
    }
  };

  // Load sent requests
  const loadSentRequests = async () => {
    try {
      const response = await fetch('https://api.unlimtedhealth.com/api/requests/sent?type=patient_request', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setSentRequests(data.requests);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  useEffect(() => {
    loadSentRequests();
  }, []);

  return (
    <div className="patient-request-system">
      <h2>Request Healthcare Services</h2>
      
      {/* Search Section */}
      <div className="search-section">
        <h3>Find Healthcare Providers</h3>
        
        <div className="search-doctors">
          <h4>Search Doctors</h4>
          <input
            type="text"
            placeholder="Specialty (e.g., cardiology)"
            onChange={(e) => searchDoctors(e.target.value, 'New York')}
          />
          {providers.map(provider => (
            <div key={provider.publicId} className="provider-card">
              <h5>{provider.displayName}</h5>
              <p>{provider.specialty}</p>
              <p>{provider.location?.city}, {provider.location?.state}</p>
              <button onClick={() => setSelectedProvider(provider)}>
                Send Request
              </button>
            </div>
          ))}
        </div>

        <div className="search-centers">
          <h4>Search Centers</h4>
          <input
            type="text"
            placeholder="Center type (e.g., hospital)"
            onChange={(e) => searchCenters(e.target.value, 'New York')}
          />
          {centers.map(center => (
            <div key={center.id} className="center-card">
              <h5>{center.name}</h5>
              <p>{center.type}</p>
              <p>{center.address}</p>
              <button onClick={() => setSelectedProvider(center)}>
                Send Request
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Request Form */}
      {selectedProvider && (
        <div className="request-form">
          <h3>Send Request to {selectedProvider.displayName || selectedProvider.name}</h3>
          <textarea
            placeholder="Describe your medical needs..."
            value={requestMessage}
            onChange={(e) => setRequestMessage(e.target.value)}
          />
          
          <div className="metadata-fields">
            <input
              type="text"
              placeholder="Appointment type (consultation, follow-up, emergency)"
              onChange={(e) => setRequestMetadata(prev => ({...prev, appointmentType: e.target.value}))}
            />
            <input
              type="date"
              placeholder="Preferred date"
              onChange={(e) => setRequestMetadata(prev => ({...prev, preferredDate: e.target.value}))}
            />
            <select
              onChange={(e) => setRequestMetadata(prev => ({...prev, urgency: e.target.value}))}
            >
              <option value="">Select urgency</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <textarea
              placeholder="Symptoms or medical concerns"
              onChange={(e) => setRequestMetadata(prev => ({...prev, symptoms: e.target.value}))}
            />
          </div>

          <button
            onClick={() => sendPatientRequest(
              selectedProvider.id || selectedProvider.publicId,
              requestMessage,
              requestMetadata
            )}
            disabled={!requestMessage.trim()}
          >
            Send Request
          </button>
        </div>
      )}

      {/* Sent Requests */}
      <div className="sent-requests">
        <h3>Your Requests</h3>
        {sentRequests.map(request => (
          <div key={request.id} className="request-card">
            <h4>Request to {request.recipient.profile?.displayName || request.recipient.displayName}</h4>
            <p><strong>Status:</strong> {request.status}</p>
            <p><strong>Message:</strong> {request.message}</p>
            <p><strong>Sent:</strong> {new Date(request.createdAt).toLocaleDateString()}</p>
            {request.responseMessage && (
              <p><strong>Response:</strong> {request.responseMessage}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientRequestSystem;
```

---

## Key Implementation Notes

### 0. Identifiers & Resolution (New)
- Users in search results include both `id` (UUID) and `publicId` when available.
- Endpoints that accept `{userId}` accept either UUID or `publicId`.
- Resolver endpoint: `GET /users/resolve/{publicId}` → `{ publicId, uuid, displayName }`.
- Recommendation: Prefer the UUID from search; otherwise resolve once and cache.

### 1. Authentication
- All endpoints require a valid JWT token in the Authorization header
- Token should be obtained through the login endpoint

### 2. Request Types
- Only `patient_request` type is used for patient requests
- Other types (`connection`, `job_application`, etc.) are for different purposes

### 3. Metadata Structure
- Use the `metadata` field to include additional request information
- Common fields: `appointmentType`, `preferredDate`, `urgency`, `symptoms`, `insuranceInfo`

### 4. Error Handling
- Always check response status before processing
- Handle network errors and API errors appropriately
- Display user-friendly error messages

### 5. Real-time Updates
- Consider implementing WebSocket connections for real-time request status updates
- Poll the API periodically to check for new responses

### 6. Privacy & Security
- Never expose sensitive patient data in search results
- Validate all user inputs before sending requests
- Use HTTPS for all API calls

---

## Common Use Cases

### 1. Emergency Request
```javascript
const emergencyRequest = {
  recipientId: 'emergency-center-id',
  requestType: 'patient_request',
  message: 'I need immediate medical attention for severe chest pain.',
  metadata: {
    appointmentType: 'emergency',
    urgency: 'high',
    symptoms: 'Severe chest pain, difficulty breathing',
    preferredDate: new Date().toISOString().split('T')[0]
  }
};
```

### 2. Routine Consultation
```javascript
const routineRequest = {
  recipientId: 'doctor-id',
  requestType: 'patient_request',
  message: 'I would like to schedule a routine check-up.',
  metadata: {
    appointmentType: 'consultation',
    urgency: 'low',
    preferredDate: '2024-02-20',
    preferredTime: 'morning'
  }
};
```

### 3. Follow-up Appointment
```javascript
const followUpRequest = {
  recipientId: 'doctor-id',
  requestType: 'patient_request',
  message: 'Following up on my previous treatment for diabetes management.',
  metadata: {
    appointmentType: 'follow-up',
    urgency: 'medium',
    preferredDate: '2024-02-15',
    medicalHistory: 'Type 2 diabetes, on metformin'
  }
};
```

This comprehensive guide provides everything frontend developers need to implement patient request functionality in the healthcare management system.
