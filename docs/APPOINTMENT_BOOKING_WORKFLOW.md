# Healthcare Appointment Booking Workflow

## Overview
This document outlines the complete workflow for patient appointment booking in the healthcare management system, covering account creation for patients, doctors, and centers, and their interactions throughout the appointment lifecycle.

## System Architecture

### User Roles & Permissions
- **Patient**: Can book appointments, view own medical records, manage profile
- **Doctor**: Can manage patients, view medical records, manage appointments, set availability
- **Center**: Can manage staff, set center availability, manage services
- **Staff**: Can assist with appointments, patient care, administrative tasks
- **Admin**: Full system access, user management, system configuration

## Complete Workflow: Patient Booking Appointment with Doctor at Center

### Phase 1: Account Creation & Setup

#### 1.1 Patient Account Creation
**Endpoint**: `POST /api/auth/register`
```json
{
  "email": "patient@example.com",
  "password": "StrongP@ss123!",
  "name": "John Doe",
  "roles": ["patient"],
  "phone": "+1234567890"
}
```

**Response**:
```json
{
  "user": {
    "id": "uuid",
    "email": "patient@example.com",
    "roles": ["patient"],
    "displayId": "PT123456"
  },
  "access_token": "jwt_token"
}
```

**Next Steps**:
1. Patient logs in and creates profile
2. Patient profile is automatically created in patients table
3. Patient can update medical information (allergies, conditions, etc.)

#### 1.2 Center Account Creation
**Endpoint**: `POST /api/auth/register`
```json
{
  "email": "center@hospital.com",
  "password": "CenterP@ss123!",
  "name": "General Hospital",
  "roles": ["center"],
  "phone": "+1987654321"
}
```

**Next Steps**:
1. Center admin logs in
2. Creates center profile with services and availability
3. Adds doctors and staff to the center

#### 1.3 Doctor Account Creation
**Endpoint**: `POST /api/auth/register/staff` (requires center or admin role)
```json
{
  "email": "doctor@hospital.com",
  "password": "DoctorP@ss123!",
  "name": "Dr. Jane Smith",
  "roles": ["doctor"],
  "phone": "+1555123456"
}
```

**Next Steps**:
1. Doctor logs in
2. Sets up availability schedule
3. Gets added to center staff

### Phase 2: Center & Doctor Setup

#### 2.1 Center Profile Creation
**Endpoint**: `POST /api/centers`
```json
{
  "name": "General Hospital",
  "type": "hospital",
  "address": "123 Medical St, City, State",
  "phone": "+1987654321",
  "email": "info@hospital.com",
  "hours": "24/7 Emergency, 9AM-5PM General"
}
```

#### 2.2 Center Services Setup
**Endpoint**: `POST /api/centers/{centerId}/services`
```json
{
  "name": "General Consultation",
  "description": "General medical consultation",
  "duration": 30,
  "price": 150.00,
  "isActive": true
}
```

#### 2.3 Doctor Availability Setup
**Endpoint**: `POST /api/appointments/availability`
```json
{
  "providerId": "doctor-uuid",
  "dayOfWeek": "monday",
  "startTime": "09:00",
  "endTime": "17:00",
  "isRecurring": true,
  "isActive": true
}
```

#### 2.4 Add Doctor to Center
**Endpoint**: `POST /api/centers/{centerId}/staff`
```json
{
  "userId": "doctor-uuid",
  "role": "doctor"
}
```

### Phase 3: Appointment Booking Process

#### 3.1 Patient Searches for Centers
**Endpoint**: `GET /api/centers/types/hospital`
- Patient can browse available centers by type
- View center details, services, and availability

#### 3.2 Patient Searches for Available Doctors
**Endpoint**: `GET /api/appointments/availability/provider/{providerId}?date=2025-01-15`
- Patient can check doctor availability for specific dates
- View available time slots

#### 3.3 Patient Books Appointment
**Endpoint**: `POST /api/appointments`
```json
{
  "patientId": "patient-uuid",
  "centerId": "center-uuid",
  "providerId": "doctor-uuid",
  "appointmentDate": "2025-01-15T10:00:00Z",
  "durationMinutes": 30,
  "reason": "Annual checkup",
  "notes": "Patient has concerns about blood pressure",
  "doctor": "Dr. Jane Smith",
  "priority": "normal"
}
```

**Response**:
```json
{
  "id": "appointment-uuid",
  "patientId": "patient-uuid",
  "centerId": "center-uuid",
  "providerId": "doctor-uuid",
  "appointmentDate": "2025-01-15T10:00:00Z",
  "status": "scheduled",
  "confirmationStatus": "pending",
  "createdAt": "2025-01-10T08:00:00Z"
}
```

### Phase 4: Appointment Management & Notifications

#### 4.1 Appointment Confirmation
**Doctor/Center confirms appointment**:
**Endpoint**: `PATCH /api/appointments/{appointmentId}/confirm`

#### 4.2 Appointment Reminders
**System automatically sends reminders**:
- 24 hours before appointment
- 2 hours before appointment
- Via email and SMS (if configured)

#### 4.3 Appointment Day Process

**Patient arrives**:
1. Patient checks in at center
2. Staff updates appointment status to "in_progress"
3. Doctor conducts consultation
4. Medical records are updated
5. Appointment marked as "completed"

**Endpoints used**:
- `PATCH /api/appointments/{id}` - Update status
- `POST /api/medical-records` - Create medical record
- `PATCH /api/appointments/{id}/complete` - Mark completed

### Phase 5: Post-Appointment

#### 5.1 Medical Record Creation
**Endpoint**: `POST /api/medical-records`
```json
{
  "patientId": "patient-uuid",
  "appointmentId": "appointment-uuid",
  "diagnosis": "Hypertension - Stage 1",
  "treatment": "Lifestyle modifications, follow-up in 3 months",
  "medications": "Lisinopril 10mg daily",
  "notes": "Patient advised to reduce sodium intake"
}
```

#### 5.2 Follow-up Scheduling
If follow-up is needed:
- Doctor can create new appointment
- Patient receives notification
- Process repeats from Phase 3

## Key API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Public registration (patient, center)
- `POST /api/auth/register/staff` - Staff registration (admin/center only)
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Centers
- `POST /api/centers` - Create center
- `GET /api/centers/types/{type}` - Get centers by type
- `POST /api/centers/{id}/services` - Add center services
- `POST /api/centers/{id}/staff` - Add staff to center

### Appointments
- `POST /api/appointments` - Book appointment
- `GET /api/appointments` - List appointments (with filters)
- `GET /api/appointments/availability/provider/{id}` - Get doctor availability
- `PATCH /api/appointments/{id}/confirm` - Confirm appointment
- `PATCH /api/appointments/{id}/cancel` - Cancel appointment
- `PATCH /api/appointments/{id}/complete` - Complete appointment

### Medical Records
- `POST /api/medical-records` - Create medical record
- `GET /api/medical-records/patient/{id}` - Get patient records

## Security & Compliance

### Authentication
- JWT tokens for API access
- Role-based access control
- Strong password requirements
- Token refresh mechanism

### Data Protection
- All medical data encrypted
- Audit logging for all actions
- GDPR/HIPAA compliance features
- Patient consent management

### Notifications
- Email notifications for appointments
- SMS reminders (if enabled)
- Real-time updates via WebSocket
- Push notifications for mobile apps

## Error Handling

### Common Error Scenarios
1. **Double Booking**: System prevents overlapping appointments
2. **Invalid Time Slots**: Only available slots can be booked
3. **Expired Tokens**: Automatic token refresh
4. **Permission Denied**: Role-based access enforcement
5. **Data Validation**: Input validation with detailed error messages

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    "appointmentDate must be a valid ISO 8601 date string"
  ]
}
```

## Integration Points

### External Services
- **Supabase**: File storage for medical documents
- **Redis**: Caching for performance
- **Email Service**: Appointment notifications
- **SMS Service**: Text reminders
- **Payment Gateway**: Billing integration (if applicable)

### Mobile App Integration
- RESTful API endpoints
- WebSocket for real-time updates
- Push notification support
- Offline capability for viewing appointments

## Monitoring & Analytics

### Key Metrics
- Appointment booking success rate
- Average time to confirmation
- Cancellation rates
- Patient satisfaction scores
- Doctor availability utilization

### Logging
- All API calls logged
- User actions tracked
- Error monitoring
- Performance metrics

## Future Enhancements

### Planned Features
- Video consultation integration
- AI-powered appointment suggestions
- Automated follow-up scheduling
- Integration with insurance providers
- Multi-language support
- Advanced analytics dashboard

---

This workflow ensures a seamless experience for all stakeholders while maintaining security, compliance, and data integrity throughout the healthcare appointment process.
