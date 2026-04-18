# Frontend API Guide: Appointments Workflow

## 📡 Base URL

```
https://api.unlimtedhealth.com/api
```

## 🔐 Authentication

All endpoints require JWT.

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

## 🧭 Overview

- Create an appointment (patient → doctor/center)
- List/filter appointments
- Confirm/cancel/complete appointment
- Get provider availability and time slots
- Manage appointment types (center/staff/admin)

## 🚶 Typical Workflow

1. Patient checks provider availability
   - GET `/appointments/availability/provider/{providerId}`
   - GET `/appointments/slots/provider/{providerId}?date=YYYY-MM-DD&durationMinutes=30`
2. Patient creates appointment (pending confirmation)
   - POST `/appointments` with `CreateAppointmentDto`
   - Result: `appointmentStatus = scheduled`, `confirmationStatus = pending`
3. Provider/center confirms or cancels
   - Confirm: PATCH `/appointments/{id}/confirm` → `appointmentStatus = confirmed`, `confirmationStatus = confirmed`
   - Cancel: PATCH `/appointments/{id}/cancel` with optional `cancellationReason`
4. Reminders (system)
   - GET `/appointments/reminders/pending` (internal) → Mark sent via PATCH `/appointments/reminders/{reminderId}/sent`
5. Day of appointment
   - Optional status updates via PATCH `/appointments/{id}` (e.g., `appointmentStatus = in_progress`)
6. Complete
   - PATCH `/appointments/{id}/complete` → `appointmentStatus = completed`

Notes:
- Patients can cancel their own appointments; providers/center can cancel or confirm.
- Always pass `patientId` (not `userId`).

---

## 📥 Create Appointment

POST `/appointments`

Request body (CreateAppointmentDto):

```json
{
  "patientId": "<uuid>",
  "centerId": "<uuid>",
  "providerId": "<uuid>",
  "appointmentTypeId": "<uuid>",
  "appointmentDate": "2025-05-26T09:00:00Z",
  "durationMinutes": 30,
  "priority": "normal",
  "reason": "Follow-up consultation",
  "notes": "Patient prefers morning",
  "doctor": "Dr. John Smith",
  "isRecurring": false,
  "recurrencePattern": null,
  "metadata": {
    "preparation": "Fast 8 hours",
    "reminderPreferences": { "emailEnabled": true, "smsEnabled": false, "reminderTiming": [24, 2] }
  }
}
```

Notes:
- Required: `patientId`, `centerId`, `appointmentDate`, `reason`, `doctor`
- Optional: `providerId`, `appointmentTypeId`, `durationMinutes` (default 30), `priority` (low|normal|high|urgent), `isRecurring`, `recurrencePattern`, `metadata`

Sample response:

```json
{
  "id": "<uuid>",
  "patientId": "<uuid>",
  "centerId": "<uuid>",
  "providerId": "<uuid>",
  "appointmentTypeId": "<uuid>",
  "appointmentDate": "2025-05-26T09:00:00Z",
  "durationMinutes": 30,
  "priority": "normal",
  "reason": "Follow-up consultation",
  "notes": "Patient prefers morning",
  "doctor": "Dr. John Smith",
  "appointmentStatus": "scheduled",
  "confirmationStatus": "pending",
  "createdAt": "2025-05-01T10:00:00Z",
  "updatedAt": "2025-05-01T10:00:00Z"
}
```

---

## 📋 List & Filter Appointments

GET `/appointments`

Query params:
- `page` (default 1), `limit` (default 10)
- `centerId`, `providerId`, `patientId` (UUIDs)
- `status` (scheduled|confirmed|in_progress|completed|cancelled|no_show)
- `dateFrom`, `dateTo` (ISO date strings)

Example:

```http
GET /appointments?patientId=<uuid>&status=confirmed&dateFrom=2025-05-01T00:00:00Z&dateTo=2025-06-01T00:00:00Z
```

Response:

```json
{
  "data": [
    { "id": "<uuid>", "appointmentDate": "2025-05-26T09:00:00Z", "status": "confirmed", "doctor": "Dr. John Smith" }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

Validation:
- Invalid UUID for `centerId`, `providerId`, or `patientId` → 400 Bad Request

---

## ✅ Confirm / ❌ Cancel / 🏁 Complete

- PATCH `/appointments/{id}/confirm`
- PATCH `/appointments/{id}/cancel`
- PATCH `/appointments/{id}/complete`

Confirm request example:

```http
PATCH /appointments/<id>/confirm
```

Response:

```json
{ "id": "<uuid>", "appointmentStatus": "confirmed", "confirmationStatus": "confirmed", "confirmedAt": "2025-05-02T11:00:00Z" }
```

Cancel request example:

```http
PATCH /appointments/<id>/cancel
Content-Type: application/json

{ "cancellationReason": "Patient unavailable" }
```

Response:

```json
{ "id": "<uuid>", "appointmentStatus": "cancelled", "cancellationReason": "Patient unavailable" }
```

Complete request example:

```http
PATCH /appointments/<id>/complete
```

Response:

```json
{ "id": "<uuid>", "appointmentStatus": "completed" }
```

---

## 🗓️ Provider Availability & Slots

GET `/appointments/availability/provider/{providerId}`

Response:

```json
{
  "providerId": "<uuid>",
  "availability": [
    { "day": "monday", "start": "09:00", "end": "17:00", "timezone": "Africa/Lagos" }
  ]
}
```

GET `/appointments/slots/provider/{providerId}?date=2025-05-26&durationMinutes=30`

Response:

```json
{
  "providerId": "<uuid>",
  "date": "2025-05-26",
  "slots": ["09:00", "09:30", "10:00", "10:30"]
}
```

---

## 🏷️ Appointment Types (Center)

GET `/appointments/types/center/{centerId}`

Response:

```json
[
  { "id": "<uuid>", "name": "General Consultation", "durationMinutes": 30, "isActive": true }
]
```

POST `/appointments/types/center/{centerId}`

```json
{ "name": "Dermatology", "durationMinutes": 45, "isActive": true }
```

---

## 🧾 Real DTOs (reference)

CreateAppointmentDto (selected fields):

```json
{
  "patientId": "uuid",
  "centerId": "uuid",
  "providerId": "uuid?",
  "appointmentTypeId": "uuid?",
  "appointmentDate": "ISO-8601",
  "durationMinutes": 30,
  "priority": "low|normal|high|urgent",
  "reason": "string",
  "notes": "string?",
  "doctor": "string",
  "isRecurring": false,
  "recurrencePattern": { "frequency": "weekly", "interval": 2, "count": 10 },
  "metadata": { "preparation": "..." }
}
```

UpdateAppointmentDto (selected fields):

```json
{
  "appointmentStatus": "scheduled|confirmed|in_progress|completed|cancelled|no_show",
  "confirmationStatus": "pending|confirmed|declined",
  "cancellationReason": "string?",
  "confirmedAt": "ISO-8601",
  "metadata": { "preparation": "..." }
}
```

---

## ⚠️ Errors to Handle (Frontend)

- 400 Bad Request
  - Invalid UUID in `centerId`/`providerId`/`patientId`
  - Invalid date format for `appointmentDate`
  - Invalid enum values (e.g., `priority`, `appointmentStatus`)

- 401 Unauthorized
  - Missing/expired/invalid JWT
  - Action: redirect to login, refresh token flow

- 403 Forbidden
  - User lacks role/permission for the action (e.g., confirming without doctor/staff/center role)

- 404 Not Found
  - Appointment, provider, or center does not exist

- 409 Conflict (possible)
  - Overlapping appointment/time slot no longer available

- 422 Unprocessable Entity (validation)
  - DTO validation failures; show field-level messages

Error payload example:

```json
{
  "statusCode": 400,
  "timestamp": "2025-05-01T11:22:33.123Z",
  "path": "/api/appointments",
  "method": "POST",
  "message": "Invalid centerId format",
  "error": "Bad Request",
  "code": "HTTP_EXCEPTION"
}
```

---

## 🧪 Quick Test Snippets (fetch)

Create appointment:

```ts
const token = localStorage.getItem('authToken');
const res = await fetch('https://api.unlimtedhealth.com/api/appointments', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ patientId, centerId, providerId, appointmentDate, reason, doctor })
});
if (!res.ok) throw await res.json();
const appt = await res.json();
```

Confirm:

```ts
await fetch(`https://api.unlimtedhealth.com/api/appointments/${id}/confirm`, {
  method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` }
});
```

Cancel:

```ts
await fetch(`https://api.unlimtedhealth.com/api/appointments/${id}/cancel`, {
  method: 'PATCH',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ cancellationReason: 'Patient unavailable' })
});
```

---

## ✅ Tips

- Always pass `patientId` (from patient record) not `userId`
- Validate dates client-side to avoid 400s
- Handle 401/403 centrally in your API client
- After confirm/cancel/complete, re-fetch the appointment list or invalidate cache


