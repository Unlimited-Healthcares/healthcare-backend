# Discovery System Testing Workflow

## 🧪 Complete API Testing Guide Using Curl Commands

This document provides a comprehensive testing workflow for the healthcare discovery system using curl commands. We'll test all the key components: user search, center search, request system, invitation system, and the complete workflow integration.

## 📋 Prerequisites

1. **Backend API running** on `https://api.unlimtedhealth.com`
2. **Database populated** with test data
3. **Valid JWT tokens** for different user types
4. **Test email addresses** for invitation testing

## 🔧 Environment Variables Setup

Set up the following environment variables for testing:

```bash
# Authentication tokens
export PATIENT_TOKEN="your-patient-jwt-token"
export DOCTOR_TOKEN="your-doctor-jwt-token"
export CENTER_TOKEN="your-center-jwt-token"

# Test entity UUIDs
export DOCTOR_UUID="your-test-doctor-uuid"
export CENTER_UUID="your-test-center-uuid"

# Optional: Additional test UUIDs
export PATIENT_UUID="your-test-patient-uuid"
export ANOTHER_DOCTOR_UUID="another-doctor-uuid-for-collaboration"
```

## 🔧 Test Data Setup

### 1. Create Test Users (if not already exists)

```bash
# Register a patient
curl -X POST https://api.unlimtedhealth.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cyberkrypt9@gmail.com",
    "password": "Test123Test123!",
    "name": "John Patient",
    "roles": ["patient"],
    "phone": "+1234567890"
  }'

# Register a doctor
curl -X POST https://api.unlimtedhealth.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "chukwuebuka.nwafor321@gmail.com",
    "password": "Test123Test123!",
    "name": "Dr. Jane Smith",
    "roles": ["doctor"],
    "phone": "+1234567891"
  }'

# Register a center admin
curl -X POST https://api.unlimtedhealth.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "chukwuebuka.nwaforx@gmail.com",
    "password": "Test123Test123!",
    "name": "City Hospital Admin",
    "roles": ["center"],
    "phone": "+1234567892"
  }'
```

### 2. Login and Get JWT Tokens

```bash
# Login as patient
PATIENT_TOKEN=$(curl -X POST https://api.unlimtedhealth.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cyberkrypt9@gmail.com",
    "password": "Test123Test123!"
  }' | jq -r '.access_token')

# Login as doctor
DOCTOR_TOKEN=$(curl -X POST https://api.unlimtedhealth.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "chukwuebuka.nwafor321@gmail.com",
    "password": "Test123Test123!"
  }' | jq -r '.access_token')

# Login as center admin
CENTER_TOKEN=$(curl -X POST https://api.unlimtedhealth.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "chukwuebuka.nwaforx@gmail.com",
    "password": "Test123Test123!"
  }' | jq -r '.access_token')

echo "Patient Token: $PATIENT_TOKEN"
echo "Doctor Token: $DOCTOR_TOKEN"
echo "Center Token: $CENTER_TOKEN"

### 3. Create User Profiles (Required for Discovery System)

```bash
# Create doctor profile with specialization and license
curl -X POST https://api.unlimtedhealth.com/api/users/profile \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "specialization": "Cardiology",
    "licenseNumber": "MD123456",
    "experience": "10 years",
    "displayName": "Dr. Jane Smith"
  }'

# Create center profile
curl -X POST https://api.unlimtedhealth.com/api/users/profile \
  -H "Authorization: Bearer $CENTER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "City Hospital Admin",
    "address": "123 Medical Center Dr, New York, NY 10001"
  }'

# Create patient profile
curl -X POST https://api.unlimtedhealth.com/api/users/profile \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "John Patient",
    "dateOfBirth": "1990-01-01",
    "gender": "male"
  }'
```
```

## 🔍 Phase 1: User Discovery Testing

### 1.1 Test User Search Endpoints

```bash
# Search for doctors by specialty
curl -X GET "https://api.unlimtedhealth.com/api/users/search?specialty=cardiology&type=doctor&page=1&limit=10" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json"

# Search for users by location
curl -X GET "https://api.unlimtedhealth.com/api/users/search?location=New%20York&type=doctor&page=1&limit=10" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json"

# Search for all doctors
curl -X GET "https://api.unlimtedhealth.com/api/users/search?type=doctor&page=1&limit=20" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json"

# Search for practitioners
curl -X GET "https://api.unlimtedhealth.com/api/users/search?type=practitioner&page=1&limit=10" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json"
```

### 1.2 Test Public Profile Access

```bash
# Get doctor's public profile (replace with actual doctor ID)
DOCTOR_UUID=$(curl -X GET https://api.unlimtedhealth.com/api/users/profile \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" | jq -r '.userId')

# Test profile access without authentication (should work for public profiles)
curl -X GET "https://api.unlimtedhealth.com/api/users/$DOCTOR_UUID/public-profile" \
  -H "Content-Type: application/json"
```

## 🏥 Phase 2: Center Discovery Testing

### 2.1 Test Center Search Endpoints

```bash
# Search centers by type
curl -X GET "https://api.unlimtedhealth.com/api/centers/search?type=hospital&page=1&limit=10" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json"

# Search centers by location
curl -s -X GET "https://api.unlimtedhealth.com/api/centers/search?location=New%20York&radius=50&page=1&limit=10" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json"


# Search for specific center types
curl -X GET "https://api.unlimtedhealth.com/api/centers/eye-clinics" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json"

curl -X GET "https://api.unlimtedhealth.com/api/centers/maternity" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json"

curl -X GET "https://api.unlimtedhealth.com/api/centers/hospital" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json"
```

### 2.2 Get Center UUID for Testing

```bash
# Get center UUID from search results (using first center from hospital search)
CENTER_UUID=$(curl -s -X GET "https://api.unlimtedhealth.com/api/centers/search?type=hospital&page=1&limit=1" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" | jq -r '.centers[0].id')

# Alternative: Get center UUID from specific center type endpoint
# CENTER_UUID=$(curl -s -X GET "https://api.unlimtedhealth.com/api/centers/hospital" \
#   -H "Authorization: Bearer $PATIENT_TOKEN" \
#   -H "Content-Type: application/json" | jq -r '.[0].id')

# Verify center UUID was retrieved
echo "Center UUID: $CENTER_UUID"

# Test center details access (now works for patients)
curl -X GET "https://api.unlimtedhealth.com/api/centers/$CENTER_UUID" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json"
```

### 2.3 Test Invitation Management

```bash
# Get individual invitation by ID
curl -X GET "https://api.unlimtedhealth.com/api/invitations/$INVITATION_ID" \
  -H "Authorization: Bearer $CENTER_TOKEN" \
  -H "Content-Type: application/json"

# List all invitations for a center (with pagination)
curl -X GET "https://api.unlimtedhealth.com/api/invitations/center/$CENTER_UUID?page=1&limit=10" \
  -H "Authorization: Bearer $CENTER_TOKEN" \
  -H "Content-Type: application/json"

# Test pagination
curl -X GET "https://api.unlimtedhealth.com/api/invitations/center/$CENTER_UUID?page=2&limit=5" \
  -H "Authorization: Bearer $CENTER_TOKEN" \
  -H "Content-Type: application/json"
```

### 2.4 Test Nearby Centers

```bash
# Find nearby centers by coordinates
curl -X GET "https://api.unlimtedhealth.com/api/centers/nearby?lat=40.7128&lng=-74.0060&radius=25" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json"

# Find nearby centers by address
curl -X GET "https://api.unlimtedhealth.com/api/centers/nearby?address=New%20York%2C%20NY&radius=30" -H "Authorization: Bearer $PATIENT_TOKEN" -H "Content-Type: application/json"
```

### 2.4 Test Center Details

```bash
# Get center details using the stored CENTER_UUID
curl -X GET "https://api.unlimtedhealth.com/api/centers/$CENTER_UUID" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json"

# Get center staff (admin/center only - patients cannot access staff info)
curl -X GET "https://api.unlimtedhealth.com/api/centers/$CENTER_UUID/staff" \
  -H "Authorization: Bearer $CENTER_TOKEN" \
  -H "Content-Type: application/json"
```

## 🤝 Phase 3: Request System Testing

### 3.1 Test Request Creation

```bash
# Patient requests to be connected to a doctor
curl -X POST https://api.unlimtedhealth.com/api/requests \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "'$DOCTOR_UUID'",
    "requestType": "connection",
    "message": "I would like you to be my cardiologist. I have been experiencing chest pain and would like to establish a professional relationship.",
    "metadata": {
      "medicalCondition": "chest pain",
      "urgency": "moderate"
    }
  }'

# Doctor applies to work at a center
curl -X POST https://api.unlimtedhealth.com/api/requests \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "'$CENTER_UUID'",
    "requestType": "job_application",
    "message": "I am a board-certified cardiologist with 10 years of experience. I would like to join your medical team.",
    "metadata": {
      "specialty": "cardiology",
      "experienceYears": 10,
      "licenseNumber": "MD123456"
    }
  }'

# Doctor requests collaboration with another doctor
curl -X POST https://api.unlimtedhealth.com/api/requests \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "'$DOCTOR_UUID'",
    "requestType": "collaboration",
    "message": "I have a complex cardiac case that could benefit from your expertise. Would you be interested in collaborating?",
    "metadata": {
      "caseType": "complex cardiac",
      "patientAge": 65
    }
  }'
```

### 3.2 Test Request Management

```bash
# Get received requests (as doctor)
curl -X GET "https://api.unlimtedhealth.com/api/requests/received?status=pending&page=1&limit=10" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json"

# Get sent requests (as patient)
curl -X GET "https://api.unlimtedhealth.com/api/requests/sent?status=pending&page=1&limit=10" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json"

# Get specific request details
REQUEST_ID="50c894a5-edfb-4d0e-9b14-7ebbf4ae6221"
curl -X GET "https://api.unlimtedhealth.com/api/requests/$REQUEST_ID" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json"
```

### 3.3 Test Request Responses

```bash
# Doctor approves patient connection request
curl -X PATCH "https://api.unlimtedhealth.com/api/requests/$REQUEST_ID/respond" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "message": "I would be happy to be your cardiologist. Please schedule an appointment for your initial consultation."
  }'

# Center rejects doctor job application
curl -X PATCH "https://api.unlimtedhealth.com/api/requests/$REQUEST_ID/respond" \
  -H "Authorization: Bearer $CENTER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "reject",
    "message": "Thank you for your interest. Unfortunately, we are not currently hiring cardiologists."
  }'

# Cancel a request
curl -X DELETE "https://api.unlimtedhealth.com/api/requests/$REQUEST_ID" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json"
```

## 📧 Phase 4: Email Invitation System Testing

### 4.1 Test Invitation Creation

```bash
# Center invites a doctor via email
curl -X POST https://api.unlimtedhealth.com/api/invitations \
  -H "Authorization: Bearer $CENTER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cyberkrypt9@gmail.com",
    "invitationType": "staff_invitation",
    "role": "doctor",
    "message": "We would like to invite you to join our medical team at City Hospital. We offer competitive benefits and a great work environment.",
    "centerId": "'$CENTER_UUID'",
    "metadata": {
      "department": "cardiology",
      "salary": "competitive",
      "benefits": ["health insurance", "retirement plan", "continuing education"]
    }
  }'

# Doctor invites a patient via email
curl -X POST https://api.unlimtedhealth.com/api/invitations \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "chukwuebuka.nwafor321@gmail.com",
    "invitationType": "patient_invitation",
    "message": "I would like to invite you to join our patient portal. This will allow you to easily book appointments and access your medical records online.",
    "metadata": {
      "doctorName": "Dr. Jane Smith",
      "specialty": "cardiology"
    }
  }'

# Doctor invites another doctor for collaboration
curl -X POST https://api.unlimtedhealth.com/api/invitations \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "chukwuebuka.nwaforx@gmail.com",
    "invitationType": "doctor_invitation",
    "message": "I would like to connect with you on our healthcare platform for potential collaboration opportunities.",
    "metadata": {
      "specialty": "cardiology",
      "collaborationType": "case consultation"
    }
  }'
```

### 4.2 Test Invitation Management

```bash
# Check pending invitations for an email
curl -X GET "https://api.unlimtedhealth.com/api/invitations/pending?email=cyberkrypt9@gmail.com" \
  -H "Content-Type: application/json"

# Check pending invitations for another email
curl -X GET "https://api.unlimtedhealth.com/api/invitations/pending?email=chukwuebuka.nwafor321@gmail.com" \
  -H "Content-Type: application/json"
```

### 4.3 Test Invitation Acceptance (Simulation)

```bash
# Note: In real testing, you would receive an email with a token
# For testing purposes, we'll simulate the acceptance process

# First, get the invitation token from the database or email
INVITATION_TOKEN="invitation-token-from-email"

# Accept invitation and register
curl -X POST "https://api.unlimtedhealth.com/api/invitations/$INVITATION_TOKEN/accept" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. New Doctor",
    "password": "Test123Test123!",
    "phone": "+1234567893",
    "profileData": {
      "specialization": "cardiology",
      "licenseNumber": "MD789012",
      "experience": 5
    }
  }'

# Decline invitation
curl -X POST "https://api.unlimtedhealth.com/api/invitations/$INVITATION_TOKEN/decline" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Not interested in this opportunity at this time"
  }'
```

## 🔄 Phase 5: Complete Workflow Integration Testing

### 5.1 Patient Discovery to Appointment Workflow

```bash
# Step 1: Patient searches for cardiologists
echo "=== Step 1: Patient searches for cardiologists ==="
curl -X GET "https://api.unlimtedhealth.com/api/users/search?specialty=cardiology&type=doctor&page=1&limit=5" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json"

# Step 2: Patient views doctor's public profile
echo "=== Step 2: Patient views doctor profile ==="
curl -X GET "https://api.unlimtedhealth.com/api/users/$DOCTOR_UUID/public-profile" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json"

# Step 3: Patient sends connection request
echo "=== Step 3: Patient sends connection request ==="
CONNECTION_REQUEST=$(curl -X POST https://api.unlimtedhealth.com/api/requests \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "'$DOCTOR_UUID'",
    "requestType": "connection",
    "message": "I would like you to be my cardiologist. I have been experiencing chest pain and need professional care.",
    "metadata": {
      "medicalCondition": "chest pain",
      "urgency": "moderate"
    }
  }')

echo "Connection request created: $CONNECTION_REQUEST"
CONNECTION_REQUEST_ID=$(echo $CONNECTION_REQUEST | jq -r '.id')

# Step 4: Doctor checks received requests
echo "=== Step 4: Doctor checks received requests ==="
curl -X GET "https://api.unlimtedhealth.com/api/requests/received?status=pending&page=1&limit=10" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json"

# Step 5: Doctor approves connection request
echo "=== Step 5: Doctor approves connection request ==="
curl -X PATCH "https://api.unlimtedhealth.com/api/requests/$CONNECTION_REQUEST_ID/respond" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "message": "I would be happy to be your cardiologist. Please schedule an appointment for your initial consultation."
  }'

# Step 6: Patient books appointment (using existing appointment system)
echo "=== Step 6: Patient books appointment ==="
curl -X POST https://api.unlimtedhealth.com/api/appointments \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "centerId": "'$CENTER_UUID'",
    "doctorId": "'$DOCTOR_UUID'",
    "appointmentDate": "2024-02-15T10:00:00Z",
    "duration": 30,
    "reason": "Initial consultation for chest pain",
    "notes": "Patient experiencing chest pain, needs cardiology evaluation"
  }'
```

### 5.2 Center Recruitment Workflow

```bash
# Step 1: Center searches for available doctors
echo "=== Step 1: Center searches for doctors ==="
curl -X GET "https://api.unlimtedhealth.com/api/users/search?type=doctor&specialty=cardiology&page=1&limit=10" \
  -H "Authorization: Bearer $CENTER_TOKEN" \
  -H "Content-Type: application/json"

# Step 2: Center sends email invitation to non-registered doctor
echo "=== Step 2: Center sends email invitation ==="
curl -X POST https://api.unlimtedhealth.com/api/invitations \
  -H "Authorization: Bearer $CENTER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "azegegberbridget123@gmail.com",
    "invitationType": "staff_invitation",
    "role": "doctor",
    "message": "We are looking for a cardiologist to join our team. We offer competitive compensation and excellent benefits.",
    "centerId": "'$CENTER_UUID'",
    "metadata": {
      "department": "cardiology",
      "position": "staff cardiologist",
      "benefits": ["health insurance", "retirement plan", "malpractice insurance"]
    }
  }'

# Step 3: Center also sends direct job application request to registered doctor
echo "=== Step 3: Center sends job application request ==="
curl -X POST https://api.unlimtedhealth.com/api/requests \
  -H "Authorization: Bearer $CENTER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "'$DOCTOR_UUID'",
    "requestType": "staff_invitation",
    "message": "We would like to invite you to join our medical team. We have an opening for a cardiologist.",
    "metadata": {
      "position": "staff cardiologist",
      "department": "cardiology",
      "startDate": "2024-03-01"
    }
  }'
```

### 5.3 Doctor Collaboration Workflow

```bash
# Step 1: Doctor searches for specialists
echo "=== Step 1: Doctor searches for specialists ==="
curl -X GET "https://api.unlimtedhealth.com/api/users/search?type=doctor&specialty=neurology&page=1&limit=5" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json"

# Step 2: Doctor sends collaboration request
echo "=== Step 2: Doctor sends collaboration request ==="
curl -X POST https://api.unlimtedhealth.com/api/requests \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "'$DOCTOR_UUID'",
    "requestType": "collaboration",
    "message": "I have a patient with complex cardiac and neurological symptoms. Would you be interested in collaborating on this case?",
    "metadata": {
      "caseType": "cardio-neurological",
      "patientAge": 72,
      "symptoms": ["chest pain", "dizziness", "memory issues"]
    }
  }'
```

## 📊 Phase 6: Notification Testing

### 6.1 Test Notification System

```bash
# Get user notifications
curl -X GET "https://api.unlimtedhealth.com/api/notifications" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json"

# Mark notification as read
NOTIFICATION_ID="notification-uuid-here"
curl -X PATCH "https://api.unlimtedhealth.com/api/notifications/$NOTIFICATION_ID" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "read": true
  }'

# Get notification preferences
curl -X GET "https://api.unlimtedhealth.com/api/notifications/preferences" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json"
```

## 🔍 Phase 7: Error Handling and Edge Cases

### 7.1 Test Invalid Requests

```bash
# Test with invalid user ID
curl -X GET "https://api.unlimtedhealth.com/api/users/invalid-uuid/public-profile" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json"

# Test with invalid request type
curl -X POST https://api.unlimtedhealth.com/api/requests \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "'$DOCTOR_UUID'",
    "requestType": "invalid_type",
    "message": "This should fail"
  }'

# Test with expired invitation token
curl -X POST "https://api.unlimtedhealth.com/api/invitations/expired-token/accept" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "password": "Test123!"
  }'
```

### 7.2 Test Authorization

```bash
# Test accessing protected endpoint without token
curl -X GET "https://api.unlimtedhealth.com/api/requests/received" \
  -H "Content-Type: application/json"

# Test accessing endpoint with wrong role
curl -X POST https://api.unlimtedhealth.com/api/invitations \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "invitationType": "staff_invitation"
  }'
```

## 📈 Phase 8: Performance Testing

### 8.1 Test Search Performance

```bash
# Test large result sets
curl -X GET "https://api.unlimtedhealth.com/api/users/search?type=doctor&page=1&limit=100" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -w "Time: %{time_total}s\n"

# Test complex search filters
curl -X GET "https://api.unlimtedhealth.com/api/users/search?specialty=cardiology&location=New York&experience=5&page=1&limit=50" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -w "Time: %{time_total}s\n"
```

## 🎯 Expected Results Summary

### ✅ Successful Test Indicators

1. **User Search**: Returns paginated list of users with proper filtering
2. **Center Search**: Returns centers by type, location, and nearby search
3. **Request System**: Creates, manages, and responds to requests properly
4. **Invitation System**: Creates invitations and handles acceptance/decline
5. **Integration**: Complete workflow from discovery to appointment booking
6. **Notifications**: Real-time notifications for all actions
7. **Error Handling**: Proper error messages for invalid inputs
8. **Authorization**: Proper role-based access control

### 📊 Performance Benchmarks

- **Search Response Time**: < 2 seconds for 100 results
- **Request Creation**: < 1 second
- **Notification Delivery**: < 5 seconds
- **Database Queries**: Optimized with proper indexing

### 🚨 Common Issues to Watch For

1. **Authentication Errors**: Invalid or expired tokens
2. **Validation Errors**: Missing required fields or invalid data types
3. **Permission Errors**: Users trying to access restricted endpoints
4. **Database Errors**: Foreign key constraints or missing records
5. **Email Delivery**: Invitation emails not being sent
6. **Notification Delays**: Real-time notifications not working

## 🔧 Troubleshooting Commands

```bash
# Check API health
curl -X GET "https://api.unlimtedhealth.com/api/health" \
  -H "Content-Type: application/json"

# Check database connectivity
curl -X GET "https://api.unlimtedhealth.com/api/health/detailed" \
  -H "Content-Type: application/json"

# Verify JWT token
curl -X GET "https://api.unlimtedhealth.com/api/auth/me" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json"
```

## 📝 Test Results Documentation

After running all tests, document:

1. **Passed Tests**: List of successful API calls
2. **Failed Tests**: List of failed calls with error messages
3. **Performance Metrics**: Response times for each endpoint
4. **Issues Found**: Any bugs or unexpected behavior
5. **Recommendations**: Suggestions for improvements

This comprehensive testing workflow ensures that the discovery system is working correctly and provides a solid foundation for the healthcare platform's networking capabilities.
