# 🔐 Authentication & Profile Management Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Registration](#registration)
3. [Login](#login)
4. [Profile Management](#profile-management)
5. [Center Management](#center-management)
6. [Role-Based Access Control](#role-based-access-control)
7. [API Endpoints Summary](#api-endpoints-summary)
8. [Examples](#examples)

---

## 🌟 Overview

This guide covers the complete authentication and profile management system for the Healthcare Management System. The system provides secure user registration, authentication, and comprehensive profile management with role-based access control.

**Base URL:** `https://api.unlimtedhealth.com/api`

---

## 📝 Registration

### Public User Registration

**Endpoint:** `POST /auth/register`

**Description:** Register a new user account (public endpoint, no authentication required)

**Request Body:**
```typescript
{
  email: string;           // Required: Valid email address
  password: string;        // Required: Strong password (10+ chars)
  name: string;           // Required: User's full name
  roles: string[];        // Required: User roles (admin not allowed)
  phone?: string;         // Optional: Phone number
}
```

**Password Requirements:**
- **Registration:** Minimum 10 characters with strict validation
- **Login:** Minimum 8 characters (same as registration)
- Must contain: uppercase, lowercase, number, special character
- Cannot be common weak passwords
- Cannot contain sequential or repeated patterns

**Validation Message:** "Password must be at least 10 characters long and contain uppercase, lowercase, number, special character, and cannot be a common weak password"

**Role Restrictions:**
- ❌ `admin` role cannot be assigned during public registration
- ✅ Allowed roles: `patient`, `doctor`, `nurse`, `staff`, `center`

**Response (201 Created):**
```json
{
  "user": {
    "id": "uuid-string",
    "email": "john@example.com",
    "roles": ["patient"],
    "displayId": "P001"
  },
  "access_token": "jwt-access-token-string"
}
```

**Note:** Registration only returns an access token. Use the login endpoint to get both access and refresh tokens.

### Staff/Doctor Registration

**Endpoint:** `POST /auth/register/staff`

**Description:** Register staff or doctor accounts (admin/center role required)

**Authentication:** Required (Bearer token with admin or center role)

**Request Body:** Same as public registration

**Role Restrictions:** Only `doctor` or `staff` roles allowed

**Response:** Same as public registration

### Admin Registration

**Endpoint:** `POST /auth/register/admin`

**Description:** Register admin accounts (existing admin role required)

**Authentication:** Required (Bearer token with admin role)

**Request Body:** Same as public registration

**Role Restrictions:** Only `admin` role allowed

**Response:**
```json
{
  "user": {
    "id": "uuid-string",
    "email": "admin@example.com",
    "roles": ["admin"],
    "displayId": "A001"
  },
  "access_token": "jwt-access-token-string",
  "message": "Admin user created successfully"
}
```

---

## 🔑 Login

**Endpoint:** `POST /auth/login`

**Description:** Authenticate user and receive access tokens

**Request Body:**
```typescript
{
  email: string;      // Required: User's email address
  password: string;   // Required: User's password (min 8 characters)
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid-string",
    "email": "john@example.com",
    "roles": ["patient"],
    "displayId": "P001"
  },
  "access_token": "jwt-access-token-string",
  "refresh_token": "jwt-refresh-token-string"
}
```

**Note:** The login endpoint returns both access and refresh tokens. Store the refresh token securely for token renewal.

---

## 👤 Profile Management

### Create Profile

**Endpoint:** `POST /users/profile`

**Description:** Create or update user profile information

**Authentication:** Required (Bearer token)

**Request Body:**
```typescript
{
  firstName?: string;           // Optional: First name
  lastName?: string;            // Optional: Last name
  displayName?: string;         // Optional: Display name
  phone?: string;               // Optional: Phone number
  avatar?: string;              // Optional: Avatar URL
  dateOfBirth?: string;         // Optional: Date of birth (ISO format)
  gender?: string;              // Optional: Gender
  address?: string;             // Optional: Address
  specialization?: string;      // Optional: Medical specialization
  licenseNumber?: string;       // Optional: Professional license number
  experience?: string;          // Optional: Years of experience
}
```

**Response (201 Created):**
```json
{
  "id": "profile-uuid",
  "userId": "user-uuid",
  "firstName": "John",
  "lastName": "Doe",
  "displayName": "Dr. John Doe",
  "phone": "+1234567890",
  "avatar": "https://example.com/avatar.jpg",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "address": "123 Main St, City, State",
  "specialization": "Cardiology",
  "licenseNumber": "MD123456",
  "experience": "5 years",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Get Profile

**Endpoint:** `GET /users/profile`

**Description:** Retrieve current user's profile

**Authentication:** Required (Bearer token)

**Response (200 OK):**
```json
{
  "id": "profile-uuid",
  "userId": "user-uuid",
  "firstName": "John",
  "lastName": "Doe",
  "displayName": "Dr. John Doe",
  "phone": "+1234567890",
  "avatar": "https://example.com/avatar.jpg",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "address": "123 Main St, City, State",
  "specialization": "Cardiology",
  "licenseNumber": "MD123456",
  "experience": "5 years",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Update Profile

**Endpoint:** `PATCH /users/profile`

**Description:** Update existing profile information

**Authentication:** Required (Bearer token)

**Request Body:** Same fields as create profile (all optional)

**Response (200 OK):** Updated profile object

### Get User by ID

**Endpoint:** `GET /users/:id`

**Description:** Retrieve user information by ID

**Authentication:** Required (Bearer token)

**Response (200 OK):**
```json
{
  "id": "user-uuid",
  "email": "john@example.com",
  "roles": ["patient"],
  "displayId": "P001",
  "profile": {
    // Profile object (if exists)
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "lastLogin": "2024-01-01T00:00:00.000Z",
  "isActive": true
}
```

---

## 🏥 Center Management

### Center Registration Process

**Important:** Center registration is a **two-step process**:

1. **User Registration** - Register with `center` role
2. **Center Creation** - Create the actual healthcare center details

### Step 1: User Registration (Center Role)

**Endpoint:** `POST /auth/register`

**Description:** Register a user account with center role (same as other users)

**Request Body:**
```typescript
{
  email: string;           // Required: Valid email address
  password: string;        // Required: Strong password (10+ chars)
  name: string;           // Required: User's full name
  roles: string[];        // Required: Must include "center"
  phone?: string;         // Optional: Phone number
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "uuid-string",
    "email": "center@example.com",
    "roles": ["center"],
    "displayId": "C001"
  },
  "access_token": "jwt-access-token-string"
}
```

### Step 2: Center Creation

**Endpoint:** `POST /centers`

**Description:** Create healthcare center details (requires center or admin role)

**Authentication:** Required (Bearer token with center or admin role)

**Request Body:**
```typescript
{
  name: string;           // Required: Center name
  type: CenterType;       // Required: Center type (see types below)
  address: string;        // Required: Center address
  phone?: string;         // Optional: Phone number
  email?: string;         // Optional: Email address
  hours?: string;         // Optional: Operating hours
  imageUrl?: string;      // Optional: Center image URL
}
```

**Center Types Available:**
- `hospital` - General hospitals
- `clinic` - Medical clinics
- `pharmacy` - Pharmacies
- `laboratory` - Medical laboratories
- `radiology` - Radiology centers
- `dental` - Dental clinics
- `eye` - Eye clinics
- `maternity` - Maternity centers
- `virology` - Virology centers
- `psychiatric` - Psychiatric centers
- `care-home` - Care homes
- `hospice` - Hospice centers
- `funeral` - Funeral services
- `ambulance` - Ambulance services

**Note:** These are the exact enum values from the `CenterType` enum in the codebase.

**Response (201 Created):**
```json
{
  "id": "center-uuid",
  "displayId": "HSP123456789",
  "name": "General Hospital",
  "type": "hospital",
  "address": "123 Medical Blvd, City, State",
  "phone": "+1234567890",
  "email": "info@hospital.com",
  "hours": "24/7",
  "imageUrl": "https://example.com/hospital.jpg",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Note:** The `displayId` is automatically generated based on the center type (e.g., HSP for hospital, CLN for clinic).

### Center Management Endpoints

#### Get All Centers (Admin Only)
**Endpoint:** `GET /centers`

**Authentication:** Required (Bearer token with admin role)

#### Get Centers by Type
**Endpoint:** `GET /centers/types/:type`

**Authentication:** Not required

**Example:** `GET /centers/types/hospital`

#### Get Centers by User ID
**Endpoint:** `GET /centers/user/:userId`

**Authentication:** Required (Bearer token)

#### Update Center
**Endpoint:** `PATCH /centers/:id`

**Authentication:** Required (Bearer token with center or admin role)

#### Delete Center
**Endpoint:** `DELETE /centers/:id`

**Authentication:** Required (Bearer token with admin role)

---

## 🛡️ Role-Based Access Control

### Available Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| `patient` | Healthcare patient | Basic patient features |
| `doctor` | Medical doctor | Patient management, medical records |
| `nurse` | Medical nurse | Patient care, basic medical tasks |
| `staff` | Healthcare staff | Administrative tasks |
| `center` | Healthcare center admin | Center management |
| `admin` | System administrator | Full system access |

### Role Restrictions

- **Public Registration:** Cannot assign `admin` role
- **Staff Registration:** Only `doctor` or `staff` roles allowed
- **Admin Registration:** Only existing admins can create admin accounts
- **Center Creation:** Only users with `center` or `admin` role can create centers

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| `POST` | `/auth/register` | Public user registration | ❌ | All except admin |
| `POST` | `/auth/register/staff` | Staff/doctor registration | ✅ | admin, center |
| `POST` | `/auth/register/admin` | Admin registration | ✅ | admin |
| `POST` | `/auth/login` | User authentication | ❌ | All |
| `POST` | `/auth/logout` | User logout | ✅ | All |
| `POST` | `/auth/refresh` | Refresh access token | ❌ | All |
| `POST` | `/users/profile` | Create/update profile | ✅ | All authenticated users |
| `GET` | `/users/profile` | Get current user profile | ✅ | All authenticated users |
| `PATCH` | `/users/:id/profile` | Update user profile (admin only) | ✅ | admin |
| `GET` | `/users/:id` | Get user by ID | ✅ | admin, doctor, staff |
| `POST` | `/centers` | Create center | ✅ | center, admin |
| `GET` | `/centers` | Get all centers | ✅ | admin |
| `GET` | `/centers/types/:type` | Get centers by type | ❌ | All |
| `GET` | `/centers/user/:userId` | Get centers by user | ✅ | All |
| `PATCH` | `/centers/:id` | Update center | ✅ | center, admin |
| `DELETE` | `/centers/:id` | Delete center | ✅ | admin |

**Note:** The `/users/profile` endpoints (POST and GET) are available to all authenticated users, allowing them to create and manage their own profiles. The `/users/:id/profile` endpoint is admin-only for managing other users' profiles.

---

## 💡 Examples

### Complete Registration & Profile Flow

#### 1. Register a New Patient

```bash
curl -X POST https://api.unlimtedhealth.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "StrongP@ss123!",
    "name": "John Doe",
    "roles": ["patient"],
    "phone": "+1234567890"
  }'
```

**Response:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "roles": ["patient"],
    "displayId": "P001"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2. Login with the Patient Account

```bash
curl -X POST https://api.unlimtedhealth.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "StrongP@ss123!"
  }'
```

#### 3. Create Patient Profile

```bash
curl -X POST https://api.unlimtedhealth.com/api/users/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "displayName": "John Doe",
    "phone": "+1234567890",
    "dateOfBirth": "1990-01-01",
    "gender": "male",
    "address": "123 Main St, City, State"
  }'
```

### Doctor Registration Example

#### 1. Admin Registers a Doctor

```bash
curl -X POST https://api.unlimtedhealth.com/api/auth/register/staff \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dr.smith@example.com",
    "password": "StrongP@ss123!",
    "name": "Dr. Jane Smith",
    "roles": ["doctor"],
    "phone": "+1234567890"
  }'
```

#### 2. Create Doctor Profile with Medical Credentials

```bash
curl -X POST https://api.unlimtedhealth.com/api/users/profile \
  -H "Authorization: Bearer DOCTOR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "displayName": "Dr. Jane Smith",
    "phone": "+1234567890",
    "specialization": "Cardiology",
    "licenseNumber": "MD123456",
    "experience": "8 years",
    "address": "456 Medical Center Dr, City, State"
  }'
```

### Center Registration Example

#### 1. Register a User with Center Role

```bash
curl -X POST https://api.unlimtedhealth.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hospital.admin@example.com",
    "password": "StrongP@ss123!",
    "name": "Hospital Administrator",
    "roles": ["center"],
    "phone": "+1234567890"
  }'
```

**Response:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "hospital.admin@example.com",
    "roles": ["center"],
    "displayId": "C001"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2. Login with the Center Account

```bash
curl -X POST https://api.unlimtedhealth.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hospital.admin@example.com",
    "password": "StrongP@ss123!"
  }'
```

#### 3. Create the Healthcare Center

```bash
curl -X POST https://api.unlimtedhealth.com/api/centers \
  -H "Authorization: Bearer CENTER_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "General Hospital",
    "type": "hospital",
    "address": "123 Medical Blvd, New York, NY 10001",
    "phone": "+1234567890",
    "email": "info@generalhospital.com",
    "hours": "24/7",
    "imageUrl": "https://example.com/hospital.jpg"
  }'
```

**Response:**
```json
{
  "id": "center-uuid-here",
  "displayId": "HSP123456789",
  "name": "General Hospital",
  "type": "hospital",
  "address": "123 Medical Blvd, New York, NY 10001",
  "phone": "+1234567890",
  "email": "info@generalhospital.com",
  "hours": "24/7",
  "imageUrl": "https://example.com/hospital.jpg",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Note:** The center creator is automatically added as center staff with 'owner' role.

---

## 🔒 Security Features

- **Password Hashing:** bcrypt with salt rounds
- **JWT Tokens:** Secure access and refresh tokens
- **Role Validation:** Strict role assignment controls
- **Input Validation:** Comprehensive DTO validation
- **Activity Logging:** Audit trail for all actions
- **Token Blacklisting:** Secure logout mechanism

---

## 📱 Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": [
    "Password must be at least 10 characters long and contain uppercase, lowercase, number, special character, and cannot be a common weak password"
  ],
  "error": "Bad Request"
}
```

**Common 400 Errors:**
- Password validation failures
- Invalid email format
- Missing required fields
- Invalid role assignments

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
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

#### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "User with this email already exists",
  "error": "Conflict"
}
```

**Common 409 Errors:**
- Duplicate email addresses
- Existing user accounts

---

## 🚀 Best Practices

1. **Store tokens securely** in HTTP-only cookies or secure storage
2. **Implement token refresh** before expiration
3. **Validate all inputs** on both client and server
4. **Use HTTPS** for all API communications
5. **Implement rate limiting** for authentication endpoints
6. **Log security events** for monitoring and auditing
7. **Regular token rotation** for enhanced security

---

## 📞 Support

For technical support or questions about the authentication system, please contact the development team or refer to the API documentation.

---

*Last updated: January 2025*
*Version: 1.0*
