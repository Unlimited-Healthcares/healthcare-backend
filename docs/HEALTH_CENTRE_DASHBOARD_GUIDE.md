# 🏥 Health Centre Dashboard - Frontend Implementation Guide

## 📋 Overview

This guide provides comprehensive information for building a **Health Centre Dashboard** that allows patients to:
- Browse and search healthcare centers
- View center details, services, and staff
- Check availability and book appointments
- Manage their appointments

**Base URL:** `https://api.unlimtedhealth.com/api`

---

## 🎯 Frontend Dashboard Overview

### Main Dashboard Sections

1. **Center Discovery**
   - Center listing with filters (type, location, services)
   - Search functionality
   - Map view integration
   - Center type categories

2. **Center Details**
   - Center information and contact details
   - Available services and pricing
   - Staff/medical practitioners
   - Operating hours and availability

3. **Service Booking (Type-Specific)**
   - **Medical Centers**: Traditional appointment booking
   - **Emergency Services**: Immediate contact/request
   - **Support Services**: Consultation requests
   - **Specialized Services**: Custom booking flows

4. **Service Management**
   - View upcoming appointments/requests
   - Reschedule/cancel services
   - Service history and status tracking

---

## 🔍 Center Discovery Endpoints

### 1. Get All Centers (Admin Only)
**Endpoint:** `GET /centers`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`

**Query Parameters:**
```typescript
// No query parameters - returns all centers for admin
```

**Example Request:**
```typescript
const getAllCenters = async () => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/centers', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

**Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "displayId": "HSP123456789",
    "name": "City General Hospital",
    "type": "hospital",
    "address": "123 Medical Drive, City, State 12345",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "city": "New York",
    "state": "NY",
    "country": "United States",
    "postalCode": "10001",
    "phone": "123-456-7890",
    "email": "info@hospital.com",
    "hours": "9:00 AM - 5:00 PM",
    "imageUrl": "https://example.com/image.jpg",
    "locationMetadata": {
      "timezone": "America/New_York",
      "elevation": 10.5,
      "accuracy": 5.0
    },
    "isActive": true,
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
]
```

### 2. Get Centers by Type
**Endpoint:** `GET /centers/types/:type`  
**Authentication:** Required (Bearer token)

**Available Types (from CenterType enum):**
- `hospital` - General hospitals
- `pharmacy` - Pharmacies
- `clinic` - Medical clinics
- `laboratory` - Diagnostic laboratories
- `radiology` - Radiology centers
- `dental` - Dental clinics
- `eye` - Eye clinics
- `maternity` - Maternity centers
- `ambulance` - Ambulance services
- `virology` - Virology centers
- `psychiatric` - Psychiatric centers
- `care-home` - Care homes
- `hospice` - Hospice centers
- `funeral` - Funeral services

**Example Request:**
```typescript
const getCentersByType = async (type: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/centers/types/${type}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

**Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "displayId": "HSP123456789",
    "name": "City General Hospital",
    "type": "hospital",
    "address": "123 Medical Drive, City, State 12345"
  }
]
```

### 3. Get Center Types
**Endpoint:** `GET /centers/types`  
**Authentication:** Required (Bearer token)

**Response (200 OK):**
```json
[
  { "value": "hospital", "label": "Hospital" },
  { "value": "pharmacy", "label": "Pharmacy" },
  { "value": "clinic", "label": "Clinic" },
  { "value": "laboratory", "label": "Laboratory" },
  { "value": "radiology", "label": "Radiology" },
  { "value": "dental", "label": "Dental" },
  { "value": "eye", "label": "Eye Clinic" },
  { "value": "maternity", "label": "Maternity Center" },
  { "value": "ambulance", "label": "Ambulance Service" },
  { "value": "virology", "label": "Virology Center" },
  { "value": "psychiatric", "label": "Psychiatric Center" },
  { "value": "care-home", "label": "Care Home" },
  { "value": "hospice", "label": "Hospice" },
  { "value": "funeral", "label": "Funeral Service" }
]
```

### 4. Get Specific Center Type Endpoints
**Available Direct Endpoints:**
- `GET /centers/eye-clinics` - Get all eye clinics
- `GET /centers/maternity` - Get all maternity centers
- `GET /centers/virology` - Get all virology centers
- `GET /centers/psychiatric` - Get all psychiatric centers
- `GET /centers/care-homes` - Get all care homes
- `GET /centers/hospice` - Get all hospice centers
- `GET /centers/funeral` - Get all funeral services
- `GET /centers/hospital` - Get all hospital centers

**Example Request:**
```typescript
const getHospitals = async () => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/centers/hospital', {
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

## 🏥 Center Details Endpoints

### 1. Get Center by ID
**Endpoint:** `GET /centers/:id`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `center`, `doctor`, `staff`

**Example Request:**
```typescript
const getCenterDetails = async (centerId: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/centers/${centerId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "displayId": "HSP123456789",
  "name": "City General Hospital",
  "type": "hospital",
  "address": "123 Medical Drive, City, State 12345",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "city": "New York",
  "state": "NY",
  "country": "United States",
  "postalCode": "10001",
  "phone": "123-456-7890",
  "email": "info@hospital.com",
  "hours": "9:00 AM - 5:00 PM",
  "imageUrl": "https://example.com/image.jpg",
  "locationMetadata": {
    "timezone": "America/New_York",
    "elevation": 10.5,
    "accuracy": 5.0
  },
  "isActive": true,
  "createdAt": "2023-01-01T00:00:00Z",
  "updatedAt": "2023-01-01T00:00:00Z"
}
```

### 2. Get Centers by User ID
**Endpoint:** `GET /centers/user/:userId`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `center`

**Example Request:**
```typescript
const getCentersByUser = async (userId: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/centers/user/${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 3. Get Center Services
**Endpoint:** `GET /centers/:id/services`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `center`, `doctor`, `staff`, `patient`

**Example Request:**
```typescript
const getCenterServices = async (centerId: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/centers/${centerId}/services`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

**Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "centerId": "550e8400-e29b-41d4-a716-446655440000",
    "serviceName": "General Consultation",
    "serviceCategory": "consultation",
    "description": "General medical consultation with a doctor",
    "durationMinutes": 30,
    "basePrice": 150.00,
    "isEmergencyService": false,
    "requiresAppointment": true,
    "isActive": true,
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "centerId": "550e8400-e29b-41d4-a716-446655440000",
    "serviceName": "Emergency Care",
    "serviceCategory": "emergency",
    "description": "24/7 emergency medical care",
    "durationMinutes": 60,
    "basePrice": 300.00,
    "isEmergencyService": true,
    "requiresAppointment": false,
    "isActive": true,
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
]
```

### 4. Get Service by ID
**Endpoint:** `GET /centers/services/:id`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `center`, `doctor`, `staff`, `patient`

**Example Request:**
```typescript
const getServiceById = async (serviceId: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/centers/services/${serviceId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 5. Create Center Service
**Endpoint:** `POST /centers/:id/services`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `center`

**Request Body (CreateCenterServiceDto):**
```typescript
interface CreateCenterServiceDto {
  centerId: string;                    // UUID - Center ID
  serviceName: string;                 // Service name
  serviceCategory?: string;            // Optional - Service category
  description?: string;                // Optional - Service description
  durationMinutes?: number;            // Optional - Duration in minutes
  basePrice?: number;                  // Optional - Base price
  isEmergencyService?: boolean;        // Optional - Is emergency service
  requiresAppointment?: boolean;       // Optional - Requires appointment
}
```

**Example Request:**
```typescript
const createCenterService = async (centerId: string, serviceData: CreateCenterServiceDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/centers/${centerId}/services`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      centerId,
      serviceName: "General Consultation",
      serviceCategory: "consultation",
      description: "General medical consultation with a doctor",
      durationMinutes: 30,
      basePrice: 150.00,
      isEmergencyService: false,
      requiresAppointment: true
    })
  });
  
  return await response.json();
};
```

### 6. Get Center Staff
**Endpoint:** `GET /centers/:id/staff`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `center`

**Example Request:**
```typescript
const getCenterStaff = async (centerId: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/centers/${centerId}/staff`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

**Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "userId": "550e8400-e29b-41d4-a716-446655440004",
    "centerId": "550e8400-e29b-41d4-a716-446655440000",
    "role": "doctor",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440004",
      "email": "dr.smith@hospital.com",
      "profile": {
        "firstName": "Dr. John",
        "lastName": "Smith",
        "displayName": "Dr. John Smith",
        "specialization": "Cardiology",
        "licenseNumber": "MD123456",
        "experience": "10 years"
      }
    },
    "createdAt": "2023-01-01T00:00:00Z"
  }
]
```

### 7. Add Staff Member to Center
**Endpoint:** `POST /centers/:id/staff`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `center`

**Request Body:**
```typescript
interface AddStaffDto {
  userId: string;    // UUID - User ID to add as staff
  role: string;      // Role (doctor, nurse, staff, etc.)
}
```

**Example Request:**
```typescript
const addStaffMember = async (centerId: string, staffData: AddStaffDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/centers/${centerId}/staff`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: "550e8400-e29b-41d4-a716-446655440004",
      role: "doctor"
    })
  });
  
  return await response.json();
};
```

### 8. Remove Staff Member from Center
**Endpoint:** `DELETE /centers/:id/staff/:staffId`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `center`

**Example Request:**
```typescript
const removeStaffMember = async (centerId: string, staffId: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/centers/${centerId}/staff/${staffId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

---

## 🏥 Center Type-Specific Service Models

### Different Service Types by Center Category

#### 1. **Medical Centers** (Hospital, Clinic, Dental, Eye, Maternity)
- **Service Model**: Traditional appointment booking
- **Booking Flow**: Service → Provider → Time Slot → Confirmation
- **Examples**: Consultations, treatments, checkups, procedures

#### 2. **Emergency Services** (Ambulance, Emergency Care)
- **Service Model**: Immediate response/request
- **Booking Flow**: Emergency request → Immediate dispatch
- **Examples**: Emergency transport, urgent care, crisis intervention

#### 3. **Support Services** (Hospice, Care Home, Psychiatric)
- **Service Model**: Consultation and ongoing care
- **Booking Flow**: Initial consultation → Care planning → Ongoing support
- **Examples**: Care assessments, family consultations, ongoing support

#### 4. **Specialized Services** (Funeral, Laboratory, Radiology)
- **Service Model**: Service-specific booking
- **Booking Flow**: Service selection → Custom requirements → Scheduling
- **Examples**: Funeral arrangements, diagnostic tests, imaging services

---

## 📅 Service Booking Endpoints (Type-Specific)

### 1. Get Available Time Slots
**Endpoint:** `GET /appointments/slots/provider/:providerId`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `doctor`, `staff`, `patient`, `center`

**Query Parameters:**
```typescript
{
  date: string;           // Required - Date in YYYY-MM-DD format
}
```

**Example Request:**
```typescript
const getAvailableSlots = async (providerId: string, date: string) => {
  const token = localStorage.getItem('access_token');
  const queryParams = new URLSearchParams();
  
  queryParams.append('date', date);
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/appointments/slots/provider/${providerId}?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

**Response (200 OK):**
```json
{
  "date": "2024-01-15",
  "providerId": "550e8400-e29b-41d4-a716-446655440004",
  "slots": [
    {
      "time": "09:00",
      "available": true,
      "duration": 30,
      "serviceId": "550e8400-e29b-41d4-a716-446655440001"
    },
    {
      "time": "09:30",
      "available": true,
      "duration": 30,
      "serviceId": "550e8400-e29b-41d4-a716-446655440001"
    },
    {
      "time": "10:00",
      "available": false,
      "duration": 30,
      "serviceId": "550e8400-e29b-41d4-a716-446655440001"
    }
  ]
}
```

### 2. Create Appointment
**Endpoint:** `POST /appointments`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `doctor`, `staff`, `patient`, `center`

**Request Body (CreateAppointmentDto):**
```typescript
interface CreateAppointmentDto {
  patientId: string;                    // Required: UUID - Patient ID
  centerId: string;                     // Required: UUID - Center ID
  providerId?: string;                  // Optional: UUID - Provider ID
  appointmentTypeId?: string;           // Optional: UUID - Appointment type ID
  appointmentDate: string;              // Required: ISO date string - Date and time
  durationMinutes?: number;             // Optional: Duration in minutes (default: 30)
  priority?: 'low' | 'normal' | 'high' | 'urgent';  // Optional: Priority level
  reason: string;                       // Required: Reason for appointment
  notes?: string;                       // Optional: Additional notes
  doctor: string;                       // Required: Doctor name
  isRecurring?: boolean;                // Optional: Is recurring appointment (default: false)
  recurrencePattern?: {                 // Optional: Recurrence pattern for recurring appointments
    frequency?: string;
    interval?: number;
    count?: number;
    endDate?: string;
    daysOfWeek?: string[];
    dayOfMonth?: number;
    occurrences?: number;
  };
}
```

**Example Request:**
```typescript
const createAppointment = async (appointmentData: CreateAppointmentDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/appointments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      patientId: '550e8400-e29b-41d4-a716-446655440005',
      centerId: '550e8400-e29b-41d4-a716-446655440000',
      providerId: '550e8400-e29b-41d4-a716-446655440004',
      appointmentDate: '2024-01-15T09:00:00Z',
      durationMinutes: 30,
      priority: 'normal',
      reason: 'Regular checkup',
      notes: 'Annual health checkup',
      doctor: 'Dr. John Smith',
      isRecurring: false
    })
  });
  
  return await response.json();
};
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440006",
  "patientId": "550e8400-e29b-41d4-a716-446655440005",
  "centerId": "550e8400-e29b-41d4-a716-446655440000",
  "providerId": "550e8400-e29b-41d4-a716-446655440004",
  "appointmentTypeId": null,
  "appointmentDate": "2024-01-15T09:00:00Z",
  "durationMinutes": 30,
  "appointmentStatus": "scheduled",
  "status": "pending",
  "priority": "normal",
  "reason": "Regular checkup",
  "notes": "Annual health checkup",
  "doctor": "Dr. John Smith",
  "isRecurring": false,
  "recurrencePattern": null,
  "parentAppointmentId": null,
  "confirmationStatus": "pending",
  "confirmedAt": null,
  "reminderSentAt": null,
  "cancellationReason": null,
  "cancelledBy": null,
  "cancelledAt": null,
  "rescheduledFrom": null,
  "metadata": null,
  "createdAt": "2023-01-01T00:00:00Z",
  "updatedAt": "2023-01-01T00:00:00Z"
}
```

### 3. Get User Appointments
**Endpoint:** `GET /appointments`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `doctor`, `staff`, `patient`, `center`

**Query Parameters:**
```typescript
{
  page?: number;          // Pagination page (default: 1)
  limit?: number;         // Items per page (default: 10)
  centerId?: string;      // Filter by center ID (UUID)
  providerId?: string;    // Filter by provider ID (UUID)
  patientId?: string;     // Filter by patient ID (UUID)
  status?: string;        // Filter by status
  dateFrom?: string;      // Filter from date (YYYY-MM-DD)
  dateTo?: string;        // Filter to date (YYYY-MM-DD)
}
```

**Example Request:**
```typescript
const getUserAppointments = async (filters: {
  page?: number;
  limit?: number;
  centerId?: string;
  providerId?: string;
  patientId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}) => {
  const token = localStorage.getItem('access_token');
  const queryParams = new URLSearchParams();
  
  if (filters.page) queryParams.append('page', filters.page.toString());
  if (filters.limit) queryParams.append('limit', filters.limit.toString());
  if (filters.centerId) queryParams.append('centerId', filters.centerId);
  if (filters.providerId) queryParams.append('providerId', filters.providerId);
  if (filters.patientId) queryParams.append('patientId', filters.patientId);
  if (filters.status) queryParams.append('status', filters.status);
  if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/appointments?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440006",
      "patientId": "550e8400-e29b-41d4-a716-446655440005",
      "centerId": "550e8400-e29b-41d4-a716-446655440000",
      "providerId": "550e8400-e29b-41d4-a716-446655440004",
      "appointmentDate": "2024-01-15T09:00:00Z",
      "durationMinutes": 30,
      "appointmentStatus": "scheduled",
      "status": "pending",
      "priority": "normal",
      "reason": "Regular checkup",
      "notes": "Annual health checkup",
      "doctor": "Dr. John Smith",
      "isRecurring": false,
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### 4. Update Appointment
**Endpoint:** `PATCH /appointments/:id`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `doctor`, `staff`, `patient`, `center`

**Request Body (UpdateAppointmentDto):**
```typescript
interface UpdateAppointmentDto {
  // All fields from CreateAppointmentDto are optional
  patientId?: string;
  centerId?: string;
  providerId?: string;
  appointmentTypeId?: string;
  appointmentDate?: string;              // ISO date string
  durationMinutes?: number;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  reason?: string;
  notes?: string;
  doctor?: string;
  isRecurring?: boolean;
  recurrencePattern?: {
    frequency?: string;
    interval?: number;
    count?: number;
    endDate?: string;
    daysOfWeek?: string[];
    dayOfMonth?: number;
    occurrences?: number;
  };
  
  // Additional update-specific fields
  appointmentStatus?: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  confirmationStatus?: 'pending' | 'confirmed' | 'declined';
  cancellationReason?: string;
  confirmedAt?: string;                  // ISO date string
  metadata?: Record<string, unknown>;    // Additional metadata
}
```

**Example Request:**
```typescript
const updateAppointment = async (appointmentId: string, updateData: UpdateAppointmentDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/appointments/${appointmentId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      appointmentDate: '2024-01-16T10:00:00Z',
      durationMinutes: 45,
      priority: 'high',
      notes: 'Updated appointment notes',
      metadata: {
        preparation: "Patient should fast for 8 hours before the appointment",
        reminderPreferences: {
          emailEnabled: true,
          smsEnabled: false
        }
      }
    })
  });
  
  return await response.json();
};
```

### 5. Confirm Appointment
**Endpoint:** `PATCH /appointments/:id/confirm`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `doctor`, `staff`, `patient`, `center`

**Example Request:**
```typescript
const confirmAppointment = async (appointmentId: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/appointments/${appointmentId}/confirm`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 6. Cancel Appointment
**Endpoint:** `PATCH /appointments/:id/cancel`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `doctor`, `staff`, `patient`, `center`

**Request Body:**
```typescript
interface CancelAppointmentDto {
  reason: string;        // Required: Reason for cancellation
  cancelledBy: string;   // Required: ID of user cancelling
}
```

**Example Request:**
```typescript
const cancelAppointment = async (appointmentId: string, reason: string, cancelledBy: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/appointments/${appointmentId}/cancel`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reason: reason,
      cancelledBy: cancelledBy
    })
  });
  
  return await response.json();
};
```

### 7. Complete Appointment
**Endpoint:** `PATCH /appointments/:id/complete`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `doctor`, `staff`, `center`

**Request Body:**
```typescript
interface CompleteAppointmentDto {
  notes?: string;                        // Optional: Completion notes
  metadata?: Record<string, unknown>;    // Optional: Additional metadata
}
```

**Example Request:**
```typescript
const completeAppointment = async (appointmentId: string, completionData: CompleteAppointmentDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/appointments/${appointmentId}/complete`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      notes: "Appointment completed successfully. Patient is in good health.",
      metadata: {
        diagnosis: "Healthy",
        recommendations: "Continue regular exercise",
        followUpRequired: false
      }
    })
  });
  
  return await response.json();
};
```

### 8. Delete Appointment
**Endpoint:** `DELETE /appointments/:id`  
**Authentication:** Required (Bearer token)  
**Roles:** `admin`, `doctor`, `staff`, `patient`, `center`

**Example Request:**
```typescript
const deleteAppointment = async (appointmentId: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/appointments/${appointmentId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

---

## 🏥 Center Type-Specific Implementation Guide

### 1. **Funeral Services** 🕊️

#### Service Model
- **Primary Function**: Funeral arrangements and memorial services
- **Booking Type**: Consultation-based, not traditional appointments
- **Urgency Level**: High (usually immediate need)

#### Services Offered
```typescript
interface FuneralServices {
  // Immediate Services
  immediateArrangements: {
    name: "Immediate Funeral Arrangements";
    description: "Urgent funeral planning and coordination";
    requiresAppointment: false;
    isEmergencyService: true;
    serviceCategory: "immediate";
  };
  
  // Planning Services
  prePlanning: {
    name: "Pre-Planning Consultation";
    description: "Advance funeral planning and documentation";
    requiresAppointment: true;
    serviceCategory: "consultation";
  };
  
  // Memorial Services
  memorialServices: {
    name: "Memorial Service Coordination";
    description: "Memorial service planning and execution";
    requiresAppointment: true;
    serviceCategory: "coordination";
  };
}
```

#### Frontend Implementation
```typescript
// Funeral Service Booking Flow
const FuneralServiceBooking = () => {
  return (
    <div className="funeral-booking">
      <h2>Funeral Service Request</h2>
      
      {/* Immediate Need Toggle */}
      <div className="urgency-section">
        <label>
          <input type="checkbox" />
          This is an immediate need (within 24 hours)
        </label>
      </div>
      
      {/* Service Type Selection */}
      <div className="service-selection">
        <button onClick={() => setServiceType('immediate')}>
          Immediate Arrangements
        </button>
        <button onClick={() => setServiceType('preplanning')}>
          Pre-Planning Consultation
        </button>
        <button onClick={() => setServiceType('memorial')}>
          Memorial Service
        </button>
      </div>
      
      {/* Custom Form Fields */}
      <div className="funeral-details">
        <input placeholder="Deceased Name" />
        <input placeholder="Relationship to Deceased" />
        <textarea placeholder="Special Requests or Requirements" />
        <input type="date" placeholder="Preferred Service Date" />
      </div>
      
      {/* Contact Information */}
      <div className="contact-info">
        <input placeholder="Your Name" />
        <input placeholder="Phone Number" />
        <input placeholder="Email" />
      </div>
    </div>
  );
};
```

### 2. **Hospice Services** 🏠

#### Service Model
- **Primary Function**: End-of-life care and family support
- **Booking Type**: Care consultation and ongoing support
- **Urgency Level**: Medium-High (time-sensitive care needs)

#### Services Offered
```typescript
interface HospiceServices {
  // Care Services
  careAssessment: {
    name: "Care Needs Assessment";
    description: "Evaluation of patient care requirements";
    requiresAppointment: true;
    serviceCategory: "assessment";
  };
  
  // Family Support
  familyConsultation: {
    name: "Family Support Consultation";
    description: "Counseling and support for family members";
    requiresAppointment: true;
    serviceCategory: "support";
  };
  
  // Ongoing Care
  ongoingCare: {
    name: "Ongoing Care Planning";
    description: "Regular care plan updates and coordination";
    requiresAppointment: true;
    serviceCategory: "care-planning";
  };
}
```

#### Frontend Implementation
```typescript
// Hospice Service Booking Flow
const HospiceServiceBooking = () => {
  return (
    <div className="hospice-booking">
      <h2>Hospice Care Request</h2>
      
      {/* Patient Information */}
      <div className="patient-info">
        <h3>Patient Information</h3>
        <input placeholder="Patient Name" />
        <input placeholder="Age" type="number" />
        <select>
          <option>Primary Diagnosis</option>
          <option>Cancer</option>
          <option>Heart Disease</option>
          <option>Dementia</option>
          <option>Other</option>
        </select>
      </div>
      
      {/* Care Level Selection */}
      <div className="care-level">
        <h3>Care Level Needed</h3>
        <label>
          <input type="radio" name="careLevel" value="assessment" />
          Initial Assessment Only
        </label>
        <label>
          <input type="radio" name="careLevel" value="ongoing" />
          Ongoing Care Services
        </label>
        <label>
          <input type="radio" name="careLevel" value="family" />
          Family Support Services
        </label>
      </div>
      
      {/* Special Requirements */}
      <div className="special-requirements">
        <h3>Special Requirements</h3>
        <textarea placeholder="Any special care needs, equipment requirements, or preferences" />
      </div>
    </div>
  );
};
```

### 3. **Care Home Services** 🏘️

#### Service Model
- **Primary Function**: Long-term care and residential services
- **Booking Type**: Assessment and placement consultation
- **Urgency Level**: Medium (planning ahead)

#### Services Offered
```typescript
interface CareHomeServices {
  // Assessment Services
  careAssessment: {
    name: "Care Needs Assessment";
    description: "Evaluation for residential care suitability";
    requiresAppointment: true;
    serviceCategory: "assessment";
  };
  
  // Placement Services
  placementConsultation: {
    name: "Placement Consultation";
    description: "Discussion of care options and placement";
    requiresAppointment: true;
    serviceCategory: "consultation";
  };
  
  // Family Support
  familySupport: {
    name: "Family Support Services";
    description: "Support for families during transition";
    requiresAppointment: true;
    serviceCategory: "support";
  };
}
```

### 4. **Ambulance Services** 🚑

#### Service Model
- **Primary Function**: Emergency medical transport
- **Booking Type**: Emergency request (immediate dispatch)
- **Urgency Level**: Critical (immediate response)

#### Services Offered
```typescript
interface AmbulanceServices {
  // Emergency Services
  emergencyTransport: {
    name: "Emergency Medical Transport";
    description: "Immediate emergency medical transport";
    requiresAppointment: false;
    isEmergencyService: true;
    serviceCategory: "emergency";
  };
  
  // Non-Emergency Transport
  nonEmergencyTransport: {
    name: "Non-Emergency Medical Transport";
    description: "Scheduled medical transport for appointments";
    requiresAppointment: true;
    serviceCategory: "transport";
  };
  
  // Inter-Facility Transfer
  facilityTransfer: {
    name: "Inter-Facility Transfer";
    description: "Transfer between medical facilities";
    requiresAppointment: true;
    serviceCategory: "transfer";
  };
}
```

#### Frontend Implementation
```typescript
// Ambulance Service Request Flow
const AmbulanceServiceRequest = () => {
  return (
    <div className="ambulance-request">
      <h2>Ambulance Service Request</h2>
      
      {/* Emergency Level */}
      <div className="emergency-level">
        <h3>Service Type</h3>
        <button className="emergency-btn" onClick={() => setServiceType('emergency')}>
          🚨 EMERGENCY - Call Now
        </button>
        <button onClick={() => setServiceType('non-emergency')}>
          Non-Emergency Transport
        </button>
        <button onClick={() => setServiceType('transfer')}>
          Facility Transfer
        </button>
      </div>
      
      {/* Patient Information */}
      <div className="patient-info">
        <input placeholder="Patient Name" />
        <input placeholder="Age" type="number" />
        <textarea placeholder="Medical Condition/Reason for Transport" />
      </div>
      
      {/* Location Information */}
      <div className="location-info">
        <input placeholder="Pickup Address" />
        <input placeholder="Destination (if known)" />
      </div>
      
      {/* Contact Information */}
      <div className="contact-info">
        <input placeholder="Your Name" />
        <input placeholder="Phone Number" />
        <input placeholder="Relationship to Patient" />
      </div>
    </div>
  );
};
```

### 5. **Laboratory Services** 🧪

#### Service Model
- **Primary Function**: Diagnostic testing and analysis
- **Booking Type**: Test scheduling and sample collection
- **Urgency Level**: Low-Medium (scheduled testing)

#### Services Offered
```typescript
interface LaboratoryServices {
  // Diagnostic Tests
  bloodTests: {
    name: "Blood Tests";
    description: "Various blood work and analysis";
    requiresAppointment: true;
    serviceCategory: "diagnostic";
  };
  
  // Imaging Services
  imagingTests: {
    name: "Imaging Tests";
    description: "X-rays, CT scans, MRI, etc.";
    requiresAppointment: true;
    serviceCategory: "imaging";
  };
  
  // Specialized Tests
  specializedTests: {
    name: "Specialized Tests";
    description: "Genetic testing, specialized diagnostics";
    requiresAppointment: true;
    serviceCategory: "specialized";
  };
}
```

### 6. **Pharmacy Services** 💊

#### Service Model
- **Primary Function**: Medication dispensing and consultation
- **Booking Type**: Walk-in or consultation booking
- **Urgency Level**: Low (routine medication needs)

#### Services Offered
```typescript
interface PharmacyServices {
  // Prescription Services
  prescriptionFilling: {
    name: "Prescription Filling";
    description: "Medication dispensing and pickup";
    requiresAppointment: false;
    serviceCategory: "prescription";
  };
  
  // Consultation Services
  medicationConsultation: {
    name: "Medication Consultation";
    description: "Pharmacist consultation and advice";
    requiresAppointment: true;
    serviceCategory: "consultation";
  };
  
  // Health Services
  healthScreening: {
    name: "Health Screening";
    description: "Blood pressure, glucose, cholesterol checks";
    requiresAppointment: true;
    serviceCategory: "screening";
  };
}
```

---

## 🎨 Frontend UI/UX Recommendations

### 1. Center Discovery Page
```typescript
// Center Discovery Component Structure
interface CenterDiscoveryProps {
  filters: CenterFilters;
  onFilterChange: (filters: CenterFilters) => void;
  centers: Center[];
  loading: boolean;
}

// Recommended Layout:
// - Search bar at top
// - Filter sidebar (type, location, services)
// - Center cards in grid/list view
// - Map view toggle
// - Pagination at bottom
```

### 2. Center Details Page
```typescript
// Center Details Component Structure
interface CenterDetailsProps {
  center: Center;
  services: CenterService[];
  staff: CenterStaff[];
  availability: CenterAvailability[];
}

// Recommended Layout:
// - Hero section with center image and basic info
// - Tabs: Overview, Services, Staff, Reviews
// - Contact information and map
// - Book appointment CTA button
```

### 3. Service Booking Flows (Type-Specific)

#### Medical Centers (Traditional Appointment Booking)
```typescript
// Traditional Appointment Flow Steps:
// 1. Service Selection
// 2. Provider Selection (if multiple available)
// 3. Date/Time Selection
// 4. Appointment Details Form
// 5. Confirmation

interface MedicalBookingFlowProps {
  center: Center;
  services: CenterService[];
  staff: CenterStaff[];
  onBookingComplete: (appointment: Appointment) => void;
}
```

#### Emergency Services (Immediate Request)
```typescript
// Emergency Service Flow Steps:
// 1. Emergency Level Selection
// 2. Patient Information
// 3. Location Details
// 4. Contact Information
// 5. Immediate Dispatch

interface EmergencyServiceFlowProps {
  center: Center;
  services: CenterService[];
  onRequestComplete: (request: EmergencyRequest) => void;
}
```

#### Support Services (Consultation Request)
```typescript
// Support Service Flow Steps:
// 1. Service Type Selection
// 2. Patient/Care Information
// 3. Special Requirements
// 4. Preferred Contact Method
// 5. Consultation Scheduling

interface SupportServiceFlowProps {
  center: Center;
  services: CenterService[];
  onRequestComplete: (request: ConsultationRequest) => void;
}
```

#### Specialized Services (Custom Booking)
```typescript
// Specialized Service Flow Steps:
// 1. Service Selection
// 2. Custom Requirements
// 3. Scheduling Preferences
// 4. Additional Information
// 5. Service Confirmation

interface SpecializedServiceFlowProps {
  center: Center;
  services: CenterService[];
  onBookingComplete: (service: SpecializedService) => void;
}
```

### 4. Appointment Management Dashboard
```typescript
// Appointment Dashboard Component
interface AppointmentDashboardProps {
  appointments: Appointment[];
  upcomingAppointments: Appointment[];
  pastAppointments: Appointment[];
  onAppointmentAction: (id: string, action: string) => void;
}

// Recommended Layout:
// - Upcoming appointments at top
// - Quick actions (reschedule, cancel)
// - Appointment history below
// - Filter and search options
```

---

## 🎯 Frontend Implementation Strategy for Different Center Types

### Service Type Detection and Routing

```typescript
// Service Type Detection
const getServiceType = (center: Center): ServiceType => {
  switch (center.type) {
    case 'hospital':
    case 'clinic':
    case 'dental':
    case 'eye':
    case 'maternity':
      return 'medical';
    
    case 'ambulance':
      return 'emergency';
    
    case 'hospice':
    case 'care-home':
    case 'psychiatric':
      return 'support';
    
    case 'funeral':
    case 'laboratory':
    case 'radiology':
    case 'pharmacy':
      return 'specialized';
    
    default:
      return 'medical';
  }
};

// Service Booking Component Router
const ServiceBookingRouter = ({ center, services }: { center: Center; services: CenterService[] }) => {
  const serviceType = getServiceType(center);
  
  switch (serviceType) {
    case 'medical':
      return <MedicalBookingFlow center={center} services={services} />;
    case 'emergency':
      return <EmergencyServiceFlow center={center} services={services} />;
    case 'support':
      return <SupportServiceFlow center={center} services={services} />;
    case 'specialized':
      return <SpecializedServiceFlow center={center} services={services} />;
    default:
      return <MedicalBookingFlow center={center} services={services} />;
  }
};
```

### Service Category Handling

```typescript
// Service Category Classification
interface ServiceCategory {
  category: string;
  requiresAppointment: boolean;
  isEmergencyService: boolean;
  bookingFlow: 'appointment' | 'request' | 'consultation' | 'immediate';
  formFields: string[];
}

const serviceCategories: Record<string, ServiceCategory> = {
  'consultation': {
    category: 'consultation',
    requiresAppointment: true,
    isEmergencyService: false,
    bookingFlow: 'appointment',
    formFields: ['reason', 'notes', 'preferredDate']
  },
  'emergency': {
    category: 'emergency',
    requiresAppointment: false,
    isEmergencyService: true,
    bookingFlow: 'immediate',
    formFields: ['patientInfo', 'location', 'urgency', 'contactInfo']
  },
  'assessment': {
    category: 'assessment',
    requiresAppointment: true,
    isEmergencyService: false,
    bookingFlow: 'consultation',
    formFields: ['patientInfo', 'careNeeds', 'specialRequirements']
  },
  'immediate': {
    category: 'immediate',
    requiresAppointment: false,
    isEmergencyService: true,
    bookingFlow: 'immediate',
    formFields: ['deceasedInfo', 'specialRequests', 'contactInfo']
  },
  'prescription': {
    category: 'prescription',
    requiresAppointment: false,
    isEmergencyService: false,
    bookingFlow: 'request',
    formFields: ['prescriptionInfo', 'pickupTime']
  }
};
```

### Dynamic Form Generation

```typescript
// Dynamic Form Generator based on Service Category
const generateFormFields = (service: CenterService) => {
  const category = serviceCategories[service.serviceCategory] || serviceCategories['consultation'];
  
  return (
    <div className="service-booking-form">
      <h3>{service.serviceName}</h3>
      <p>{service.description}</p>
      
      {/* Dynamic form fields based on service category */}
      {category.formFields.map(field => (
        <FormField key={field} field={field} service={service} />
      ))}
      
      {/* Emergency services get immediate action button */}
      {category.isEmergencyService && (
        <button className="emergency-action">
          🚨 {category.bookingFlow === 'immediate' ? 'Request Now' : 'Call Immediately'}
        </button>
      )}
      
      {/* Non-emergency services get standard booking */}
      {!category.isEmergencyService && (
        <button className="standard-booking">
          {category.requiresAppointment ? 'Book Appointment' : 'Request Service'}
        </button>
      )}
    </div>
  );
};
```

### Center Type-Specific UI Components

```typescript
// Center Type-Specific Service Display
const CenterServiceDisplay = ({ center, services }: { center: Center; services: CenterService[] }) => {
  const serviceType = getServiceType(center);
  
  return (
    <div className={`services-${serviceType}`}>
      <h2>Available Services</h2>
      
      {services.map(service => (
        <div key={service.id} className={`service-card ${service.serviceCategory}`}>
          <h3>{service.serviceName}</h3>
          <p>{service.description}</p>
          
          {/* Service-specific information */}
          {service.basePrice && (
            <div className="price">${service.basePrice}</div>
          )}
          
          {service.durationMinutes && (
            <div className="duration">{service.durationMinutes} minutes</div>
          )}
          
          {/* Emergency services get special styling */}
          {service.isEmergencyService && (
            <div className="emergency-badge">🚨 Emergency Service</div>
          )}
          
          {/* Booking action based on service type */}
          <ServiceBookingAction service={service} center={center} />
        </div>
      ))}
    </div>
  );
};
```

---

## 🔧 TypeScript Interfaces

### Core Interfaces (Based on Real DTOs)

```typescript
// Center related interfaces (from HealthcareCenter entity)
interface HealthcareCenter {
  id: string;                           // UUID - Primary key
  displayId: string;                    // Human-readable display ID
  name: string;                         // Center name
  type: string;                         // Center type (from CenterType enum)
  address: string;                      // Full address
  latitude?: number;                    // Latitude coordinate
  longitude?: number;                   // Longitude coordinate
  city?: string;                        // City name
  state?: string;                       // State/Province
  country?: string;                     // Country
  postalCode?: string;                  // Postal/ZIP code
  phone?: string;                       // Phone number
  email?: string;                       // Email address
  hours?: string;                       // Operating hours
  imageUrl?: string;                    // Center image URL
  locationMetadata?: Record<string, unknown>;  // Location metadata (timezone, elevation, etc.)
  isActive: boolean;                    // Whether center is active
  createdAt: string;                    // Creation timestamp
  updatedAt: string;                    // Last update timestamp
}

// Center Service interface (from CenterService entity)
interface CenterService {
  id: string;                           // UUID - Primary key
  centerId: string;                     // UUID - Center ID
  serviceName: string;                  // Service name
  serviceCategory?: string;             // Service category (consultation, diagnostic, etc.)
  description?: string;                 // Service description
  durationMinutes?: number;             // Duration in minutes
  basePrice?: number;                   // Base price
  isEmergencyService: boolean;          // Is emergency service
  requiresAppointment: boolean;         // Requires appointment
  isActive: boolean;                    // Is service active
  createdAt: string;                    // Creation timestamp
  updatedAt: string;                    // Last update timestamp
}

// Center Staff interface (from CenterStaff entity)
interface CenterStaff {
  id: string;                           // UUID - Primary key
  userId: string;                       // UUID - User ID
  centerId: string;                     // UUID - Center ID
  role: string;                         // Staff role (doctor, nurse, staff, etc.)
  user: {
    id: string;                         // UUID - User ID
    email: string;                      // User email
    profile: {
      firstName: string;                // First name
      lastName: string;                 // Last name
      displayName: string;              // Display name
      specialization?: string;          // Medical specialization
      licenseNumber?: string;           // License number
      experience?: string;              // Years of experience
    };
  };
  createdAt: string;                    // Creation timestamp
}

// Appointment interface (from Appointment entity)
interface Appointment {
  id: string;                           // UUID - Primary key
  patientId: string;                    // UUID - Patient ID
  centerId: string;                     // UUID - Center ID
  providerId?: string;                  // UUID - Provider ID
  appointmentTypeId?: string;           // UUID - Appointment type ID
  appointmentDate: string;              // ISO date string - Appointment date/time
  durationMinutes: number;              // Duration in minutes
  appointmentStatus: string;            // Appointment status (scheduled, confirmed, etc.)
  status: string;                       // General status (pending, etc.)
  priority: string;                     // Priority level (low, normal, high, urgent)
  reason: string;                       // Reason for appointment
  notes?: string;                       // Additional notes
  doctor: string;                       // Doctor name
  isRecurring: boolean;                 // Is recurring appointment
  recurrencePattern?: {                 // Recurrence pattern for recurring appointments
    frequency?: string;
    interval?: number;
    count?: number;
    endDate?: string;
    daysOfWeek?: string[];
    dayOfMonth?: number;
    occurrences?: number;
  };
  parentAppointmentId?: string;         // UUID - Parent appointment for recurring series
  confirmationStatus: string;           // Confirmation status (pending, confirmed, declined)
  confirmedAt?: string;                 // ISO date string - Confirmation timestamp
  reminderSentAt?: string;              // ISO date string - Reminder sent timestamp
  cancellationReason?: string;          // Cancellation reason
  cancelledBy?: string;                 // UUID - User who cancelled
  cancelledAt?: string;                 // ISO date string - Cancellation timestamp
  rescheduledFrom?: string;             // UUID - Original appointment if rescheduled
  metadata?: Record<string, unknown>;   // Additional metadata
  createdAt: string;                    // Creation timestamp
  updatedAt: string;                    // Last update timestamp
}

// Time Slot interface
interface TimeSlot {
  time: string;                         // Time in HH:MM format
  available: boolean;                   // Is slot available
  duration: number;                     // Slot duration in minutes
  serviceId?: string;                   // UUID - Associated service ID
}

// Filter interfaces
interface CenterFilters {
  type?: string;                        // Center type filter
  city?: string;                        // City filter
  state?: string;                       // State filter
  search?: string;                      // Search term
  latitude?: number;                    // Latitude for location search
  longitude?: number;                   // Longitude for location search
  radius?: number;                      // Search radius in km
  page?: number;                        // Page number
  limit?: number;                       // Items per page
}

interface AppointmentFilters {
  page?: number;                        // Page number
  limit?: number;                       // Items per page
  centerId?: string;                    // UUID - Center ID filter
  providerId?: string;                  // UUID - Provider ID filter
  patientId?: string;                   // UUID - Patient ID filter
  status?: string;                      // Status filter
  dateFrom?: string;                    // Start date filter (YYYY-MM-DD)
  dateTo?: string;                      // End date filter (YYYY-MM-DD)
}

// DTO Interfaces (for API requests)
interface CreateCenterDto {
  name: string;                         // Center name
  type: string;                         // Center type (from CenterType enum)
  address: string;                      // Center address
  phone?: string;                       // Phone number
  email?: string;                       // Email address
  hours?: string;                       // Operating hours
  imageUrl?: string;                    // Image URL
}

interface CreateCenterServiceDto {
  centerId: string;                     // UUID - Center ID
  serviceName: string;                  // Service name
  serviceCategory?: string;             // Service category
  description?: string;                 // Service description
  durationMinutes?: number;             // Duration in minutes
  basePrice?: number;                   // Base price
  isEmergencyService?: boolean;         // Is emergency service
  requiresAppointment?: boolean;        // Requires appointment
}

interface CreateAppointmentDto {
  patientId: string;                    // UUID - Patient ID
  centerId: string;                     // UUID - Center ID
  providerId?: string;                  // UUID - Provider ID
  appointmentTypeId?: string;           // UUID - Appointment type ID
  appointmentDate: string;              // ISO date string
  durationMinutes?: number;             // Duration in minutes
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  reason: string;                       // Reason for appointment
  notes?: string;                       // Additional notes
  doctor: string;                       // Doctor name
  isRecurring?: boolean;                // Is recurring appointment
  recurrencePattern?: {
    frequency?: string;
    interval?: number;
    count?: number;
    endDate?: string;
    daysOfWeek?: string[];
    dayOfMonth?: number;
    occurrences?: number;
  };
}

interface UpdateAppointmentDto {
  // All CreateAppointmentDto fields are optional
  patientId?: string;
  centerId?: string;
  providerId?: string;
  appointmentTypeId?: string;
  appointmentDate?: string;             // ISO date string
  durationMinutes?: number;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  reason?: string;
  notes?: string;
  doctor?: string;
  isRecurring?: boolean;
  recurrencePattern?: {
    frequency?: string;
    interval?: number;
    count?: number;
    endDate?: string;
    daysOfWeek?: string[];
    dayOfMonth?: number;
    occurrences?: number;
  };
  
  // Additional update-specific fields
  appointmentStatus?: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  confirmationStatus?: 'pending' | 'confirmed' | 'declined';
  cancellationReason?: string;
  confirmedAt?: string;                 // ISO date string
  metadata?: Record<string, unknown>;
}

// Center Type Enum (from CenterType enum)
enum CenterType {
  HOSPITAL = 'hospital',
  PHARMACY = 'pharmacy',
  CLINIC = 'clinic',
  LABORATORY = 'laboratory',
  RADIOLOGY = 'radiology',
  DENTAL = 'dental',
  EYE = 'eye',
  MATERNITY = 'maternity',
  AMBULANCE = 'ambulance',
  VIROLOGY = 'virology',
  PSYCHIATRIC = 'psychiatric',
  CARE_HOME = 'care-home',
  HOSPICE = 'hospice',
  FUNERAL = 'funeral'
}

// Service Type Interfaces
interface ServiceType {
  type: 'medical' | 'emergency' | 'support' | 'specialized';
}

interface EmergencyRequest {
  id: string;
  centerId: string;
  patientName: string;
  patientAge: number;
  medicalCondition: string;
  location: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  contactName: string;
  contactPhone: string;
  relationship: string;
  status: 'pending' | 'dispatched' | 'en-route' | 'completed';
  createdAt: string;
}

interface ConsultationRequest {
  id: string;
  centerId: string;
  serviceType: string;
  patientInfo: {
    name: string;
    age: number;
    condition?: string;
  };
  careNeeds: string;
  specialRequirements?: string;
  preferredContactMethod: 'phone' | 'email' | 'in-person';
  status: 'pending' | 'scheduled' | 'completed';
  createdAt: string;
}

interface SpecializedService {
  id: string;
  centerId: string;
  serviceName: string;
  customRequirements: string;
  schedulingPreferences: string;
  additionalInfo?: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed';
  createdAt: string;
}

// Service Category Interface
interface ServiceCategory {
  category: string;
  requiresAppointment: boolean;
  isEmergencyService: boolean;
  bookingFlow: 'appointment' | 'request' | 'consultation' | 'immediate';
  formFields: string[];
}
```

---

## 📋 Complete API Endpoints Summary

### Center Management Endpoints

| Method | Endpoint | Description | Roles | Query Parameters |
|--------|----------|-------------|-------|------------------|
| `GET` | `/centers` | Get all centers (admin only) | `admin` | None |
| `GET` | `/centers/types` | Get all center types | All | None |
| `GET` | `/centers/types/:type` | Get centers by type | All | None |
| `GET` | `/centers/eye-clinics` | Get all eye clinics | All | None |
| `GET` | `/centers/maternity` | Get all maternity centers | All | None |
| `GET` | `/centers/virology` | Get all virology centers | All | None |
| `GET` | `/centers/psychiatric` | Get all psychiatric centers | All | None |
| `GET` | `/centers/care-homes` | Get all care homes | All | None |
| `GET` | `/centers/hospice` | Get all hospice centers | All | None |
| `GET` | `/centers/funeral` | Get all funeral services | All | None |
| `GET` | `/centers/hospital` | Get all hospital centers | All | None |
| `GET` | `/centers/:id` | Get center by ID | `admin`, `center`, `doctor`, `staff` | None |
| `GET` | `/centers/user/:userId` | Get centers by user ID | `admin`, `center` | None |
| `POST` | `/centers` | Create new center | `admin`, `center` | Body: `CreateCenterDto` |
| `PATCH` | `/centers/:id` | Update center | `admin`, `center` | Body: `Partial<CreateCenterDto>` |
| `DELETE` | `/centers/:id` | Delete center | `admin` | None |

### Center Services Endpoints

| Method | Endpoint | Description | Roles | Query Parameters |
|--------|----------|-------------|-------|------------------|
| `GET` | `/centers/:id/services` | Get center services | `admin`, `center`, `doctor`, `staff`, `patient` | None |
| `GET` | `/centers/services/:id` | Get service by ID | `admin`, `center`, `doctor`, `staff`, `patient` | None |
| `POST` | `/centers/:id/services` | Create center service | `admin`, `center` | Body: `CreateCenterServiceDto` |
| `PATCH` | `/centers/services/:id` | Update service | `admin`, `center` | Body: `Partial<CreateCenterServiceDto>` |
| `DELETE` | `/centers/services/:id` | Delete service | `admin`, `center` | None |

### Center Staff Endpoints

| Method | Endpoint | Description | Roles | Query Parameters |
|--------|----------|-------------|-------|------------------|
| `GET` | `/centers/:id/staff` | Get center staff | `admin`, `center` | None |
| `POST` | `/centers/:id/staff` | Add staff member | `admin`, `center` | Body: `{userId: string, role: string}` |
| `DELETE` | `/centers/:id/staff/:staffId` | Remove staff member | `admin`, `center` | None |

### Appointment Management Endpoints

| Method | Endpoint | Description | Roles | Query Parameters |
|--------|----------|-------------|-------|------------------|
| `GET` | `/appointments` | Get appointments with filters | `admin`, `doctor`, `staff`, `patient`, `center` | `page`, `limit`, `centerId`, `providerId`, `patientId`, `status`, `dateFrom`, `dateTo` |
| `GET` | `/appointments/:id` | Get appointment by ID | `admin`, `doctor`, `staff`, `patient`, `center` | None |
| `POST` | `/appointments` | Create appointment | `admin`, `doctor`, `staff`, `patient`, `center` | Body: `CreateAppointmentDto` |
| `PATCH` | `/appointments/:id` | Update appointment | `admin`, `doctor`, `staff`, `patient`, `center` | Body: `UpdateAppointmentDto` |
| `PATCH` | `/appointments/:id/confirm` | Confirm appointment | `admin`, `doctor`, `staff`, `patient`, `center` | None |
| `PATCH` | `/appointments/:id/cancel` | Cancel appointment | `admin`, `doctor`, `staff`, `patient`, `center` | Body: `{reason: string, cancelledBy: string}` |
| `PATCH` | `/appointments/:id/complete` | Complete appointment | `admin`, `doctor`, `staff`, `center` | Body: `{notes?: string, metadata?: Record<string, unknown>}` |
| `DELETE` | `/appointments/:id` | Delete appointment | `admin`, `doctor`, `staff`, `patient`, `center` | None |

### Time Slot & Availability Endpoints

| Method | Endpoint | Description | Roles | Query Parameters |
|--------|----------|-------------|-------|------------------|
| `GET` | `/appointments/slots/provider/:providerId` | Get available time slots | `admin`, `doctor`, `staff`, `patient`, `center` | `date` (required) |
| `GET` | `/appointments/availability/provider/:providerId` | Get provider availability | `admin`, `doctor`, `staff`, `patient`, `center` | `date` (optional) |
| `POST` | `/appointments/availability` | Create provider availability | `admin`, `doctor`, `staff`, `center` | Body: `CreateProviderAvailabilityDto` |
| `PATCH` | `/appointments/availability/:id` | Update provider availability | `admin`, `doctor`, `staff`, `center` | Body: `Partial<CreateProviderAvailabilityDto>` |

### Recurring Appointments Endpoints

| Method | Endpoint | Description | Roles | Query Parameters |
|--------|----------|-------------|-------|------------------|
| `POST` | `/appointments/recurring` | Create recurring appointment | `admin`, `doctor`, `staff`, `center` | Body: `CreateRecurringAppointmentDto` |
| `PATCH` | `/appointments/recurring/:id` | Update recurring series | `admin`, `doctor`, `staff`, `center` | `updateFuture` (boolean) |
| `DELETE` | `/appointments/recurring/:id` | Cancel recurring series | `admin`, `doctor`, `staff`, `center` | `cancelFuture` (boolean) |
| `GET` | `/appointments/recurring/:id` | Get recurring appointments | `admin`, `doctor`, `staff`, `center` | None |

### Reminder Management Endpoints

| Method | Endpoint | Description | Roles | Query Parameters |
|--------|----------|-------------|-------|------------------|
| `GET` | `/appointments/reminders/pending` | Get pending reminders | `admin`, `doctor`, `staff`, `center` | None |
| `PATCH` | `/appointments/reminders/:reminderId/sent` | Mark reminder as sent | `admin`, `doctor`, `staff`, `center` | None |
| `POST` | `/appointments/reminders` | Create manual reminder | `admin`, `doctor`, `staff`, `center` | Body: `CreateReminderDto` |

### Analytics Endpoints

| Method | Endpoint | Description | Roles | Query Parameters |
|--------|----------|-------------|-------|------------------|
| `GET` | `/appointments/analytics/:centerId` | Get appointment analytics | `admin`, `doctor`, `staff`, `center` | `startDate`, `endDate` |

---

## 🚨 Error Handling

### Common Error Responses
```typescript
// 400 Bad Request
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}

// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Center not found",
  "error": "Not Found"
}

// 409 Conflict
{
  "statusCode": 409,
  "message": "Appointment slot already booked",
  "error": "Conflict"
}
```

### Error Handling Example
```typescript
const handleApiError = (error: any) => {
  switch (error.status) {
    case 400:
      return 'Please check your input and try again';
    case 401:
      // Redirect to login
      localStorage.removeItem('access_token');
      window.location.href = '/login';
      return 'Please login to continue';
    case 404:
      return 'Center not found';
    case 409:
      return 'This time slot is no longer available';
    default:
      return 'Something went wrong. Please try again';
  }
};
```

---

## 📱 Mobile Responsiveness

### Key Considerations
1. **Touch-friendly interface** - Large buttons and touch targets
2. **Responsive grid** - Adapt to different screen sizes
3. **Mobile-first design** - Start with mobile layout
4. **Fast loading** - Optimize images and lazy loading
5. **Offline support** - Cache center data and appointments

### Mobile-Specific Features
- **Location services** - Use GPS for nearby centers
- **Push notifications** - Appointment reminders
- **Camera integration** - Upload documents if needed
- **Swipe gestures** - Navigate between appointments

---

## 🔐 Security Considerations

### Data Protection
1. **Token management** - Secure storage and refresh
2. **Input validation** - Client-side validation
3. **HTTPS only** - Secure API communication
4. **Data sanitization** - Clean user inputs

### Privacy
1. **Minimal data collection** - Only collect necessary data
2. **Data encryption** - Encrypt sensitive data
3. **User consent** - Clear privacy policies
4. **Data retention** - Follow data retention policies

---

## 🎯 Implementation Checklist

### Phase 1: Basic Center Discovery
- [ ] Implement center listing with pagination
- [ ] Add search and filter functionality
- [ ] Create center detail pages
- [ ] Implement responsive design

### Phase 2: Appointment Booking
- [ ] Build appointment booking flow
- [ ] Implement time slot selection
- [ ] Add appointment confirmation
- [ ] Create appointment management dashboard

### Phase 3: Advanced Features
- [ ] Add map integration
- [ ] Implement push notifications
- [ ] Add appointment reminders
- [ ] Create user reviews and ratings

### Phase 4: Optimization
- [ ] Implement caching strategies
- [ ] Add offline support
- [ ] Optimize performance
- [ ] Add analytics tracking

---

## 📚 Additional Resources

- **Swagger Documentation:** `https://api.unlimtedhealth.com/api/docs`
- **Health Check:** `GET https://api.unlimtedhealth.com/api/health`
- **API Version:** v1 (current)

---

## 📋 Summary: Complete Frontend Implementation Guide

### 🎯 Key Implementation Points

#### 1. **Real API Integration**
- **Base URL**: `https://api.unlimtedhealth.com/api`
- **Authentication**: Bearer token required for all endpoints
- **Role-based Access**: Different endpoints require specific user roles
- **Type Safety**: All DTOs and interfaces are based on actual backend entities

#### 2. **Center Discovery Features**
- **Multiple Discovery Methods**: 
  - Get all centers (admin only)
  - Get by type using `/centers/types/:type`
  - Direct endpoints for specific types (`/centers/hospital`, `/centers/eye-clinics`, etc.)
- **Real Data Structure**: Based on `HealthcareCenter` entity with proper UUIDs and metadata
- **Location Support**: Latitude/longitude coordinates and location metadata

#### 3. **Service Management**
- **Service Categories**: Based on `CenterService` entity with emergency flags
- **Dynamic Pricing**: `basePrice` field for service pricing
- **Appointment Requirements**: `requiresAppointment` and `isEmergencyService` flags
- **Service Management**: Full CRUD operations for center services

#### 4. **Appointment System**
- **Comprehensive Booking**: Based on `CreateAppointmentDto` with all required fields
- **Status Management**: Multiple status fields (`appointmentStatus`, `confirmationStatus`, `status`)
- **Recurring Support**: Full recurring appointment system with patterns
- **Time Slot Management**: Real-time availability checking
- **Priority Levels**: `low`, `normal`, `high`, `urgent` priority system

#### 5. **Center Type-Specific Implementation**

| Center Type | Service Model | Booking Flow | UI Approach | API Endpoints |
|-------------|---------------|--------------|-------------|---------------|
| **Medical** (Hospital, Clinic, Dental, Eye, Maternity) | Traditional appointments | Service → Provider → Time → Confirm | Standard booking form | `/appointments`, `/appointments/slots/provider/:providerId` |
| **Emergency** (Ambulance) | Immediate response | Emergency request → Dispatch | Emergency action buttons | `/appointments` with `isEmergencyService: true` |
| **Support** (Hospice, Care Home, Psychiatric) | Consultation-based | Assessment → Care planning | Consultation forms | `/appointments` with custom metadata |
| **Specialized** (Funeral, Lab, Pharmacy, Radiology) | Service-specific | Custom requirements → Scheduling | Custom booking flows | `/appointments` with service-specific DTOs |

### 🔧 Frontend Developer Action Items

#### Phase 1: Core Infrastructure
1. **Set up API Client** - Create typed API client with proper error handling
2. **Implement Authentication** - Bearer token management and role-based routing
3. **Create Type Definitions** - Import all interfaces from the guide
4. **Build Center Discovery** - Implement center listing with filters and search

#### Phase 2: Center Management
1. **Center Details Pages** - Display center info, services, and staff
2. **Service Management** - CRUD operations for center services
3. **Staff Management** - Add/remove staff members from centers
4. **Type-Specific UI** - Different layouts for different center types

#### Phase 3: Appointment System
1. **Appointment Booking** - Complete booking flow with time slot selection
2. **Appointment Management** - View, update, cancel, and complete appointments
3. **Recurring Appointments** - Handle recurring appointment creation and management
4. **Status Management** - Real-time status updates and confirmations

#### Phase 4: Advanced Features
1. **Reminder System** - Integration with appointment reminders
2. **Analytics Dashboard** - Center-specific appointment analytics
3. **Availability Management** - Provider availability scheduling
4. **Emergency Handling** - Special UI for emergency services

### 🚀 Quick Start Implementation

#### 1. **API Client Setup**
```typescript
// api-client.ts
class HealthcareAPI {
  private baseURL = 'https://api.unlimtedhealth.com/api';
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Center methods
  async getCenters(): Promise<HealthcareCenter[]> {
    return this.request<HealthcareCenter[]>('/centers');
  }

  async getCentersByType(type: string): Promise<HealthcareCenter[]> {
    return this.request<HealthcareCenter[]>(`/centers/types/${type}`);
  }

  async getCenterDetails(id: string): Promise<HealthcareCenter> {
    return this.request<HealthcareCenter>(`/centers/${id}`);
  }

  // Appointment methods
  async createAppointment(data: CreateAppointmentDto): Promise<Appointment> {
    return this.request<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAppointments(filters: AppointmentFilters = {}): Promise<{data: Appointment[], pagination: any}> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });
    
    return this.request<{data: Appointment[], pagination: any}>(`/appointments?${params}`);
  }
}

export const api = new HealthcareAPI();
```

#### 2. **Component Structure**
```
src/
├── components/
│   ├── centers/
│   │   ├── CenterCard.tsx
│   │   ├── CenterDetails.tsx
│   │   ├── CenterFilters.tsx
│   │   └── CenterList.tsx
│   ├── appointments/
│   │   ├── AppointmentBooking.tsx
│   │   ├── AppointmentCard.tsx
│   │   ├── AppointmentList.tsx
│   │   └── TimeSlotSelector.tsx
│   └── shared/
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       └── ConfirmDialog.tsx
├── hooks/
│   ├── useCenters.ts
│   ├── useAppointments.ts
│   └── useAuth.ts
├── types/
│   └── index.ts (all interfaces from guide)
└── utils/
    ├── api-client.ts
    └── formatters.ts
```

### 📚 Additional Resources

- **Swagger Documentation**: `https://api.unlimtedhealth.com/api/docs`
- **Health Check**: `GET https://api.unlimtedhealth.com/api/health`
- **API Version**: v1 (current)
- **Authentication**: JWT Bearer tokens
- **Rate Limiting**: Check response headers for rate limit information

---

**Note**: This comprehensive guide provides all the necessary information to build a complete Health Centre Dashboard frontend. The API endpoints, DTOs, and interfaces are based on the actual backend implementation, ensuring type safety and proper integration. Focus on implementing the core features first, then add advanced functionality as needed.
