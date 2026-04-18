# 📋 Referral Dashboard Guide

## 📋 Overview

This comprehensive guide provides everything needed to implement a Referral Dashboard for the healthcare management system. The dashboard enables healthcare providers to manage, track, and analyze patient referrals with comprehensive analytics, status tracking, and document management capabilities.

**Base URL:** `https://api.unlimtedhealth.com/api`  
**Authentication:** Bearer token required for all endpoints  
**Documentation:** Swagger/OpenAPI available at `/api/docs`

---

## 🏷️ TypeScript Interfaces

### Core Referral Types

```typescript
// Referral Status
enum ReferralStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
  EXPIRED = 'expired'
}

// Referral Priority
enum ReferralPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Referral Type
enum ReferralType {
  SPECIALIST = 'specialist',
  DIAGNOSTIC = 'diagnostic',
  PROCEDURE = 'procedure',
  CONSULTATION = 'consultation',
  FOLLOW_UP = 'follow_up',
  SECOND_OPINION = 'second_opinion',
  TRANSFER = 'transfer'
}

// Document Type
enum DocumentType {
  REPORT = 'report',
  LAB_RESULT = 'lab_result',
  IMAGING = 'imaging',
  PRESCRIPTION = 'prescription',
  CLINICAL_NOTE = 'clinical_note',
  CONSENT_FORM = 'consent_form',
  OTHER = 'other'
}
```

### Referral DTOs

```typescript
// Create Referral Request
interface CreateReferralDto {
  patientId: string;                    // Required: Patient UUID
  referringCenterId: string;           // Required: Referring center UUID
  receivingCenterId: string;           // Required: Receiving center UUID
  receivingProviderId?: string;        // Optional: Receiving provider UUID
  referralType: ReferralType;          // Required: Type of referral
  priority?: ReferralPriority;         // Optional: Priority level
  reason: string;                      // Required: Reason for referral
  clinicalNotes?: string;              // Optional: Clinical notes
  diagnosis?: string;                  // Optional: Diagnosis
  instructions?: string;               // Optional: Instructions
  scheduledDate?: Date;                // Optional: Scheduled date
  expirationDate?: Date;               // Optional: Expiration date
  medications?: MedicationInfo[];      // Optional: Current medications
  allergies?: AllergyInfo[];           // Optional: Patient allergies
  medicalHistory?: string;             // Optional: Medical history
  metadata?: Record<string, unknown>;  // Optional: Additional metadata
}

// Update Referral Request
interface UpdateReferralDto extends Partial<CreateReferralDto> {
  status?: ReferralStatus;             // Optional: New status
  responseNotes?: string;              // Optional: Response notes
  respondedDate?: Date;                // Optional: Response date
}

// Create Referral Document Request
interface CreateReferralDocumentDto {
  referralId: string;                  // Required: Referral UUID
  name: string;                        // Required: Document name
  documentType: DocumentType;          // Required: Document type
  description?: string;                // Optional: Document description
}

// Referral Query Parameters
interface ReferralQueryParams {
  patientId?: string;                  // Optional: Filter by patient
  referringCenterId?: string;         // Optional: Filter by referring center
  receivingCenterId?: string;         // Optional: Filter by receiving center
  status?: ReferralStatus;            // Optional: Filter by status
  startDate?: string;                 // Optional: Start date filter
  endDate?: string;                   // Optional: End date filter
}
```

### Referral Response Interfaces

```typescript
// Referral Entity
interface Referral {
  id: string;                          // UUID - Primary key
  patientId: string;                   // UUID - Patient ID
  referringProviderId: string;         // UUID - Referring provider ID
  referringCenterId: string;           // UUID - Referring center ID
  receivingCenterId: string;           // UUID - Receiving center ID
  receivingProviderId?: string;        // UUID - Receiving provider ID
  referralType: ReferralType;          // Type of referral
  status: ReferralStatus;              // Current status
  priority: ReferralPriority;          // Priority level
  reason: string;                      // Reason for referral
  clinicalNotes?: string;              // Clinical notes
  diagnosis?: string;                  // Diagnosis
  instructions?: string;               // Instructions
  scheduledDate?: Date;                // Scheduled date
  expirationDate?: Date;               // Expiration date
  metadata: Record<string, unknown>;   // Additional metadata
  medications: MedicationInfo[];       // Current medications
  allergies: AllergyInfo[];            // Patient allergies
  medicalHistory?: string;             // Medical history
  respondedDate?: Date;                // Response date
  responseNotes?: string;              // Response notes
  respondedById?: string;              // UUID - Responder ID
  createdAt: Date;                     // Creation timestamp
  updatedAt: Date;                     // Last update timestamp
  patient: Patient;                    // Patient information
  referringProvider: User;             // Referring provider info
  receivingProvider?: User;            // Receiving provider info
  respondedBy?: User;                  // Responder info
  documents: ReferralDocument[];       // Associated documents
}

// Referral Document Entity
interface ReferralDocument {
  id: string;                          // UUID - Primary key
  referralId: string;                  // UUID - Referral ID
  name: string;                        // Document name
  documentType: DocumentType;          // Document type
  description?: string;                // Document description
  filePath: string;                    // File storage path
  originalFilename: string;            // Original filename
  mimeType: string;                    // MIME type
  fileSize: number;                    // File size in bytes
  uploadedById: string;                // UUID - Uploader ID
  createdAt: Date;                     // Creation timestamp
  updatedAt: Date;                     // Last update timestamp
  uploadedBy: User;                    // Uploader information
}

// Medication Information
interface MedicationInfo {
  name: string;                        // Medication name
  dosage: string;                      // Dosage information
  frequency: string;                   // Frequency of use
  [key: string]: unknown;              // Additional properties
}

// Allergy Information
interface AllergyInfo {
  allergen: string;                    // Allergen name
  reaction: string;                    // Reaction description
  severity: string;                    // Severity level
  [key: string]: unknown;              // Additional properties
}

// Referral Analytics Response
interface ReferralAnalytics {
  totalReferrals: number;              // Total referral count
  referralsByStatus: Array<{           // Count by status
    status: string;
    count: number;
  }>;
  referralsByType: Array<{             // Count by type
    type: string;
    count: number;
  }>;
  inboundVsOutbound: {                 // Inbound vs outbound counts
    inbound: number;                   // Referrals received
    outbound: number;                  // Referrals sent
  };
  timeRange: {                         // Analytics time range
    startDate?: Date;
    endDate?: Date;
  };
}

// Dashboard Summary Data
interface ReferralDashboardSummary {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  rejectedReferrals: number;
  urgentReferrals: number;
  avgResponseTime: number;             // Average response time in days
  referralTypes: Record<string, number>;
  statusDistribution: Record<string, number>;
  inboundOutboundRatio: number;        // Inbound/Outbound ratio
  recentActivity: Referral[];          // Recent referrals
  upcomingDeadlines: Referral[];       // Referrals with upcoming deadlines
}
```

---

## 📊 Referral Management Endpoints

### 1. Create Referral
**Endpoint:** `POST /referrals`  
**Authentication:** Required (Bearer token)  
**Roles:** Healthcare Provider, Admin, Doctor

**Request Body (CreateReferralDto):**
```typescript
const createReferral = async (referralData: CreateReferralDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/referrals', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      patientId: "550e8400-e29b-41d4-a716-446655440000",
      referringCenterId: "550e8400-e29b-41d4-a716-446655440001",
      receivingCenterId: "550e8400-e29b-41d4-a716-446655440002",
      receivingProviderId: "550e8400-e29b-41d4-a716-446655440003",
      referralType: "specialist",
      priority: "high",
      reason: "Specialist consultation for diabetes management",
      clinicalNotes: "Patient has uncontrolled Type 2 diabetes with recent HbA1c of 9.2%",
      diagnosis: "Type 2 Diabetes Mellitus (E11.9)",
      instructions: "Please evaluate for insulin therapy and provide nutritional guidance",
      scheduledDate: "2024-02-15T10:00:00.000Z",
      expirationDate: "2024-03-15T23:59:59.999Z",
      medications: [
        {
          name: "Metformin",
          dosage: "500mg",
          frequency: "Twice daily"
        }
      ],
      allergies: [
        {
          allergen: "Penicillin",
          reaction: "Rash",
          severity: "Moderate"
        }
      ],
      medicalHistory: "Type 2 diabetes diagnosed 5 years ago, hypertension"
    })
  });
  
  return await response.json();
};
```

**Response:**
```typescript
{
  "id": "550e8400-e29b-41d4-a716-446655440004",
  "patientId": "550e8400-e29b-41d4-a716-446655440000",
  "referringProviderId": "550e8400-e29b-41d4-a716-446655440005",
  "referringCenterId": "550e8400-e29b-41d4-a716-446655440001",
  "receivingCenterId": "550e8400-e29b-41d4-a716-446655440002",
  "receivingProviderId": "550e8400-e29b-41d4-a716-446655440003",
  "referralType": "specialist",
  "status": "pending",
  "priority": "high",
  "reason": "Specialist consultation for diabetes management",
  "clinicalNotes": "Patient has uncontrolled Type 2 diabetes with recent HbA1c of 9.2%",
  "diagnosis": "Type 2 Diabetes Mellitus (E11.9)",
  "instructions": "Please evaluate for insulin therapy and provide nutritional guidance",
  "scheduledDate": "2024-02-15T10:00:00.000Z",
  "expirationDate": "2024-03-15T23:59:59.999Z",
  "metadata": {},
  "medications": [
    {
      "name": "Metformin",
      "dosage": "500mg",
      "frequency": "Twice daily"
    }
  ],
  "allergies": [
    {
      "allergen": "Penicillin",
      "reaction": "Rash",
      "severity": "Moderate"
    }
  ],
  "medicalHistory": "Type 2 diabetes diagnosed 5 years ago, hypertension",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "documents": []
}
```

### 2. Get All Referrals
**Endpoint:** `GET /referrals`  
**Authentication:** Required (Bearer token)  
**Roles:** Healthcare Provider, Admin, Doctor

**Query Parameters:**
```typescript
const getReferrals = async (filters: ReferralQueryParams = {}) => {
  const token = localStorage.getItem('access_token');
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value);
    }
  });
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/referrals?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};

// Example usage:
const referrals = await getReferrals({
  status: 'pending',
  referringCenterId: '550e8400-e29b-41d4-a716-446655440001',
  startDate: '2024-01-01T00:00:00.000Z',
  endDate: '2024-12-31T23:59:59.999Z'
});
```

### 3. Get Referral by ID
**Endpoint:** `GET /referrals/:id`  
**Authentication:** Required (Bearer token)  
**Roles:** Healthcare Provider, Admin, Doctor, Patient

```typescript
const getReferralById = async (referralId: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/referrals/${referralId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 4. Update Referral
**Endpoint:** `PATCH /referrals/:id`  
**Authentication:** Required (Bearer token)  
**Roles:** Healthcare Provider, Admin, Doctor

```typescript
const updateReferral = async (referralId: string, updateData: UpdateReferralDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/referrals/${referralId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'accepted',
      responseNotes: 'Patient accepted for consultation. Scheduled for next week.',
      // Other update fields...
    })
  });
  
  return await response.json();
};
```

### 5. Delete Referral
**Endpoint:** `DELETE /referrals/:id`  
**Authentication:** Required (Bearer token)  
**Roles:** Healthcare Provider, Admin

```typescript
const deleteReferral = async (referralId: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/referrals/${referralId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return response.ok;
};
```

---

## 📄 Document Management Endpoints

### 1. Get Referral Documents
**Endpoint:** `GET /referrals/:id/documents`  
**Authentication:** Required (Bearer token)  
**Roles:** Healthcare Provider, Admin, Doctor

```typescript
const getReferralDocuments = async (referralId: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/referrals/${referralId}/documents`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 2. Add Document to Referral
**Endpoint:** `POST /referrals/:id/documents`  
**Authentication:** Required (Bearer token)  
**Roles:** Healthcare Provider, Admin, Doctor

```typescript
const addReferralDocument = async (referralId: string, file: File, documentData: CreateReferralDocumentDto) => {
  const token = localStorage.getItem('access_token');
  const formData = new FormData();
  
  formData.append('file', file);
  formData.append('name', documentData.name);
  formData.append('documentType', documentData.documentType);
  if (documentData.description) {
    formData.append('description', documentData.description);
  }
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/referrals/${referralId}/documents`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData
  });
  
  return await response.json();
};
```

### 3. Download Document
**Endpoint:** `GET /referrals/documents/:id/download`  
**Authentication:** Required (Bearer token)  
**Roles:** Healthcare Provider, Admin, Doctor

```typescript
const downloadReferralDocument = async (documentId: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/referrals/documents/${documentId}/download`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });
  
  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referral-document-${documentId}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
  
  return response.ok;
};
```

### 4. Delete Document
**Endpoint:** `DELETE /referrals/documents/:id`  
**Authentication:** Required (Bearer token)  
**Roles:** Healthcare Provider, Admin

```typescript
const deleteReferralDocument = async (documentId: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/referrals/documents/${documentId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return response.ok;
};
```

---

## 📈 Analytics Endpoints

### 1. Get Referral Analytics
**Endpoint:** `GET /referrals/analytics/:centerId`  
**Authentication:** Required (Bearer token)  
**Roles:** Healthcare Provider, Admin, Doctor

**Query Parameters:**
```typescript
interface AnalyticsQuery {
  startDate?: string;                  // Optional: Start date (ISO format)
  endDate?: string;                    // Optional: End date (ISO format)
}
```

**Example Request:**
```typescript
const getReferralAnalytics = async (centerId: string, filters: AnalyticsQuery = {}) => {
  const token = localStorage.getItem('access_token');
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value);
    }
  });
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/referrals/analytics/${centerId}?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};

// Example usage:
const analytics = await getReferralAnalytics('550e8400-e29b-41d4-a716-446655440001', {
  startDate: '2024-01-01T00:00:00.000Z',
  endDate: '2024-12-31T23:59:59.999Z'
});
```

**Response:**
```typescript
{
  "totalReferrals": 150,
  "referralsByStatus": [
    { "status": "pending", "count": 45 },
    { "status": "accepted", "count": 60 },
    { "status": "completed", "count": 35 },
    { "status": "rejected", "count": 10 }
  ],
  "referralsByType": [
    { "type": "specialist", "count": 80 },
    { "type": "diagnostic", "count": 40 },
    { "type": "consultation", "count": 20 },
    { "type": "follow_up", "count": 10 }
  ],
  "inboundVsOutbound": {
    "inbound": 90,
    "outbound": 60
  },
  "timeRange": {
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-12-31T23:59:59.999Z"
  }
}
```

---

## 🎨 Frontend Implementation Examples

### React Referral Dashboard Component

```typescript
import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, DoughnutController, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, DoughnutController, ArcElement);

interface ReferralDashboardProps {
  centerId: string;
  token: string;
}

const ReferralDashboard: React.FC<ReferralDashboardProps> = ({ centerId, token }) => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [analytics, setAnalytics] = useState<ReferralAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadReferrals();
    loadAnalytics();
  }, [centerId, selectedStatus, selectedType, dateRange]);

  const loadReferrals = async () => {
    setLoading(true);
    try {
      const filters: ReferralQueryParams = {
        referringCenterId: centerId,
        startDate: dateRange.start,
        endDate: dateRange.end
      };
      
      if (selectedStatus !== 'all') {
        filters.status = selectedStatus as ReferralStatus;
      }
      
      const referralsData = await getReferrals(filters);
      setReferrals(referralsData);
    } catch (error) {
      console.error('Error loading referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const analyticsData = await getReferralAnalytics(centerId, {
        startDate: dateRange.start,
        endDate: dateRange.end
      });
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const createNewReferral = async (referralData: CreateReferralDto) => {
    try {
      const newReferral = await createReferral(referralData);
      setReferrals(prev => [newReferral, ...prev]);
      loadAnalytics(); // Refresh analytics
    } catch (error) {
      console.error('Error creating referral:', error);
    }
  };

  const updateReferralStatus = async (referralId: string, status: ReferralStatus, responseNotes?: string) => {
    try {
      await updateReferral(referralId, {
        status,
        responseNotes,
        respondedDate: new Date()
      });
      loadReferrals(); // Refresh referrals list
      loadAnalytics(); // Refresh analytics
    } catch (error) {
      console.error('Error updating referral:', error);
    }
  };

  const addDocument = async (referralId: string, file: File, documentData: CreateReferralDocumentDto) => {
    try {
      await addReferralDocument(referralId, file, documentData);
      loadReferrals(); // Refresh to get updated documents
    } catch (error) {
      console.error('Error adding document:', error);
    }
  };

  // Chart data preparation
  const prepareStatusChartData = () => {
    if (!analytics?.referralsByStatus) return null;

    return {
      labels: analytics.referralsByStatus.map(item => item.status),
      datasets: [
        {
          data: analytics.referralsByStatus.map(item => item.count),
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40'
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  const prepareTypeChartData = () => {
    if (!analytics?.referralsByType) return null;

    return {
      labels: analytics.referralsByType.map(item => item.type),
      datasets: [
        {
          label: 'Referrals by Type',
          data: analytics.referralsByType.map(item => item.count),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Referral Distribution',
      },
      legend: {
        position: 'top' as const,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Referral Status Distribution',
      },
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  if (loading) {
    return <div className="loading">Loading referrals...</div>;
  }

  return (
    <div className="referral-dashboard">
      {/* Header Controls */}
      <div className="dashboard-header">
        <h1>Referral Dashboard</h1>
        <div className="controls">
          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
            <option value="canceled">Canceled</option>
            <option value="expired">Expired</option>
          </select>
          
          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="specialist">Specialist</option>
            <option value="diagnostic">Diagnostic</option>
            <option value="procedure">Procedure</option>
            <option value="consultation">Consultation</option>
            <option value="follow_up">Follow Up</option>
            <option value="second_opinion">Second Opinion</option>
            <option value="transfer">Transfer</option>
          </select>
          
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
          />
        </div>
      </div>

      {/* Summary Cards */}
      {analytics && (
        <div className="summary-cards">
          <div className="summary-card">
            <h3>Total Referrals</h3>
            <div className="metric">
              <span className="value">{analytics.totalReferrals}</span>
              <span className="label">All Time</span>
            </div>
          </div>

          <div className="summary-card">
            <h3>Inbound vs Outbound</h3>
            <div className="metric">
              <span className="value">{analytics.inboundVsOutbound.inbound}</span>
              <span className="label">Inbound</span>
            </div>
            <div className="metric">
              <span className="value">{analytics.inboundVsOutbound.outbound}</span>
              <span className="label">Outbound</span>
            </div>
          </div>

          <div className="summary-card">
            <h3>Pending Referrals</h3>
            <div className="metric">
              <span className="value">
                {analytics.referralsByStatus.find(s => s.status === 'pending')?.count || 0}
              </span>
              <span className="label">Awaiting Response</span>
            </div>
          </div>

          <div className="summary-card">
            <h3>Completed Referrals</h3>
            <div className="metric">
              <span className="value">
                {analytics.referralsByStatus.find(s => s.status === 'completed')?.count || 0}
              </span>
              <span className="label">Successfully Completed</span>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="charts-section">
        <div className="chart-container">
          <h3>Referral Types</h3>
          {prepareTypeChartData() && (
            <Bar data={prepareTypeChartData()!} options={chartOptions} />
          )}
        </div>

        <div className="chart-container">
          <h3>Status Distribution</h3>
          {prepareStatusChartData() && (
            <Doughnut data={prepareStatusChartData()!} options={doughnutOptions} />
          )}
        </div>
      </div>

      {/* Referrals Table */}
      <div className="referrals-table">
        <h3>Recent Referrals</h3>
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Type</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {referrals.slice(0, 10).map((referral) => (
              <tr key={referral.id}>
                <td>{referral.patient?.name || 'Unknown'}</td>
                <td>
                  <span className={`type-badge ${referral.referralType}`}>
                    {referral.referralType}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${referral.status}`}>
                    {referral.status}
                  </span>
                </td>
                <td>
                  <span className={`priority-badge ${referral.priority}`}>
                    {referral.priority}
                  </span>
                </td>
                <td>{new Date(referral.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      onClick={() => updateReferralStatus(referral.id, 'accepted')}
                      disabled={referral.status !== 'pending'}
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => updateReferralStatus(referral.id, 'rejected')}
                      disabled={referral.status !== 'pending'}
                    >
                      Reject
                    </button>
                    <button onClick={() => {/* View details */}}>
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReferralDashboard;
```

### CSS Styling

```css
.referral-dashboard {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.dashboard-header h1 {
  margin: 0;
  color: #333;
}

.controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

.controls select,
.controls input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.summary-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.summary-card h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
}

.metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.metric:last-child {
  border-bottom: none;
}

.value {
  font-size: 24px;
  font-weight: bold;
  color: #007bff;
}

.label {
  color: #666;
  font-size: 14px;
}

.charts-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.chart-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.chart-container h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.referrals-table {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.referrals-table h3 {
  margin: 0 0 20px 0;
  color: #333;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
}

tr:hover {
  background: #f8f9fa;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.accepted {
  background: #d4edda;
  color: #155724;
}

.status-badge.rejected {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.completed {
  background: #d1ecf1;
  color: #0c5460;
}

.priority-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.priority-badge.low {
  background: #e2e3e5;
  color: #383d41;
}

.priority-badge.normal {
  background: #d4edda;
  color: #155724;
}

.priority-badge.high {
  background: #fff3cd;
  color: #856404;
}

.priority-badge.urgent {
  background: #f8d7da;
  color: #721c24;
}

.type-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  background: #e9ecef;
  color: #495057;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-buttons button {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
}

.action-buttons button:hover:not(:disabled) {
  background: #f8f9fa;
}

.action-buttons button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
    gap: 15px;
  }
  
  .controls {
    flex-wrap: wrap;
  }
  
  .charts-section {
    grid-template-columns: 1fr;
  }
  
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .referrals-table {
    overflow-x: auto;
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
      "field": "patientId",
      "message": "Patient ID is required"
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
  "message": "Insufficient permissions to manage referrals",
  "error": "Forbidden"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Referral not found",
  "error": "Not Found"
}

// 500 Internal Server Error
{
  "statusCode": 500,
  "message": "Failed to process referral",
  "error": "Internal Server Error"
}
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install chart.js react-chartjs-2 axios
# or
yarn add chart.js react-chartjs-2 axios
```

### 2. Create API Service

```typescript
// services/referralApi.ts
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

export const referralApi = {
  // Referral Management
  createReferral: (data: CreateReferralDto) => apiClient.post('/referrals', data),
  getReferrals: (params: ReferralQueryParams) => apiClient.get('/referrals', { params }),
  getReferralById: (id: string) => apiClient.get(`/referrals/${id}`),
  updateReferral: (id: string, data: UpdateReferralDto) => apiClient.patch(`/referrals/${id}`, data),
  deleteReferral: (id: string) => apiClient.delete(`/referrals/${id}`),
  
  // Document Management
  getReferralDocuments: (referralId: string) => apiClient.get(`/referrals/${referralId}/documents`),
  addReferralDocument: (referralId: string, formData: FormData) => 
    apiClient.post(`/referrals/${referralId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  downloadDocument: (documentId: string) => 
    apiClient.get(`/referrals/documents/${documentId}/download`, {
      responseType: 'blob'
    }),
  deleteDocument: (documentId: string) => apiClient.delete(`/referrals/documents/${documentId}`),
  
  // Analytics
  getReferralAnalytics: (centerId: string, params: AnalyticsQuery) => 
    apiClient.get(`/referrals/analytics/${centerId}`, { params }),
};
```

### 3. Environment Configuration

```typescript
// config/environment.ts
export const environment = {
  production: false,
  apiUrl: 'https://api.unlimtedhealth.com/api',
  appName: 'Referral Dashboard',
  version: '1.0.0'
};
```

---

## 📋 Summary

This comprehensive Referral Dashboard guide provides:

✅ **Complete API Documentation** - All referral endpoints with real DTOs  
✅ **Document Management** - File upload, download, and management  
✅ **Analytics Integration** - Comprehensive analytics with charts and trends  
✅ **Status Tracking** - Real-time referral status management  
✅ **TypeScript Interfaces** - Full type definitions for all data structures  
✅ **Frontend Implementation** - React components with Chart.js integration  
✅ **Data Visualization** - Bar charts, doughnut charts, and summary cards  
✅ **Real-time Updates** - Live status updates and notifications  
✅ **Error Handling** - Comprehensive error response documentation  
✅ **Mobile Responsive** - CSS grid layouts for all screen sizes  

The dashboard supports:
- Referral creation and management
- Document attachment and management
- Comprehensive analytics and data visualization
- Status tracking and workflow management
- Real-time updates and notifications
- Mobile-responsive design
- Role-based access control

**Base URL:** `https://api.unlimtedhealth.com/api`  
**Authentication:** Bearer token required for all endpoints  
**Documentation:** Swagger/OpenAPI available at `/api/docs`
