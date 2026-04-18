# 🚀 Frontend Workflow Implementation Instructions

## 📋 Overview

This document provides step-by-step instructions for implementing the complete discovery system workflow in your frontend application. Follow these instructions exactly to build a successful, production-ready discovery and matching system.

**Base URL:** `https://api.unlimtedhealth.com/api`

---

## 🎯 Implementation Phases

### **PHASE 1: USER DISCOVERY INTERFACE** 
*Duration: 3-4 days*

#### **Step 1.1: Create User Search Page**
```typescript
// File: pages/DiscoveryPage.tsx
// Purpose: Main discovery interface for finding healthcare professionals

// REQUIRED COMPONENTS:
// 1. SearchFilters component
// 2. SearchResults component  
// 3. UserCard component
// 4. Pagination component

// IMPLEMENTATION STEPS:
// 1. Create search form with filters (specialty, location, radius)
// 2. Implement search API integration
// 3. Display results in card format
// 4. Add pagination controls
// 5. Handle loading and error states

// API ENDPOINTS TO USE:
// GET /users/search?specialty=cardiology&location=New York&radius=50&page=1&limit=20
// GET /users/{id}/public-profile
```

#### **Step 1.2: Build Search Filters Component**
```typescript
// File: components/discovery/SearchFilters.tsx
// Purpose: Filter interface for user search

// REQUIRED FILTERS:
// 1. User Type (doctor, practitioner, center)
// 2. Specialty dropdown (cardiology, dermatology, etc.)
// 3. Location input (city, state, ZIP)
// 4. Radius selector (10, 25, 50, 100 miles)
// 5. Experience range slider
// 6. Availability toggle

// IMPLEMENTATION RULES:
// 1. Use controlled components with useState
// 2. Debounce search input (300ms delay)
// 3. Validate location input format
// 4. Show filter count badge
// 5. Provide clear/reset functionality
```

#### **Step 1.3: Create User Card Component**
```typescript
// File: components/discovery/UserCard.tsx
// Purpose: Display individual user information

// REQUIRED ELEMENTS:
// 1. User avatar (with fallback)
// 2. Name and title
// 3. Specialty and experience
// 4. Location and distance
// 5. Rating and review count
// 6. Action buttons (Send Request, View Profile)

// IMPLEMENTATION RULES:
// 1. Use consistent card styling
// 2. Handle missing data gracefully
// 3. Show loading skeleton
// 4. Implement hover effects
// 5. Make buttons accessible
```

---

### **PHASE 2: CENTER DISCOVERY INTERFACE**
*Duration: 2-3 days*

#### **Step 2.1: Create Center Search Page**
```typescript
// File: pages/CentersPage.tsx
// Purpose: Search and discover healthcare centers

// REQUIRED FEATURES:
// 1. Center type filtering (hospital, clinic, eye clinic, etc.)
// 2. Location-based search
// 3. Nearby centers map view
// 4. Center details modal/page
// 5. Staff listing for each center

// API ENDPOINTS TO USE:
// GET /centers/search?type=hospital&location=New York&radius=25
// GET /centers/nearby?lat=40.7128&lng=-74.0060&radius=25
// GET /centers/{id}
// GET /centers/{id}/staff
```

#### **Step 2.2: Build Center Card Component**
```typescript
// File: components/discovery/CenterCard.tsx
// Purpose: Display center information

// REQUIRED ELEMENTS:
// 1. Center name and type
// 2. Address and contact info
// 3. Services offered
// 4. Operating hours
// 5. Staff count and specialties
// 6. Action buttons (View Details, Contact)

// IMPLEMENTATION RULES:
// 1. Show center type badge
// 2. Display distance from user
// 3. Highlight key services
// 4. Show availability status
// 5. Handle missing data
```

---

### **PHASE 3: REQUEST MANAGEMENT SYSTEM**
*Duration: 4-5 days*

#### **Step 3.1: Create Request Dashboard**
```typescript
// File: pages/RequestsPage.tsx
// Purpose: Manage connection requests

// REQUIRED SECTIONS:
// 1. Received Requests tab
// 2. Sent Requests tab
// 3. Request details modal
// 4. Action buttons (Approve, Reject, Cancel)
// 5. Request status indicators

// IMPLEMENTATION RULES:
// 1. Use tabbed interface
// 2. Show request count badges
// 3. Implement real-time updates
// 4. Add search/filter functionality
// 5. Handle bulk actions
```

#### **Step 3.2: Build Request Modal**
```typescript
// File: components/requests/RequestModal.tsx
// Purpose: Create and manage requests

// REQUIRED FIELDS:
// 1. Recipient selection
// 2. Request type dropdown
// 3. Message textarea
// 4. Metadata fields (role-specific)
// 5. Send/Cancel buttons

// REQUEST TYPES TO SUPPORT:
// - connection: General professional connection
// - collaboration: Professional collaboration
// - patient_request: Patient requests doctor
// - job_application: Apply to work at center
// - staff_invitation: Invite to join staff
// - referral: Patient referral

// API ENDPOINTS TO USE:
// POST /requests
// GET /requests/received?status=pending
// GET /requests/sent?status=pending
// PATCH /requests/{id}/respond
// DELETE /requests/{id}
```

#### **Step 3.3: Implement Request Actions**
```typescript
// File: components/requests/RequestActions.tsx
// Purpose: Handle request responses

// REQUIRED ACTIONS:
// 1. Approve request
// 2. Reject request
// 3. Cancel request
// 4. View request details
// 5. Send response message

// IMPLEMENTATION RULES:
// 1. Show confirmation dialogs
// 2. Handle loading states
// 3. Update UI immediately
// 4. Show success/error messages
// 5. Refresh data after actions
```

---

### **PHASE 4: INVITATION SYSTEM**
*Duration: 3-4 days*

#### **Step 4.1: Create Invitation Interface**
```typescript
// File: pages/InvitationsPage.tsx
// Purpose: Send and manage invitations

// REQUIRED FEATURES:
// 1. Send invitation form
// 2. Pending invitations list
// 3. Invitation acceptance page
// 4. Email validation
// 5. Role-specific invitation types

// INVITATION TYPES TO SUPPORT:
// - staff_invitation: Center invites doctor
// - patient_invitation: Doctor invites patient
// - doctor_invitation: Doctor invites doctor

// API ENDPOINTS TO USE:
// POST /invitations
// GET /invitations/pending?email=test@example.com
// POST /invitations/{token}/accept
// POST /invitations/{token}/decline
```

#### **Step 4.2: Build Invitation Form**
```typescript
// File: components/invitations/InvitationForm.tsx
// Purpose: Create invitation requests

// REQUIRED FIELDS:
// 1. Email address input
// 2. Invitation type selector
// 3. Role selection (for staff invitations)
// 4. Personal message
// 5. Metadata fields (role-specific)

// IMPLEMENTATION RULES:
// 1. Validate email format
// 2. Show role-specific fields
// 3. Add character limits
// 4. Preview invitation
// 5. Handle form validation
```

---

### **PHASE 5: PROFILE ENHANCEMENT**
*Duration: 2-3 days*

#### **Step 5.1: Extend Profile Editor**
```typescript
// File: components/profile/EnhancedProfileEditor.tsx
// Purpose: Add discovery-specific profile fields

// NEW FIELDS TO ADD:
// 1. Specialization dropdown
// 2. Qualifications input
// 3. Experience years
// 4. Location with coordinates
// 5. Availability schedule
// 6. Privacy settings

// IMPLEMENTATION RULES:
// 1. Use existing profile form structure
// 2. Add new sections with clear labels
// 3. Implement location autocomplete
// 4. Add privacy controls
// 5. Validate required fields
```

#### **Step 5.2: Add Privacy Settings**
```typescript
// File: components/profile/PrivacySettings.tsx
// Purpose: Control profile visibility and data sharing

// REQUIRED SETTINGS:
// 1. Profile visibility (public, private, professional_only)
// 2. Allow patient requests toggle
// 3. Allow center invitations toggle
// 4. Allow collaboration requests toggle
// 5. Contact preferences

// IMPLEMENTATION RULES:
// 1. Use toggle switches
// 2. Show setting descriptions
// 3. Save changes immediately
// 4. Show confirmation messages
// 5. Handle validation errors
```

---

### **PHASE 6: DASHBOARD INTEGRATION**
*Duration: 2-3 days*

#### **Step 6.1: Add Discovery Widgets**
```typescript
// File: components/dashboard/DiscoveryWidget.tsx
// Purpose: Add discovery features to main dashboard

// REQUIRED WIDGETS:
// 1. Recent connections
// 2. Pending requests
// 3. Quick search
// 4. Invitation status
// 5. Activity feed

// IMPLEMENTATION RULES:
// 1. Use existing dashboard layout
// 2. Add to appropriate sections
// 3. Show real-time data
// 4. Handle loading states
// 5. Link to full pages
```

#### **Step 6.2: Update Navigation**
```typescript
// File: components/navigation/MainNavigation.tsx
// Purpose: Add discovery menu items

// REQUIRED MENU ITEMS:
// 1. Find Doctors
// 2. Find Centers
// 3. My Connections
// 4. Requests
// 5. Invitations (role-specific)

// IMPLEMENTATION RULES:
// 1. Add to existing navigation
// 2. Use appropriate icons
// 3. Show notification badges
// 4. Handle role-based visibility
// 5. Maintain consistent styling
```

---

## 🔧 API Integration Instructions

### **Step 1: Create API Service Layer**
```typescript
// File: services/discoveryService.ts
// Purpose: Centralized API communication

// REQUIRED METHODS:
// 1. searchUsers(params)
// 2. searchCenters(params)
// 3. getUserProfile(userId)
// 4. getCenterDetails(centerId)
// 5. createRequest(requestData)
// 6. getReceivedRequests(status)
// 7. getSentRequests(status)
// 8. respondToRequest(requestId, action, message)
// 9. cancelRequest(requestId)
// 10. sendInvitation(invitationData)
// 11. getPendingInvitations(email)
// 12. acceptInvitation(token, userData)
// 13. declineInvitation(token, reason)

// IMPLEMENTATION RULES:
// 1. Use consistent error handling
// 2. Implement request/response interceptors
// 3. Add loading states
// 4. Handle authentication
// 5. Cache frequently used data
```

### **Step 2: Add Type Definitions**
```typescript
// File: types/discovery.ts
// Purpose: TypeScript type definitions

// REQUIRED INTERFACES:
// 1. User interface
// 2. Center interface
// 3. Request interface
// 4. Invitation interface
// 5. SearchParams interface
// 6. API response interfaces

// IMPLEMENTATION RULES:
// 1. Use strict typing
// 2. Add JSDoc comments
// 3. Export all interfaces
// 4. Use generic types where appropriate
// 5. Handle optional fields
```

---

## 🎯 Workflow Implementation Checklist

### **Phase 1: User Discovery** ✅
- [ ] Create SearchPage component
- [ ] Build SearchFilters component
- [ ] Implement UserCard component
- [ ] Add pagination functionality
- [ ] Test search API integration
- [ ] Handle loading and error states
- [ ] Add responsive design
- [ ] Implement accessibility features

### **Phase 2: Center Discovery** ✅
- [ ] Create CentersPage component
- [ ] Build CenterCard component
- [ ] Implement center type filtering
- [ ] Add location-based search
- [ ] Test center search APIs
- [ ] Add map integration (optional)
- [ ] Handle center details
- [ ] Test staff listing

### **Phase 3: Request Management** ✅
- [ ] Create RequestsPage component
- [ ] Build RequestModal component
- [ ] Implement request actions
- [ ] Add real-time updates
- [ ] Test request workflow
- [ ] Handle bulk actions
- [ ] Add search/filter
- [ ] Test error handling

### **Phase 4: Invitation System** ✅
- [ ] Create InvitationsPage component
- [ ] Build InvitationForm component
- [ ] Implement invitation acceptance
- [ ] Add email validation
- [ ] Test invitation workflow
- [ ] Handle role-specific forms
- [ ] Add preview functionality
- [ ] Test error scenarios

### **Phase 5: Profile Enhancement** ✅
- [ ] Extend profile editor
- [ ] Add new profile fields
- [ ] Implement privacy settings
- [ ] Add location services
- [ ] Test profile updates
- [ ] Handle validation
- [ ] Add form persistence
- [ ] Test data saving

### **Phase 6: Dashboard Integration** ✅
- [ ] Add discovery widgets
- [ ] Update navigation menu
- [ ] Integrate with notifications
- [ ] Test dashboard functionality
- [ ] Add real-time updates
- [ ] Handle role-based features
- [ ] Test responsive design
- [ ] Add accessibility features

---

## 🚀 Quick Start Commands

### **Test APIs First**
```bash
# Test user search
curl -X GET "https://api.unlimtedhealth.com/api/users/search?type=doctor&page=1&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test center search
curl -X GET "https://api.unlimtedhealth.com/api/centers/search?type=hospital&page=1&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test request creation
curl -X POST "https://api.unlimtedhealth.com/api/requests" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipientId":"uuid","requestType":"connection","message":"Test request"}'
```

### **Frontend Development**
```bash
# 1. Create new components
mkdir -p src/components/discovery
mkdir -p src/components/requests
mkdir -p src/components/invitations

# 2. Create new pages
mkdir -p src/pages/discovery
mkdir -p src/pages/requests
mkdir -p src/pages/invitations

# 3. Create services
mkdir -p src/services
mkdir -p src/types

# 4. Start development
npm run dev
```

---

## 📞 Success Criteria

### **Functional Requirements** ✅
- [ ] Users can search for doctors and centers
- [ ] Users can view detailed profiles
- [ ] Users can send connection requests
- [ ] Users can manage received/sent requests
- [ ] Users can send email invitations
- [ ] Users can accept/decline invitations
- [ ] Complete workflow from discovery to appointment
- [ ] Real-time notifications for all actions

### **Technical Requirements** ✅
- [ ] All API calls return 200/201 status codes
- [ ] Search results are properly paginated
- [ ] Requests are created and managed correctly
- [ ] Invitations are sent and handled properly
- [ ] Error handling for all scenarios
- [ ] Loading states for all operations
- [ ] Responsive design for all screen sizes
- [ ] Accessibility compliance

### **Performance Requirements** ✅
- [ ] Search queries complete in < 2 seconds
- [ ] Request creation completes in < 1 second
- [ ] Notification delivery in < 5 seconds
- [ ] Smooth user interactions
- [ ] Optimized API calls
- [ ] Efficient data caching
- [ ] Minimal bundle size impact

---

## 🎯 Implementation Timeline

### **Week 1: Foundation**
- Day 1-2: User discovery interface
- Day 3-4: Center discovery interface
- Day 5: API integration and testing

### **Week 2: Request System**
- Day 1-2: Request management dashboard
- Day 3-4: Request modal and actions
- Day 5: Testing and refinement

### **Week 3: Invitations & Profiles**
- Day 1-2: Invitation system
- Day 3-4: Profile enhancement
- Day 5: Integration testing

### **Week 4: Dashboard & Polish**
- Day 1-2: Dashboard integration
- Day 3-4: Navigation updates
- Day 5: Final testing and deployment

---

## 🚨 Critical Success Factors

### **1. Follow the Workflow Exactly**
- Implement phases in order
- Complete each step before moving to next
- Test thoroughly at each phase
- Don't skip any required components

### **2. Use the Provided API Endpoints**
- All endpoints are tested and working
- Follow the exact request/response format
- Handle all error scenarios
- Implement proper authentication

### **3. Maintain Consistency**
- Use existing design patterns
- Follow established coding standards
- Maintain responsive design
- Ensure accessibility compliance

### **4. Test Continuously**
- Test each component individually
- Test complete workflows
- Test error scenarios
- Test on different devices

---

**Follow these instructions exactly, and you'll have a fully functional discovery system that integrates seamlessly with your existing healthcare dashboard!** 🚀
