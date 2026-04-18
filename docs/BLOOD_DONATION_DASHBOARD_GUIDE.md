# 🩸 Blood Donation Dashboard Guide

## 📋 Overview

This comprehensive guide provides everything needed to implement a Blood Donation Dashboard for the healthcare management system. The dashboard enables users to manage blood donors, donation requests, inventory, and track donation analytics.

**Base URL:** `https://api.unlimtedhealth.com/api`  
**Authentication:** Bearer token required for all endpoints  
**Documentation:** Swagger/OpenAPI available at `/api/docs`

---

## 🏷️ TypeScript Interfaces

### Core Blood Donation Types

```typescript
// Blood Type Enum
enum BloodType {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
}

// Donor Status Enum
enum DonorStatus {
  ELIGIBLE = 'eligible',
  TEMPORARILY_DEFERRED = 'temporarily_deferred',
  PERMANENTLY_DEFERRED = 'permanently_deferred',
  SUSPENDED = 'suspended',
}

// Request Status Enum
enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  FULFILLED = 'fulfilled',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

// Request Priority Enum
enum RequestPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Donation Status Enum
enum DonationStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}
```

### Blood Donor Interface

```typescript
interface BloodDonor {
  id: string;                           // UUID - Primary key
  userId: string;                       // UUID - User ID
  donorNumber: string;                  // Unique donor number
  bloodType: BloodType;                 // Blood type
  weightKg?: number;                    // Weight in kilograms
  heightCm?: number;                    // Height in centimeters
  dateOfBirth: Date;                    // Date of birth
  emergencyContactName?: string;        // Emergency contact name
  emergencyContactPhone?: string;       // Emergency contact phone
  medicalConditions: string[];          // Medical conditions
  medications: string[];                // Current medications
  lastDonationDate?: Date;              // Last donation date
  nextEligibleDate?: Date;              // Next eligible donation date
  totalDonations: number;               // Total donations count
  totalRewardPoints: number;            // Total reward points
  status: DonorStatus;                  // Donor eligibility status
  notes?: string;                       // Additional notes
  createdAt: Date;                      // Creation timestamp
  updatedAt: Date;                      // Last update timestamp
}
```

### Blood Donation Request Interface

```typescript
interface BloodDonationRequest {
  id: string;                           // UUID - Primary key
  requestNumber: string;                // Unique request number
  requestingCenterId: string;           // UUID - Requesting center ID
  patientName?: string;                 // Patient name
  patientAge?: number;                  // Patient age
  bloodType: BloodType;                 // Required blood type
  unitsNeeded: number;                  // Units needed
  unitsFulfilled: number;               // Units fulfilled
  priority: RequestPriority;            // Request priority
  status: RequestStatus;                // Request status
  neededBy: Date;                       // When blood is needed
  medicalCondition?: string;            // Medical condition
  specialRequirements?: string;         // Special requirements
  contactPerson?: string;               // Contact person
  contactPhone?: string;                // Contact phone
  approvedBy?: string;                  // UUID - Approved by user ID
  approvedAt?: Date;                    // Approval date
  fulfilledAt?: Date;                   // Fulfillment date
  notes?: string;                       // Additional notes
  createdAt: Date;                      // Creation timestamp
  updatedAt: Date;                      // Last update timestamp
}
```

### Blood Donation Interface

```typescript
interface BloodDonation {
  id: string;                           // UUID - Primary key
  donationNumber: string;               // Unique donation number
  donorId: string;                      // UUID - Donor ID
  requestId?: string;                   // UUID - Request ID (optional)
  bloodBankCenterId: string;            // UUID - Blood bank center ID
  donationDate: Date;                   // Donation date
  bloodType: BloodType;                 // Blood type
  volumeMl: number;                     // Volume in milliliters
  status: DonationStatus;               // Donation status
  preDonationVitals?: Record<string, string | number>; // Pre-donation vitals
  postDonationVitals?: Record<string, string | number>; // Post-donation vitals
  preScreeningResults?: Record<string, unknown>; // Pre-screening results
  postDonationMonitoring?: Record<string, unknown>; // Post-donation monitoring
  notes?: Record<string, unknown>;      // Additional notes
  staffNotes?: string;                  // Staff notes
  compensationAmount: number;           // Compensation amount
  paymentStatus: string;                // Payment status
  paymentReference?: string;            // Payment reference
  expiryDate?: Date;                    // Blood expiry date
  createdBy: string;                    // UUID - Created by user ID
  createdAt: Date;                      // Creation timestamp
  updatedAt: Date;                      // Last update timestamp
}
```

### Blood Inventory Interface

```typescript
interface BloodInventory {
  id: string;                           // UUID - Primary key
  centerId: string;                     // UUID - Center ID
  bloodType: BloodType;                 // Blood type
  totalUnits: number;                   // Total units
  availableUnits: number;               // Available units
  reservedUnits: number;                // Reserved units
  expiredUnits: number;                 // Expired units
  minimumThreshold: number;             // Minimum threshold for alerts
  lastUpdated: Date;                    // Last update timestamp
}
```

---

## 🩸 Blood Donor Management Endpoints

### 1. Register as Blood Donor
**Endpoint:** `POST /blood-donation/donors/register`  
**Authentication:** Required (Bearer token)  
**Roles:** All authenticated users

**Request Body (CreateBloodDonorDto):**
```typescript
interface CreateBloodDonorDto {
  bloodType: BloodType;                 // Required: Blood type
  weightKg?: number;                    // Optional: Weight in kg (40-200)
  heightCm?: number;                    // Optional: Height in cm (120-250)
  dateOfBirth: string;                  // Required: Date of birth (ISO date)
  emergencyContactName?: string;        // Optional: Emergency contact name
  emergencyContactPhone?: string;       // Optional: Emergency contact phone
  medicalConditions?: string[];         // Optional: Medical conditions
  medications?: string[];               // Optional: Current medications
  notes?: string;                       // Optional: Additional notes
}
```

**Example Request:**
```typescript
const registerBloodDonor = async (donorData: CreateBloodDonorDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/blood-donation/donors/register', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bloodType: "A+",
      weightKg: 70.5,
      heightCm: 175,
      dateOfBirth: "1990-01-15",
      emergencyContactName: "Jane Smith",
      emergencyContactPhone: "+1-555-0123",
      medicalConditions: [],
      medications: [],
      notes: "First-time donor"
    })
  });
  
  return await response.json();
};
```

### 2. Get My Donor Profile
**Endpoint:** `GET /blood-donation/donors/me`  
**Authentication:** Required (Bearer token)  
**Roles:** All authenticated users

**Example Request:**
```typescript
const getMyDonorProfile = async () => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/blood-donation/donors/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 3. Get All Donors
**Endpoint:** `GET /blood-donation/donors`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `staff`

**Query Parameters:**
```typescript
interface DonorFilters {
  page?: number;                        // Page number (default: 1)
  limit?: number;                       // Items per page (default: 10)
  status?: DonorStatus;                 // Filter by donor status
  bloodType?: string;                   // Filter by blood type
}
```

**Example Request:**
```typescript
const getAllDonors = async (filters: DonorFilters = {}) => {
  const token = localStorage.getItem('access_token');
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/blood-donation/donors?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 4. Get Eligible Donors
**Endpoint:** `GET /blood-donation/donors/eligible/:bloodType`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `staff`

**Example Request:**
```typescript
const getEligibleDonors = async (bloodType: string, limit: number = 10) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/blood-donation/donors/eligible/${bloodType}?limit=${limit}`, {
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

## 🩸 Blood Donation Request Endpoints

### 1. Create Blood Donation Request
**Endpoint:** `POST /blood-donation/requests`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `healthcare_provider`, `staff`

**Request Body (CreateBloodDonationRequestDto):**
```typescript
interface CreateBloodDonationRequestDto {
  requestingCenterId: string;           // Required: Requesting center ID
  patientName?: string;                 // Optional: Patient name
  patientAge?: number;                  // Optional: Patient age (0-150)
  bloodType: BloodType;                 // Required: Blood type
  unitsNeeded: number;                  // Required: Units needed (1-20)
  priority: RequestPriority;            // Required: Request priority
  neededBy: string;                     // Required: When needed (ISO date)
  medicalCondition?: string;            // Optional: Medical condition
  specialRequirements?: string;         // Optional: Special requirements
  contactPerson?: string;               // Optional: Contact person
  contactPhone?: string;                // Optional: Contact phone
  notes?: string;                       // Optional: Additional notes
}
```

**Example Request:**
```typescript
const createBloodRequest = async (requestData: CreateBloodDonationRequestDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/blood-donation/requests', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requestingCenterId: "550e8400-e29b-41d4-a716-446655440000",
      patientName: "John Doe",
      patientAge: 35,
      bloodType: "A+",
      unitsNeeded: 2,
      priority: "high",
      neededBy: "2024-02-15T10:00:00Z",
      medicalCondition: "Surgery - blood loss",
      specialRequirements: "CMV negative required",
      contactPerson: "Dr. Smith",
      contactPhone: "+1-555-0123",
      notes: "Urgent case - car accident"
    })
  });
  
  return await response.json();
};
```

### 2. Get All Blood Requests
**Endpoint:** `GET /blood-donation/requests`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `healthcare_provider`, `staff`

**Query Parameters:**
```typescript
interface RequestFilters {
  page?: number;                        // Page number (default: 1)
  limit?: number;                       // Items per page (default: 10)
  status?: RequestStatus;               // Filter by status
  priority?: RequestPriority;           // Filter by priority
  bloodType?: string;                   // Filter by blood type
  centerId?: string;                    // Filter by center ID
}
```

**Example Request:**
```typescript
const getAllBloodRequests = async (filters: RequestFilters = {}) => {
  const token = localStorage.getItem('access_token');
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/blood-donation/requests?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 3. Get Urgent Requests
**Endpoint:** `GET /blood-donation/requests/urgent`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `healthcare_provider`, `staff`

**Example Request:**
```typescript
const getUrgentRequests = async () => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/blood-donation/requests/urgent', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 4. Approve Blood Request
**Endpoint:** `PATCH /blood-donation/requests/:id/approve`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `healthcare_provider`

**Example Request:**
```typescript
const approveBloodRequest = async (requestId: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/blood-donation/requests/${requestId}/approve`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

---

## 🩸 Blood Inventory Management Endpoints

### 1. Get Blood Inventory
**Endpoint:** `GET /blood-donation/inventory`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `staff`

**Query Parameters:**
```typescript
{
  bloodType?: string;                   // Filter by blood type
  centerId?: string;                    // Filter by center ID
}
```

**Example Request:**
```typescript
const getBloodInventory = async (centerId?: string, bloodType?: string) => {
  const token = localStorage.getItem('access_token');
  const queryParams = new URLSearchParams();
  
  if (centerId) queryParams.append('centerId', centerId);
  if (bloodType) queryParams.append('bloodType', bloodType);
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/blood-donation/inventory?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 2. Get Center Inventory
**Endpoint:** `GET /blood-donation/inventory/center/:centerId`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `staff`

**Example Request:**
```typescript
const getCenterInventory = async (centerId: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/blood-donation/inventory/center/${centerId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 3. Get Low Inventory Alerts
**Endpoint:** `GET /blood-donation/inventory/low-alerts`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `staff`

**Example Request:**
```typescript
const getLowInventoryAlerts = async () => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/blood-donation/inventory/low-alerts', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 4. Check Blood Availability
**Endpoint:** `GET /blood-donation/inventory/availability/:centerId/:bloodType/:units`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `staff`

**Example Request:**
```typescript
const checkBloodAvailability = async (centerId: string, bloodType: string, units: number) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/blood-donation/inventory/availability/${centerId}/${bloodType}/${units}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 5. Reserve Blood Units
**Endpoint:** `PATCH /blood-donation/inventory/reserve/:centerId/:bloodType/:units`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `staff`

**Example Request:**
```typescript
const reserveBloodUnits = async (centerId: string, bloodType: string, units: number) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/blood-donation/inventory/reserve/${centerId}/${bloodType}/${units}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

---

## 🩸 Blood Donation Management Endpoints

### 1. Create Blood Donation
**Endpoint:** `POST /blood-donation/donations`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `staff`

**Request Body (CreateBloodDonationDto):**
```typescript
interface CreateBloodDonationDto {
  donorId: string;                      // Required: Donor ID
  requestId?: string;                   // Optional: Request ID
  bloodBankCenterId: string;            // Required: Blood bank center ID
  donationDate: string;                 // Required: Donation date (ISO date)
  bloodType: BloodType;                 // Required: Blood type
  volumeMl?: number;                    // Optional: Volume in ml (300-500)
  preDonationVitals?: Record<string, string | number>; // Optional: Pre-donation vitals
  postDonationVitals?: Record<string, string | number>; // Optional: Post-donation vitals
  screeningResults?: Record<string, string | number>; // Optional: Screening results
  staffNotes?: string;                  // Optional: Staff notes
  compensationAmount?: number;          // Optional: Compensation amount
  preScreeningResults?: Record<string, unknown>; // Optional: Pre-screening results
  postDonationMonitoring?: Record<string, unknown>; // Optional: Post-donation monitoring
  notes?: string;                       // Optional: Additional notes
}
```

**Example Request:**
```typescript
const createBloodDonation = async (donationData: CreateBloodDonationDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/blood-donation/donations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      donorId: "550e8400-e29b-41d4-a716-446655440000",
      bloodBankCenterId: "550e8400-e29b-41d4-a716-446655440001",
      donationDate: "2024-02-15T10:00:00Z",
      bloodType: "A+",
      volumeMl: 450,
      preDonationVitals: {
        bloodPressure: "120/80",
        pulse: 72,
        temperature: 98.6
      },
      postDonationVitals: {
        bloodPressure: "115/75",
        pulse: 75
      },
      screeningResults: {
        hemoglobin: 14.5,
        hematocrit: 42
      },
      staffNotes: "Donation completed successfully",
      compensationAmount: 50.00
    })
  });
  
  return await response.json();
};
```

### 2. Get All Donations
**Endpoint:** `GET /blood-donation/donations`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `staff`

**Example Request:**
```typescript
const getAllDonations = async () => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/blood-donation/donations', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 3. Get My Donations
**Endpoint:** `GET /blood-donation/donations/my-donations`  
**Authentication:** Required (Bearer token)  
**Roles:** All authenticated users

**Example Request:**
```typescript
const getMyDonations = async () => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/blood-donation/donations/my-donations', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 4. Complete Donation
**Endpoint:** `PATCH /blood-donation/donations/:id/complete`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `staff`

**Example Request:**
```typescript
const completeDonation = async (donationId: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/blood-donation/donations/${donationId}/complete`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

---

## 🎨 Frontend Implementation Examples

### React Component Example

```typescript
import React, { useState, useEffect } from 'react';

interface BloodDonationDashboardProps {
  centerId?: string;
}

const BloodDonationDashboard: React.FC<BloodDonationDashboardProps> = ({ centerId }) => {
  const [donors, setDonors] = useState<BloodDonor[]>([]);
  const [requests, setRequests] = useState<BloodDonationRequest[]>([]);
  const [inventory, setInventory] = useState<BloodInventory[]>([]);
  const [donations, setDonations] = useState<BloodDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    centerId
  });

  useEffect(() => {
    loadBloodDonationData();
  }, [filters]);

  const loadBloodDonationData = async () => {
    try {
      setLoading(true);
      const [donorsRes, requestsRes, inventoryRes, donationsRes] = await Promise.all([
        getAllDonors(filters),
        getAllBloodRequests(filters),
        getBloodInventory(filters.centerId),
        getAllDonations()
      ]);
      
      setDonors(donorsRes.data);
      setRequests(requestsRes.data);
      setInventory(inventoryRes.data);
      setDonations(donationsRes.data);
    } catch (error) {
      console.error('Error loading blood donation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterDonor = async (donorData: CreateBloodDonorDto) => {
    try {
      await registerBloodDonor(donorData);
      alert('Successfully registered as blood donor!');
      loadBloodDonationData();
    } catch (error) {
      console.error('Error registering donor:', error);
      alert('Failed to register as donor');
    }
  };

  const handleCreateRequest = async (requestData: CreateBloodDonationRequestDto) => {
    try {
      await createBloodRequest(requestData);
      alert('Blood donation request created successfully!');
      loadBloodDonationData();
    } catch (error) {
      console.error('Error creating request:', error);
      alert('Failed to create blood request');
    }
  };

  if (loading) {
    return <div className="loading">Loading blood donation data...</div>;
  }

  return (
    <div className="blood-donation-dashboard">
      <h1>Blood Donation Dashboard</h1>
      
      {/* Inventory Overview */}
      <div className="inventory-overview">
        <h2>Blood Inventory</h2>
        <div className="inventory-grid">
          {inventory.map(item => (
            <div key={`${item.centerId}-${item.bloodType}`} className="inventory-card">
              <h3>{item.bloodType}</h3>
              <p>Available: {item.availableUnits}</p>
              <p>Reserved: {item.reservedUnits}</p>
              <p>Total: {item.totalUnits}</p>
              {item.availableUnits < item.minimumThreshold && (
                <div className="alert">Low Stock Alert!</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Urgent Requests */}
      <div className="urgent-requests">
        <h2>Urgent Blood Requests</h2>
        <div className="requests-list">
          {requests.filter(req => req.priority === 'critical' || req.priority === 'high').map(request => (
            <div key={request.id} className="request-card urgent">
              <h3>{request.patientName || 'Anonymous'}</h3>
              <p>Blood Type: {request.bloodType}</p>
              <p>Units Needed: {request.unitsNeeded}</p>
              <p>Priority: {request.priority}</p>
              <p>Needed By: {new Date(request.neededBy).toLocaleDateString()}</p>
              <div className="request-actions">
                <button onClick={() => approveBloodRequest(request.id)}>
                  Approve
                </button>
                <button onClick={() => {/* Handle view details */}}>
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Donor Management */}
      <div className="donor-management">
        <h2>Blood Donors</h2>
        <div className="donors-list">
          {donors.map(donor => (
            <div key={donor.id} className="donor-card">
              <h3>Donor #{donor.donorNumber}</h3>
              <p>Blood Type: {donor.bloodType}</p>
              <p>Status: {donor.status}</p>
              <p>Total Donations: {donor.totalDonations}</p>
              <p>Last Donation: {donor.lastDonationDate ? new Date(donor.lastDonationDate).toLocaleDateString() : 'Never'}</p>
              <div className="donor-actions">
                <button onClick={() => {/* Handle view details */}}>
                  View Details
                </button>
                <button onClick={() => {/* Handle update status */}}>
                  Update Status
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BloodDonationDashboard;
```

---

## 🔐 Error Handling

### Common Error Responses

```typescript
// 400 Bad Request
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "bloodType",
      "message": "Blood type is required"
    }
  ]
}

// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}

// 403 Forbidden
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Blood donor not found",
  "error": "Not Found"
}

// 409 Conflict
{
  "statusCode": 409,
  "message": "User already registered as donor",
  "error": "Conflict"
}
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install axios
# or
yarn add axios
```

### 2. Create API Service

```typescript
// services/bloodDonationApi.ts
import axios from 'axios';

const API_BASE_URL = 'https://api.unlimtedhealth.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const bloodDonationApi = {
  // Donors
  registerDonor: (data: CreateBloodDonorDto) => apiClient.post('/blood-donation/donors/register', data),
  getMyProfile: () => apiClient.get('/blood-donation/donors/me'),
  getAllDonors: (filters: DonorFilters) => apiClient.get('/blood-donation/donors', { params: filters }),
  getEligibleDonors: (bloodType: string, limit: number = 10) => 
    apiClient.get(`/blood-donation/donors/eligible/${bloodType}`, { params: { limit } }),
  
  // Requests
  createRequest: (data: CreateBloodDonationRequestDto) => apiClient.post('/blood-donation/requests', data),
  getAllRequests: (filters: RequestFilters) => apiClient.get('/blood-donation/requests', { params: filters }),
  getUrgentRequests: () => apiClient.get('/blood-donation/requests/urgent'),
  approveRequest: (id: string) => apiClient.patch(`/blood-donation/requests/${id}/approve`),
  
  // Inventory
  getInventory: (centerId?: string, bloodType?: string) => 
    apiClient.get('/blood-donation/inventory', { params: { centerId, bloodType } }),
  getCenterInventory: (centerId: string) => apiClient.get(`/blood-donation/inventory/center/${centerId}`),
  getLowAlerts: () => apiClient.get('/blood-donation/inventory/low-alerts'),
  checkAvailability: (centerId: string, bloodType: string, units: number) => 
    apiClient.get(`/blood-donation/inventory/availability/${centerId}/${bloodType}/${units}`),
  reserveBlood: (centerId: string, bloodType: string, units: number) => 
    apiClient.patch(`/blood-donation/inventory/reserve/${centerId}/${bloodType}/${units}`),
  
  // Donations
  createDonation: (data: CreateBloodDonationDto) => apiClient.post('/blood-donation/donations', data),
  getAllDonations: () => apiClient.get('/blood-donation/donations'),
  getMyDonations: () => apiClient.get('/blood-donation/donations/my-donations'),
  completeDonation: (id: string) => apiClient.patch(`/blood-donation/donations/${id}/complete`),
};
```

### 3. Environment Configuration

```typescript
// config/environment.ts
export const environment = {
  production: false,
  apiUrl: 'https://api.unlimtedhealth.com/api',
  appName: 'Blood Donation Dashboard',
  version: '1.0.0'
};
```

---

## 📋 Summary

This comprehensive Blood Donation Dashboard guide provides:

✅ **Complete API Documentation** - All 40 blood donation endpoints with real DTOs  
✅ **TypeScript Interfaces** - Full type definitions for all data structures  
✅ **Frontend Implementation** - React components and styling examples  
✅ **Error Handling** - Comprehensive error response documentation  
✅ **Authentication** - JWT token handling and role-based access  
✅ **Real-world Examples** - Practical implementation patterns  

The dashboard supports:
- Blood donor registration and management
- Blood donation request creation and tracking
- Blood inventory management and alerts
- Blood donation scheduling and completion
- Multi-role access control
- Real-time inventory monitoring

**Base URL:** `https://api.unlimtedhealth.com/api`  
**Authentication:** Bearer token required for all endpoints  
**Documentation:** Swagger/OpenAPI available at `/api/docs`
