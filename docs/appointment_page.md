## Appointments Page - Required API Endpoints

Base URL: `/api`

Authentication: All endpoints below (unless noted) require a Bearer access token.

### 1) Current User
- GET `/auth/me`
  - Hydrate app with current user and profile (after login/register).

### 2) Dashboard KPIs (cards at top)
- GET `/appointments?status=confirmed&dateFrom=YYYY-MM-01&dateTo=YYYY-MM-DD`
  - Use filters to compute: total appointments, confirmed today, pending confirmation, cancellation rate, avg wait time, unique patients.
- GET `/appointments/analytics/:centerId` (admin/center/staff/doctor)
  - For aggregated metrics if user is staff/center/admin.

### 3) Filters/Search Bar
- GET `/appointments`
  - Query params: `page`, `limit`, `status`, `centerId`, `providerId`, `patientId`, `dateFrom`, `dateTo`.
  - Drives the appointments list with server-side filtering and pagination.

### 4) Quick Filters (chips)
- GET `/appointments?status=pending` (Pending Confirmation)
- GET `/appointments?priority=urgent` (Urgent Priority, if supported by backend filter)
- GET `/appointments?dateFrom=today&dateTo=today` (Today’s Appointments)

### 5) Appointments List (main table/cards)
- GET `/appointments`
  - Same as Filters/Search. Include `page` and `limit`.
- PATCH `/appointments/:id/confirm`
- PATCH `/appointments/:id/cancel` (body: `{ reason, cancelledBy }`)
- PATCH `/appointments/:id` (reschedule or update details; body matches `UpdateAppointmentDto`)
- PATCH `/appointments/:id/complete` (notes/metadata; staff/center/admin)
- DELETE `/appointments/:id` (if needed)

### 6) Create/Reschedule Appointment (drawer/modals)
- POST `/appointments` (body: `CreateAppointmentDto`)
- GET `/appointments/types/center/:centerId` (load appointment types)
- GET `/appointments/availability/provider/:providerId?date=YYYY-MM-DD` (provider availability)
- GET `/appointments/slots/provider/:providerId?date=YYYY-MM-DD` (available time slots)

### 7) Quick Actions (sidebar)
- POST `/appointments` (Book New Appointment)
- GET `/appointments/slots/provider/:providerId?date=YYYY-MM-DD` (View Available Slots)
- For “Reschedule Appointment” use:
  - GET `/appointments/:id`
  - PATCH `/appointments/:id` with new date/time

### 8) Next Appointment (sidebar widget)
- GET `/appointments?patientId=:currentUserId&status=confirmed&dateFrom=today&limit=1`
  - Use soonest confirmed upcoming appointment.
- For video: POST `/video-conferences/:conferenceId/join` (when appointment has an associated conference)

### 9) Provider Availability (sidebar widget)
- GET `/appointments/availability/provider/:providerId`
- GET `/appointments/slots/provider/:providerId?date=YYYY-MM-DD`

### 10) Reminders (back-office widgets)
- GET `/appointments/reminders/pending` (admin/doctor/staff/center)
- PATCH `/appointments/reminders/:reminderId/sent`
- POST `/appointments/reminders` (manual reminder)

### 11) Recurring Appointments (if needed)
- POST `/appointments/recurring`
- PATCH `/appointments/recurring/:id`
- DELETE `/appointments/recurring/:id`
- GET `/appointments/recurring/:id`

### 12) Video Conferencing (Join Call button)
- POST `/video-conferences` (create room if not already created)
- POST `/video-conferences/:conferenceId/join`
- POST `/video-conferences/:conferenceId/leave`
- POST `/video-conferences/:conferenceId/start` (host)
- POST `/video-conferences/:conferenceId/end` (host)

Notes
- Use `/auth/me` post-login to get user and their role to drive which actions to show (e.g., complete appointment, analytics).
- All IDs are UUIDs. Validate on the client before calling route params.

---

## Example API Calls (DTO-based)

All examples assume base URL prefix `/api` and `Authorization: Bearer <access_token>` where required.

### Create Appointment (CreateAppointmentDto)
```bash
curl -X POST "https://api.unlimtedhealth.com/api/appointments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "patientId": "00000000-0000-0000-0000-000000000001",
    "centerId": "00000000-0000-0000-0000-000000000002",
    "providerId": "00000000-0000-0000-0000-000000000003",
    "appointmentTypeId": "00000000-0000-0000-0000-000000000004",
    "appointmentDate": "2025-05-26T09:00:00Z",
    "durationMinutes": 30,
    "priority": "normal",
    "reason": "Follow-up for hypertension",
    "notes": "Please prepare last BP readings",
    "doctor": "Dr. John Smith",
    "isRecurring": false
  }'
```

### Update Appointment (UpdateAppointmentDto)
```bash
curl -X PATCH "https://api.unlimtedhealth.com/api/appointments/00000000-0000-0000-0000-000000009999" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "appointmentDate": "2025-05-26T10:00:00Z",
    "confirmationStatus": "confirmed",
    "appointmentStatus": "confirmed",
    "confirmedAt": "2025-05-20T08:00:00Z",
    "notes": "Patient confirmed new time"
  }'
```

### Create Appointment Type (CreateAppointmentTypeDto)
```bash
curl -X POST "https://api.unlimtedhealth.com/api/appointments/types/center/00000000-0000-0000-0000-0000000000aa" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "General Consultation",
    "description": "Standard 30-minute visit",
    "durationMinutes": 30,
    "colorCode": "#3B82F6",
    "requiresPreparation": false,
    "preparationInstructions": "",
    "isActive": true
  }'
```

### Create Provider Availability (CreateProviderAvailabilityDto)
```bash
curl -X POST "https://api.unlimtedhealth.com/api/appointments/availability" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "providerId": "00000000-0000-0000-0000-0000000000bb",
    "centerId": "00000000-0000-0000-0000-0000000000aa",
    "dayOfWeek": 1,
    "startTime": "09:00",
    "endTime": "17:00",
    "isAvailable": true,
    "maxAppointmentsPerSlot": 1,
    "slotDurationMinutes": 30,
    "bufferTimeMinutes": 5
  }'
```

### Update Provider Availability (Partial<CreateProviderAvailabilityDto>)
```bash
curl -X PATCH "https://api.unlimtedhealth.com/api/appointments/availability/00000000-0000-0000-0000-00000000a1a1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "startTime": "08:30",
    "endTime": "16:30",
    "slotDurationMinutes": 20
  }'
```

### Create Recurring Appointment (CreateRecurringAppointmentDto)
```bash
curl -X POST "https://api.unlimtedhealth.com/api/appointments/recurring" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "patientId": "00000000-0000-0000-0000-000000000001",
    "centerId": "00000000-0000-0000-0000-000000000002",
    "providerId": "00000000-0000-0000-0000-000000000003",
    "appointmentTypeId": "00000000-0000-0000-0000-000000000004",
    "appointmentDate": "2025-06-01T09:00:00Z",
    "durationMinutes": 30,
    "reason": "Physical therapy",
    "notes": "Morning preferred",
    "doctor": "Dr. Jane Doe",
    "isRecurring": true,
    "recurrencePattern": {
      "frequency": "weekly",
      "interval": 1,
      "daysOfWeek": ["monday", "wednesday"],
      "endDate": "2025-08-31T00:00:00Z"
    }
  }'
```

### Create Video Conference (CreateVideoConferenceDto)
```bash
curl -X POST "https://api.unlimtedhealth.com/api/video-conferences" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Patient Consultation",
    "description": "Follow-up consultation",
    "type": "consultation",
    "appointmentId": "00000000-0000-0000-0000-00000000abcd",
    "scheduledStartTime": "2025-05-26T09:00:00Z",
    "scheduledEndTime": "2025-05-26T09:30:00Z",
    "maxParticipants": 4,
    "isRecordingEnabled": true,
    "waitingRoomEnabled": true,
    "muteParticipantsOnEntry": true,
    "provider": "webrtc",
    "participantIds": [
      "00000000-0000-0000-0000-00000000p001",
      "00000000-0000-0000-0000-00000000p002"
    ]
  }'
```

