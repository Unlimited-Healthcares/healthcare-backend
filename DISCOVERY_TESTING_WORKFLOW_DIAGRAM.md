# Discovery System Testing Workflow Diagram

## 🔄 Complete Testing Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DISCOVERY SYSTEM TESTING WORKFLOW                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PHASE 1       │    │   PHASE 2       │    │   PHASE 3       │    │   PHASE 4       │
│   USER          │    │   CENTER        │    │   REQUEST       │    │   INVITATION    │
│   DISCOVERY     │    │   DISCOVERY     │    │   SYSTEM        │    │   SYSTEM        │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         ▼                       ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ • Search users  │    │ • Search centers│    │ • Create request│    │ • Send email    │
│ • Filter by     │    │ • Filter by type│    │ • Manage requests│    │   invitations   │
│   specialty     │    │ • Find nearby   │    │ • Approve/reject│    │ • Accept/decline│
│ • View profiles │    │ • Get details   │    │ • Track status  │    │ • Auto-register │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         └───────────────────────┼───────────────────────┼───────────────────────┘
                                 │                       │
                                 ▼                       ▼
                    ┌─────────────────────────────────────────┐
                    │           PHASE 5                      │
                    │      INTEGRATION TESTING               │
                    └─────────────────────────────────────────┘
                                         │
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │  Complete Workflow: Discovery →        │
                    │  Connection → Appointment Booking      │
                    └─────────────────────────────────────────┘
```

## 🧪 Detailed Testing Steps

### **Phase 1: User Discovery Testing**
```
1. Register Test Users
   ├── Patient: patient@test.com
   ├── Doctor: doctor@test.com  
   └── Center Admin: center@test.com

2. Get JWT Tokens
   ├── Login each user
   └── Extract access tokens

3. Test User Search
   ├── Search by specialty: GET /users/search?specialty=cardiology
   ├── Search by location: GET /users/search?location=New York
   ├── Search by role: GET /users/search?role=doctor
   └── View public profiles: GET /users/{id}/public-profile
```

### **Phase 2: Center Discovery Testing**
```
1. Test Center Search
   ├── Search by type: GET /centers/search?type=hospital
   ├── Search by location: GET /centers/search?location=New York
   └── Search specific types: GET /centers/eye-clinics

2. Test Nearby Search
   ├── By coordinates: GET /centers/nearby?lat=40.7128&lng=-74.0060
   └── By address: GET /centers/nearby?address=New York, NY

3. Test Center Details
   ├── Get center info: GET /centers/{id}
   └── Get staff: GET /centers/{id}/staff
```

### **Phase 3: Request System Testing**
```
1. Create Requests
   ├── Patient → Doctor: POST /requests (connection)
   ├── Doctor → Center: POST /requests (job_application)
   └── Doctor → Doctor: POST /requests (collaboration)

2. Manage Requests
   ├── View received: GET /requests/received
   ├── View sent: GET /requests/sent
   └── Get details: GET /requests/{id}

3. Respond to Requests
   ├── Approve: PATCH /requests/{id}/respond (action: approve)
   ├── Reject: PATCH /requests/{id}/respond (action: reject)
   └── Cancel: DELETE /requests/{id}
```

### **Phase 4: Invitation System Testing**
```
1. Send Invitations
   ├── Center → Doctor: POST /invitations (staff_invitation)
   ├── Doctor → Patient: POST /invitations (patient_invitation)
   └── Doctor → Doctor: POST /invitations (doctor_invitation)

2. Check Invitations
   ├── Pending invitations: GET /invitations/pending?email=test@example.com
   └── Invitation details: Check email for token

3. Handle Invitations
   ├── Accept: POST /invitations/{token}/accept
   └── Decline: POST /invitations/{token}/decline
```

### **Phase 5: Integration Testing**
```
1. Complete Patient Workflow
   ├── Search for doctor
   ├── View doctor profile
   ├── Send connection request
   ├── Doctor approves request
   └── Book appointment

2. Complete Center Workflow
   ├── Search for doctors
   ├── Send email invitations
   ├── Send job applications
   └── Manage staff

3. Complete Doctor Workflow
   ├── Search for specialists
   ├── Send collaboration requests
   ├── Invite patients
   └── Manage connections
```

## 🔍 Testing Commands Summary

### **Authentication Commands**
```bash
# Register users
curl -X POST /auth/register -d '{"email":"user@test.com","password":"Test123Test123!","name":"Test User","roles":["patient"]}'

# Login and get token
TOKEN=$(curl -X POST /auth/login -d '{"email":"user@test.com","password":"Test123Test123!"}' | jq -r '.access_token')
```

### **Discovery Commands**
```bash
# Search users
curl -X GET "/users/search?specialty=cardiology&role=doctor" -H "Authorization: Bearer $TOKEN"

# Search centers
curl -X GET "/centers/search?type=hospital&location=New York" -H "Authorization: Bearer $TOKEN"

# Get public profile
curl -X GET "/users/{id}/public-profile" -H "Authorization: Bearer $TOKEN"
```

### **Request Commands**
```bash
# Create request
curl -X POST /requests -H "Authorization: Bearer $TOKEN" -d '{"recipientId":"uuid","requestType":"connection","message":"Test"}'

# Get requests
curl -X GET "/requests/received?status=pending" -H "Authorization: Bearer $TOKEN"

# Respond to request
curl -X PATCH "/requests/{id}/respond" -H "Authorization: Bearer $TOKEN" -d '{"action":"approve","message":"Approved"}'
```

### **Invitation Commands**
```bash
# Send invitation
curl -X POST /invitations -H "Authorization: Bearer $TOKEN" -d '{"email":"test@example.com","invitationType":"staff_invitation","role":"doctor"}'

# Check pending invitations
curl -X GET "/invitations/pending?email=test@example.com"

# Accept invitation
curl -X POST "/invitations/{token}/accept" -d '{"name":"Test User","password":"Test123Test123!"}'
```

## 📊 Expected Results

### **✅ Success Indicators**
- All API calls return 200/201 status codes
- Search results are properly paginated
- Requests are created and managed correctly
- Invitations are sent and handled properly
- Complete workflows function end-to-end

### **🚨 Error Scenarios to Test**
- Invalid authentication tokens
- Missing required fields
- Invalid user IDs or UUIDs
- Permission denied errors
- Rate limiting responses

### **📈 Performance Benchmarks**
- Search queries: < 2 seconds
- Request creation: < 1 second
- Notification delivery: < 5 seconds
- Database operations: Optimized with indexes

## 🎯 Testing Checklist

- [ ] User registration and authentication
- [ ] User search with various filters
- [ ] Center search and nearby functionality
- [ ] Public profile access
- [ ] Request creation and management
- [ ] Request approval/rejection workflow
- [ ] Email invitation system
- [ ] Invitation acceptance/decline
- [ ] Complete discovery to appointment workflow
- [ ] Notification system integration
- [ ] Error handling and validation
- [ ] Performance and response times
- [ ] Security and authorization
- [ ] Database integrity and constraints

This comprehensive testing workflow ensures that the discovery system is fully functional and ready for production use.
