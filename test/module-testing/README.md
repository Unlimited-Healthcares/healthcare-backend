# 🧪 Module-by-Module API Testing Guide

## 🎯 Overview
This directory contains individual test suites for each API module, allowing you to test endpoints separately for easier troubleshooting and development.

## 🚀 Quick Start

### 1. Setup Environment
```bash
# Start the database
docker-compose up postgres -d

# Install dependencies
npm install

# Setup test database
npm run test:setup-db
```

### 2. Run All Module Tests
```bash
# Run all module tests sequentially
npm run test:modules

# Run specific module test
npm run test:module auth
npm run test:module users
npm run test:module patients
```

### 3. Test Individual Endpoints
```bash
# Test specific endpoint
npm run test:endpoint auth/login
npm run test:endpoint users/create
```

## 📁 Module Test Structure

Each module test follows this pattern:
```
test/module-testing/
├── auth.module.test.ts           # Authentication endpoints
├── users.module.test.ts          # User management endpoints  
├── patients.module.test.ts       # Patient management endpoints
├── appointments.module.test.ts   # Appointment scheduling endpoints
├── medical-records.module.test.ts # Medical records endpoints
├── centers.module.test.ts        # Healthcare centers endpoints
├── referrals.module.test.ts      # Patient referrals endpoints
├── reviews.module.test.ts        # Reviews & ratings endpoints
├── notifications.module.test.ts  # Notification system endpoints
├── integrations.module.test.ts   # External integrations endpoints
├── location.module.test.ts       # Location services endpoints
├── chat.module.test.ts           # Chat system endpoints
├── emergency.module.test.ts      # Emergency services endpoints
├── blood-donation.module.test.ts # Blood donation endpoints
├── ai.module.test.ts             # AI assistant endpoints
└── admin.module.test.ts          # Admin panel endpoints
```

## 🔧 Test Configuration

### Environment Variables
Tests use `.env.test` configuration:
- Database: `healthcare_test` (separate from development)
- Port: `3001` (separate from development server)
- JWT secrets: Test-specific secrets

### Database Setup
- Automatic database seeding before tests
- Clean state for each module test
- Transaction rollback after each test

## 📊 Test Reports

Each module test generates:
- ✅ **Pass/Fail Status** for each endpoint
- 📈 **Response Time Metrics**
- 🔍 **Detailed Error Logs**
- 📋 **Coverage Reports**

## 🎯 Testing Phases

### Phase 1: Core Authentication & Users
- [ ] Authentication (login, register, refresh)
- [ ] Users (CRUD operations)
- [ ] Authorization (role-based access)

### Phase 2: Patient Management
- [ ] Patients (CRUD operations)
- [ ] Patient visits
- [ ] Patient search

### Phase 3: Healthcare Operations
- [ ] Medical Records (CRUD, file uploads)
- [ ] Appointments (scheduling, availability)
- [ ] Healthcare Centers (management)

### Phase 4: Advanced Features
- [ ] Referrals (patient referrals)
- [ ] Reviews & Ratings
- [ ] Notifications (multi-channel)

### Phase 5: Integrations & Services
- [ ] External Integrations (payments, insurance)
- [ ] Location Services (GPS, geofencing)
- [ ] Chat System (real-time messaging)

### Phase 6: Specialized Services
- [ ] Emergency Services
- [ ] Blood Donation System
- [ ] AI Assistant
- [ ] Admin Panel

## 🚨 Troubleshooting Guide

### Common Issues
1. **Database Connection**: Ensure PostgreSQL container is running
2. **Port Conflicts**: Check if port 3001 is available
3. **Authentication**: Verify JWT tokens are properly set
4. **File Uploads**: Ensure Supabase configuration is correct

### Debug Commands
```bash
# Check database connection
npm run test:db-check

# Verify API server is running
curl http://localhost:3001/health

# Check specific module dependencies
npm run test:deps auth
```

## 📈 Success Metrics

Each module test should achieve:
- ✅ **100% Endpoint Coverage**
- ⚡ **Response Time < 1s** for 95% of requests
- 🛡️ **Security Validation** (authentication, authorization)
- 📝 **Data Validation** (input/output schemas)
- 🔄 **Error Handling** (edge cases, invalid inputs) 