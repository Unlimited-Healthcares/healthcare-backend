# Frontend Integration Guide: Patient Approved Providers

## 🚀 Quick Start

The backend now provides 4 new endpoints to fetch approved providers for patients. Use these endpoints to display provider cards in the patient dashboard.

## 📡 Available Endpoints

### Base URL
```
https://api.unlimtedhealth.com/api
```

### 1. Get Approved Doctors
```http
GET /patients/{patientId}/approved-doctors
```

### 2. Get Approved Healthcare Centers  
```http
GET /patients/{patientId}/approved-centers
```

### 3. Get All Approved Providers
```http
GET /patients/{patientId}/approved-providers
```

### 4. Get Provider Counts
```http
GET /patients/{patientId}/approved-providers/count
```

## 🔐 Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```javascript
const headers = {
  'Authorization': `Bearer ${userToken}`,
  'Content-Type': 'application/json'
}
```

## 📝 Example Usage

### React Hook Example

```javascript
import { useState, useEffect } from 'react';

const usePatientProviders = (patientId) => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(
          `https://api.unlimtedhealth.com/api/patients/${patientId}/approved-providers`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch providers');
        }

        const data = await response.json();
        setProviders(data.providers);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchProviders();
    }
  }, [patientId]);

  return { providers, loading, error };
};

export default usePatientProviders;
```

### Component Example

```javascript
import React from 'react';
import usePatientProviders from './hooks/usePatientProviders';

const PatientDashboard = ({ patientId }) => {
  const { providers, loading, error } = usePatientProviders(patientId);

  if (loading) return <div>Loading providers...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="patient-dashboard">
      <h2>My Approved Providers</h2>
      
      {providers.length === 0 ? (
        <div className="empty-state">
          <p>No approved providers yet.</p>
          <button>Find Providers</button>
        </div>
      ) : (
        <div className="providers-grid">
          {providers.map(provider => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      )}
    </div>
  );
};

const ProviderCard = ({ provider }) => {
  const isDoctor = provider.providerType === 'doctor';
  const providerData = isDoctor ? provider.provider : provider.center;

  return (
    <div className="provider-card">
      <h3>{providerData.name || `${providerData.firstName} ${providerData.lastName}`}</h3>
      <p>{isDoctor ? 'Doctor' : 'Healthcare Center'}</p>
      {isDoctor && providerData.profile?.specialization && (
        <p>Specialization: {providerData.profile.specialization}</p>
      )}
      <p>Approved: {new Date(provider.approvedAt).toLocaleDateString()}</p>
    </div>
  );
};

export default PatientDashboard;
```

## 📊 Response Formats

### Get All Providers Response
```json
{
  "providers": [
    {
      "id": "uuid",
      "providerId": "uuid", 
      "providerType": "doctor",
      "status": "approved",
      "approvedAt": "2025-01-07T10:30:00Z",
      "provider": {
        "id": "uuid",
        "email": "doctor@example.com",
        "profile": {
          "firstName": "John",
          "lastName": "Smith",
          "specialization": "Cardiology",
          "phone": "+1234567890",
          "avatar": "https://..."
        }
      },
      "center": null
    },
    {
      "id": "uuid",
      "providerId": "uuid",
      "providerType": "center", 
      "status": "approved",
      "approvedAt": "2025-01-07T11:00:00Z",
      "provider": null,
      "center": {
        "id": "uuid",
        "name": "City Medical Center",
        "address": "123 Main St",
        "phone": "+1234567890",
        "email": "info@citymedical.com",
        "centerType": "Hospital"
      }
    }
  ],
  "total": 2
}
```

### Get Provider Counts Response
```json
{
  "total": 5,
  "doctors": 3,
  "centers": 2
}
```

## 🎨 UI Implementation Tips

### 1. Empty State
```javascript
const EmptyProvidersState = () => (
  <div className="empty-state">
    <div className="empty-icon">👩‍⚕️</div>
    <h3>No Approved Providers</h3>
    <p>You haven't connected with any healthcare providers yet.</p>
    <button className="primary-button">Find Providers</button>
  </div>
);
```

### 2. Loading State
```javascript
const ProvidersLoading = () => (
  <div className="loading-state">
    <div className="skeleton-card"></div>
    <div className="skeleton-card"></div>
    <div className="skeleton-card"></div>
  </div>
);
```

### 3. Provider Card Design
```javascript
const ProviderCard = ({ provider }) => {
  const isDoctor = provider.providerType === 'doctor';
  const data = isDoctor ? provider.provider : provider.center;
  
  return (
    <div className="provider-card">
      <div className="provider-avatar">
        {isDoctor ? '👨‍⚕️' : '🏥'}
      </div>
      <div className="provider-info">
        <h3>{isDoctor ? `${data.profile.firstName} ${data.profile.lastName}` : data.name}</h3>
        <p className="provider-type">{isDoctor ? 'Doctor' : 'Healthcare Center'}</p>
        {isDoctor && data.profile.specialization && (
          <p className="specialization">{data.profile.specialization}</p>
        )}
        <p className="approval-date">
          Approved {new Date(provider.approvedAt).toLocaleDateString()}
        </p>
      </div>
      <div className="provider-actions">
        <button className="secondary-button">View Profile</button>
        <button className="primary-button">Book Appointment</button>
      </div>
    </div>
  );
};
```

## 🔄 Real-time Updates

The system automatically creates patient-provider relationships when requests are approved. You can:

1. **Poll for updates** every 30 seconds
2. **Use WebSocket** if implemented
3. **Refresh on user action** (pull-to-refresh)

```javascript
// Polling example
useEffect(() => {
  const interval = setInterval(() => {
    fetchProviders(); // Re-fetch providers
  }, 30000); // 30 seconds

  return () => clearInterval(interval);
}, []);
```

## ⚠️ Error Handling

```javascript
const handleApiError = (error) => {
  if (error.status === 401) {
    // Redirect to login
    window.location.href = '/login';
  } else if (error.status === 404) {
    // Patient not found
    console.error('Patient not found');
  } else if (error.status === 403) {
    // Access denied
    console.error('Access denied');
  } else {
    // Generic error
    console.error('Something went wrong');
  }
};
```

## 🧪 Testing

### Test with Sample Data
```javascript
// Mock data for development
const mockProviders = [
  {
    id: "1",
    providerId: "doc-1",
    providerType: "doctor",
    status: "approved",
    approvedAt: "2025-01-07T10:30:00Z",
    provider: {
      id: "doc-1",
      email: "john.smith@example.com",
      profile: {
        firstName: "John",
        lastName: "Smith", 
        specialization: "Cardiology",
        phone: "+1234567890"
      }
    },
    center: null
  }
];
```

## 📱 Mobile Considerations

- Use **card-based layout** for better mobile experience
- Implement **pull-to-refresh** functionality
- Show **loading skeletons** instead of spinners
- Use **infinite scroll** if you have many providers

## 🚀 Next Steps

1. **Implement the hook** in your patient dashboard
2. **Create provider cards** with the design system
3. **Add empty states** for better UX
4. **Test with real data** from the API
5. **Add real-time updates** if needed

## ❗ Common Integration Mistakes (and fixes)

- **Wrong identifier**: Do not use `userId` in patient routes. Use the patient's `profile.id` (this is the `patientId`).
  - ✅ Use: `patientId = profile.id`
  - ❌ Avoid: `/patients/{userId}` or `/patients/by-user/{userId}`

- **Wrong endpoint**: The approved relationships are exposed via the patient provider endpoints.
  - ✅ Use: `/patients/{patientId}/approved-providers` (or `/approved-doctors`, `/approved-centers`, `/approved-providers/count`)
  - ❌ Avoid: `/patients/by-user/{userId}` (not implemented)

- **Broken avatar URLs**: Do not fetch hard-coded assets like `http://217.21.78.192:3001/doctor1.jpg`.
  - ✅ Use `provider.provider.profile.avatar` (doctor) or a placeholder when missing

- **Base URL**: Always call `https://api.unlimtedhealth.com/api`.

### Minimal fix example

```ts
// Derive patientId from the loaded profile object
const patientId = profile?.id; // e.g., "77bf9749-..."
if (!patientId) throw new Error('Patient profile not found for this account.');

// Fetch approved providers for the patient
const token = localStorage.getItem('authToken');
const res = await fetch(
  `https://api.unlimtedhealth.com/api/patients/${patientId}/approved-providers`,
  { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
);
if (!res.ok) throw new Error('Failed to fetch providers');
const data = await res.json();
```

### Avatar fallback example (React)

```tsx
const isDoctor = provider.providerType === 'doctor';
const avatarUrl = isDoctor
  ? provider.provider?.profile?.avatar
  : provider.center?.logo;

<img
  src={avatarUrl || '/images/avatar-placeholder.png'}
  alt="Provider avatar"
  width={40}
  height={40}
/>;
```

### Do / Don't

```text
DON'T: GET /api/patients/by-user/{userId}
DON'T: GET /api/patients/{userId}
DO:    GET /api/patients/{patientId}/approved-providers
```

### Troubleshooting 404s

- "Cannot GET /api/patients/by-user/{...}" → Wrong endpoint; switch to `/patients/{patientId}/approved-providers`.
- "Patient not found" while passing a `userId` → You're using the wrong id; pass `profile.id` as `patientId`.

### Quick checklist

- **Use `patientId`** from `profile.id`
- **Correct route**: `/patients/{patientId}/approved-providers`
- **JWT header**: `Authorization: Bearer <token>`
- **Avatar**: use profile avatar or placeholder
- **Empty state**: handle zero providers gracefully

## 📞 Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify the JWT token is valid
3. Ensure the patient ID is correct
4. Check the API documentation at `/api/docs` (Swagger UI)

---

**Happy coding! 🎉**
