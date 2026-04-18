# Appointment API Documentation

This document provides comprehensive documentation for all appointment-related endpoints in the healthcare management system. All endpoints require JWT authentication and are protected by role-based access control.

## Base URL
```
https://api.unlimtedhealth.com/api/appointments
```

## Authentication
All endpoints require:
- **JWT Bearer Token** in the Authorization header
- **Role-based access control** (specific roles listed per endpoint)

## Common Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## 📅 Core Appointment Endpoints

### 1. Create Appointment
**POST** `/appointments`

Creates a new appointment for a patient.

**Authentication:** `admin`, `doctor`, `staff`, `patient`, `center`

**Request Body:**
```json
{
  "patientId": "123e4567-e89b-12d3-a456-426614174000",
  "centerId": "123e4567-e89b-12d3-a456-426614174001",
  "providerId": "123e4567-e89b-12d3-a456-426614174002",
  "appointmentTypeId": "123e4567-e89b-12d3-a456-426614174003",
  "appointmentDate": "2025-05-26T09:00:00Z",
  "durationMinutes": 30,
  "priority": "normal",
  "reason": "Regular checkup",
  "notes": "Patient has been experiencing headaches",
  "doctor": "Dr. John Smith",
  "isRecurring": false,
  "recurrencePattern": {
    "frequency": "weekly",
    "interval": 2,
    "count": 10
  },
  "metadata": {
    "preparation": "Patient should fast for 8 hours before the appointment",
    "reminderPreferences": {
      "emailEnabled": true,
      "smsEnabled": false,
      "reminderTiming": [24, 2]
    }
  }
}
```

**Response (201):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174004",
  "patientId": "123e4567-e89b-12d3-a456-426614174000",
  "centerId": "123e4567-e89b-12d3-a456-426614174001",
  "providerId": "123e4567-e89b-12d3-a456-426614174002",
  "appointmentTypeId": "123e4567-e89b-12d3-a456-426614174003",
  "appointmentDate": "2025-05-26T09:00:00.000Z",
  "durationMinutes": 30,
  "appointmentStatus": "scheduled",
  "status": "pending",
  "priority": "normal",
  "reason": "Regular checkup",
  "notes": "Patient has been experiencing headaches",
  "doctor": "Dr. John Smith",
  "isRecurring": false,
  "recurrencePattern": null,
  "confirmationStatus": "pending",
  "confirmedAt": null,
  "cancellationReason": null,
  "cancelledBy": null,
  "cancelledAt": null,
  "metadata": {
    "preparation": "Patient should fast for 8 hours before the appointment",
    "reminderPreferences": {
      "emailEnabled": true,
      "smsEnabled": false,
      "reminderTiming": [24, 2]
    }
  },
  "createdAt": "2025-01-27T10:30:00.000Z",
  "updatedAt": "2025-01-27T10:30:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Patient, center, or provider not found

---

### 2. Get All Appointments
**GET** `/appointments`

Retrieves a paginated list of appointments with optional filtering.

**Authentication:** `admin`, `doctor`, `staff`, `patient`, `center`

**Query Parameters:**
- `page` (number, default: 1) - Page number for pagination
- `limit` (number, default: 10) - Number of items per page
- `centerId` (string, optional) - Filter by healthcare center
- `providerId` (string, optional) - Filter by healthcare provider
- `patientId` (string, optional) - Filter by patient
- `status` (string, optional) - Filter by appointment status
- `dateFrom` (string, optional) - Start date filter (ISO 8601)
- `dateTo` (string, optional) - End date filter (ISO 8601)

**Example Request:**
```http
GET /appointments?page=1&limit=20&centerId=123e4567-e89b-12d3-a456-426614174001&status=scheduled&dateFrom=2025-01-01T00:00:00Z&dateTo=2025-12-31T23:59:59Z
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174004",
      "patientId": "123e4567-e89b-12d3-a456-426614174000",
      "centerId": "123e4567-e89b-12d3-a456-426614174001",
      "providerId": "123e4567-e89b-12d3-a456-426614174002",
      "appointmentDate": "2025-05-26T09:00:00.000Z",
      "durationMinutes": 30,
      "appointmentStatus": "scheduled",
      "priority": "normal",
      "reason": "Regular checkup",
      "doctor": "Dr. John Smith",
      "patient": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com"
      },
      "center": {
        "id": "123e4567-e89b-12d3-a456-426614174001",
        "name": "Downtown Medical Center",
        "address": "123 Main St, City, State"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid UUID format in query parameters
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Insufficient permissions

---

### 3. Get Single Appointment
**GET** `/appointments/:id`

Retrieves a specific appointment by ID.

**Authentication:** `admin`, `doctor`, `staff`, `patient`, `center`

**Path Parameters:**
- `id` (string, required) - Appointment UUID

**Example Request:**
```http
GET /appointments/123e4567-e89b-12d3-a456-426614174004
```

**Response (200):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174004",
  "patientId": "123e4567-e89b-12d3-a456-426614174000",
  "centerId": "123e4567-e89b-12d3-a456-426614174001",
  "providerId": "123e4567-e89b-12d3-a456-426614174002",
  "appointmentTypeId": "123e4567-e89b-12d3-a456-426614174003",
  "appointmentDate": "2025-05-26T09:00:00.000Z",
  "durationMinutes": 30,
  "appointmentStatus": "scheduled",
  "status": "pending",
  "priority": "normal",
  "reason": "Regular checkup",
  "notes": "Patient has been experiencing headaches",
  "doctor": "Dr. John Smith",
  "isRecurring": false,
  "confirmationStatus": "pending",
  "confirmedAt": null,
  "cancellationReason": null,
  "metadata": {
    "preparation": "Patient should fast for 8 hours before the appointment"
  },
  "patient": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890"
  },
  "center": {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "name": "Downtown Medical Center",
    "address": "123 Main St, City, State"
  },
  "provider": {
    "id": "123e4567-e89b-12d3-a456-426614174002",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@example.com"
  },
  "appointmentType": {
    "id": "123e4567-e89b-12d3-a456-426614174003",
    "name": "General Consultation",
    "durationMinutes": 30,
    "colorCode": "#4CAF50"
  },
  "createdAt": "2025-01-27T10:30:00.000Z",
  "updatedAt": "2025-01-27T10:30:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid UUID format
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Appointment not found

---

### 4. Update Appointment
**PATCH** `/appointments/:id`

Updates an existing appointment.

**Authentication:** `admin`, `doctor`, `staff`, `patient`, `center`

**Path Parameters:**
- `id` (string, required) - Appointment UUID

**Request Body:**
```json
{
  "appointmentDate": "2025-05-27T10:00:00Z",
  "durationMinutes": 45,
  "priority": "high",
  "reason": "Follow-up consultation",
  "notes": "Updated notes",
  "appointmentStatus": "confirmed",
  "confirmationStatus": "confirmed",
  "confirmedAt": "2025-01-27T11:00:00Z",
  "metadata": {
    "preparation": "Updated preparation instructions"
  }
}
```

**Response (200):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174004",
  "patientId": "123e4567-e89b-12d3-a456-426614174000",
  "centerId": "123e4567-e89b-12d3-a456-426614174001",
  "providerId": "123e4567-e89b-12d3-a456-426614174002",
  "appointmentDate": "2025-05-27T10:00:00.000Z",
  "durationMinutes": 45,
  "appointmentStatus": "confirmed",
  "priority": "high",
  "reason": "Follow-up consultation",
  "notes": "Updated notes",
  "confirmationStatus": "confirmed",
  "confirmedAt": "2025-01-27T11:00:00.000Z",
  "updatedAt": "2025-01-27T11:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Appointment not found

---

### 5. Confirm Appointment
**PATCH** `/appointments/:id/confirm`

Confirms an appointment.

**Authentication:** `admin`, `doctor`, `staff`, `patient`, `center`

**Path Parameters:**
- `id` (string, required) - Appointment UUID

**Response (200):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174004",
  "appointmentStatus": "confirmed",
  "confirmationStatus": "confirmed",
  "confirmedAt": "2025-01-27T11:00:00.000Z",
  "message": "Appointment confirmed successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid UUID format
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Appointment not found

---

### 6. Cancel Appointment
**PATCH** `/appointments/:id/cancel`

Cancels an appointment with a reason.

**Authentication:** `admin`, `doctor`, `staff`, `patient`, `center`

**Path Parameters:**
- `id` (string, required) - Appointment UUID

**Request Body:**
```json
{
  "reason": "Patient requested cancellation",
  "cancelledBy": "123e4567-e89b-12d3-a456-426614174002"
}
```

**Response (200):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174004",
  "appointmentStatus": "cancelled",
  "cancellationReason": "Patient requested cancellation",
  "cancelledBy": "123e4567-e89b-12d3-a456-426614174002",
  "cancelledAt": "2025-01-27T11:00:00.000Z",
  "message": "Appointment cancelled successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid UUID format or missing required fields
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Appointment not found

---

### 7. Complete Appointment
**PATCH** `/appointments/:id/complete`

Marks an appointment as completed.

**Authentication:** `admin`, `doctor`, `staff`, `center`

**Path Parameters:**
- `id` (string, required) - Appointment UUID

**Request Body:**
```json
{
  "notes": "Appointment completed successfully. Patient responded well to treatment.",
  "metadata": {
    "treatmentProvided": "Prescribed medication",
    "followUpRequired": true,
    "nextAppointment": "2025-06-26T09:00:00Z"
  }
}
```

**Response (200):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174004",
  "appointmentStatus": "completed",
  "notes": "Appointment completed successfully. Patient responded well to treatment.",
  "metadata": {
    "treatmentProvided": "Prescribed medication",
    "followUpRequired": true,
    "nextAppointment": "2025-06-26T09:00:00Z"
  },
  "message": "Appointment marked as completed"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid UUID format
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Appointment not found

---

### 8. Delete Appointment
**DELETE** `/appointments/:id`

Deletes an appointment permanently.

**Authentication:** `admin`, `doctor`, `staff`, `patient`, `center`

**Path Parameters:**
- `id` (string, required) - Appointment UUID

**Response (200):**
```json
{
  "message": "Appointment deleted successfully",
  "deletedId": "123e4567-e89b-12d3-a456-426614174004"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid UUID format
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Appointment not found

---

## 🔄 Recurring Appointment Endpoints

### 9. Create Recurring Appointment
**POST** `/appointments/recurring`

Creates a series of recurring appointments.

**Authentication:** `admin`, `doctor`, `staff`, `center`

**Request Body:**
```json
{
  "patientId": "123e4567-e89b-12d3-a456-426614174000",
  "centerId": "123e4567-e89b-12d3-a456-426614174001",
  "providerId": "123e4567-e89b-12d3-a456-426614174002",
  "appointmentTypeId": "123e4567-e89b-12d3-a456-426614174003",
  "appointmentDate": "2025-05-26T09:00:00Z",
  "durationMinutes": 30,
  "reason": "Physical therapy sessions",
  "notes": "Weekly physical therapy",
  "doctor": "Dr. John Smith",
  "isRecurring": true,
  "recurrencePattern": {
    "frequency": "weekly",
    "interval": 1,
    "occurrences": 12,
    "daysOfWeek": ["monday", "wednesday", "friday"]
  }
}
```

**Response (201):**
```json
{
  "parentAppointmentId": "123e4567-e89b-12d3-a456-426614174004",
  "createdAppointments": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174005",
      "appointmentDate": "2025-05-26T09:00:00.000Z",
      "appointmentStatus": "scheduled"
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174006",
      "appointmentDate": "2025-05-28T09:00:00.000Z",
      "appointmentStatus": "scheduled"
    }
  ],
  "totalCreated": 12,
  "message": "Recurring appointment series created successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input data or recurrence pattern
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Patient, center, or provider not found

---

### 10. Update Recurring Series
**PATCH** `/appointments/recurring/:id`

Updates a recurring appointment series.

**Authentication:** `admin`, `doctor`, `staff`, `center`

**Path Parameters:**
- `id` (string, required) - Parent appointment UUID

**Query Parameters:**
- `updateFuture` (boolean, default: false) - Whether to update future appointments in the series

**Request Body:**
```json
{
  "durationMinutes": 45,
  "priority": "high",
  "notes": "Updated therapy notes"
}
```

**Response (200):**
```json
{
  "updatedAppointments": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174005",
      "durationMinutes": 45,
      "priority": "high",
      "notes": "Updated therapy notes"
    }
  ],
  "totalUpdated": 1,
  "message": "Recurring series updated successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid UUID format or input data
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Recurring series not found

---

### 11. Cancel Recurring Series
**DELETE** `/appointments/recurring/:id`

Cancels a recurring appointment series.

**Authentication:** `admin`, `doctor`, `staff`, `center`

**Path Parameters:**
- `id` (string, required) - Parent appointment UUID

**Query Parameters:**
- `cancelFuture` (boolean, default: false) - Whether to cancel future appointments in the series

**Response (200):**
```json
{
  "cancelledAppointments": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174005",
      "appointmentStatus": "cancelled",
      "cancelledAt": "2025-01-27T11:00:00.000Z"
    }
  ],
  "totalCancelled": 8,
  "message": "Recurring appointments cancelled successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid UUID format
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Recurring series not found

---

### 12. Get Recurring Appointments
**GET** `/appointments/recurring/:id`

Retrieves all appointments in a recurring series.

**Authentication:** `admin`, `doctor`, `staff`, `center`

**Path Parameters:**
- `id` (string, required) - Parent appointment UUID

**Response (200):**
```json
{
  "parentAppointment": {
    "id": "123e4567-e89b-12d3-a456-426614174004",
    "appointmentDate": "2025-05-26T09:00:00.000Z",
    "isRecurring": true,
    "recurrencePattern": {
      "frequency": "weekly",
      "interval": 1,
      "occurrences": 12
    }
  },
  "seriesAppointments": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174005",
      "appointmentDate": "2025-05-26T09:00:00.000Z",
      "appointmentStatus": "scheduled",
      "parentAppointmentId": "123e4567-e89b-12d3-a456-426614174004"
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174006",
      "appointmentDate": "2025-05-28T09:00:00.000Z",
      "appointmentStatus": "scheduled",
      "parentAppointmentId": "123e4567-e89b-12d3-a456-426614174004"
    }
  ],
  "totalInSeries": 12
}
```

**Error Responses:**
- `400 Bad Request` - Invalid UUID format
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Recurring series not found

---

## 📋 Appointment Type Management

### 13. Get Appointment Types by Center
**GET** `/appointments/types/center/:centerId`

Retrieves all appointment types for a specific healthcare center.

**Authentication:** `admin`, `doctor`, `staff`, `center`

**Path Parameters:**
- `centerId` (string, required) - Healthcare center UUID

**Response (200):**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174003",
    "name": "General Consultation",
    "description": "Standard medical consultation",
    "durationMinutes": 30,
    "colorCode": "#4CAF50",
    "requiresPreparation": false,
    "preparationInstructions": null,
    "isActive": true,
    "createdAt": "2025-01-27T10:30:00.000Z"
  },
  {
    "id": "123e4567-e89b-12d3-a456-426614174007",
    "name": "Physical Therapy",
    "description": "Physical therapy session",
    "durationMinutes": 60,
    "colorCode": "#2196F3",
    "requiresPreparation": true,
    "preparationInstructions": "Wear comfortable clothing",
    "isActive": true,
    "createdAt": "2025-01-27T10:30:00.000Z"
  }
]
```

**Error Responses:**
- `400 Bad Request` - Invalid UUID format
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Center not found

---

### 14. Create Appointment Type
**POST** `/appointments/types/center/:centerId`

Creates a new appointment type for a healthcare center.

**Authentication:** `admin`, `doctor`, `staff`, `center`

**Path Parameters:**
- `centerId` (string, required) - Healthcare center UUID

**Request Body:**
```json
{
  "name": "Cardiology Consultation",
  "description": "Specialized heart consultation",
  "durationMinutes": 45,
  "colorCode": "#FF5722",
  "requiresPreparation": true,
  "preparationInstructions": "Bring previous test results and avoid caffeine",
  "isActive": true
}
```

**Response (201):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174008",
  "name": "Cardiology Consultation",
  "description": "Specialized heart consultation",
  "durationMinutes": 45,
  "colorCode": "#FF5722",
  "requiresPreparation": true,
  "preparationInstructions": "Bring previous test results and avoid caffeine",
  "isActive": true,
  "centerId": "123e4567-e89b-12d3-a456-426614174001",
  "createdAt": "2025-01-27T10:30:00.000Z",
  "updatedAt": "2025-01-27T10:30:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input data or UUID format
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Center not found

---

## ⏰ Provider Availability Management

### 15. Get Provider Availability
**GET** `/appointments/availability/provider/:providerId`

Retrieves availability schedule for a specific healthcare provider.

**Authentication:** `admin`, `doctor`, `staff`, `patient`, `center`

**Path Parameters:**
- `providerId` (string, required) - Provider UUID

**Query Parameters:**
- `date` (string, optional) - Specific date to check availability (ISO 8601)

**Example Request:**
```http
GET /appointments/availability/provider/123e4567-e89b-12d3-a456-426614174002?date=2025-05-26
```

**Response (200):**
```json
{
  "providerId": "123e4567-e89b-12d3-a456-426614174002",
  "date": "2025-05-26",
  "availability": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174009",
      "dayOfWeek": 1,
      "startTime": "09:00",
      "endTime": "17:00",
      "breakStartTime": "12:00",
      "breakEndTime": "13:00",
      "maxAppointmentsPerSlot": 1,
      "slotDurationMinutes": 30,
      "bufferTimeMinutes": 15,
      "isAvailable": true
    }
  ],
  "availableSlots": [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30"
  ]
}
```

**Error Responses:**
- `400 Bad Request` - Invalid UUID format
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Provider not found

---

### 16. Create Provider Availability
**POST** `/appointments/availability`

Creates availability schedule for a healthcare provider.

**Authentication:** `admin`, `doctor`, `staff`, `center`

**Request Body:**
```json
{
  "providerId": "123e4567-e89b-12d3-a456-426614174002",
  "centerId": "123e4567-e89b-12d3-a456-426614174001",
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "17:00",
  "isAvailable": true,
  "breakStartTime": "12:00",
  "breakEndTime": "13:00",
  "maxAppointmentsPerSlot": 1,
  "slotDurationMinutes": 30,
  "bufferTimeMinutes": 15,
  "effectiveFrom": "2025-01-27T00:00:00Z",
  "effectiveUntil": "2025-12-31T23:59:59Z"
}
```

**Response (201):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174009",
  "providerId": "123e4567-e89b-12d3-a456-426614174002",
  "centerId": "123e4567-e89b-12d3-a456-426614174001",
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "17:00",
  "isAvailable": true,
  "breakStartTime": "12:00",
  "breakEndTime": "13:00",
  "maxAppointmentsPerSlot": 1,
  "slotDurationMinutes": 30,
  "bufferTimeMinutes": 15,
  "effectiveFrom": "2025-01-27T00:00:00.000Z",
  "effectiveUntil": "2025-12-31T23:59:59.000Z",
  "createdAt": "2025-01-27T10:30:00.000Z",
  "updatedAt": "2025-01-27T10:30:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Provider or center not found

---

### 17. Update Provider Availability
**PATCH** `/appointments/availability/:id`

Updates an existing provider availability schedule.

**Authentication:** `admin`, `doctor`, `staff`, `center`

**Path Parameters:**
- `id` (string, required) - Availability UUID

**Request Body:**
```json
{
  "startTime": "08:00",
  "endTime": "18:00",
  "breakStartTime": "12:00",
  "breakEndTime": "13:00",
  "maxAppointmentsPerSlot": 2
}
```

**Response (200):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174009",
  "providerId": "123e4567-e89b-12d3-a456-426614174002",
  "centerId": "123e4567-e89b-12d3-a456-426614174001",
  "dayOfWeek": 1,
  "startTime": "08:00",
  "endTime": "18:00",
  "isAvailable": true,
  "breakStartTime": "12:00",
  "breakEndTime": "13:00",
  "maxAppointmentsPerSlot": 2,
  "slotDurationMinutes": 30,
  "bufferTimeMinutes": 15,
  "updatedAt": "2025-01-27T11:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid UUID format or input data
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Availability not found

---

## 🕐 Time Slot Management

### 18. Get Available Time Slots
**GET** `/appointments/slots/provider/:providerId`

Retrieves available time slots for a specific provider on a given date.

**Authentication:** `admin`, `doctor`, `staff`, `patient`, `center`

**Path Parameters:**
- `providerId` (string, required) - Provider UUID

**Query Parameters:**
- `date` (string, required) - Date to check for available slots (ISO 8601)

**Example Request:**
```http
GET /appointments/slots/provider/123e4567-e89b-12d3-a456-426614174002?date=2025-05-26
```

**Response (200):**
```json
{
  "providerId": "123e4567-e89b-12d3-a456-426614174002",
  "date": "2025-05-26",
  "availableSlots": [
    {
      "time": "09:00",
      "duration": 30,
      "isAvailable": true,
      "maxBookings": 1,
      "currentBookings": 0
    },
    {
      "time": "09:30",
      "duration": 30,
      "isAvailable": true,
      "maxBookings": 1,
      "currentBookings": 0
    },
    {
      "time": "10:00",
      "duration": 30,
      "isAvailable": false,
      "maxBookings": 1,
      "currentBookings": 1,
      "reason": "Already booked"
    },
    {
      "time": "10:30",
      "duration": 30,
      "isAvailable": true,
      "maxBookings": 1,
      "currentBookings": 0
    }
  ],
  "totalAvailableSlots": 12,
  "providerSchedule": {
    "startTime": "09:00",
    "endTime": "17:00",
    "breakStartTime": "12:00",
    "breakEndTime": "13:00"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid UUID format or missing date parameter
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Provider not found

---

## 🔔 Reminder Management

### 19. Get Pending Reminders
**GET** `/appointments/reminders/pending`

Retrieves all pending appointment reminders.

**Authentication:** `admin`, `doctor`, `staff`, `center`

**Response (200):**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174010",
    "appointmentId": "123e4567-e89b-12d3-a456-426614174004",
    "recipientId": "123e4567-e89b-12d3-a456-426614174000",
    "reminderType": "appointment_reminder",
    "deliveryMethod": "email",
    "scheduledFor": "2025-05-25T09:00:00.000Z",
    "sentAt": null,
    "deliveryStatus": "pending",
    "messageContent": "Your appointment with Dr. John Smith is scheduled for tomorrow at 9:00 AM",
    "appointment": {
      "id": "123e4567-e89b-12d3-a456-426614174004",
      "appointmentDate": "2025-05-26T09:00:00.000Z",
      "doctor": "Dr. John Smith",
      "patient": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com"
      }
    }
  }
]
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Insufficient permissions

---

### 20. Mark Reminder as Sent
**PATCH** `/appointments/reminders/:reminderId/sent`

Marks a reminder as sent.

**Authentication:** `admin`, `doctor`, `staff`, `center`

**Path Parameters:**
- `reminderId` (string, required) - Reminder UUID

**Response (200):**
```json
{
  "success": true,
  "message": "Reminder for appointment 123e4567-e89b-12d3-a456-426614174004 marked as sent successfully",
  "reminder": {
    "id": "123e4567-e89b-12d3-a456-426614174010",
    "appointmentId": "123e4567-e89b-12d3-a456-426614174004",
    "recipientId": "123e4567-e89b-12d3-a456-426614174000",
    "reminderType": "appointment_reminder",
    "deliveryMethod": "email",
    "scheduledFor": "2025-05-25T09:00:00.000Z",
    "sentAt": "2025-01-27T11:00:00.000Z",
    "deliveryStatus": "sent",
    "messageContent": "Your appointment with Dr. John Smith is scheduled for tomorrow at 9:00 AM"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid UUID format
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Reminder not found

---

### 21. Create Manual Reminder
**POST** `/appointments/reminders`

Creates a manual reminder for an appointment.

**Authentication:** `admin`, `doctor`, `staff`, `center`

**Request Body:**
```json
{
  "appointmentId": "123e4567-e89b-12d3-a456-426614174004",
  "reminderType": "appointment_reminder",
  "reminderTime": "2025-05-25T09:00:00Z",
  "message": "Your appointment with Dr. John Smith is scheduled for tomorrow at 9:00 AM",
  "isActive": true,
  "priority": "normal",
  "customMessage": "Please arrive 15 minutes early for check-in",
  "deliveryMethod": "email"
}
```

**Response (201):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174011",
  "appointmentId": "123e4567-e89b-12d3-a456-426614174004",
  "recipientId": "123e4567-e89b-12d3-a456-426614174000",
  "reminderType": "appointment_reminder",
  "deliveryMethod": "email",
  "scheduledFor": "2025-05-25T09:00:00.000Z",
  "sentAt": null,
  "deliveryStatus": "pending",
  "messageContent": "Your appointment with Dr. John Smith is scheduled for tomorrow at 9:00 AM. Please arrive 15 minutes early for check-in",
  "isActive": true,
  "priority": "normal",
  "createdAt": "2025-01-27T10:30:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Appointment not found

---

## 📊 Analytics

### 22. Get Appointment Analytics
**GET** `/appointments/analytics/:centerId`

Retrieves analytics data for appointments at a specific healthcare center.

**Authentication:** `admin`, `doctor`, `staff`, `center`

**Path Parameters:**
- `centerId` (string, required) - Healthcare center UUID

**Query Parameters:**
- `startDate` (string, optional) - Start date for analytics (ISO 8601)
- `endDate` (string, optional) - End date for analytics (ISO 8601)

**Example Request:**
```http
GET /appointments/analytics/123e4567-e89b-12d3-a456-426614174001?startDate=2025-01-01T00:00:00Z&endDate=2025-01-31T23:59:59Z
```

**Response (200):**
```json
{
  "centerId": "123e4567-e89b-12d3-a456-426614174001",
  "period": {
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-01-31T23:59:59.000Z"
  },
  "summary": {
    "totalAppointments": 150,
    "completedAppointments": 120,
    "cancelledAppointments": 20,
    "noShowAppointments": 10,
    "completionRate": 80.0,
    "cancellationRate": 13.3,
    "noShowRate": 6.7
  },
  "statusBreakdown": {
    "scheduled": 25,
    "confirmed": 30,
    "in_progress": 5,
    "completed": 120,
    "cancelled": 20,
    "no_show": 10
  },
  "priorityBreakdown": {
    "low": 20,
    "normal": 100,
    "high": 25,
    "urgent": 5
  },
  "dailyStats": [
    {
      "date": "2025-01-01",
      "appointments": 5,
      "completed": 4,
      "cancelled": 1
    },
    {
      "date": "2025-01-02",
      "appointments": 8,
      "completed": 7,
      "cancelled": 1
    }
  ],
  "providerStats": [
    {
      "providerId": "123e4567-e89b-12d3-a456-426614174002",
      "providerName": "Dr. John Smith",
      "totalAppointments": 50,
      "completedAppointments": 45,
      "cancelledAppointments": 5,
      "completionRate": 90.0
    }
  ],
  "appointmentTypeStats": [
    {
      "appointmentTypeId": "123e4567-e89b-12d3-a456-426614174003",
      "appointmentTypeName": "General Consultation",
      "totalAppointments": 80,
      "averageDuration": 30,
      "completionRate": 85.0
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request` - Invalid UUID format
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Center not found

---

## 🔐 Authentication & Authorization

### Required Headers
All endpoints require the following headers:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Role-Based Access Control
Each endpoint specifies which roles can access it:
- `admin` - Full system access
- `doctor` - Medical provider access
- `staff` - Healthcare staff access
- `patient` - Patient access (limited to own appointments)
- `center` - Healthcare center administrative access

### Common Error Responses

#### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

#### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

#### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

#### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "patientId",
      "message": "patientId must be a UUID"
    }
  ]
}
```

#### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## 📝 Data Models

### Appointment Status Values
- `scheduled` - Appointment is scheduled but not confirmed
- `confirmed` - Appointment is confirmed by patient/provider
- `in_progress` - Appointment is currently happening
- `completed` - Appointment has been completed
- `cancelled` - Appointment has been cancelled
- `no_show` - Patient did not show up for appointment

### Confirmation Status Values
- `pending` - Waiting for confirmation
- `confirmed` - Confirmed by patient/provider
- `declined` - Declined by patient/provider

### Priority Values
- `low` - Low priority appointment
- `normal` - Normal priority appointment
- `high` - High priority appointment
- `urgent` - Urgent appointment

### Recurrence Frequency Values
- `daily` - Daily recurrence
- `weekly` - Weekly recurrence
- `monthly` - Monthly recurrence
- `yearly` - Yearly recurrence

### Reminder Delivery Methods
- `email` - Email reminder
- `sms` - SMS reminder
- `push` - Push notification
- `phone` - Phone call

---

## 🚀 Frontend Integration Examples

### Making an Appointment
```javascript
// Create a new appointment
const createAppointment = async (appointmentData) => {
  const response = await fetch('https://api.unlimtedhealth.com/api/appointments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(appointmentData)
  });
  
  if (!response.ok) {
    throw new Error('Failed to create appointment');
  }
  
  return response.json();
};

// Example usage
const appointmentData = {
  patientId: '123e4567-e89b-12d3-a456-426614174000',
  centerId: '123e4567-e89b-12d3-a456-426614174001',
  providerId: '123e4567-e89b-12d3-a456-426614174002',
  appointmentDate: '2025-05-26T09:00:00Z',
  durationMinutes: 30,
  priority: 'normal',
  reason: 'Regular checkup',
  doctor: 'Dr. John Smith'
};

const appointment = await createAppointment(appointmentData);
```

### Getting Available Time Slots
```javascript
// Get available time slots for a provider
const getAvailableSlots = async (providerId, date) => {
  const response = await fetch(
    `https://api.unlimtedhealth.com/api/appointments/slots/provider/${providerId}?date=${date}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to get available slots');
  }
  
  return response.json();
};

// Example usage
const slots = await getAvailableSlots('123e4567-e89b-12d3-a456-426614174002', '2025-05-26');
```

### Filtering Appointments
```javascript
// Get appointments with filters
const getAppointments = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(
    `https://api.unlimtedhealth.com/api/appointments?${queryParams}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to get appointments');
  }
  
  return response.json();
};

// Example usage
const appointments = await getAppointments({
  centerId: '123e4567-e89b-12d3-a456-426614174001',
  status: 'scheduled',
  dateFrom: '2025-01-01T00:00:00Z',
  dateTo: '2025-01-31T23:59:59Z',
  page: 1,
  limit: 20
});
```

---

This documentation provides comprehensive coverage of all appointment-related endpoints in the healthcare management system. The frontend team can use this to implement the "Make Appointment" feature and related functionality with proper error handling and user experience considerations.
