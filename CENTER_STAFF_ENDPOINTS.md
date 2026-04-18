# Center Staff Management Endpoints

## Overview
This guide covers how to manage staff across multiple centers when a center admin manages more than one healthcare facility. Each center's staff must be queried separately and displayed with their respective center information.

## Core Endpoints

### 1. Get Centers for Current User
```http
GET /api/centers/user/{userId}
```
**Auth:** Bearer token (center/admin role)

**Response:**
```json
[
  {
    "id": "center-uuid-1",
    "displayId": "HSP123456789",
    "name": "City Eye Clinic",
    "type": "eye",
    "address": "123 Medical Center Dr, New York, NY 10001",
    "isActive": true
  },
  {
    "id": "center-uuid-2", 
    "displayId": "MAT580137205",
    "name": "City Maternity Center",
    "type": "maternity",
    "address": "456 Maternity Lane, New York, NY 10002",
    "isActive": true
  }
]
```

### 2. Get Staff Members for Specific Center
```http
GET /api/centers/{centerId}/staff
```
**Auth:** Bearer token (center/admin role)

**Response:**
```json
[
  {
    "id": "staff-uuid",
    "userId": "user-uuid", 
    "centerId": "center-uuid",
    "role": "doctor",
    "user": {
      "id": "user-uuid",
      "displayId": "DOC123456",
      "email": "doctor@example.com",
      "roles": ["doctor"],
      "profile": {
        "firstName": "John",
        "lastName": "Smith",
        "specialization": "Cardiology",
        "licenseNumber": "MD123456"
      }
    },
    "createdAt": "2025-10-03T00:00:00Z"
  }
]
```

### 3. Get User Details (if needed separately)
```http
GET /api/users/{userId}
```
**Auth:** Bearer token

**Response:**
```json
{
  "id": "user-uuid",
  "email": "doctor@example.com",
  "roles": ["doctor"],
  "displayId": "DOC123456",
  "profile": {
    "firstName": "John",
    "lastName": "Smith",
    "specialization": "Cardiology"
  }
}
```

## Frontend Implementation Guide

### Complete Staff Management Flow

```javascript
// 1. Get all centers for the current user
const getCentersForUser = async (userId, token) => {
  const response = await fetch(`https://api.unlimtedhealth.com/api/centers/user/${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  return await response.json();
};

// 2. Get staff for a specific center
const getStaffForCenter = async (centerId, token) => {
  const response = await fetch(`https://api.unlimtedhealth.com/api/centers/${centerId}/staff`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  return await response.json();
};

// 3. Get all staff across all centers with center information
const getAllStaffWithCenterInfo = async (userId, token) => {
  try {
    // Get all centers for the user
    const centers = await getCentersForUser(userId, token);
    
    // Get staff for each center
    const allStaffData = await Promise.all(
      centers.map(async (center) => {
        const staff = await getStaffForCenter(center.id, token);
        return {
          center: {
            id: center.id,
            displayId: center.displayId,
            name: center.name,
            type: center.type,
            address: center.address
          },
          staff: staff,
          staffCount: staff.length
        };
      })
    });
    
    return allStaffData;
  } catch (error) {
    console.error('Error fetching staff data:', error);
    throw error;
  }
};

// 4. Usage example
const loadStaffData = async () => {
  const userId = '2177e4e6-a535-4eb3-a0c1-f2c67732aa03'; // Current user ID
  const token = localStorage.getItem('access_token');
  
  try {
    const staffData = await getAllStaffWithCenterInfo(userId, token);
    
    // Display staff grouped by center
    staffData.forEach(centerData => {
      console.log(`\n=== ${centerData.center.name} (${centerData.center.type}) ===`);
      console.log(`Staff Count: ${centerData.staffCount}`);
      console.log(`Address: ${centerData.center.address}`);
      
      centerData.staff.forEach(member => {
        console.log(`- ${member.user.profile?.firstName} ${member.user.profile?.lastName} (${member.role})`);
        console.log(`  Email: ${member.user.email}`);
        console.log(`  Specialization: ${member.user.profile?.specialization || 'N/A'}`);
      });
    });
    
    return staffData;
  } catch (error) {
    console.error('Failed to load staff data:', error);
  }
};
```

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';

const StaffManagement = ({ userId, token }) => {
  const [staffData, setStaffData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStaff = async () => {
      try {
        setLoading(true);
        const data = await getAllStaffWithCenterInfo(userId, token);
        setStaffData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStaff();
  }, [userId, token]);

  if (loading) return <div>Loading staff data...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="staff-management">
      <h2>Staff Management Dashboard</h2>
      
      {staffData.map((centerData) => (
        <div key={centerData.center.id} className="center-section">
          <div className="center-header">
            <h3>{centerData.center.name}</h3>
            <span className="center-type">{centerData.center.type}</span>
            <span className="staff-count">{centerData.staffCount} staff members</span>
          </div>
          
          <div className="center-address">
            📍 {centerData.center.address}
          </div>
          
          <div className="staff-list">
            {centerData.staff.length === 0 ? (
              <p className="no-staff">No staff members yet</p>
            ) : (
              centerData.staff.map((member) => (
                <div key={member.id} className="staff-member">
                  <div className="staff-info">
                    <h4>{member.user.profile?.firstName} {member.user.profile?.lastName}</h4>
                    <p className="role">{member.role}</p>
                    <p className="email">{member.user.email}</p>
                    {member.user.profile?.specialization && (
                      <p className="specialization">{member.user.profile.specialization}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StaffManagement;
```

### Staff Management After Job Application Approval

```javascript
// Complete workflow after approving a job application
const approveJobApplication = async (requestId, centerId, token) => {
  try {
    // 1. Approve the job application
    await fetch(`https://api.unlimtedhealth.com/api/requests/${requestId}/respond`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'approve',
        message: 'Welcome to our team!'
      })
    });

    // 2. Refresh staff data for the specific center
    const updatedStaff = await getStaffForCenter(centerId, token);
    
    // 3. Refresh all staff data to update the UI
    const allStaffData = await getAllStaffWithCenterInfo(userId, token);
    
    return { updatedStaff, allStaffData };
  } catch (error) {
    console.error('Error approving job application:', error);
    throw error;
  }
};
```

## Key Points for Frontend Developers

1. **Multiple Centers**: Always query centers first using `/api/centers/user/{userId}`
2. **Separate Staff Queries**: Each center's staff must be queried individually
3. **Group by Center**: Display staff grouped by their respective centers
4. **Center Information**: Include center name, type, and address for context
5. **Staff Count**: Show staff count per center for quick overview
6. **Error Handling**: Handle cases where centers have no staff members
7. **Real-time Updates**: Refresh staff data after adding/removing staff members

## Data Structure Summary

```typescript
interface CenterStaffData {
  center: {
    id: string;
    displayId: string;
    name: string;
    type: string;
    address: string;
  };
  staff: Array<{
    id: string;
    userId: string;
    centerId: string;
    role: string;
    user: {
      id: string;
      displayId: string;
      email: string;
      roles: string[];
      profile: {
        firstName?: string;
        lastName?: string;
        specialization?: string;
        licenseNumber?: string;
      };
    };
    createdAt: string;
  }>;
  staffCount: number;
}
```
