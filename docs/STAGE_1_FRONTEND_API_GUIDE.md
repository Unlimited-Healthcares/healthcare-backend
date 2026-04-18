# 🚀 Stage 1 Frontend API Guide - User Profile Dashboard

## 📋 Overview

This guide provides all the valid API endpoints and DTOs needed to build the **User Profile Dashboard** for Stage 1 of the progressive frontend development plan.

**Base URL:** `https://api.unlimtedhealth.com/api`

---

## 🔐 Authentication Endpoints

### 1. User Registration
**Endpoint:** `POST /auth/register`  
**Authentication:** Public (no token required)

**Request Body (RegisterDto):**
```typescript
{
  email: string;           // Required: Valid email address
  password: string;        // Required: Strong password (10+ chars)
  name: string;           // Required: User's full name
  roles: string[];        // Required: User roles (admin not allowed)
  phone?: string;         // Optional: Phone number
}
```

**Example Request:**
```json
{
  "email": "john.doe@example.com",
  "password": "StrongP@ss123!",
  "name": "John Doe",
  "roles": ["patient"],
  "phone": "+1234567890"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "uuid-string",
    "email": "john.doe@example.com",
    "roles": ["patient"],
    "displayId": "P001"
  },
  "access_token": "jwt-access-token-string"
}
```

### 2. User Login
**Endpoint:** `POST /auth/login`  
**Authentication:** Public (no token required)

**Request Body (LoginDto):**
```typescript
{
  email: string;           // Required: Valid email address
  password: string;        // Required: Password (8+ chars)
}
```

**Example Request:**
```json
{
  "email": "john.doe@example.com",
  "password": "StrongP@ss123!"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid-string",
    "email": "john.doe@example.com",
    "roles": ["patient"],
    "displayId": "P001"
  },
  "access_token": "jwt-access-token-string"
}
```

### 3. Get Current User Profile
**Endpoint:** `GET /auth/me`  
**Authentication:** Required (Bearer token)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "email": "john.doe@example.com",
    "roles": ["patient"],
    "displayId": "P001",
    "profile": {
      "id": "profile-uuid",
      "firstName": "John",
      "lastName": "Doe",
      "displayName": "John Doe",
      "phone": "+1234567890",
      "avatar": "https://example.com/avatar.jpg",
      "dateOfBirth": "1990-01-01",
      "gender": "male",
      "address": "123 Main St, City, State",
      "specialization": null,
      "licenseNumber": null,
      "experience": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "lastLogin": "2024-01-01T00:00:00.000Z",
    "isActive": true
  }
}
```

### 4. Logout
**Endpoint:** `POST /auth/logout`  
**Authentication:** Required (Bearer token)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "message": "Successfully logged out"
}
```

### 5. Refresh Token
**Endpoint:** `POST /auth/refresh`  
**Authentication:** Required (Refresh token as Bearer)

**Headers:**
```
Authorization: Bearer <refresh_token>
```

**Response (200 OK):**
```json
{
  "access_token": "new-jwt-access-token-string",
  "refresh_token": "new-refresh-token-string"
}
```

---

## 👤 User Profile Management Endpoints

### 1. Get Current User Profile
**Endpoint:** `GET /users/profile`  
**Authentication:** Required (Bearer token)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": "profile-uuid",
  "firstName": "John",
  "lastName": "Doe",
  "displayName": "John Doe",
  "phone": "+1234567890",
  "avatar": "https://example.com/avatar.jpg",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "address": "123 Main St, City, State",
  "specialization": null,
  "licenseNumber": null,
  "experience": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Profile not found for user ID: uuid-string",
  "error": "Not Found"
}
```

### 2. Create or Update Profile
**Endpoint:** `POST /users/profile`  
**Authentication:** Required (Bearer token)

**Request Body (CreateProfileDto):**
```typescript
{
  firstName?: string;        // Optional: First name
  lastName?: string;         // Optional: Last name
  displayName?: string;      // Optional: Display name
  phone?: string;           // Optional: Phone number
  avatar?: string;          // Optional: Avatar URL
  dateOfBirth?: string;     // Optional: Date of birth (ISO string)
  gender?: string;          // Optional: Gender
  address?: string;         // Optional: Address
  specialization?: string;  // Optional: Medical specialization
  licenseNumber?: string;   // Optional: Professional license number
  experience?: string;      // Optional: Years of experience
}
```

**Example Request:**
```json
{
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
  "experience": "5 years"
}
```

**Response (201 Created / 200 OK):**
```json
{
  "id": "profile-uuid",
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

### 3. Get User by ID (Admin/Doctor/Staff only)
**Endpoint:** `GET /users/:id`  
**Authentication:** Required (Bearer token)  
**Authorization:** Admin, Doctor, or Staff roles

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": "user-uuid",
  "email": "john.doe@example.com",
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

## 🔒 Authentication & Authorization

### Required Headers
All authenticated endpoints require:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Role-Based Access Control
- **Public Endpoints:** Registration, Login, Token Refresh
- **User Endpoints:** Profile management (own profile only)
- **Admin/Doctor/Staff:** Can view other users' profiles

### Token Management
1. **Access Token:** Short-lived (15 minutes), used for API calls
2. **Refresh Token:** Long-lived (7 days), used to get new access tokens
3. **Token Storage:** Store both tokens securely (localStorage/sessionStorage)

---

## 📝 Data Validation Rules

### Password Requirements
- **Minimum Length:** 10 characters
- **Must Contain:** Uppercase, lowercase, number, special character
- **Cannot Be:** Common weak passwords
- **Cannot Contain:** Sequential patterns (123, abc, etc.)
- **Cannot Contain:** Keyboard patterns (qwerty, asdfgh, etc.)

### Email Validation
- Must be a valid email format
- Must be unique across the system

### Profile Fields
- **Optional:** All profile fields are optional
- **Date Format:** ISO 8601 string (YYYY-MM-DD)
- **Phone Format:** String (no specific format enforced)
- **Gender:** String (no specific values enforced)

---

## 🚨 Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

**409 Conflict:**
```json
{
  "statusCode": 409,
  "message": "User with this email already exists",
  "error": "Conflict"
}
```

---

## 🎯 Frontend Implementation Checklist

### Authentication Flow
- [ ] Implement registration form with validation
- [ ] Implement login form with validation
- [ ] Store tokens securely
- [ ] Implement automatic token refresh
- [ ] Handle logout functionality

### Profile Management
- [ ] Display current user profile
- [ ] Implement profile editing form
- [ ] Handle avatar upload (if needed)
- [ ] Implement user preferences
- [ ] Handle profile creation/update

### Error Handling
- [ ] Implement proper error messages
- [ ] Handle network errors
- [ ] Handle authentication errors
- [ ] Implement loading states

### Security
- [ ] Validate all inputs on frontend
- [ ] Implement proper token storage
- [ ] Handle token expiration
- [ ] Implement secure logout

---

## 📚 Additional Resources

- **Swagger Documentation:** `https://api.unlimtedhealth.com/api/docs`
- **Health Check:** `GET https://api.unlimtedhealth.com/api/health`
- **API Version:** v1 (current)

---

## 🔧 Development Tips

1. **Always validate inputs** before sending requests
2. **Handle loading states** for better UX
3. **Implement proper error boundaries**
4. **Use TypeScript interfaces** for type safety
5. **Test with different user roles** (patient, doctor, admin)
6. **Implement proper token refresh logic**
7. **Handle network connectivity issues**

---

## 🏥 Center-Specific Profile Management

### Important: Center Users Have Different Data Requirements

**Center users** (healthcare facilities) have completely different profile data and endpoints compared to individual users (doctors, nurses, patients). When a user has the `center` role, they need to manage **center information** instead of personal profile data.

### Center Registration Process

Center registration is a **two-step process**:

1. **User Registration** - Register with `center` role
2. **Center Creation** - Create the actual healthcare center details

### Step 1: Center User Registration

**Endpoint:** `POST /auth/register`  
**Authentication:** Public (no token required)

**Request Body (RegisterDto):**
```typescript
{
  email: string;           // Required: Valid email address
  password: string;        // Required: Strong password (10+ chars)
  name: string;           // Required: Center contact person's name
  roles: string[];        // Required: Must include "center"
  phone?: string;         // Optional: Phone number
}
```

**Example Request:**
```json
{
  "email": "admin@cityhospital.com",
  "password": "StrongP@ss123!",
  "name": "Dr. Sarah Johnson",
  "roles": ["center"],
  "phone": "+1234567890"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "uuid-string",
    "email": "admin@cityhospital.com",
    "roles": ["center"],
    "displayId": "C001"
  },
  "access_token": "jwt-access-token-string"
}
```

### Step 2: Center Creation

**Endpoint:** `POST /centers`  
**Authentication:** Required (Bearer token with center or admin role)

**Request Body (CreateCenterDto):**
```typescript
{
  name: string;           // Required: Center name
  type: CenterType;       // Required: Center type (enum)
  address: string;        // Required: Center address
  phone?: string;         // Optional: Phone number
  email?: string;         // Optional: Email address
  hours?: string;         // Optional: Operating hours
  imageUrl?: string;      // Optional: Center image URL
}
```

**Center Types (CenterType enum):**
```typescript
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
```

**Example Request:**
```json
{
  "name": "City General Hospital",
  "type": "hospital",
  "address": "123 Medical Drive, City, State 12345",
  "phone": "+1234567890",
  "email": "info@cityhospital.com",
  "hours": "24/7 Emergency, 8:00 AM - 6:00 PM General",
  "imageUrl": "https://example.com/hospital-image.jpg"
}
```

**Response (201 Created):**
```json
{
  "id": "center-uuid",
  "name": "City General Hospital",
  "type": "hospital",
  "address": "123 Medical Drive, City, State 12345",
  "phone": "+1234567890",
  "email": "info@cityhospital.com",
  "hours": "24/7 Emergency, 8:00 AM - 6:00 PM General",
  "imageUrl": "https://example.com/hospital-image.jpg",
  "displayId": "H001",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Center Profile Management Endpoints

### 1. Get Center by User ID
**Endpoint:** `GET /centers/user/:userId`  
**Authentication:** Required (Bearer token)  
**Authorization:** Admin or Center roles

**Response (200 OK):**
```json
{
  "id": "center-uuid",
  "name": "City General Hospital",
  "type": "hospital",
  "address": "123 Medical Drive, City, State 12345",
  "phone": "+1234567890",
  "email": "info@cityhospital.com",
  "hours": "24/7 Emergency, 8:00 AM - 6:00 PM General",
  "imageUrl": "https://example.com/hospital-image.jpg",
  "displayId": "H001",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 2. Update Center Information
**Endpoint:** `PATCH /centers/:id`  
**Authentication:** Required (Bearer token)  
**Authorization:** Admin or Center roles

**Request Body (Partial<CreateCenterDto>):**
```typescript
{
  name?: string;          // Optional: Center name
  type?: CenterType;      // Optional: Center type
  address?: string;       // Optional: Center address
  phone?: string;         // Optional: Phone number
  email?: string;         // Optional: Email address
  hours?: string;         // Optional: Operating hours
  imageUrl?: string;      // Optional: Center image URL
}
```

**Example Request:**
```json
{
  "hours": "24/7 Emergency, 8:00 AM - 8:00 PM General",
  "phone": "+1234567891"
}
```

### 3. Get Center by ID
**Endpoint:** `GET /centers/:id`  
**Authentication:** Required (Bearer token)  
**Authorization:** Admin, Center, Doctor, or Staff roles

### 4. Get All Center Types
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

---

## 🔄 Role-Based Profile Management Logic

### Frontend Implementation Strategy

**1. Check User Role After Login:**
```typescript
// After successful login
const user = response.user;
const userRoles = user.roles;

if (userRoles.includes('center')) {
  // Redirect to center dashboard
  // Use center-specific endpoints
  // Show center management interface
} else {
  // Redirect to personal profile dashboard
  // Use user profile endpoints
  // Show personal profile interface
}
```

**2. Different Profile Components:**
- **Individual Users (patient, doctor, nurse, staff):** Use `/users/profile` endpoints
- **Center Users:** Use `/centers/user/:userId` and `/centers/:id` endpoints

**3. Different Data Structures:**
- **Individual Profile:** Personal information (name, phone, address, etc.)
- **Center Profile:** Business information (center name, type, address, hours, etc.)

---

## 🎯 Updated Frontend Implementation Checklist

### Authentication Flow
- [ ] Implement registration form with validation
- [ ] Implement login form with validation
- [ ] Store tokens securely
- [ ] Implement automatic token refresh
- [ ] Handle logout functionality
- [ ] **Check user roles after login**
- [ ] **Route to appropriate dashboard based on role**

### Profile Management
- [ ] **Detect if user is center or individual**
- [ ] **Display appropriate profile interface**
- [ ] **Individual Users:** Display personal profile
- [ ] **Center Users:** Display center information
- [ ] Implement profile editing forms
- [ ] Handle avatar/image upload (if needed)
- [ ] Implement user preferences
- [ ] Handle profile creation/update

### Error Handling
- [ ] Implement proper error messages
- [ ] Handle network errors
- [ ] Handle authentication errors
- [ ] Implement loading states

### Security
- [ ] Validate all inputs on frontend
- [ ] Implement proper token storage
- [ ] Handle token expiration
- [ ] Implement secure logout

---

## 💻 Practical API Call Examples

### Frontend Implementation Examples

Here are practical examples of how to make API calls using the actual DTOs with realistic data:

### 1. User Registration Example

```typescript
// Registration API call
const registerUser = async (userData: RegisterDto) => {
  const response = await fetch('https://api.unlimtedhealth.com/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'sarah.wilson@email.com',
      password: 'SecurePass123!',
      name: 'Sarah Wilson',
      roles: ['patient'],
      phone: '+1-555-0123'
    })
  });
  
  const result = await response.json();
  return result;
};
```

### 2. User Login Example

```typescript
// Login API call
const loginUser = async (credentials: LoginDto) => {
  const response = await fetch('https://api.unlimtedhealth.com/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'sarah.wilson@email.com',
      password: 'SecurePass123!'
    })
  });
  
  const result = await response.json();
  // Store tokens
  localStorage.setItem('access_token', result.access_token);
  return result;
};
```

### 3. Get Current User Profile Example

```typescript
// Get current user profile
const getCurrentUser = async () => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/auth/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  const result = await response.json();
  return result.data;
};
```

### 4. Create/Update Personal Profile Example

```typescript
// Create or update personal profile
const updateProfile = async (profileData: CreateProfileDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/users/profile', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      firstName: 'Sarah',
      lastName: 'Wilson',
      displayName: 'Sarah Wilson',
      phone: '+1-555-0123',
      avatar: 'https://example.com/avatars/sarah-wilson.jpg',
      dateOfBirth: '1985-03-15',
      gender: 'female',
      address: '456 Oak Street, Springfield, IL 62701',
      specialization: null,
      licenseNumber: null,
      experience: null
    })
  });
  
  const result = await response.json();
  return result;
};
```

### 5. Center Registration Example

```typescript
// Step 1: Register center user
const registerCenterUser = async () => {
  const response = await fetch('https://api.unlimtedhealth.com/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'admin@springfieldmedical.com',
      password: 'HospitalPass456!',
      name: 'Dr. Michael Rodriguez',
      roles: ['center'],
      phone: '+1-555-0456'
    })
  });
  
  const result = await response.json();
  localStorage.setItem('access_token', result.access_token);
  return result;
};

// Step 2: Create center
const createCenter = async (centerData: CreateCenterDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/centers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Springfield Medical Center',
      type: 'hospital',
      address: '789 Healthcare Blvd, Springfield, IL 62701',
      phone: '+1-555-0456',
      email: 'info@springfieldmedical.com',
      hours: '24/7 Emergency, 6:00 AM - 10:00 PM General Services',
      imageUrl: 'https://example.com/hospitals/springfield-medical.jpg'
    })
  });
  
  const result = await response.json();
  return result;
};
```

### 6. Get Center Profile Example

```typescript
// Get center by user ID
const getCenterProfile = async (userId: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/centers/user/${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  const result = await response.json();
  return result;
};
```

### 7. Update Center Information Example

```typescript
// Update center information
const updateCenter = async (centerId: string, updateData: Partial<CreateCenterDto>) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/centers/${centerId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      hours: '24/7 Emergency, 5:00 AM - 11:00 PM General Services',
      phone: '+1-555-0457',
      email: 'contact@springfieldmedical.com'
    })
  });
  
  const result = await response.json();
  return result;
};
```

### 8. Get Center Types Example

```typescript
// Get all available center types
const getCenterTypes = async () => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/centers/types', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  const result = await response.json();
  return result;
};
```

### 9. Role-Based Dashboard Routing Example

```typescript
// Check user role and route accordingly
const handleLoginSuccess = async (loginResponse: any) => {
  const { user, access_token } = loginResponse;
  
  // Store token
  localStorage.setItem('access_token', access_token);
  
  // Check user roles
  const userRoles = user.roles;
  
  if (userRoles.includes('center')) {
    // Get center profile
    const centerProfile = await getCenterProfile(user.id);
    
    // Route to center dashboard
    window.location.href = '/dashboard/center';
    
    // Store center data
    localStorage.setItem('center_profile', JSON.stringify(centerProfile));
  } else {
    // Get personal profile
    const personalProfile = await getCurrentUser();
    
    // Route to personal dashboard
    window.location.href = '/dashboard/personal';
    
    // Store user data
    localStorage.setItem('user_profile', JSON.stringify(personalProfile));
  }
};
```

### 10. Error Handling Example

```typescript
// Comprehensive error handling
const apiCall = async (url: string, options: RequestInit) => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      
      switch (response.status) {
        case 400:
          throw new Error(`Validation Error: ${errorData.message}`);
        case 401:
          // Redirect to login
          localStorage.removeItem('access_token');
          window.location.href = '/login';
          throw new Error('Unauthorized - Please login again');
        case 403:
          throw new Error('Access Denied - Insufficient permissions');
        case 404:
          throw new Error('Resource not found');
        case 409:
          throw new Error('Conflict - Resource already exists');
        default:
          throw new Error(`API Error: ${errorData.message || 'Unknown error'}`);
      }
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
};
```

### 11. TypeScript Interface Examples

```typescript
// Define interfaces for type safety
interface RegisterDto {
  email: string;
  password: string;
  name: string;
  roles: string[];
  phone?: string;
}

interface LoginDto {
  email: string;
  password: string;
}

interface CreateProfileDto {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  avatar?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  specialization?: string;
  licenseNumber?: string;
  experience?: string;
}

interface CreateCenterDto {
  name: string;
  type: CenterType;
  address: string;
  phone?: string;
  email?: string;
  hours?: string;
  imageUrl?: string;
}

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
```

---

**Note:** This guide covers the endpoints needed for Stage 1 (User Profile Dashboard) including both individual users and center users. Additional endpoints for other stages will be provided in subsequent guides.
