# 🚨 Emergency Dashboard Guide

## 📋 Overview

This comprehensive guide provides everything needed to implement an Emergency Dashboard for the healthcare management system. The dashboard enables real-time emergency management including SOS alerts, ambulance requests, viral disease reporting, and emergency contact management.

**Base URL:** `https://api.unlimtedhealth.com/api`  
**Authentication:** Bearer token required for all endpoints  
**Documentation:** Swagger/OpenAPI available at `/api/docs`

---

## 🏷️ TypeScript Interfaces

### Core Emergency Types

```typescript
// Alert Types
enum AlertType {
  SOS = 'sos',
  MEDICAL_EMERGENCY = 'medical_emergency',
  ACCIDENT = 'accident',
  FIRE = 'fire',
  NATURAL_DISASTER = 'natural_disaster',
  SECURITY_THREAT = 'security_threat',
  PANIC = 'panic'
}

// Alert Status
enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESPONDING = 'responding',
  RESOLVED = 'resolved',
  FALSE_ALARM = 'false_alarm',
  CANCELLED = 'cancelled'
}

// Ambulance Priority
enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Request Status
enum RequestStatus {
  PENDING = 'pending',
  DISPATCHED = 'dispatched',
  ACKNOWLEDGED = 'acknowledged',
  EN_ROUTE = 'en_route',
  ON_SCENE = 'on_scene',
  TRANSPORTING = 'transporting',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Viral Report Types
enum ViralReportType {
  OUTBREAK_REPORT = 'outbreak_report',
  EXPOSURE_REPORT = 'exposure_report',
  SYMPTOM_REPORT = 'symptom_report',
  CONTACT_TRACE = 'contact_trace',
  RECOVERY_REPORT = 'recovery_report'
}

// Report Status
enum ReportStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  VERIFIED = 'verified',
  INVESTIGATED = 'investigated',
  CLOSED = 'closed',
  DISMISSED = 'dismissed'
}
```

### Emergency Alert Interface

```typescript
interface EmergencyAlert {
  id: string;                           // UUID - Primary key
  alertNumber: string;                  // Unique alert number
  type: AlertType;                      // Alert type
  status: AlertStatus;                  // Current status
  userId: string;                       // User who triggered alert
  patientId?: string;                   // Associated patient ID
  description?: string;                 // Alert description
  latitude: number;                     // GPS latitude
  longitude: number;                    // GPS longitude
  address?: string;                     // Human-readable address
  contactNumber: string;                // Contact number
  emergencyContacts?: Array<{           // Emergency contacts
    name: string;
    phone: string;
    relationship: string;
    is_primary: boolean;
  }>;
  medicalInfo?: {                       // Medical information
    blood_type?: string;
    allergies?: string[];
    medications?: string[];
    medical_conditions?: string[];
    emergency_medical_notes?: string;
  };
  responderIds?: string[];              // Responder user IDs
  acknowledgedAt?: Date;                // Acknowledgment timestamp
  acknowledgedBy?: string;              // Acknowledger user ID
  responseTimeMinutes?: number;         // Response time in minutes
  resolvedAt?: Date;                    // Resolution timestamp
  resolvedBy?: string;                  // Resolver user ID
  resolutionNotes?: string;             // Resolution notes
  isTestAlert: boolean;                 // Is test alert
  metadata: Record<string, unknown>;    // Additional metadata
  createdAt: Date;                      // Creation timestamp
  updatedAt: Date;                      // Last update timestamp
}
```

### Ambulance Request Interface

```typescript
interface AmbulanceRequest {
  id: string;                           // UUID - Primary key
  requestNumber: string;                // Unique request number
  patientName: string;                  // Patient name
  patientAge?: number;                  // Patient age
  patientGender?: string;               // Patient gender
  patientPhone: string;                 // Patient phone
  emergencyContactName?: string;        // Emergency contact name
  emergencyContactPhone?: string;       // Emergency contact phone
  pickupLatitude: number;               // Pickup GPS latitude
  pickupLongitude: number;              // Pickup GPS longitude
  pickupAddress: string;                // Pickup address
  destinationLatitude?: number;         // Destination GPS latitude
  destinationLongitude?: number;        // Destination GPS longitude
  destinationAddress?: string;          // Destination address
  medicalCondition: string;             // Medical condition description
  symptoms?: string;                    // Symptoms description
  priority: Priority;                   // Request priority
  status: RequestStatus;                // Current status
  specialRequirements?: string;         // Special requirements
  medicalHistory?: {                    // Medical history
    allergies?: string[];
    medications?: string[];
    conditions?: string[];
    blood_type?: string;
  };
  requestedBy: string;                  // Requester user ID
  ambulanceId?: string;                 // Assigned ambulance ID
  dispatchedAt?: Date;                  // Dispatch timestamp
  acknowledgedAt?: Date;                // Acknowledgment timestamp
  arrivedAt?: Date;                     // Arrival timestamp
  completedAt?: Date;                   // Completion timestamp
  estimatedArrival?: Date;              // Estimated arrival time
  actualArrival?: Date;                 // Actual arrival time
  totalCost?: number;                   // Total cost
  insuranceInfo?: {                     // Insurance information
    provider?: string;
    policy_number?: string;
    group_number?: string;
  };
  metadata: Record<string, unknown>;    // Additional metadata
  createdAt: Date;                      // Creation timestamp
  updatedAt: Date;                      // Last update timestamp
}
```

### Viral Report Interface

```typescript
interface ViralReport {
  id: string;                           // UUID - Primary key
  reportNumber: string;                 // Unique report number
  type: ViralReportType;                // Report type
  status: ReportStatus;                 // Current status
  reportedBy?: string;                  // Reporter user ID
  isAnonymous: boolean;                 // Is anonymous report
  diseaseType: string;                  // Disease type
  symptoms: string[];                   // Symptoms array
  onsetDate?: Date;                     // Onset date
  exposureDate?: Date;                  // Exposure date
  locationLatitude?: number;            // Location GPS latitude
  locationLongitude?: number;           // Location GPS longitude
  locationAddress?: string;             // Location address
  contactInformation?: {                // Contact information
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  affectedCount: number;                // Number of affected people
  description?: string;                 // Report description
  riskFactors?: string[];               // Risk factors
  preventiveMeasures?: string[];        // Preventive measures
  healthcareFacilityVisited?: string;   // Healthcare facility visited
  testResults?: {                       // Test results
    test_type?: string;
    result?: string;
    test_date?: Date;
    lab_name?: string;
  };
  healthAuthorityNotified: boolean;     // Health authority notified
  notificationSentAt?: Date;            // Notification sent timestamp
  investigatedBy?: string;              // Investigator user ID
  investigationNotes?: string;          // Investigation notes
  publicHealthActions?: string[];       // Public health actions
  metadata: Record<string, unknown>;    // Additional metadata
  createdAt: Date;                      // Creation timestamp
  updatedAt: Date;                      // Last update timestamp
}
```

---

## 🚨 Emergency Alerts Endpoints

### 1. Send SOS Alert
**Endpoint:** `POST /emergency/alerts/sos`  
**Authentication:** Required (Bearer token)  
**Roles:** All authenticated users

**Request Body:**
```typescript
interface CreateSOSAlertDto {
  type: AlertType;                      // Required: Alert type
  description?: string;                 // Optional: Alert description
  latitude: number;                     // Required: GPS latitude
  longitude: number;                    // Required: GPS longitude
  address?: string;                     // Optional: Human-readable address
  contactNumber: string;                // Required: Contact number
  patientId?: string;                   // Optional: Associated patient ID
  medicalInfo?: {                       // Optional: Medical information
    bloodType?: string;
    allergies?: string[];
    medications?: string[];
    medicalConditions?: string[];
    emergencyContacts?: Array<{
      name: string;
      phone: string;
      relationship: string;
    }>;
    notes?: string;
  };
  isTestAlert?: boolean;                // Optional: Is test alert (default: false)
}
```

**Example Request:**
```typescript
const sendSOSAlert = async (alertData: CreateSOSAlertDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/emergency/alerts/sos', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'medical_emergency',
      description: 'Patient experiencing chest pain and shortness of breath',
      latitude: 40.7128,
      longitude: -74.0060,
      address: '123 Main St, New York, NY 10001',
      contactNumber: '+1234567890',
      patientId: '550e8400-e29b-41d4-a716-446655440000',
      medicalInfo: {
        bloodType: 'O+',
        allergies: ['Penicillin', 'Shellfish'],
        medications: ['Aspirin', 'Metformin'],
        medicalConditions: ['Diabetes', 'Hypertension'],
        emergencyContacts: [{
          name: 'John Doe',
          phone: '+1234567891',
          relationship: 'Spouse'
        }],
        notes: 'Patient has history of heart disease'
      },
      isTestAlert: false
    })
  });
  
  return await response.json();
};
```

### 2. Get Emergency Alerts
**Endpoint:** `GET /emergency/alerts`  
**Authentication:** Required (Bearer token)  
**Roles:** All authenticated users

**Query Parameters:**
```typescript
interface AlertFilters {
  type?: AlertType;                     // Filter by alert type
  status?: AlertStatus;                 // Filter by status
  page?: number;                        // Page number (default: 1)
  limit?: number;                       // Items per page (default: 10)
}
```

**Example Request:**
```typescript
const getEmergencyAlerts = async (filters: AlertFilters = {}) => {
  const token = localStorage.getItem('access_token');
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/emergency/alerts?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 3. Acknowledge Alert
**Endpoint:** `PUT /emergency/alerts/:id/acknowledge`  
**Authentication:** Required (Bearer token)  
**Roles:** Admin, Doctor, Nurse

**Example Request:**
```typescript
const acknowledgeAlert = async (alertId: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/emergency/alerts/${alertId}/acknowledge`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 4. Resolve Alert
**Endpoint:** `PUT /emergency/alerts/:id/resolve`  
**Authentication:** Required (Bearer token)  
**Roles:** Admin, Doctor, Nurse

**Request Body:**
```typescript
{
  resolutionNotes?: string;             // Optional: Resolution notes
}
```

**Example Request:**
```typescript
const resolveAlert = async (alertId: string, resolutionNotes?: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/emergency/alerts/${alertId}/resolve`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      resolutionNotes: 'Patient transported to hospital, condition stable'
    })
  });
  
  return await response.json();
};
```

---

## 🚑 Ambulance Services Endpoints

### 1. Request Ambulance
**Endpoint:** `POST /emergency/ambulance/request`  
**Authentication:** Required (Bearer token)  
**Roles:** All authenticated users

**Request Body:**
```typescript
interface CreateAmbulanceRequestDto {
  patientName: string;                  // Required: Patient name
  patientAge?: number;                  // Optional: Patient age
  patientGender?: string;               // Optional: Patient gender
  patientPhone: string;                 // Required: Patient phone
  emergencyContactName?: string;        // Optional: Emergency contact name
  emergencyContactPhone?: string;       // Optional: Emergency contact phone
  pickupLatitude: number;               // Required: Pickup GPS latitude
  pickupLongitude: number;              // Required: Pickup GPS longitude
  pickupAddress: string;                // Required: Pickup address
  destinationLatitude?: number;         // Optional: Destination GPS latitude
  destinationLongitude?: number;        // Optional: Destination GPS longitude
  destinationAddress?: string;          // Optional: Destination address
  medicalCondition: string;             // Required: Medical condition
  symptoms?: string;                    // Optional: Symptoms description
  priority: Priority;                   // Required: Request priority
  specialRequirements?: string;         // Optional: Special requirements
  medicalHistory?: {                    // Optional: Medical history
    allergies?: string[];
    medications?: string[];
    conditions?: string[];
    blood_type?: string;
  };
  insuranceInfo?: {                     // Optional: Insurance information
    provider?: string;
    policy_number?: string;
    group_number?: string;
  };
}
```

**Example Request:**
```typescript
const requestAmbulance = async (requestData: CreateAmbulanceRequestDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/emergency/ambulance/request', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      patientName: 'Jane Smith',
      patientAge: 45,
      patientGender: 'Female',
      patientPhone: '+1234567890',
      emergencyContactName: 'John Smith',
      emergencyContactPhone: '+1234567891',
      pickupLatitude: 40.7128,
      pickupLongitude: -74.0060,
      pickupAddress: '123 Main St, New York, NY 10001',
      destinationLatitude: 40.7589,
      destinationLongitude: -73.9851,
      destinationAddress: '456 Hospital Ave, New York, NY 10002',
      medicalCondition: 'Severe chest pain with shortness of breath',
      symptoms: 'Chest pain, shortness of breath, nausea, sweating',
      priority: 'critical',
      specialRequirements: 'Cardiac monitoring required',
      medicalHistory: {
        allergies: ['Penicillin'],
        medications: ['Aspirin', 'Lisinopril'],
        conditions: ['Hypertension', 'High Cholesterol'],
        blood_type: 'A+'
      },
      insuranceInfo: {
        provider: 'Blue Cross Blue Shield',
        policy_number: 'BC123456789',
        group_number: 'GRP001'
      }
    })
  });
  
  return await response.json();
};
```

### 2. Get Ambulance Requests
**Endpoint:** `GET /emergency/ambulance/requests`  
**Authentication:** Required (Bearer token)  
**Roles:** All authenticated users

**Query Parameters:**
```typescript
interface AmbulanceRequestFilters {
  status?: RequestStatus;               // Filter by status
  priority?: Priority;                  // Filter by priority
  ambulanceId?: string;                 // Filter by ambulance ID
  page?: number;                        // Page number (default: 1)
  limit?: number;                       // Items per page (default: 10)
}
```

**Example Request:**
```typescript
const getAmbulanceRequests = async (filters: AmbulanceRequestFilters = {}) => {
  const token = localStorage.getItem('access_token');
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/emergency/ambulance/requests?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 3. Get Available Ambulances
**Endpoint:** `GET /emergency/ambulance/available`  
**Authentication:** Required (Bearer token)  
**Roles:** All authenticated users

**Query Parameters:**
```typescript
interface LocationFilters {
  latitude?: number;                    // Optional: GPS latitude
  longitude?: number;                   // Optional: GPS longitude
}
```

**Example Request:**
```typescript
const getAvailableAmbulances = async (latitude?: number, longitude?: number) => {
  const token = localStorage.getItem('access_token');
  const queryParams = new URLSearchParams();
  
  if (latitude !== undefined) queryParams.append('latitude', latitude.toString());
  if (longitude !== undefined) queryParams.append('longitude', longitude.toString());
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/emergency/ambulance/available?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

---

## 🦠 Viral Disease Reporting Endpoints

### 1. Submit Viral Report
**Endpoint:** `POST /emergency/viral-reporting/reports`  
**Authentication:** Required (Bearer token)  
**Roles:** All authenticated users

**Request Body:**
```typescript
interface CreateViralReportDto {
  type: ViralReportType;                // Required: Report type
  isAnonymous?: boolean;                // Optional: Is anonymous (default: false)
  diseaseType: string;                  // Required: Disease type
  symptoms: string[];                   // Required: Symptoms array
  onsetDate?: Date;                     // Optional: Onset date
  exposureDate?: Date;                  // Optional: Exposure date
  locationLatitude?: number;            // Optional: Location GPS latitude
  locationLongitude?: number;           // Optional: Location GPS longitude
  locationAddress?: string;             // Optional: Location address
  contactInformation?: {                // Optional: Contact information
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  affectedCount?: number;               // Optional: Affected count (default: 1)
  description?: string;                 // Optional: Description
  riskFactors?: string[];               // Optional: Risk factors
  preventiveMeasures?: string[];        // Optional: Preventive measures
  healthcareFacilityVisited?: string;   // Optional: Healthcare facility visited
  testResults?: {                       // Optional: Test results
    test_type?: string;
    result?: string;
    test_date?: Date;
    lab_name?: string;
  };
}
```

**Example Request:**
```typescript
const submitViralReport = async (reportData: CreateViralReportDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/emergency/viral-reporting/reports', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'symptom_report',
      isAnonymous: false,
      diseaseType: 'COVID-19',
      symptoms: ['Fever', 'Cough', 'Shortness of breath', 'Fatigue'],
      onsetDate: new Date('2024-01-15'),
      exposureDate: new Date('2024-01-10'),
      locationLatitude: 40.7128,
      locationLongitude: -74.0060,
      locationAddress: '123 Main St, New York, NY 10001',
      contactInformation: {
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john.doe@email.com',
        address: '123 Main St, New York, NY 10001'
      },
      affectedCount: 1,
      description: 'Experiencing flu-like symptoms after potential exposure',
      riskFactors: ['Close contact with confirmed case', 'Travel to high-risk area'],
      preventiveMeasures: ['Self-isolation', 'Wearing mask', 'Frequent hand washing'],
      healthcareFacilityVisited: 'City General Hospital',
      testResults: {
        test_type: 'PCR',
        result: 'Positive',
        test_date: new Date('2024-01-16'),
        lab_name: 'City Lab Services'
      }
    })
  });
  
  return await response.json();
};
```

### 2. Get Viral Reports
**Endpoint:** `GET /emergency/viral-reporting/reports`  
**Authentication:** Required (Bearer token)  
**Roles:** All authenticated users

**Query Parameters:**
```typescript
interface ViralReportFilters {
  type?: ViralReportType;               // Filter by report type
  status?: ReportStatus;                // Filter by status
  diseaseType?: string;                 // Filter by disease type
  page?: number;                        // Page number (default: 1)
  limit?: number;                       // Items per page (default: 10)
}
```

**Example Request:**
```typescript
const getViralReports = async (filters: ViralReportFilters = {}) => {
  const token = localStorage.getItem('access_token');
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/emergency/viral-reporting/reports?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

---

## 🎨 Frontend Implementation Examples

### React Emergency Dashboard Component

```typescript
import React, { useState, useEffect } from 'react';

interface EmergencyDashboardProps {
  userId: string;
  token: string;
  userRole: string;
}

const EmergencyDashboard: React.FC<EmergencyDashboardProps> = ({ userId, token, userRole }) => {
  const [activeAlerts, setActiveAlerts] = useState<EmergencyAlert[]>([]);
  const [ambulanceRequests, setAmbulanceRequests] = useState<AmbulanceRequest[]>([]);
  const [viralReports, setViralReports] = useState<ViralReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [alertsResponse, requestsResponse, reportsResponse] = await Promise.all([
        getEmergencyAlerts({ status: 'active' }),
        getAmbulanceRequests({ status: 'pending' }),
        getViralReports({ status: 'submitted' })
      ]);

      setActiveAlerts(alertsResponse.data);
      setAmbulanceRequests(requestsResponse.data);
      setViralReports(reportsResponse.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSOSAlert = async () => {
    try {
      // Get current location
      const position = await getCurrentPosition();
      
      await sendSOSAlert({
        type: 'medical_emergency',
        description: 'Emergency assistance needed',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        contactNumber: '+1234567890',
        isTestAlert: false
      });
      
      alert('SOS alert sent successfully!');
      loadDashboardData();
    } catch (error) {
      console.error('Error sending SOS alert:', error);
      alert('Failed to send SOS alert');
    }
  };

  const handleAmbulanceRequest = async () => {
    try {
      const position = await getCurrentPosition();
      
      await requestAmbulance({
        patientName: 'Emergency Patient',
        patientPhone: '+1234567890',
        pickupLatitude: position.coords.latitude,
        pickupLongitude: position.coords.longitude,
        pickupAddress: 'Current Location',
        medicalCondition: 'Medical emergency',
        priority: 'critical'
      });
      
      alert('Ambulance requested successfully!');
      loadDashboardData();
    } catch (error) {
      console.error('Error requesting ambulance:', error);
      alert('Failed to request ambulance');
    }
  };

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  };

  if (isLoading) {
    return <div className="loading">Loading emergency dashboard...</div>;
  }

  return (
    <div className="emergency-dashboard">
      <div className="dashboard-header">
        <h1>🚨 Emergency Dashboard</h1>
        <div className="emergency-actions">
          <button className="sos-button" onClick={handleSOSAlert}>
            🚨 SOS ALERT
          </button>
          <button className="ambulance-button" onClick={handleAmbulanceRequest}>
            🚑 Request Ambulance
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Active Alerts Section */}
        <div className="dashboard-section">
          <h2>Active Alerts ({activeAlerts.length})</h2>
          <div className="alerts-list">
            {activeAlerts.map(alert => (
              <div key={alert.id} className={`alert-card ${alert.type}`}>
                <div className="alert-header">
                  <span className="alert-type">{alert.type.toUpperCase()}</span>
                  <span className="alert-status">{alert.status}</span>
                </div>
                <div className="alert-content">
                  <p><strong>Location:</strong> {alert.address || 'GPS Coordinates'}</p>
                  <p><strong>Contact:</strong> {alert.contactNumber}</p>
                  {alert.description && <p><strong>Description:</strong> {alert.description}</p>}
                  <p><strong>Time:</strong> {new Date(alert.createdAt).toLocaleString()}</p>
                </div>
                {userRole !== 'patient' && (
                  <div className="alert-actions">
                    <button onClick={() => acknowledgeAlert(alert.id)}>
                      Acknowledge
                    </button>
                    <button onClick={() => resolveAlert(alert.id)}>
                      Resolve
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Ambulance Requests Section */}
        <div className="dashboard-section">
          <h2>Ambulance Requests ({ambulanceRequests.length})</h2>
          <div className="requests-list">
            {ambulanceRequests.map(request => (
              <div key={request.id} className={`request-card ${request.priority}`}>
                <div className="request-header">
                  <span className="request-priority">{request.priority.toUpperCase()}</span>
                  <span className="request-status">{request.status}</span>
                </div>
                <div className="request-content">
                  <p><strong>Patient:</strong> {request.patientName}</p>
                  <p><strong>Condition:</strong> {request.medicalCondition}</p>
                  <p><strong>Location:</strong> {request.pickupAddress}</p>
                  <p><strong>Time:</strong> {new Date(request.createdAt).toLocaleString()}</p>
                </div>
                {userRole !== 'patient' && (
                  <div className="request-actions">
                    <button onClick={() => updateRequestStatus(request.id, 'dispatched')}>
                      Dispatch
                    </button>
                    <button onClick={() => updateRequestStatus(request.id, 'acknowledged')}>
                      Acknowledge
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Viral Reports Section */}
        <div className="dashboard-section">
          <h2>Viral Reports ({viralReports.length})</h2>
          <div className="reports-list">
            {viralReports.map(report => (
              <div key={report.id} className={`report-card ${report.status}`}>
                <div className="report-header">
                  <span className="report-type">{report.type.replace('_', ' ').toUpperCase()}</span>
                  <span className="report-status">{report.status}</span>
                </div>
                <div className="report-content">
                  <p><strong>Disease:</strong> {report.diseaseType}</p>
                  <p><strong>Symptoms:</strong> {report.symptoms.join(', ')}</p>
                  <p><strong>Affected:</strong> {report.affectedCount} people</p>
                  <p><strong>Time:</strong> {new Date(report.createdAt).toLocaleString()}</p>
                </div>
                {userRole === 'admin' || userRole === 'public_health' ? (
                  <div className="report-actions">
                    <button onClick={() => updateReportStatus(report.id, 'under_review')}>
                      Review
                    </button>
                    <button onClick={() => updateReportStatus(report.id, 'verified')}>
                      Verify
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyDashboard;
```

### CSS Styling

```css
.emergency-dashboard {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.emergency-actions {
  display: flex;
  gap: 15px;
}

.sos-button {
  background: #dc3545;
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

.sos-button:hover {
  background: #c82333;
}

.ambulance-button {
  background: #ffc107;
  color: #212529;
  border: none;
  padding: 15px 30px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

.ambulance-button:hover {
  background: #e0a800;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.dashboard-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.dashboard-section h2 {
  margin: 0 0 20px 0;
  color: #333;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
}

.alert-card, .request-card, .report-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  transition: box-shadow 0.3s;
}

.alert-card:hover, .request-card:hover, .report-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.alert-card.medical_emergency {
  border-left: 4px solid #dc3545;
}

.alert-card.accident {
  border-left: 4px solid #fd7e14;
}

.alert-card.fire {
  border-left: 4px solid #ffc107;
}

.request-card.critical {
  border-left: 4px solid #dc3545;
}

.request-card.high {
  border-left: 4px solid #fd7e14;
}

.request-card.medium {
  border-left: 4px solid #ffc107;
}

.request-card.low {
  border-left: 4px solid #28a745;
}

.report-card.submitted {
  border-left: 4px solid #6c757d;
}

.report-card.under_review {
  border-left: 4px solid #ffc107;
}

.report-card.verified {
  border-left: 4px solid #28a745;
}

.alert-header, .request-header, .report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.alert-type, .request-priority, .report-type {
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.alert-status, .request-status, .report-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  text-transform: capitalize;
}

.alert-content p, .request-content p, .report-content p {
  margin: 5px 0;
  color: #666;
}

.alert-actions, .request-actions, .report-actions {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}

.alert-actions button, .request-actions button, .report-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.alert-actions button:first-child {
  background: #007bff;
  color: white;
}

.alert-actions button:last-child {
  background: #28a745;
  color: white;
}

.request-actions button:first-child {
  background: #dc3545;
  color: white;
}

.request-actions button:last-child {
  background: #ffc107;
  color: #212529;
}

.report-actions button:first-child {
  background: #6c757d;
  color: white;
}

.report-actions button:last-child {
  background: #28a745;
  color: white;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 18px;
  color: #666;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 20px;
  }
  
  .emergency-actions {
    width: 100%;
    justify-content: center;
  }
  
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .alert-actions, .request-actions, .report-actions {
    flex-direction: column;
  }
}
```

---

## 🔐 Error Handling

### Common Error Responses

```typescript
// 400 Bad Request
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "latitude",
      "message": "Latitude is required"
    }
  ]
}

// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}

// 403 Forbidden
{
  "statusCode": 403,
  "message": "Insufficient permissions to access emergency data",
  "error": "Forbidden"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Emergency alert not found",
  "error": "Not Found"
}
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install axios
# or
yarn add axios
```

### 2. Create API Service

```typescript
// services/emergencyApi.ts
import axios from 'axios';

const API_BASE_URL = 'https://api.unlimtedhealth.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const emergencyApi = {
  // Emergency Alerts
  sendSOSAlert: (data: CreateSOSAlertDto) => apiClient.post('/emergency/alerts/sos', data),
  getEmergencyAlerts: (filters: AlertFilters) => apiClient.get('/emergency/alerts', { params: filters }),
  acknowledgeAlert: (alertId: string) => apiClient.put(`/emergency/alerts/${alertId}/acknowledge`),
  resolveAlert: (alertId: string, data: { resolutionNotes?: string }) => 
    apiClient.put(`/emergency/alerts/${alertId}/resolve`, data),
  
  // Ambulance Services
  requestAmbulance: (data: CreateAmbulanceRequestDto) => apiClient.post('/emergency/ambulance/request', data),
  getAmbulanceRequests: (filters: AmbulanceRequestFilters) => 
    apiClient.get('/emergency/ambulance/requests', { params: filters }),
  getAvailableAmbulances: (latitude?: number, longitude?: number) => 
    apiClient.get('/emergency/ambulance/available', { params: { latitude, longitude } }),
  updateRequestStatus: (requestId: string, data: { status: RequestStatus; notes?: string }) => 
    apiClient.put(`/emergency/ambulance/requests/${requestId}/status`, data),
  
  // Viral Reporting
  submitViralReport: (data: CreateViralReportDto) => apiClient.post('/emergency/viral-reporting/reports', data),
  getViralReports: (filters: ViralReportFilters) => 
    apiClient.get('/emergency/viral-reporting/reports', { params: filters }),
  updateReportStatus: (reportId: string, data: { status: ReportStatus; investigationNotes?: string }) => 
    apiClient.put(`/emergency/viral-reporting/reports/${reportId}/status`, data),
};
```

### 3. Environment Configuration

```typescript
// config/environment.ts
export const environment = {
  production: false,
  apiUrl: 'https://api.unlimtedhealth.com/api',
  appName: 'Emergency Dashboard',
  version: '1.0.0'
};
```

---

## 📋 Summary

This comprehensive Emergency Dashboard guide provides:

✅ **Complete API Documentation** - All emergency endpoints with real DTOs  
✅ **TypeScript Interfaces** - Full type definitions for all data structures  
✅ **Frontend Implementation** - React components with emergency management features  
✅ **SOS Alert System** - Real-time emergency alerting with GPS location  
✅ **Ambulance Services** - Request, track, and manage ambulance services  
✅ **Viral Disease Reporting** - Submit and manage disease outbreak reports  
✅ **Role-based Access** - Different permissions for different user roles  
✅ **Error Handling** - Comprehensive error response documentation  
✅ **Mobile Responsive** - CSS grid layouts for all screen sizes  

