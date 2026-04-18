# Center Staff Management Workflow - Backend API Analysis

## Overview
This document outlines the existing backend API workflow for centers to add doctors and staff members to their healthcare centers.

## Current Backend Implementation

### 1. Database Schema

#### CenterStaff Entity
```typescript
@Entity('center_staff')
export class CenterStaff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;        // References users.id

  @Column()
  centerId: string;      // References healthcare_centers.id

  @Column({ default: 'staff' })
  role: string;          // 'doctor', 'staff', or 'owner'

  @ManyToOne(() => HealthcareCenter, center => center.staff)
  @JoinColumn({ name: 'centerId' })
  center: HealthcareCenter;

  @CreateDateColumn()
  createdAt: Date;
}
```

### 2. API Endpoints

#### Add Staff Member to Center
**Endpoint:** `POST /api/centers/:id/staff`
**Authentication:** Required (Bearer token with center or admin role)
**Request Body:**
```typescript
{
  userId: string;    // UUID of existing user
  role: string;      // 'doctor', 'staff', or 'owner'
}
```

**Response:**
```typescript
{
  id: string;        // CenterStaff UUID
  userId: string;    // User UUID
  centerId: string;  // Center UUID
  role: string;      // Assigned role
  createdAt: Date;   // Creation timestamp
}
```

#### Get All Center Staff
**Endpoint:** `GET /api/centers/:id/staff`
**Authentication:** Required (Bearer token with center or admin role)
**Response:**
```typescript
CenterStaff[] // Array of staff members
```

#### Remove Staff Member
**Endpoint:** `DELETE /api/centers/:id/staff/:staffId`
**Authentication:** Required (Bearer token with center or admin role)
**Response:**
```typescript
{
  message: "Staff member removed successfully"
}
```

### 3. Staff Registration Endpoints

#### Register New Staff/Doctor
**Endpoint:** `POST /api/auth/register/staff`
**Authentication:** Required (Bearer token with admin or center role)
**Request Body:**
```typescript
{
  email: string;
  password: string;
  name: string;
  roles: string[];    // ['doctor'] or ['staff']
  phone?: string;
}
```

**Response:**
```typescript
{
  id: string;         // User UUID (doctor-uuid)
  email: string;
  roles: string[];
  displayId: string;  // Generated display ID
  createdAt: Date;
}
```

## Complete Workflow Implementation

### Phase 1: Center Registration & Setup

#### Step 1: Center Admin Registers
```typescript
// 1. Center admin registers
POST /api/auth/register
{
  "email": "admin@hospital.com",
  "password": "StrongP@ss123!",
  "name": "Hospital Admin",
  "roles": ["center"],
  "phone": "+1234567890"
}

// Response: center-uuid and access token
```

#### Step 2: Create Center Profile
```typescript
// 2. Create center profile
POST /api/centers
{
  "name": "General Hospital",
  "type": "hospital",
  "address": "123 Medical St, City, State",
  "phone": "+1987654321",
  "email": "info@hospital.com",
  "hours": "24/7 Emergency, 9AM-5PM General"
}

// Response: center-uuid and center details
// Note: Creator automatically becomes 'owner' in center_staff table
```

### Phase 2: Staff Registration & Addition

#### Option A: Register New Doctor/Staff First, Then Add to Center

```typescript
// Step 1: Center admin registers new doctor
POST /api/auth/register/staff
Headers: { Authorization: "Bearer <center-admin-token>" }
{
  "email": "doctor@hospital.com",
  "password": "DoctorP@ss123!",
  "name": "Dr. Jane Smith",
  "roles": ["doctor"],
  "phone": "+1555123456"
}

// Response: doctor-uuid (user.id)
{
  "id": "doctor-uuid-123",
  "email": "doctor@hospital.com",
  "roles": ["doctor"],
  "displayId": "DR123456"
}

// Step 2: Add doctor to center staff
POST /api/centers/{center-uuid}/staff
Headers: { Authorization: "Bearer <center-admin-token>" }
{
  "userId": "doctor-uuid-123",
  "role": "doctor"
}

// Response: CenterStaff record created
{
  "id": "staff-record-uuid",
  "userId": "doctor-uuid-123",
  "centerId": "center-uuid",
  "role": "doctor",
  "createdAt": "2025-01-10T08:00:00Z"
}
```

#### Option B: Add Existing User to Center

```typescript
// If user already exists, just add them to center
POST /api/centers/{center-uuid}/staff
Headers: { Authorization: "Bearer <center-admin-token>" }
{
  "userId": "existing-user-uuid",
  "role": "doctor"
}
```

### Phase 3: Doctor Setup & Availability

#### Step 1: Doctor Sets Availability
```typescript
// Doctor logs in and sets availability
POST /api/appointments/availability
Headers: { Authorization: "Bearer <doctor-token>" }
{
  "providerId": "doctor-uuid-123",
  "dayOfWeek": "monday",
  "startTime": "09:00",
  "endTime": "17:00",
  "isRecurring": true,
  "isActive": true
}
```

#### Step 2: Doctor Completes Profile
```typescript
// Doctor updates their profile with specialty, etc.
PATCH /api/users/profile
Headers: { Authorization: "Bearer <doctor-token>" }
{
  "specialty": "Cardiology",
  "qualifications": "MD, Board Certified",
  "experience": "10 years"
}
```

### Phase 4: Verification & Management

#### View Center Staff
```typescript
// Center admin views all staff
GET /api/centers/{center-uuid}/staff
Headers: { Authorization: "Bearer <center-admin-token>" }

// Response: Array of staff members
[
  {
    "id": "staff-record-uuid-1",
    "userId": "center-owner-uuid",
    "centerId": "center-uuid",
    "role": "owner",
    "createdAt": "2025-01-01T00:00:00Z"
  },
  {
    "id": "staff-record-uuid-2",
    "userId": "doctor-uuid-123",
    "centerId": "center-uuid",
    "role": "doctor",
    "createdAt": "2025-01-10T08:00:00Z"
  }
]
```

## Key Implementation Details

### 1. Role Validation
```typescript
// In CentersService.addStaffMember()
if (!['doctor', 'staff', 'owner'].includes(role)) {
  role = 'staff'; // Default to staff if invalid role provided
}
```

### 2. Duplicate Prevention
```typescript
// Check if staff member already exists
const existingStaff = await this.staffRepository.findOne({
  where: { centerId, userId }
});

if (existingStaff) {
  throw new ConflictException('User is already a staff member at this center');
}
```

### 3. Owner Protection
```typescript
// Don't allow removal of center owner
if (staff.role === 'owner') {
  throw new ConflictException('Cannot remove center owner');
}
```

### 4. Automatic Owner Assignment
```typescript
// When center is created, creator becomes owner
const staff = this.staffRepository.create({
  userId: ownerId,
  centerId: savedCenter.id,
  role: 'owner',
});
```

## Required Frontend Implementation

### 1. Staff Management Interface
```typescript
interface StaffManagementProps {
  centerId: string;
  onStaffAdded: (staff: CenterStaff) => void;
}

// Components needed:
- StaffListComponent
- AddStaffModal
- StaffRoleSelector
- StaffMemberCard
```

### 2. Doctor Registration Flow
```typescript
interface DoctorRegistrationProps {
  centerId: string;
  onDoctorRegistered: (doctor: User) => void;
}

// Components needed:
- DoctorRegistrationForm
- RoleSelectionComponent
- EmailInvitationForm
```

### 3. Staff Management API Calls
```typescript
// Frontend service methods needed:
class StaffManagementService {
  async addStaffMember(centerId: string, userId: string, role: string)
  async getCenterStaff(centerId: string)
  async removeStaffMember(centerId: string, staffId: string)
  async registerNewStaff(registrationData: RegisterDto)
}
```

## Current Limitations

### 1. No Email Invitation System
- Centers must manually register doctors
- No invitation workflow for existing users
- No email notifications for staff additions

### 2. No Bulk Operations
- Must add staff one by one
- No CSV import functionality
- No bulk role assignment

### 3. No Staff Profile Management
- Limited staff information stored
- No specialty or qualification fields
- No staff-specific settings

## Recommended Enhancements

### 1. Email Invitation System
```typescript
// New endpoint needed:
POST /api/centers/{id}/staff/invite
{
  "email": "doctor@example.com",
  "role": "doctor",
  "message": "Welcome to our team!"
}
```

### 2. Enhanced Staff Profiles
```typescript
// Extend CenterStaff entity:
interface CenterStaffProfile {
  specialty?: string;
  qualifications?: string;
  department?: string;
  isActive: boolean;
  permissions: string[];
}
```

### 3. Staff Management Dashboard
```typescript
// New endpoints needed:
GET /api/centers/{id}/staff/analytics
GET /api/centers/{id}/staff/roles
PATCH /api/centers/{id}/staff/{staffId}/role
```

## Conclusion

The backend API provides a solid foundation for center staff management with:
- ✅ Complete CRUD operations for staff
- ✅ Role-based access control
- ✅ Duplicate prevention
- ✅ Owner protection
- ✅ Integration with user system

**Missing from frontend:**
- ❌ Staff management interface
- ❌ Doctor registration workflow
- ❌ Staff invitation system
- ❌ Bulk operations
- ❌ Enhanced staff profiles

The frontend developer needs to implement the staff management interface to make this functionality accessible to center administrators.
