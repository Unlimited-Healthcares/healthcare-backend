# 📅 Appointments API Documentation

## Base URL
```
https://api.unlimtedhealth.com/api
```

## Authentication
All endpoints require a valid JWT access token in the Authorization header:
```
Authorization: Bearer {{access_token}}
```

---

## 1. Create Appointment

### Endpoint
```
POST /appointments
```

### Headers
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

### Request Body
```json
{
  "patientId": "{{patient_id}}",
  "centerId": "{{center_id}}",
  "providerId": "{{provider_id}}",
  "appointmentDate": "2024-02-20T14:00:00Z",
  "durationMinutes": 30,
  "reason": "Follow-up for hypertension",
  "priority": "normal",
  "notes": "Patient requested afternoon appointment",
  "doctor": "Dr. John Smith",
  "isRecurring": false,
  "metadata": {
    "preparation": "Patient should fast for 8 hours before the appointment",
    "reminderPreferences": {
      "emailEnabled": true,
      "smsEnabled": true,
      "reminderTiming": [24, 2]
    }
  }
}
```

### Expected Response (201 Created)
```json
{
  "id": "app_123456789",
  "patientId": "{{patient_id}}",
  "centerId": "{{center_id}}",
  "providerId": "{{provider_id}}",
  "appointmentDate": "2024-02-20T14:00:00Z",
  "durationMinutes": 30,
  "reason": "Follow-up for hypertension",
  "priority": "normal",
  "status": "scheduled",
  "notes": "Patient requested afternoon appointment",
  "doctor": "Dr. John Smith",
  "isRecurring": false,
  "createdAt": "2024-02-15T10:00:00Z",
  "updatedAt": "2024-02-15T10:00:00Z",
  "metadata": {
    "preparation": "Patient should fast for 8 hours before the appointment",
    "reminderPreferences": {
      "emailEnabled": true,
      "smsEnabled": true,
      "reminderTiming": [24, 2]
    }
  }
}
```

### Error Responses
- **400 Bad Request**: Invalid data format or missing required fields
- **401 Unauthorized**: Invalid or missing access token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Patient, center, or provider not found
- **409 Conflict**: Time slot already booked
- **422 Unprocessable Entity**: Validation errors

---

## 2. Get All Appointments

### Endpoint
```
GET /appointments
```

### Headers
```
Authorization: Bearer {{access_token}}
```

### Query Parameters
```
page=1&limit=10&status=scheduled&date=2024-02-20&providerId={{provider_id}}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 10, max: 100) |
| status | string | No | Filter by status (scheduled, confirmed, completed, cancelled) |
| date | string | No | Filter by date (YYYY-MM-DD) |
| providerId | string | No | Filter by provider ID |
| centerId | string | No | Filter by center ID |
| patientId | string | No | Filter by patient ID |

### Expected Response (200 OK)
```json
{
  "data": [
    {
      "id": "app_123456789",
      "patientId": "{{patient_id}}",
      "centerId": "{{center_id}}",
      "providerId": "{{provider_id}}",
      "appointmentDate": "2024-02-20T14:00:00Z",
      "durationMinutes": 30,
      "reason": "Follow-up for hypertension",
      "priority": "normal",
      "status": "scheduled",
      "notes": "Patient requested afternoon appointment",
      "doctor": "Dr. John Smith",
      "createdAt": "2024-02-15T10:00:00Z",
      "updatedAt": "2024-02-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### Error Responses
- **401 Unauthorized**: Invalid or missing access token
- **403 Forbidden**: Insufficient permissions
- **422 Unprocessable Entity**: Invalid query parameters

---

## 3. Get Appointment by ID

### Endpoint
```
GET /appointments/{{appointment_id}}
```

### Headers
```
Authorization: Bearer {{access_token}}
```

### Expected Response (200 OK)
```json
{
  "id": "{{appointment_id}}",
  "patientId": "{{patient_id}}",
  "centerId": "{{center_id}}",
  "providerId": "{{provider_id}}",
  "appointmentDate": "2024-02-20T14:00:00Z",
  "durationMinutes": 30,
  "reason": "Follow-up for hypertension",
  "priority": "normal",
  "status": "scheduled",
  "notes": "Patient requested afternoon appointment",
  "doctor": "Dr. John Smith",
  "isRecurring": false,
  "createdAt": "2024-02-15T10:00:00Z",
  "updatedAt": "2024-02-15T10:00:00Z",
  "metadata": {
    "preparation": "Patient should fast for 8 hours before the appointment",
    "reminderPreferences": {
      "emailEnabled": true,
      "smsEnabled": true,
      "reminderTiming": [24, 2]
    }
  }
}
```

### Error Responses
- **401 Unauthorized**: Invalid or missing access token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Appointment not found

---

## 4. Update Appointment

### Endpoint
```
PATCH /appointments/{{appointment_id}}
```

### Headers
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

### Request Body
```json
{
  "appointmentDate": "2024-02-21T15:00:00Z",
  "durationMinutes": 45,
  "reason": "Follow-up for hypertension and medication review",
  "notes": "Extended appointment for comprehensive review"
}
```

### Expected Response (200 OK)
```json
{
  "id": "{{appointment_id}}",
  "patientId": "{{patient_id}}",
  "centerId": "{{center_id}}",
  "providerId": "{{provider_id}}",
  "appointmentDate": "2024-02-21T15:00:00Z",
  "durationMinutes": 45,
  "reason": "Follow-up for hypertension and medication review",
  "priority": "normal",
  "status": "scheduled",
  "notes": "Extended appointment for comprehensive review",
  "doctor": "Dr. John Smith",
  "isRecurring": false,
  "createdAt": "2024-02-15T10:00:00Z",
  "updatedAt": "2024-02-21T10:00:00Z"
}
```

### Error Responses
- **400 Bad Request**: Invalid data format
- **401 Unauthorized**: Invalid or missing access token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Appointment not found
- **409 Conflict**: New time slot already booked
- **422 Unprocessable Entity**: Validation errors

---

## 5. Cancel Appointment

### Endpoint
```
PATCH /appointments/{{appointment_id}}
```

### Headers
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

### Request Body
```json
{
  "status": "cancelled",
  "notes": "Patient unable to attend"
}
```

### Expected Response (200 OK)
```json
{
  "id": "{{appointment_id}}",
  "patientId": "{{patient_id}}",
  "centerId": "{{center_id}}",
  "providerId": "{{provider_id}}",
  "appointmentDate": "2024-02-20T14:00:00Z",
  "durationMinutes": 30,
  "reason": "Follow-up for hypertension",
  "priority": "normal",
  "status": "cancelled",
  "notes": "Patient unable to attend",
  "doctor": "Dr. John Smith",
  "cancelledAt": "2024-02-16T10:00:00Z",
  "updatedAt": "2024-02-16T10:00:00Z"
}
```

### Error Responses
- **400 Bad Request**: Invalid status or data format
- **401 Unauthorized**: Invalid or missing access token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Appointment not found
- **409 Conflict**: Cannot cancel completed appointment
- **422 Unprocessable Entity**: Validation errors

---

## 6. Get My Appointments

### Endpoint
```
GET /appointments/me
```

### Headers
```
Authorization: Bearer {{access_token}}
```

### Query Parameters
```
status=scheduled&upcoming=true&limit=20
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status |
| upcoming | boolean | No | Show only upcoming appointments |
| limit | number | No | Maximum items to return |
| page | number | No | Page number |

### Expected Response (200 OK)
```json
{
  "data": [
    {
      "id": "app_123456789",
      "patientId": "{{patient_id}}",
      "centerId": "{{center_id}}",
      "providerId": "{{provider_id}}",
      "appointmentDate": "2024-02-20T14:00:00Z",
      "durationMinutes": 30,
      "reason": "Follow-up for hypertension",
      "priority": "normal",
      "status": "scheduled",
      "notes": "Patient requested afternoon appointment",
      "doctor": "Dr. John Smith",
      "centerName": "Downtown Medical Center",
      "providerName": "Dr. John Smith"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

### Error Responses
- **401 Unauthorized**: Invalid or missing access token
- **422 Unprocessable Entity**: Invalid query parameters

---

## 7. Get Available Slots

### Endpoint
```
GET /appointments/slots/available
```

### Headers
```
Authorization: Bearer {{access_token}}
```

### Query Parameters
```
providerId={{provider_id}}&date=2024-02-20&duration=30
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| providerId | string | Yes | Provider ID |
| date | string | Yes | Date in YYYY-MM-DD format |
| duration | number | Yes | Appointment duration in minutes |

### Expected Response (200 OK)
```json
{
  "providerId": "{{provider_id}}",
  "date": "2024-02-20",
  "availableSlots": [
    {
      "startTime": "09:00",
      "endTime": "09:30",
      "duration": 30,
      "isAvailable": true
    },
    {
      "startTime": "14:00",
      "endTime": "14:30",
      "duration": 30,
      "isAvailable": true
    }
  ]
}
```

### Error Responses
- **400 Bad Request**: Missing required parameters
- **401 Unauthorized**: Invalid or missing access token
- **404 Not Found**: Provider not found
- **422 Unprocessable Entity**: Invalid date format

---

## 8. Get Appointment Types by Center

### Endpoint
```
GET /appointments/types/center/{{center_id}}
```

### Headers
```
None required
```

### Expected Response (200 OK)
```json
{
  "centerId": "{{center_id}}",
  "appointmentTypes": [
    {
      "id": "type_123",
      "name": "Consultation",
      "description": "Standard consultation appointment",
      "durationMinutes": 30,
      "color": "#007bff",
      "isActive": true
    },
    {
      "id": "type_456",
      "name": "Follow-up",
      "description": "Follow-up appointment",
      "durationMinutes": 45,
      "color": "#28a745",
      "isActive": true
    }
  ]
}
```

### Error Responses
- **404 Not Found**: Center not found

---

## 9. Create Appointment Type

### Endpoint
```
POST /appointments/types/center/{{center_id}}
```

### Headers
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

### Request Body
```json
{
  "name": "Consultation",
  "description": "Standard consultation appointment",
  "durationMinutes": 30,
  "color": "#007bff",
  "isActive": true
}
```

### Expected Response (201 Created)
```json
{
  "id": "type_123",
  "centerId": "{{center_id}}",
  "name": "Consultation",
  "description": "Standard consultation appointment",
  "durationMinutes": 30,
  "color": "#007bff",
  "isActive": true,
  "createdAt": "2024-02-15T10:00:00Z",
  "updatedAt": "2024-02-15T10:00:00Z"
}
```

### Error Responses
- **400 Bad Request**: Invalid data format
- **401 Unauthorized**: Invalid or missing access token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Center not found
- **409 Conflict**: Appointment type name already exists
- **422 Unprocessable Entity**: Validation errors

---

## 10. Get Provider Availability

### Endpoint
```
GET /appointments/availability/provider/{{provider_id}}
```

### Headers
```
None required
```

### Expected Response (200 OK)
```json
{
  "providerId": "{{provider_id}}",
  "availability": [
    {
      "id": "avail_123",
      "dayOfWeek": "monday",
      "startTime": "09:00",
      "endTime": "17:00",
      "isAvailable": true,
      "maxAppointments": 20
    },
    {
      "id": "avail_456",
      "dayOfWeek": "tuesday",
      "startTime": "09:00",
      "endTime": "17:00",
      "isAvailable": true,
      "maxAppointments": 20
    }
  ]
}
```

### Error Responses
- **404 Not Found**: Provider not found

---

## 11. Create Provider Availability

### Endpoint
```
POST /appointments/availability
```

### Headers
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

### Request Body
```json
{
  "providerId": "{{provider_id}}",
  "dayOfWeek": "monday",
  "startTime": "09:00",
  "endTime": "17:00",
  "isAvailable": true,
  "maxAppointments": 20
}
```

### Expected Response (201 Created)
```json
{
  "id": "avail_123",
  "providerId": "{{provider_id}}",
  "dayOfWeek": "monday",
  "startTime": "09:00",
  "endTime": "17:00",
  "isAvailable": true,
  "maxAppointments": 20,
  "createdAt": "2024-02-15T10:00:00Z",
  "updatedAt": "2024-02-15T10:00:00Z"
}
```

### Error Responses
- **400 Bad Request**: Invalid data format
- **401 Unauthorized**: Invalid or missing access token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Provider not found
- **409 Conflict**: Availability already exists for this day
- **422 Unprocessable Entity**: Validation errors

---

## 12. Update Provider Availability

### Endpoint
```
PATCH /appointments/availability/{{availability_id}}
```

### Headers
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

### Request Body
```json
{
  "startTime": "08:00",
  "endTime": "18:00",
  "maxAppointments": 25
}
```

### Expected Response (200 OK)
```json
{
  "id": "{{availability_id}}",
  "providerId": "{{provider_id}}",
  "dayOfWeek": "monday",
  "startTime": "08:00",
  "endTime": "18:00",
  "isAvailable": true,
  "maxAppointments": 25,
  "updatedAt": "2024-02-15T10:00:00Z"
}
```

### Error Responses
- **400 Bad Request**: Invalid data format
- **401 Unauthorized**: Invalid or missing access token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Availability record not found
- **422 Unprocessable Entity**: Validation errors

---

## 13. Get Provider Time Slots

### Endpoint
```
GET /appointments/slots/provider/{{provider_id}}
```

### Headers
```
None required
```

### Expected Response (200 OK)
```json
{
  "providerId": "{{provider_id}}",
  "timeSlots": [
    {
      "id": "slot_123",
      "startTime": "09:00",
      "endTime": "09:30",
      "duration": 30,
      "isBooked": false,
      "appointmentId": null
    },
    {
      "id": "slot_456",
      "startTime": "14:00",
      "endTime": "14:30",
      "duration": 30,
      "isBooked": true,
      "appointmentId": "app_123"
    }
  ]
}
```

### Error Responses
- **404 Not Found**: Provider not found

---

## 14. Get Pending Reminders

### Endpoint
```
GET /appointments/reminders/pending
```

### Headers
```
Authorization: Bearer {{access_token}}
```

### Expected Response (200 OK)
```json
{
  "data": [
    {
      "id": "reminder_123",
      "appointmentId": "app_123",
      "reminderType": "sms",
      "reminderTime": "2024-03-15T09:00:00Z",
      "message": "Reminder: Your appointment is in 1 hour",
      "status": "pending",
      "createdAt": "2024-03-15T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

### Error Responses
- **401 Unauthorized**: Invalid or missing access token
- **403 Forbidden**: Insufficient permissions

---

## 15. Mark Reminder as Sent

### Endpoint
```
PATCH /appointments/reminders/{{reminder_id}}/sent
```

### Headers
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

### Request Body
```json
{
  "sentAt": "2024-03-15T10:00:00Z",
  "deliveryStatus": "delivered"
}
```

### Expected Response (200 OK)
```json
{
  "id": "{{reminder_id}}",
  "appointmentId": "app_123",
  "reminderType": "sms",
  "reminderTime": "2024-03-15T09:00:00Z",
  "message": "Reminder: Your appointment is in 1 hour",
  "status": "sent",
  "sentAt": "2024-03-15T10:00:00Z",
  "deliveryStatus": "delivered",
  "updatedAt": "2024-03-15T10:00:00Z"
}
```

### Error Responses
- **400 Bad Request**: Invalid data format
- **401 Unauthorized**: Invalid or missing access token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Reminder not found
- **422 Unprocessable Entity**: Validation errors

---

## 16. Create Manual Reminder

### Endpoint
```
POST /appointments/reminders
```

### Headers
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

### Request Body
```json
{
  "appointmentId": "{{appointment_id}}",
  "reminderType": "sms",
  "reminderTime": "2024-03-15T09:00:00Z",
  "message": "Reminder: Your appointment is in 1 hour"
}
```

### Expected Response (201 Created)
```json
{
  "id": "reminder_123",
  "appointmentId": "{{appointment_id}}",
  "reminderType": "sms",
  "reminderTime": "2024-03-15T09:00:00Z",
  "message": "Reminder: Your appointment is in 1 hour",
  "status": "pending",
  "createdAt": "2024-03-15T08:00:00Z",
  "updatedAt": "2024-03-15T08:00:00Z"
}
```

### Error Responses
- **400 Bad Request**: Invalid data format
- **401 Unauthorized**: Invalid or missing access token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Appointment not found
- **422 Unprocessable Entity**: Validation errors

---

## 17. Confirm Appointment

### Endpoint
```
PATCH /appointments/{{appointment_id}}/confirm
```

### Headers
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

### Request Body
```json
{
  "status": "confirmed",
  "confirmedAt": "2024-03-15T10:00:00Z"
}
```

### Expected Response (200 OK)
```json
{
  "id": "{{appointment_id}}",
  "patientId": "{{patient_id}}",
  "centerId": "{{center_id}}",
  "providerId": "{{provider_id}}",
  "appointmentDate": "2024-02-20T14:00:00Z",
  "durationMinutes": 30,
  "reason": "Follow-up for hypertension",
  "priority": "normal",
  "status": "confirmed",
  "notes": "Patient requested afternoon appointment",
  "doctor": "Dr. John Smith",
  "confirmedAt": "2024-03-15T10:00:00Z",
  "updatedAt": "2024-03-15T10:00:00Z"
}
```

### Error Responses
- **400 Bad Request**: Invalid data format
- **401 Unauthorized**: Invalid or missing access token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Appointment not found
- **409 Conflict**: Cannot confirm cancelled or completed appointment
- **422 Unprocessable Entity**: Validation errors

---

## 18. Complete Appointment

### Endpoint
```
PATCH /appointments/{{appointment_id}}/complete
```

### Headers
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

### Request Body
```json
{
  "status": "completed",
  "completedAt": "2024-03-15T10:30:00Z",
  "completionNotes": "Appointment completed successfully"
}
```

### Expected Response (200 OK)
```json
{
  "id": "{{appointment_id}}",
  "patientId": "{{patient_id}}",
  "centerId": "{{center_id}}",
  "providerId": "{{provider_id}}",
  "appointmentDate": "2024-02-20T14:00:00Z",
  "durationMinutes": 30,
  "reason": "Follow-up for hypertension",
  "priority": "normal",
  "status": "completed",
  "notes": "Patient requested afternoon appointment",
  "doctor": "Dr. John Smith",
  "completedAt": "2024-03-15T10:30:00Z",
  "completionNotes": "Appointment completed successfully",
  "updatedAt": "2024-03-15T10:30:00Z"
}
```

### Error Responses
- **400 Bad Request**: Invalid data format
- **401 Unauthorized**: Invalid or missing access token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Appointment not found
- **409 Conflict**: Cannot complete cancelled appointment
- **422 Unprocessable Entity**: Validation errors

---

## 19. Delete Appointment

### Endpoint
```
DELETE /appointments/{{appointment_id}}
```

### Headers
```
Authorization: Bearer {{access_token}}
```

### Expected Response (204 No Content)
```
No response body
```

### Error Responses
- **401 Unauthorized**: Invalid or missing access token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Appointment not found
- **409 Conflict**: Cannot delete confirmed or completed appointment

---

## 20. Create Recurring Appointment

### Endpoint
```
POST /appointments/recurring
```

### Headers
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

### Request Body
```json
{
  "patientId": "{{patient_id}}",
  "centerId": "{{center_id}}",
  "providerId": "{{provider_id}}",
  "startDate": "2024-03-15T10:00:00Z",
  "endDate": "2024-06-15T10:00:00Z",
  "recurrencePattern": "weekly",
  "recurrenceInterval": 1,
  "dayOfWeek": "monday",
  "durationMinutes": 30,
  "reason": "Weekly follow-up"
}
```

### Expected Response (201 Created)
```json
{
  "id": "recurring_123",
  "patientId": "{{patient_id}}",
  "centerId": "{{center_id}}",
  "providerId": "{{provider_id}}",
  "startDate": "2024-03-15T10:00:00Z",
  "endDate": "2024-06-15T10:00:00Z",
  "recurrencePattern": "weekly",
  "recurrenceInterval": 1,
  "dayOfWeek": "monday",
  "durationMinutes": 30,
  "reason": "Weekly follow-up",
  "status": "active",
  "appointmentsCreated": 12,
  "createdAt": "2024-03-15T10:00:00Z",
  "updatedAt": "2024-03-15T10:00:00Z"
}
```

### Error Responses
- **400 Bad Request**: Invalid data format
- **401 Unauthorized**: Invalid or missing access token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Patient, center, or provider not found
- **409 Conflict**: Time slots already booked
- **422 Unprocessable Entity**: Validation errors

---

## 21. Update Recurring Appointment Series

### Endpoint
```
PATCH /appointments/recurring/{{recurring_id}}
```

### Headers
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

### Request Body
```json
{
  "endDate": "2024-08-15T10:00:00Z",
  "recurrenceInterval": 2,
  "notes": "Extended series with bi-weekly appointments"
}
```

### Expected Response (200 OK)
```json
{
  "id": "{{recurring_id}}",
  "patientId": "{{patient_id}}",
  "centerId": "{{center_id}}",
  "providerId": "{{provider_id}}",
  "startDate": "2024-03-15T10:00:00Z",
  "endDate": "2024-08-15T10:00:00Z",
  "recurrencePattern": "weekly",
  "recurrenceInterval": 2,
  "dayOfWeek": "monday",
  "durationMinutes": 30,
  "reason": "Weekly follow-up",
  "status": "active",
  "notes": "Extended series with bi-weekly appointments",
  "updatedAt": "2024-03-15T10:00:00Z"
}
```

### Error Responses
- **400 Bad Request**: Invalid data format
- **401 Unauthorized**: Invalid or missing access token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Recurring appointment series not found
- **422 Unprocessable Entity**: Validation errors

---

## 22. Cancel Recurring Appointment Series

### Endpoint
```
DELETE /appointments/recurring/{{recurring_id}}
```

### Headers
```
Authorization: Bearer {{access_token}}
```

### Expected Response (204 No Content)
```
No response body
```

### Error Responses
- **401 Unauthorized**: Invalid or missing access token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Recurring appointment series not found

---

## 23. Get Recurring Appointments

### Endpoint
```
GET /appointments/recurring/{{recurring_id}}
```

### Headers
```
Authorization: Bearer {{access_token}}
```

### Expected Response (200 OK)
```json
{
  "id": "{{recurring_id}}",
  "patientId": "{{patient_id}}",
  "centerId": "{{center_id}}",
  "providerId": "{{provider_id}}",
  "startDate": "2024-03-15T10:00:00Z",
  "endDate": "2024-06-15T10:00:00Z",
  "recurrencePattern": "weekly",
  "recurrenceInterval": 1,
  "dayOfWeek": "monday",
  "durationMinutes": 30,
  "reason": "Weekly follow-up",
  "status": "active",
  "appointments": [
    {
      "id": "app_123",
      "appointmentDate": "2024-03-15T10:00:00Z",
      "status": "scheduled"
    },
    {
      "id": "app_124",
      "appointmentDate": "2024-03-22T10:00:00Z",
      "status": "scheduled"
    }
  ]
}
```

### Error Responses
- **401 Unauthorized**: Invalid or missing access token
- **404 Not Found**: Recurring appointment series not found

---

## 24. Get Appointment Analytics

### Endpoint
```
GET /appointments/analytics/{{center_id}}
```

### Headers
```
Authorization: Bearer {{access_token}}
```

### Expected Response (200 OK)
```json
{
  "centerId": "{{center_id}}",
  "period": "2024-02",
  "metrics": {
    "totalAppointments": 150,
    "completedAppointments": 120,
    "cancelledAppointments": 15,
    "noShowAppointments": 10,
    "averageDuration": 35,
    "utilizationRate": 0.85
  },
  "byProvider": [
    {
      "providerId": "{{provider_id}}",
      "providerName": "Dr. John Smith",
      "totalAppointments": 45,
      "completedAppointments": 40,
      "cancellationRate": 0.11
    }
  ],
  "byDate": [
    {
      "date": "2024-02-01",
      "totalAppointments": 8,
      "completedAppointments": 7
    }
  ]
}
```

### Error Responses
- **401 Unauthorized**: Invalid or missing access token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Center not found

---

## Common Error Response Format

All error responses follow this standard format:

```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "error": "Validation failed",
  "details": [
    {
      "field": "appointmentDate",
      "message": "Appointment date must be in the future"
    }
  ],
  "timestamp": "2024-02-15T10:00:00Z",
  "path": "/appointments"
}
```

## Status Codes Summary

| Status Code | Description | Usage |
|-------------|-------------|-------|
| 200 | OK | Successful GET, PATCH operations |
| 201 | Created | Successful POST operations |
| 204 | No Content | Successful DELETE operations |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Business rule violation |
| 422 | Unprocessable Entity | Validation errors |
| 500 | Internal Server Error | Server-side error |

## Rate Limiting

- **Standard endpoints**: 100 requests per minute per user
- **Analytics endpoints**: 10 requests per minute per user
- **Bulk operations**: 5 requests per minute per user

## Pagination

All list endpoints support pagination with these parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Response includes pagination metadata:
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```
