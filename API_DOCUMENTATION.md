
# UNLIMITEDHEALTHCARE API Documentation

This document provides comprehensive information about the available API endpoints for the UNLIMITEDHEALTHCARE backend system.

## Postman Collection

A Postman collection has been created to help you test and interact with the API. The collection includes all implemented endpoints with examples.

### How to Import the Collection

1. Download the `postman_collection.json` file
2. Open Postman
3. Click on "Import" button in the top left corner
4. Select the `postman_collection.json` file
5. The collection will be imported with all the endpoints

### Environment Variables

The collection uses the following environment variables that you should set in Postman:

- `base_url`: The base URL of the API (e.g., `http://localhost:3000`)
- `access_token`: Your JWT access token (obtained after login)
- `refresh_token`: Your JWT refresh token (obtained after login)
- `user_id`: The ID of a user you want to operate on
- `patient_id`: The ID of a patient for patient-related operations
- `center_id`: The ID of a healthcare center
- `provider_id`: The ID of a healthcare provider
- `appointment_id`: The ID of an appointment
- `record_id`: The ID of a medical record
- `report_id`: The ID of a medical report
- `notification_id`: The ID of a notification
- `review_id`: The ID of a review

## Authentication Flow

1. Register a new user using the `Register` endpoint
2. Login with the user credentials using the `Login` endpoint
3. The login response will include `accessToken` and `refreshToken`
4. Copy these tokens to your Postman environment variables
5. Use the access token for authenticated requests
6. If the access token expires, use the refresh token to get a new one

## Available Endpoints

### Authentication

| Method | Endpoint        | Description                                    | Authentication |
|--------|----------------|------------------------------------------------|---------------|
| POST   | /auth/register | Register a new user                            | Public        |
| POST   | /auth/login    | Login and get tokens                           | Public        |
| POST   | /auth/logout   | Logout (invalidate refresh token)              | JWT Token     |
| POST   | /auth/refresh  | Get new access token using refresh token       | Refresh Token |
| GET    | /auth/me       | Get current user profile                       | JWT Token     |

### Users

| Method | Endpoint              | Description                     | Authentication |
|--------|----------------------|---------------------------------|---------------|
| POST   | /users               | Create a new user               | JWT Token (admin) |
| GET    | /users               | Get all users                   | JWT Token (admin) |
| GET    | /users/:id           | Get user by ID                  | JWT Token     |
| PATCH  | /users/:id           | Update user                     | JWT Token     |
| PATCH  | /users/:id/profile   | Update user profile             | JWT Token     |
| DELETE | /users/:id           | Delete user                     | JWT Token (admin) |

### Patients

| Method | Endpoint                 | Description                     | Authentication |
|--------|-------------------------|---------------------------------|---------------|
| POST   | /patients               | Create a new patient            | JWT Token     |
| GET    | /patients               | Get all patients                | JWT Token     |
| GET    | /patients/me            | Get current user's patient record | JWT Token   |
| GET    | /patients/:id           | Get patient by ID               | JWT Token     |
| PATCH  | /patients/:id           | Update patient                  | JWT Token     |
| DELETE | /patients/:id           | Delete patient                  | JWT Token (admin) |
| POST   | /patients/:id/visits    | Create patient visit            | JWT Token     |
| GET    | /patients/:id/visits    | Get patient visits              | JWT Token     |
| GET    | /patients/visits/:id    | Get visit by ID                 | JWT Token     |
| PATCH  | /patients/visits/:id    | Update visit                    | JWT Token     |
| DELETE | /patients/visits/:id    | Delete visit                    | JWT Token     |

### Medical Records

| Method | Endpoint                              | Description                     | Authentication |
|--------|--------------------------------------|---------------------------------|---------------|
| POST   | /medical-records                     | Create medical record           | JWT Token     |
| GET    | /medical-records                     | Get all medical records         | JWT Token     |
| GET    | /medical-records/:id                 | Get medical record by ID        | JWT Token     |
| PATCH  | /medical-records/:id                 | Update medical record           | JWT Token     |
| DELETE | /medical-records/:id                 | Delete medical record           | JWT Token     |
| POST   | /medical-records/:id/files           | Upload file to record           | JWT Token     |
| GET    | /medical-records/:id/files           | Get record files                | JWT Token     |
| GET    | /medical-records/files/:fileId       | Get file by ID                  | JWT Token     |
| GET    | /medical-records/files/:fileId/url   | Get file URL                    | JWT Token     |
| DELETE | /medical-records/files/:fileId       | Delete file                     | JWT Token     |
| POST   | /medical-records/files/:fileId/convert/jpeg | Convert DICOM to JPEG    | JWT Token     |
| GET    | /medical-records/:id/versions        | Get version history             | JWT Token     |
| GET    | /medical-records/versions/:versionId | Get specific version            | JWT Token     |
| POST   | /medical-records/:id/revert/:versionNumber | Revert to version      | JWT Token     |
| GET    | /medical-records/versions/:v1/compare/:v2 | Compare versions       | JWT Token     |
| GET    | /medical-records/search              | Search medical records          | JWT Token     |
| GET    | /medical-records/tags                | Get all tags                    | JWT Token     |
| GET    | /medical-records/categories          | Get categories                  | JWT Token     |
| GET    | /medical-records/categories/hierarchy | Get category hierarchy         | JWT Token     |
| POST   | /medical-records/categories          | Create category                 | JWT Token     |
| PATCH  | /medical-records/categories/:id      | Update category                 | JWT Token     |
| DELETE | /medical-records/categories/:id      | Delete category                 | JWT Token     |

### Appointments

| Method | Endpoint                                    | Description                     | Authentication |
|--------|--------------------------------------------|---------------------------------|---------------|
| POST   | /appointments                              | Create appointment              | JWT Token     |
| GET    | /appointments                              | Get all appointments            | JWT Token     |
| GET    | /appointments/:id                          | Get appointment by ID           | JWT Token     |
| PATCH  | /appointments/:id                          | Update appointment              | JWT Token     |
| DELETE | /appointments/:id                          | Delete appointment              | JWT Token     |
| PATCH  | /appointments/:id/confirm                  | Confirm appointment             | JWT Token     |
| PATCH  | /appointments/:id/cancel                   | Cancel appointment              | JWT Token     |
| PATCH  | /appointments/:id/complete                 | Complete appointment            | JWT Token     |
| GET    | /appointments/types/center/:centerId       | Get appointment types           | JWT Token     |
| POST   | /appointments/types/center/:centerId       | Create appointment type         | JWT Token     |
| GET    | /appointments/availability/provider/:providerId | Get provider availability  | JWT Token     |
| POST   | /appointments/availability                 | Create provider availability    | JWT Token     |
| PATCH  | /appointments/availability/:id             | Update provider availability    | JWT Token     |
| GET    | /appointments/slots/provider/:providerId   | Get available time slots        | JWT Token     |
| GET    | /appointments/reminders/pending            | Get pending reminders           | JWT Token     |
| PATCH  | /appointments/reminders/:id/sent           | Mark reminder as sent           | JWT Token     |
| POST   | /appointments/reminders                    | Create manual reminder          | JWT Token     |
| POST   | /appointments/recurring                    | Create recurring appointment    | JWT Token     |
| PATCH  | /appointments/recurring/:id                | Update recurring series         | JWT Token     |
| DELETE | /appointments/recurring/:id                | Cancel recurring series         | JWT Token     |
| GET    | /appointments/recurring/:id                | Get recurring appointments      | JWT Token     |
| GET    | /appointments/analytics/:centerId          | Get appointment analytics       | JWT Token     |

### Reviews & Ratings

| Method | Endpoint                                | Description                     | Authentication |
|--------|----------------------------------------|---------------------------------|---------------|
| POST   | /reviews                               | Create a new review             | JWT Token (patient) |
| GET    | /reviews                               | Get reviews with filtering      | JWT Token     |
| GET    | /reviews/:id                           | Get specific review by ID       | JWT Token     |
| PUT    | /reviews/:id                           | Update a review                 | JWT Token (patient) |
| DELETE | /reviews/:id                           | Delete a review                 | JWT Token (patient) |
| POST   | /reviews/:id/response                  | Create response to review       | JWT Token (provider/staff) |
| GET    | /reviews/centers/:centerId/summary     | Get center review summary       | Public        |
| GET    | /reviews/centers/:centerId/analytics   | Get center review analytics     | JWT Token (provider/staff/admin) |
| GET    | /reviews/centers/:centerId/trends      | Get center review trends        | JWT Token (provider/staff/admin) |

### Medical Reports

| Method | Endpoint                          | Description                     | Authentication |
|--------|----------------------------------|---------------------------------|---------------|
| POST   | /reports/generate                | Generate medical report         | JWT Token     |
| GET    | /reports/medical/:id             | Get medical report              | JWT Token     |
| POST   | /reports/export                  | Export report                   | JWT Token     |
| GET    | /reports/analytics/:centerId     | Get report analytics            | JWT Token     |

### Notifications

| Method | Endpoint                         | Description                     | Authentication |
|--------|----------------------------------|---------------------------------|---------------|
| GET    | /notifications                   | Get user notifications          | JWT Token     |
| GET    | /notifications/unread-count      | Get unread count                | JWT Token     |
| POST   | /notifications                   | Create notification             | JWT Token     |
| PUT    | /notifications/:id/read          | Mark notification as read       | JWT Token     |
| PUT    | /notifications/mark-all-read     | Mark all notifications as read  | JWT Token     |
| DELETE | /notifications/:id               | Delete notification             | JWT Token     |
| GET    | /notifications/preferences       | Get notification preferences    | JWT Token     |
| PUT    | /notifications/preferences       | Update notification preferences | JWT Token     |
| POST   | /notifications/test/:type        | Send test notification          | JWT Token     |

### External Integrations

| Method | Endpoint                                 | Description                     | Authentication |
|--------|------------------------------------------|---------------------------------|---------------|
| POST   | /integrations/payments/process           | Process payment                 | JWT Token     |
| GET    | /integrations/payments/:id/status        | Get payment status              | JWT Token     |
| POST   | /integrations/insurance/verify           | Verify insurance                | JWT Token     |
| GET    | /integrations/insurance/:id/benefits     | Get insurance benefits          | JWT Token     |
| POST   | /integrations/healthcare/lookup          | Healthcare provider lookup      | JWT Token     |
| POST   | /integrations/sms/send                   | Send SMS                        | JWT Token     |
| GET    | /integrations/sms/:id/status             | Get SMS status                  | JWT Token     |

### Location Services

| Method | Endpoint                                 | Description                     | Authentication |
|--------|------------------------------------------|---------------------------------|---------------|
| POST   | /location/update                         | Update user location            | JWT Token     |
| GET    | /location/nearby/:type                   | Find nearby facilities          | JWT Token     |
| POST   | /location/geofence                       | Create geofence zone            | JWT Token (admin) |
| GET    | /location/geofence                       | Get geofence zones              | JWT Token     |
| PUT    | /location/geofence/:id                   | Update geofence zone            | JWT Token (admin) |
| DELETE | /location/geofence/:id                   | Delete geofence zone            | JWT Token (admin) |
| GET    | /location/history/:userId                | Get location history            | JWT Token     |

### Analytics & Audit

| Method | Endpoint                         | Description                     | Authentication |
|--------|----------------------------------|---------------------------------|---------------|
| GET    | /analytics/audit-logs            | Get audit logs                  | JWT Token     |

### Health Check

| Method | Endpoint        | Description              | Authentication |
|--------|----------------|--------------------------|---------------|
| GET    | /health        | Check API health status  | Public        |

## Data Models

### User

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "roles": ["patient", "doctor", "admin"],
  "profile": {
    "id": "uuid",
    "userId": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "displayName": "Dr. John Doe",
    "phone": "123-456-7890",
    "avatar": "https://example.com/avatar.jpg",
    "createdAt": "2023-07-01T12:00:00Z",
    "updatedAt": "2023-07-01T12:00:00Z"
  },
  "createdAt": "2023-07-01T12:00:00Z",
  "updatedAt": "2023-07-01T12:00:00Z"
}
```

### Patient

```json
{
  "id": "uuid",
  "name": "John Doe",
  "patientId": "P123456",
  "age": 30,
  "gender": "male",
  "profileId": "uuid",
  "status": "active",
  "lastVisit": "2024-01-15T10:00:00Z",
  "medicalRecordSharingPreferences": {
    "trustedCenters": [],
    "notifyOnAccess": true,
    "autoApproveTrusted": false,
    "defaultAccessDurationDays": 30
  },
  "createdAt": "2024-01-01T12:00:00Z",
  "updatedAt": "2024-01-15T12:00:00Z"
}
```

### Medical Record

```json
{
  "id": "uuid",
  "patientId": "uuid",
  "title": "Blood Test Results",
  "recordType": "lab_result",
  "description": "Complete blood count test results",
  "category": "laboratory",
  "tags": ["blood", "lab", "routine"],
  "fileUrl": "https://example.com/file.pdf",
  "metadata": {},
  "version": 1,
  "isLatestVersion": true,
  "parentRecordId": null,
  "createdBy": "uuid",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

### Review

```json
{
  "id": "uuid",
  "centerId": "uuid",
  "patientId": "uuid",
  "appointmentId": "uuid",
  "overallRating": 4.5,
  "staffRating": 4.0,
  "cleanlinessRating": 5.0,
  "waitTimeRating": 3.0,
  "treatmentRating": 4.5,
  "title": "Great experience at the clinic",
  "content": "The staff was very friendly and professional.",
  "isAnonymous": false,
  "isVerified": true,
  "status": "approved",
  "photos": ["https://example.com/photo1.jpg"],
  "helpfulVotes": 5,
  "totalVotes": 7,
  "isEdited": false,
  "editedAt": null,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

### Review Response

```json
{
  "id": "uuid",
  "reviewId": "uuid",
  "content": "Thank you for your feedback. We appreciate your visit.",
  "respondedBy": "uuid",
  "status": "active",
  "isEdited": false,
  "editedAt": null,
  "createdAt": "2024-01-16T10:00:00Z",
  "updatedAt": "2024-01-16T10:00:00Z"
}
```

### Appointment

```json
{
  "id": "uuid",
  "patientId": "uuid",
  "centerId": "uuid",
  "providerId": "uuid",
  "appointmentDate": "2024-01-15T10:00:00Z",
  "appointmentTypeId": "uuid",
  "status": "scheduled",
  "notes": "Regular checkup",
  "duration": 30,
  "isRecurring": false,
  "recurringSeriesId": null,
  "createdAt": "2024-01-01T12:00:00Z",
  "updatedAt": "2024-01-01T12:00:00Z"
}
```

### Notification

```json
{
  "id": "uuid",
  "userId": "uuid",
  "centerId": "uuid",
  "title": "New Appointment",
  "message": "You have a new appointment scheduled",
  "type": "appointment",
  "deliveryMethod": "both",
  "relatedType": "appointment",
  "relatedId": "uuid",
  "data": {},
  "isUrgent": false,
  "isRead": false,
  "readAt": null,
  "sentAt": "2024-01-15T10:00:00Z",
  "scheduledFor": "2024-01-15T10:00:00Z",
  "expiresAt": "2024-01-22T10:00:00Z",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

### Authentication Response

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "roles": ["patient"],
    "profile": {
      "id": "uuid",
      "userId": "uuid", 
      "firstName": "John",
      "lastName": "Doe",
      "displayName": "John Doe",
      "phone": "123-456-7890",
      "avatar": "https://example.com/avatar.jpg",
      "createdAt": "2023-07-01T12:00:00Z",
      "updatedAt": "2023-07-01T12:00:00Z"
    },
    "createdAt": "2023-07-01T12:00:00Z",
    "updatedAt": "2023-07-01T12:00:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## API Features

### Phase 3 - Enhanced Medical Records (Complete)
- ✅ Advanced medical record management with versioning
- ✅ File upload and management with DICOM support
- ✅ Comprehensive search and filtering capabilities
- ✅ Medical record categories and tagging system
- ✅ Version control and comparison features

### Phase 4 - Advanced Features (Complete)
- ✅ Full appointment system with scheduling and availability
- ✅ Recurring appointments support
- ✅ Appointment reminders and notifications
- ✅ Comprehensive referral system with tracking
- ✅ Medical report generation and export (CSV/PDF)
- ✅ Analytics and audit logging for compliance

### Phase 5 - Notification System and Integration (Complete)
- ✅ Real-time notifications via WebSockets
- ✅ Email and push notification support
- ✅ Notification preferences management
- ✅ Payment gateway integration
- ✅ Healthcare API integrations
- ✅ Insurance verification services
- ✅ SMS service integration

### Phase 8 - Location Services (Complete)
- ✅ GPS location tracking and updates
- ✅ Geofencing for healthcare facilities
- ✅ Nearby facility search with distance calculations
- ✅ Location history tracking
- ✅ Emergency location services

### Phase 9 - Reviews & Ratings System (Complete)
- ✅ Comprehensive review system with ratings
- ✅ Multiple rating categories (staff, cleanliness, wait time, treatment)
- ✅ Review responses from healthcare providers
- ✅ Review moderation and approval system
- ✅ Review analytics and trending data
- ✅ Anonymous and verified review options
- ✅ Photo attachments for reviews
- ✅ Review helpfulness voting system

## Error Handling

The API returns consistent error responses in the following format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request",
  "timestamp": "2024-01-15T10:00:00Z",
  "path": "/api/endpoint"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- Default: 100 requests per minute per API key
- Burst: 1000 requests per hour per API key
- Daily: 10,000 requests per day per API key

## Security

- All endpoints (except health check and auth) require JWT authentication
- Role-based access control (RBAC) implemented
- Request/response logging for audit trails
- Input validation and sanitization
- SQL injection protection
- CORS enabled for web clients
