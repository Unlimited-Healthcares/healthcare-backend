# Job Application Workflow Test Guide

## 🎯 **Complete Job Application Workflow Verification**

This guide tests the complete job application workflow from doctor discovery to center application.

## 📋 **Test Scenarios**

### **Scenario 1: Doctor Searching for Centers**

#### **Step 1: Search for Centers**
```bash
# Search for hospitals in New York
curl -X GET "http://localhost:3000/api/centers/search?type=hospital&location=New York&page=1&limit=10" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "centers": [
    {
      "publicId": "HSP123456789",
      "name": "General Hospital",
      "type": "hospital",
      "address": "123 Main St, New York, NY 10001",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "generalLocation": {
        "city": "New York",
        "state": "NY",
        "country": "United States"
      },
      "serviceCategories": ["Emergency Care", "Surgery", "Cardiology"],
      "acceptingNewPatients": true,
      "ownerId": "550e8400-e29b-41d4-a716-446655440000"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "hasMore": false
}
```

**✅ Key Verification Points:**
- `ownerId` field is present in response
- Center information is complete for job applications
- No sensitive data is exposed

#### **Step 2: Get Center Owner Information (Alternative Method)**
```bash
# Get center owner information directly
curl -X GET "http://localhost:3000/api/centers/CENTER_ID/owner" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "id": "staff-uuid",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "centerId": "center-uuid",
  "role": "owner",
  "createdAt": "2023-01-01T00:00:00Z"
}
```

### **Scenario 2: Doctor Creating Job Application**

#### **Step 1: Create Job Application Request**
```bash
# Doctor applies to join a center
curl -X POST "http://localhost:3000/api/requests" \
  -H "Authorization: Bearer DOCTOR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "CENTER_OWNER_USER_ID",
    "requestType": "job_application",
    "message": "I would like to apply to join General Hospital as a doctor. I have 5 years of experience in cardiology and am available for full-time work.",
    "metadata": {
      "centerId": "CENTER_ID",
      "qualifications": ["MD in Cardiology", "Board Certified"],
      "experience": "5 years",
      "availability": "Full-time"
    }
  }'
```

**Expected Response:**
```json
{
  "id": "request-uuid",
  "senderId": "DOCTOR_USER_ID",
  "recipientId": "CENTER_OWNER_USER_ID",
  "requestType": "job_application",
  "status": "pending",
  "message": "I would like to apply to join General Hospital as a doctor...",
  "metadata": {
    "centerId": "CENTER_ID",
    "qualifications": ["MD in Cardiology", "Board Certified"],
    "experience": "5 years",
    "availability": "Full-time"
  },
  "createdAt": "2023-01-01T00:00:00Z",
  "createdBy": "DOCTOR_USER_ID"
}
```

#### **Step 2: Verify Notification Sent**
- Center owner should receive a notification about the job application
- Check notifications endpoint for center owner

### **Scenario 3: Center Owner Managing Applications**

#### **Step 1: Get Received Job Applications**
```bash
# Center owner gets all received job applications
curl -X GET "http://localhost:3000/api/requests/received?type=job_application&status=pending&page=1&limit=10" \
  -H "Authorization: Bearer CENTER_OWNER_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "requests": [
    {
      "id": "request-uuid",
      "senderId": "DOCTOR_USER_ID",
      "recipientId": "CENTER_OWNER_USER_ID",
      "requestType": "job_application",
      "status": "pending",
      "message": "I would like to apply to join General Hospital as a doctor...",
      "metadata": {
        "centerId": "CENTER_ID",
        "qualifications": ["MD in Cardiology", "Board Certified"],
        "experience": "5 years",
        "availability": "Full-time"
      },
      "createdAt": "2023-01-01T00:00:00Z",
      "sender": {
        "id": "DOCTOR_USER_ID",
        "email": "doctor@example.com",
        "roles": ["doctor"],
        "profile": {
          "firstName": "Dr. John",
          "lastName": "Smith",
          "specialization": "Cardiology",
          "qualifications": ["MD in Cardiology", "Board Certified"]
        }
      }
    }
  ],
  "total": 1,
  "page": 1,
  "hasMore": false
}
```

#### **Step 2: Approve Job Application**
```bash
# Center owner approves the job application
curl -X PATCH "http://localhost:3000/api/requests/REQUEST_ID/respond" \
  -H "Authorization: Bearer CENTER_OWNER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "message": "Welcome to our team! We are excited to have you join us."
  }'
```

**Expected Response:**
```json
{
  "id": "request-uuid",
  "senderId": "DOCTOR_USER_ID",
  "recipientId": "CENTER_OWNER_USER_ID",
  "requestType": "job_application",
  "status": "approved",
  "message": "I would like to apply to join General Hospital as a doctor...",
  "responseMessage": "Welcome to our team! We are excited to have you join us.",
  "respondedAt": "2023-01-01T00:00:00Z"
}
```

#### **Step 3: Add Doctor to Center Staff**
```bash
# Add the approved doctor to center staff
curl -X POST "http://localhost:3000/api/centers/CENTER_ID/staff" \
  -H "Authorization: Bearer CENTER_OWNER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "DOCTOR_USER_ID",
    "role": "doctor"
  }'
```

### **Scenario 4: Doctor Tracking Applications**

#### **Step 1: Get Sent Applications**
```bash
# Doctor gets all their sent job applications
curl -X GET "http://localhost:3000/api/requests/sent?type=job_application&page=1&limit=10" \
  -H "Authorization: Bearer DOCTOR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "requests": [
    {
      "id": "request-uuid",
      "senderId": "DOCTOR_USER_ID",
      "recipientId": "CENTER_OWNER_USER_ID",
      "requestType": "job_application",
      "status": "approved",
      "message": "I would like to apply to join General Hospital as a doctor...",
      "responseMessage": "Welcome to our team! We are excited to have you join us.",
      "createdAt": "2023-01-01T00:00:00Z",
      "respondedAt": "2023-01-01T00:00:00Z",
      "recipient": {
        "id": "CENTER_OWNER_USER_ID",
        "email": "owner@hospital.com",
        "roles": ["center"],
        "profile": {
          "firstName": "Hospital",
          "lastName": "Admin"
        }
      }
    }
  ],
  "total": 1,
  "page": 1,
  "hasMore": false
}
```

## 🔧 **Complete Frontend Implementation Example**

### **React Component for Job Application**

```typescript
import React, { useState, useEffect } from 'react';

interface CenterSearchResult {
  publicId: string;
  name: string;
  type: string;
  address: string;
  serviceCategories: string[];
  ownerId: string;
}

interface JobApplicationData {
  recipientId: string;
  requestType: 'job_application';
  message: string;
  metadata: {
    centerId: string;
    qualifications: string[];
    experience: string;
    availability: string;
  };
}

const DoctorCenterJoining: React.FC = () => {
  const [centers, setCenters] = useState<CenterSearchResult[]>([]);
  const [applications, setApplications] = useState([]);
  const [searchFilters, setSearchFilters] = useState({
    type: 'hospital',
    location: '',
    radius: 50
  });

  // Search for centers
  const searchCenters = async () => {
    try {
      const params = new URLSearchParams({
        type: searchFilters.type,
        location: searchFilters.location,
        page: '1',
        limit: '10'
      });

      const response = await fetch(`/api/centers/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setCenters(data.centers);
    } catch (error) {
      console.error('Error searching centers:', error);
    }
  };

  // Apply to center
  const applyToCenter = async (center: CenterSearchResult) => {
    try {
      const applicationData: JobApplicationData = {
        recipientId: center.ownerId, // Use ownerId from search results
        requestType: 'job_application',
        message: `I would like to apply to join ${center.name} as a doctor. I have experience in [specialties] and am available [availability].`,
        metadata: {
          centerId: center.publicId,
          qualifications: ['MD in Cardiology', 'Board Certified'],
          experience: '5 years',
          availability: 'Full-time'
        }
      };

      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(applicationData)
      });

      if (response.ok) {
        alert('Application submitted successfully!');
        loadApplications(); // Refresh applications list
      } else {
        alert('Failed to submit application');
      }
    } catch (error) {
      console.error('Error applying to center:', error);
      alert('Failed to submit application');
    }
  };

  // Load applications
  const loadApplications = async () => {
    try {
      const response = await fetch('/api/requests/sent?type=job_application', {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      const data = await response.json();
      setApplications(data.requests);
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  return (
    <div className="doctor-center-joining">
      <h1>Find Centers to Join</h1>
      
      {/* Search Filters */}
      <div className="search-filters">
        <input
          type="text"
          placeholder="Location (city, state)"
          value={searchFilters.location}
          onChange={(e) => setSearchFilters({...searchFilters, location: e.target.value})}
        />
        <select
          value={searchFilters.type}
          onChange={(e) => setSearchFilters({...searchFilters, type: e.target.value})}
        >
          <option value="hospital">Hospital</option>
          <option value="clinic">Clinic</option>
          <option value="medical_center">Medical Center</option>
        </select>
        <button onClick={searchCenters}>Search Centers</button>
      </div>
      
      {/* Centers List */}
      <div className="centers-list">
        {centers.map(center => (
          <div key={center.publicId} className="center-card">
            <h3>{center.name}</h3>
            <p>{center.type}</p>
            <p>{center.address}</p>
            <div className="services">
              {center.serviceCategories.map(service => (
                <span key={service} className="service-tag">{service}</span>
              ))}
            </div>
            <button onClick={() => applyToCenter(center)}>
              Apply to Join
            </button>
          </div>
        ))}
      </div>
      
      {/* Applications List */}
      <div className="applications-section">
        <h2>My Applications</h2>
        {applications.map(app => (
          <div key={app.id} className="application-card">
            <h3>{app.recipient?.profile?.firstName} {app.recipient?.profile?.lastName}</h3>
            <p>Status: {app.status}</p>
            <p>Message: {app.message}</p>
            <p>Applied: {new Date(app.createdAt).toLocaleDateString()}</p>
            {app.status === 'pending' && (
              <button onClick={() => cancelApplication(app.id)}>
                Cancel Application
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorCenterJoining;
```

## ✅ **Verification Checklist**

### **Backend API Verification**
- [ ] Center search returns `ownerId` field
- [ ] Center owner endpoint works (`GET /api/centers/:id/owner`)
- [ ] Job application requests can be created with `job_application` type
- [ ] Request system handles job applications correctly
- [ ] Notifications are sent for job applications
- [ ] Center staff can be added after approval

### **Frontend Integration Verification**
- [ ] Search results display center information correctly
- [ ] "Apply to Join" button uses `ownerId` from search results
- [ ] Job application form includes proper metadata
- [ ] Application status tracking works
- [ ] Notifications are displayed correctly

### **Complete Workflow Verification**
- [ ] Doctor can search for centers
- [ ] Doctor can apply to join centers
- [ ] Center owner receives job application notifications
- [ ] Center owner can approve/reject applications
- [ ] Doctor receives response notifications
- [ ] Approved doctors can be added to center staff
- [ ] Application status is tracked correctly

## 🚀 **Testing Commands**

Run these commands in sequence to test the complete workflow:

```bash
# 1. Start the application
npm run start:dev

# 2. Search for centers
curl -X GET "http://localhost:3000/api/centers/search?type=hospital&location=New York&page=1&limit=10"

# 3. Get center owner (replace CENTER_ID with actual ID)
curl -X GET "http://localhost:3000/api/centers/CENTER_ID/owner"

# 4. Create job application (replace tokens and IDs)
curl -X POST "http://localhost:3000/api/requests" \
  -H "Authorization: Bearer DOCTOR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipientId":"OWNER_ID","requestType":"job_application","message":"I want to join","metadata":{"centerId":"CENTER_ID"}}'

# 5. Get received applications (center owner)
curl -X GET "http://localhost:3000/api/requests/received?type=job_application" \
  -H "Authorization: Bearer OWNER_JWT_TOKEN"

# 6. Approve application (replace REQUEST_ID)
curl -X PATCH "http://localhost:3000/api/requests/REQUEST_ID/respond" \
  -H "Authorization: Bearer OWNER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"approve","message":"Welcome!"}'

# 7. Add doctor to staff
curl -X POST "http://localhost:3000/api/centers/CENTER_ID/staff" \
  -H "Authorization: Bearer OWNER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"DOCTOR_ID","role":"doctor"}'
```

## 🎉 **Success Criteria**

The job application workflow is working correctly when:

1. ✅ **Center search includes owner information** - `ownerId` field is present
2. ✅ **Job applications can be created** - Using `job_application` request type
3. ✅ **Notifications work** - Both parties receive appropriate notifications
4. ✅ **Status tracking works** - Applications can be approved/rejected
5. ✅ **Staff management works** - Approved doctors can be added to centers
6. ✅ **Frontend integration is ready** - All necessary data is available

The implementation now fully supports the job application workflow as described in your frontend implementation guide!
