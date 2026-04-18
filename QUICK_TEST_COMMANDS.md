# Quick Discovery System Test Commands

## 🚀 Essential Testing Commands

### **1. Setup & Authentication**
```bash
# Set base URL
API_URL="https://api.unlimtedhealth.com/api"

# Register test users with real emails
curl -X POST $API_URL/auth/register -H "Content-Type: application/json" -d '{"email":"cyberkrypt9@gmail.com","password":"Test123Test123!","name":"John Patient","roles":["patient"]}'
curl -X POST $API_URL/auth/register -H "Content-Type: application/json" -d '{"email":"chukwuebuka.nwafor321@gmail.com","password":"Test123Test123!","name":"Dr. Jane Smith","roles":["doctor"]}'
curl -X POST $API_URL/auth/register -H "Content-Type: application/json" -d '{"email":"chukwuebuka.nwaforx@gmail.com","password":"Test123Test123!","name":"City Hospital Admin","roles":["center"]}'

# Create profiles with additional info
curl -X POST $API_URL/users/profile -H "Authorization: Bearer $DOCTOR_TOKEN" -H "Content-Type: application/json" -d '{"specialization":"Cardiology","licenseNumber":"MD123456","experience":"10 years"}'
curl -X POST $API_URL/users/profile -H "Authorization: Bearer $CENTER_TOKEN" -H "Content-Type: application/json" -d '{"displayName":"City Hospital Admin","address":"123 Medical Center Dr, New York, NY 10001"}'
curl -X POST $API_URL/users/profile -H "Authorization: Bearer $PATIENT_TOKEN" -H "Content-Type: application/json" -d '{"displayName":"John Patient","dateOfBirth":"1990-01-01","gender":"male"}'

# Get tokens
PATIENT_TOKEN=$(curl -X POST $API_URL/auth/login -H "Content-Type: application/json" -d '{"email":"cyberkrypt9@gmail.com","password":"Test123Test123!"}' | jq -r '.access_token')
DOCTOR_TOKEN=$(curl -X POST $API_URL/auth/login -H "Content-Type: application/json" -d '{"email":"chukwuebuka.nwafor321@gmail.com","password":"Test123Test123!"}' | jq -r '.access_token')
CENTER_TOKEN=$(curl -X POST $API_URL/auth/login -H "Content-Type: application/json" -d '{"email":"chukwuebuka.nwaforx@gmail.com","password":"Test123Test123!"}' | jq -r '.access_token')
```

### **2. User Discovery Testing**
```bash
# Search for doctors
curl -X GET "$API_URL/users/search?type=doctor&page=1&limit=10" -H "Authorization: Bearer $PATIENT_TOKEN"

# Search by specialty
curl -X GET "$API_URL/users/search?specialty=cardiology&type=doctor" -H "Authorization: Bearer $PATIENT_TOKEN"

# Search by location
curl -X GET "$API_URL/users/search?location=New York&type=doctor" -H "Authorization: Bearer $PATIENT_TOKEN"

# Get public profile (replace with actual doctor ID)
curl -X GET "$API_URL/users/DOCTOR_ID/public-profile" -H "Authorization: Bearer $PATIENT_TOKEN"
```

### **3. Center Discovery Testing**
```bash
# Search centers by type
curl -X GET "$API_URL/centers/search?type=hospital&page=1&limit=10" -H "Authorization: Bearer $PATIENT_TOKEN"

# Search specific center types
curl -X GET "$API_URL/centers/eye-clinics" -H "Authorization: Bearer $PATIENT_TOKEN"
curl -X GET "$API_URL/centers/maternity" -H "Authorization: Bearer $PATIENT_TOKEN"
curl -X GET "$API_URL/centers/hospital" -H "Authorization: Bearer $PATIENT_TOKEN"

# Find nearby centers
curl -X GET "$API_URL/centers/nearby?lat=40.7128&lng=-74.0060&radius=25" -H "Authorization: Bearer $PATIENT_TOKEN"
```

### **4. Request System Testing**
```bash
# Patient sends connection request to doctor
curl -X POST $API_URL/requests -H "Authorization: Bearer $PATIENT_TOKEN" -H "Content-Type: application/json" -d '{
  "recipientId": "DOCTOR_ID_HERE",
  "requestType": "connection",
  "message": "I would like you to be my cardiologist",
  "metadata": {"medicalCondition": "chest pain"}
}'

# Doctor applies to work at center
curl -X POST $API_URL/requests -H "Authorization: Bearer $DOCTOR_TOKEN" -H "Content-Type: application/json" -d '{
  "recipientId": "CENTER_ID_HERE",
  "requestType": "job_application",
  "message": "I would like to join your medical team",
  "metadata": {"specialty": "cardiology", "experienceYears": 10}
}'

# Get received requests
curl -X GET "$API_URL/requests/received?status=pending" -H "Authorization: Bearer $DOCTOR_TOKEN"

# Get sent requests
curl -X GET "$API_URL/requests/sent?status=pending" -H "Authorization: Bearer $PATIENT_TOKEN"

# Approve request
curl -X PATCH "$API_URL/requests/REQUEST_ID/respond" -H "Authorization: Bearer $DOCTOR_TOKEN" -H "Content-Type: application/json" -d '{
  "action": "approve",
  "message": "I would be happy to be your doctor"
}'

# Reject request
curl -X PATCH "$API_URL/requests/REQUEST_ID/respond" -H "Authorization: Bearer $CENTER_TOKEN" -H "Content-Type: application/json" -d '{
  "action": "reject",
  "message": "Not currently hiring"
}'
```

### **5. Invitation System Testing**
```bash
# Center invites doctor via email
curl -X POST $API_URL/invitations -H "Authorization: Bearer $CENTER_TOKEN" -H "Content-Type: application/json" -d '{
  "email": "cyberkrypt9@gmail.com",
  "invitationType": "staff_invitation",
  "role": "doctor",
  "message": "Join our medical team",
  "centerId": "CENTER_ID_HERE"
}'

# Doctor invites patient via email
curl -X POST $API_URL/invitations -H "Authorization: Bearer $DOCTOR_TOKEN" -H "Content-Type: application/json" -d '{
  "email": "chukwuebuka.nwafor321@gmail.com",
  "invitationType": "patient_invitation",
  "message": "Join our patient portal"
}'

# Check pending invitations
curl -X GET "$API_URL/invitations/pending?email=cyberkrypt9@gmail.com"

# Accept invitation (replace with actual token from email)
curl -X POST "$API_URL/invitations/INVITATION_TOKEN/accept" -H "Content-Type: application/json" -d '{
  "name": "New Doctor",
  "password": "Test123Test123!",
  "phone": "+1234567890"
}'

# Decline invitation
curl -X POST "$API_URL/invitations/INVITATION_TOKEN/decline" -H "Content-Type: application/json" -d '{
  "reason": "Not interested"
}'
```

### **6. Complete Workflow Testing**
```bash
# Step 1: Patient searches for doctor
curl -X GET "$API_URL/users/search?specialty=cardiology&type=doctor" -H "Authorization: Bearer $PATIENT_TOKEN"

# Step 2: Patient sends connection request
REQUEST_RESPONSE=$(curl -X POST $API_URL/requests -H "Authorization: Bearer $PATIENT_TOKEN" -H "Content-Type: application/json" -d '{
  "recipientId": "DOCTOR_ID_HERE",
  "requestType": "connection",
  "message": "I need a cardiologist"
}')
REQUEST_ID=$(echo $REQUEST_RESPONSE | jq -r '.id')

# Step 3: Doctor approves request
curl -X PATCH "$API_URL/requests/$REQUEST_ID/respond" -H "Authorization: Bearer $DOCTOR_TOKEN" -H "Content-Type: application/json" -d '{
  "action": "approve",
  "message": "I would be happy to help"
}'

# Step 4: Patient books appointment
curl -X POST $API_URL/appointments -H "Authorization: Bearer $PATIENT_TOKEN" -H "Content-Type: application/json" -d '{
  "centerId": "CENTER_ID_HERE",
  "doctorId": "DOCTOR_ID_HERE",
  "appointmentDate": "2024-02-15T10:00:00Z",
  "duration": 30,
  "reason": "Initial consultation"
}'
```

### **7. Notification Testing**
```bash
# Get notifications
curl -X GET "$API_URL/notifications" -H "Authorization: Bearer $PATIENT_TOKEN"

# Mark notification as read
curl -X PATCH "$API_URL/notifications/NOTIFICATION_ID" -H "Authorization: Bearer $PATIENT_TOKEN" -H "Content-Type: application/json" -d '{"read": true}'

# Get notification preferences
curl -X GET "$API_URL/notifications/preferences" -H "Authorization: Bearer $PATIENT_TOKEN"
```

### **8. Error Testing**
```bash
# Test invalid authentication
curl -X GET "$API_URL/users/search" -H "Authorization: Bearer invalid_token"

# Test invalid request type
curl -X POST $API_URL/requests -H "Authorization: Bearer $PATIENT_TOKEN" -H "Content-Type: application/json" -d '{
  "recipientId": "DOCTOR_ID_HERE",
  "requestType": "invalid_type",
  "message": "This should fail"
}'

# Test invalid user ID
curl -X GET "$API_URL/users/invalid-uuid/public-profile" -H "Authorization: Bearer $PATIENT_TOKEN"
```

## 🔧 Helper Scripts

### **Get All User IDs**
```bash
# Get all users and extract IDs
curl -X GET "$API_URL/users?page=1&limit=100" -H "Authorization: Bearer $PATIENT_TOKEN" | jq -r '.data[].id'
```

### **Get All Center IDs**
```bash
# Get all centers and extract IDs
curl -X GET "$API_URL/centers?page=1&limit=100" -H "Authorization: Bearer $PATIENT_TOKEN" | jq -r '.data[].id'
```

### **Test API Health**
```bash
# Check if API is running
curl -X GET "$API_URL/health"

# Check detailed health
curl -X GET "$API_URL/health/detailed"
```

## 📊 Performance Testing
```bash
# Test search performance
time curl -X GET "$API_URL/users/search?type=doctor&page=1&limit=100" -H "Authorization: Bearer $PATIENT_TOKEN"

# Test with timing
curl -X GET "$API_URL/centers/search?type=hospital" -H "Authorization: Bearer $PATIENT_TOKEN" -w "Time: %{time_total}s\n"
```

## 🎯 Success Criteria

- ✅ All API calls return 200/201 status codes
- ✅ Search results are properly formatted and paginated
- ✅ Requests are created and managed correctly
- ✅ Invitations are sent and handled properly
- ✅ Complete workflows function end-to-end
- ✅ Error handling works as expected
- ✅ Performance meets benchmarks (< 2 seconds for searches)

## 🚨 Common Issues

1. **Authentication Errors**: Check token validity and format
2. **Validation Errors**: Ensure all required fields are provided
3. **Permission Errors**: Verify user roles and permissions
4. **Database Errors**: Check if referenced IDs exist
5. **Email Issues**: Verify email service configuration
6. **Notification Delays**: Check WebSocket and notification service

This quick reference provides all the essential commands needed to test the discovery system comprehensively.
