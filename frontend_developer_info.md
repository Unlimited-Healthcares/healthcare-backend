# Frontend Developer Information

## API Base URL
**Confirmed:** `https://api.unlimtedhealth.com/api`

All API endpoints are prefixed with `/api`. The global prefix is set in `main.ts` and can be overridden with the `API_PREFIX` environment variable.

---

## Authentication Flow

### JWT Token Format
**Access Token Payload:**
```typescript
interface JwtPayload {
  sub: string;        // User ID
  email: string;      // User email
  roles: string[];    // User roles array
}
```

**Token Structure:**
- **Header:** `Authorization: Bearer <access_token>`
- **Expiration:** Configurable via `JWT_EXPIRES_IN` (default not specified in code)
- **Secret:** `JWT_SECRET` environment variable

### Refresh Token Mechanism
1. **Login Response:**
   ```json
   {
     "access_token": "jwt_access_token",
     "refresh_token": "jwt_refresh_token", 
     "user": {
       "id": "uuid",
       "email": "user@example.com",
       "roles": ["patient"],
       "displayId": "PT123456"
     }
   }
   ```

2. **Refresh Endpoint:** `POST /auth/refresh`
   - **Header:** `Authorization: Bearer <refresh_token>`
   - **Response:** Same as login (new access + refresh tokens)

3. **Logout:** `POST /auth/logout`
   - **Header:** `Authorization: Bearer <access_token>`
   - **Action:** Blacklists access token and clears refresh token

---

## User Role System

### Available Roles
```typescript
enum UserRole {
  ADMIN = 'admin',
  HEALTHCARE_PROVIDER = 'doctor', 
  STAFF = 'staff',
  PATIENT = 'patient',
  CENTER = 'center'
}
```

### Role Permissions
| Role | Description | Key Permissions |
|------|-------------|-----------------|
| `patient` | Healthcare patient | View own appointments, create profile, basic features |
| `doctor` | Medical doctor | Patient management, medical records, appointments |
| `staff` | Healthcare staff | Administrative tasks, patient care |
| `center` | Healthcare center admin | Center management, staff management |
| `admin` | System administrator | Full system access, user management |

### Role Restrictions
- **Public Registration:** Cannot assign `admin` role
- **Staff Registration:** Only `doctor` or `staff` roles allowed (admin/center only)
- **Admin Registration:** Only existing admins can create admin accounts

---

## Data Models

### User Entity
```typescript
interface User {
  id: string;                    // UUID
  displayId: string;             // Human-readable ID (e.g., "PT123456")
  email: string;                 // Unique email
  password: string;              // Hashed (excluded from responses)
  roles: string[];               // Array of role strings
  refreshToken: string;          // JWT refresh token (excluded from responses)
  profile: Profile | null;       // User profile relation
  createdAt: Date;
  updatedAt: Date;
}
```

### Appointment Entity
```typescript
interface Appointment {
  id: string;                    // UUID
  patientId: string;             // Patient UUID
  centerId: string;              // Center UUID
  providerId: string;            // Provider UUID (nullable)
  appointmentTypeId: string;     // Appointment type UUID (nullable)
  appointmentDate: Date;         // Appointment date/time
  durationMinutes: number;       // Duration (default: 30)
  appointmentStatus: string;     // 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
  status: string;                // Legacy status field (default: 'pending')
  priority: string;              // 'low', 'normal', 'high', 'urgent' (default: 'normal')
  reason: string;                // Appointment reason
  notes: string;                 // Additional notes (nullable)
  doctor: string;                // Doctor name
  isRecurring: boolean;          // Is recurring appointment
  recurrencePattern: {           // Recurrence configuration (nullable)
    frequency?: string;          // 'daily', 'weekly', 'monthly', 'yearly'
    interval?: number;           // Interval between occurrences
    count?: number;              // Total occurrences
    endDate?: string;            // End date
    daysOfWeek?: string[];       // Days of week for weekly
    dayOfMonth?: number;         // Day of month for monthly
    occurrences?: number;        // Number of occurrences
  };
  parentAppointmentId: string;   // Parent appointment for recurring series (nullable)
  confirmationStatus: string;    // 'pending', 'confirmed', 'declined'
  confirmedAt: Date;             // Confirmation timestamp (nullable)
  reminderSentAt: Date;          // Reminder sent timestamp (nullable)
  cancellationReason: string;    // Cancellation reason (nullable)
  cancelledBy: string;           // User who cancelled (nullable)
  cancelledAt: Date;             // Cancellation timestamp (nullable)
  rescheduledFrom: string;       // Previous appointment ID if rescheduled (nullable)
  metadata: Record<string, unknown>; // Additional metadata (nullable)
  createdAt: Date;
  updatedAt: Date;
}
```

### Healthcare Center Entity
```typescript
interface HealthcareCenter {
  id: string;                    // UUID
  displayId: string;             // Human-readable ID (e.g., "HSP123456789")
  name: string;                  // Center name
  type: string;                  // Center type (hospital, clinic, etc.)
  address: string;               // Full address
  latitude: number;              // GPS latitude (nullable)
  longitude: number;             // GPS longitude (nullable)
  city: string;                  // City (nullable)
  state: string;                 // State/Province (nullable)
  country: string;               // Country (nullable)
  postalCode: string;            // ZIP/Postal code (nullable)
  phone: string;                 // Phone number (nullable)
  email: string;                 // Email address (nullable)
  hours: string;                 // Operating hours (nullable)
  imageUrl: string;              // Center image URL (nullable)
  locationMetadata: Record<string, unknown>; // Additional location data (nullable)
  isActive: boolean;             // Center active status
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Error Response Format

### Standard Error Response
```typescript
interface ErrorResponse {
  statusCode: number;            // HTTP status code
  timestamp: string;             // ISO timestamp
  path: string;                  // Request path
  method: string;                // HTTP method
  message: string;               // Error message
  error: string;                 // Error type
  code: string;                  // Error code
  stack?: string;                // Stack trace (development only)
}
```

### Example Error Responses
```json
// 400 Bad Request
{
  "statusCode": 400,
  "timestamp": "2025-01-08T10:30:00.000Z",
  "path": "/api/appointments",
  "method": "POST",
  "message": "Invalid input data",
  "error": "Bad Request",
  "code": "HTTP_EXCEPTION"
}

// 401 Unauthorized
{
  "statusCode": 401,
  "timestamp": "2025-01-08T10:30:00.000Z",
  "path": "/api/users/profile",
  "method": "GET",
  "message": "User not authenticated",
  "error": "Unauthorized",
  "code": "HTTP_EXCEPTION"
}

// 403 Forbidden
{
  "statusCode": 403,
  "timestamp": "2025-01-08T10:30:00.000Z",
  "path": "/api/users",
  "method": "GET",
  "message": "Forbidden resource",
  "error": "Forbidden",
  "code": "HTTP_EXCEPTION"
}
```

---

## Pagination Format

### Standard Paginated Response
```typescript
interface PaginatedApiResponse<T> {
  success: boolean;
  data: T[];                     // Array of items
  pagination: {
    total: number;               // Total number of items
    page: number;                // Current page number
    limit: number;               // Items per page
    totalPages: number;          // Total number of pages
  };
  message?: string;              // Optional message
  timestamp: string;             // Response timestamp
}
```

### Example Paginated Response
```json
{
  "success": true,
  "data": [
    {
      "id": "app-123",
      "patientId": "patient-456",
      "appointmentDate": "2025-01-15T10:00:00Z",
      "status": "confirmed"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  },
  "timestamp": "2025-01-08T10:30:00.000Z"
}
```

### Pagination Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- Example: `GET /api/appointments?page=2&limit=20`

---

## Additional Response Types

### Standard API Response
```typescript
interface StandardApiResponse<T> {
  success: boolean;
  data?: T;                      // Response data
  message?: string;              // Success/error message
  error?: string;                // Error message
  timestamp: string;             // Response timestamp
  requestId?: string;            // Request tracking ID
}
```

### User Profile Response
```typescript
interface UserProfileResponse {
  id: string;
  email: string;
  roles: string[];
  displayId: string;
  profile: Profile | null;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}
```

---

## Environment Configuration

### Required Environment Variables
- `JWT_SECRET`: JWT signing secret
- `JWT_REFRESH_SECRET`: Refresh token secret
- `JWT_EXPIRES_IN`: Access token expiration
- `JWT_REFRESH_EXPIRES_IN`: Refresh token expiration (default: 7d)
- `API_PREFIX`: API route prefix (default: 'api')

### CORS Configuration
- CORS is handled by Nginx reverse proxy
- No CORS headers are set by the NestJS application
- This prevents duplicate CORS header errors

---

## Security Notes

1. **Token Blacklisting:** Access tokens are blacklisted on logout
2. **Password Requirements:** Minimum 10 characters with complexity requirements
3. **Role-Based Access:** All endpoints are protected with role guards
4. **Input Validation:** All inputs are validated using class-validator DTOs
5. **Rate Limiting:** Implemented via ThrottlerModule (currently disabled for debugging)

---

## Testing Endpoints

### Health Check
- `GET /api/health` - API health status

### Authentication Test
```bash
# Login
curl -X POST "https://api.unlimtedhealth.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Get current user
curl -X GET "https://api.unlimtedhealth.com/api/auth/me" \
  -H "Authorization: Bearer <access_token>"
```

---

*Last Updated: January 8, 2025*
