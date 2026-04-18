# 📊 Medical Reports Dashboard Guide

## 📋 Overview

This comprehensive guide provides everything needed to implement a Medical Reports Dashboard for the healthcare management system. The dashboard enables healthcare providers to generate, view, export, and analyze medical reports with comprehensive analytics, data visualization, and reporting capabilities.

**Base URL:** `https://api.unlimtedhealth.com/api`  
**Authentication:** Bearer token required for all endpoints  
**Documentation:** Swagger/OpenAPI available at `/api/docs`

---

## 🏷️ TypeScript Interfaces

### Core Report Types

```typescript
// Report Types
enum ReportType {
  MEDICAL_SUMMARY = 'medical_summary',
  DIAGNOSIS_REPORT = 'diagnosis_report',
  PRESCRIPTION_REPORT = 'prescription_report',
  LAB_RESULTS = 'lab_results',
  IMAGING_REPORT = 'imaging_report',
  SURGERY_REPORT = 'surgery_report',
  FOLLOW_UP_REPORT = 'follow_up_report',
  COMPREHENSIVE = 'comprehensive'
}

// Export Formats
enum ExportFormat {
  PDF = 'pdf',
  CSV = 'csv',
  EXCEL = 'excel'
}

// Analytics Time Frames
enum AnalyticsTimeFrame {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

// Analytics Entity Types
enum AnalyticsEntityType {
  MEDICAL_RECORDS = 'medical_records',
  REFERRALS = 'referrals',
  APPOINTMENTS = 'appointments',
  ALL = 'all'
}
```

### Report Generation DTOs

```typescript
// Date Range for filtering
interface DateRangeDto {
  start?: string;    // ISO date string
  end?: string;      // ISO date string
}

// Generate Report Request
interface GenerateReportDto {
  patientId: string;                    // Required: Patient UUID
  reportType?: string;                  // Optional: Report type
  dateRange?: DateRangeDto;            // Optional: Date range filter
  includeFiles?: boolean;              // Optional: Include file attachments
  format?: 'pdf' | 'html';            // Optional: Output format
}

// Export Report Request
interface ExportReportDto {
  reportId: string;                    // Required: Report UUID
  format: 'csv' | 'pdf' | 'excel';    // Required: Export format
  includeAttachments?: boolean;        // Optional: Include file attachments
  centerId?: string;                   // Optional: Center ID for filtering
}

// Analytics Query Request
interface AnalyticsQueryDto {
  centerId: string;                    // Required: Center UUID
  startDate?: string;                  // Optional: Start date (ISO format)
  endDate?: string;                    // Optional: End date (ISO format)
  timeFrame?: AnalyticsTimeFrame;      // Optional: Time aggregation
  entityType?: AnalyticsEntityType;    // Optional: Entity type filter
  providerIds?: string[];              // Optional: Provider UUIDs filter
  patientIds?: string[];               // Optional: Patient UUIDs filter
  recordTypes?: string[];              // Optional: Record types filter
  includeTrends?: boolean;             // Optional: Include trend analysis
  includeComparison?: boolean;         // Optional: Include period comparison
}
```

### Report Response Interfaces

```typescript
// Medical Record Structure
interface MedicalRecord {
  id: string;                          // UUID - Primary key
  patientId: string;                   // UUID - Patient ID
  centerId?: string;                   // UUID - Center ID
  createdBy: string;                   // UUID - Creator ID
  recordType: string;                  // Record type (diagnosis, prescription, etc.)
  title: string;                       // Record title
  description?: string;                // Record description
  recordData: Record<string, unknown>; // Structured medical data
  tags: string[];                      // Categorization tags
  category?: string;                   // Medical category
  diagnosis?: string;                  // Diagnosis information
  treatment?: string;                  // Treatment information
  notes?: string;                      // Additional notes
  followUp?: string;                   // Follow-up instructions
  isActive: boolean;                   // Is record active
  isConfidential: boolean;             // Is record confidential
  priority: 'low' | 'medium' | 'high' | 'urgent'; // Priority level
  status: 'draft' | 'pending' | 'approved' | 'archived'; // Record status
  createdAt: Date;                     // Creation timestamp
  updatedAt: Date;                     // Last update timestamp
  files: MedicalRecordFile[];          // Associated files
}

// Medical Record File
interface MedicalRecordFile {
  id: string;                          // UUID - Primary key
  recordId: string;                    // UUID - Medical record ID
  fileName: string;                    // Original file name
  fileUrl: string;                     // File URL
  fileSize: number;                    // File size in bytes
  fileType: string;                    // MIME type
  uploadedBy: string;                  // UUID - Uploader ID
  uploadedAt: Date;                    // Upload timestamp
}

// Generated Report Structure
interface GeneratedReport {
  id: string;                          // UUID - Report ID
  patientId: string;                   // UUID - Patient ID
  reportType: string;                  // Report type
  title: string;                       // Report title
  content: string;                     // Report content (HTML/PDF)
  summary: string;                     // Report summary
  generatedBy: string;                 // UUID - Generator ID
  generatedAt: Date;                   // Generation timestamp
  dateRange?: DateRangeDto;           // Date range covered
  includeFiles: boolean;               // Includes file attachments
  format: string;                      // Report format
  metadata: Record<string, unknown>;   // Report metadata
  medicalRecords: MedicalRecord[];     // Included medical records
  statistics: ReportStatistics;        // Report statistics
}

// Report Statistics
interface ReportStatistics {
  totalRecords: number;                // Total medical records
  recordTypes: Record<string, number>; // Count by record type
  dateRange: {
    start: Date;
    end: Date;
    days: number;
  };
  categories: Record<string, number>;  // Count by category
  priorityDistribution: Record<string, number>; // Priority distribution
  statusDistribution: Record<string, number>;   // Status distribution
}

// Analytics Data Structures
interface TimeSeriesDataPoint {
  period: string;                      // Time period (e.g., "2024-01")
  records: number;                     // Medical records count
  referrals: number;                   // Referrals count
  appointments: number;                // Appointments count
  total: number;                       // Total count
}

interface AnalyticsSummary {
  medicalRecords?: {
    totalRecords: number;
    newRecords: number;
    updatedRecords: number;
    categories: Record<string, number>;
    recordTypes: Record<string, number>;
    priorityDistribution: Record<string, number>;
    statusDistribution: Record<string, number>;
  };
  referrals?: {
    totalReferrals: number;
    pendingReferrals: number;
    completedReferrals: number;
    avgResponseTime: number;
    referralTypes: Record<string, number>;
  };
  appointments?: {
    totalAppointments: number;
    scheduledAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    cancellationRate: number;
    appointmentTypes: Record<string, number>;
  };
  trends?: {
    period: string;
    change: number;
    changePercent: number;
  };
}

interface MetricComparison {
  current?: number;                    // Current period value
  previous?: number;                   // Previous period value
  change: number;                      // Absolute change
  changePercent: number;               // Percentage change
}

// Comprehensive Analytics Response
interface ComprehensiveAnalyticsResponse {
  summary: AnalyticsSummary;
  timeSeries: TimeSeriesDataPoint[];
  comparisons: {
    medicalRecords: MetricComparison;
    referrals: MetricComparison;
    appointments: MetricComparison;
  };
  trends: {
    medicalRecords: TimeSeriesDataPoint[];
    referrals: TimeSeriesDataPoint[];
    appointments: TimeSeriesDataPoint[];
  };
  metadata: {
    generatedAt: Date;
    centerId: string;
    dateRange: {
      start: Date;
      end: Date;
    };
    timeFrame: AnalyticsTimeFrame;
    entityType: AnalyticsEntityType;
  };
}
```

---

## 📊 Report Generation Endpoints

### 1. Generate Medical Report
**Endpoint:** `POST /reports/generate`  
**Authentication:** Required (Bearer token)  
**Roles:** Healthcare Provider, Admin

**Request Body (GenerateReportDto):**
```typescript
interface GenerateReportDto {
  patientId: string;                    // Required: Patient UUID
  reportType?: string;                  // Optional: Report type
  dateRange?: {
    start?: string;                     // Optional: Start date (ISO)
    end?: string;                       // Optional: End date (ISO)
  };
  includeFiles?: boolean;              // Optional: Include attachments
  format?: 'pdf' | 'html';            // Optional: Output format
}
```

**Example Request:**
```typescript
const generateMedicalReport = async (reportData: GenerateReportDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/reports/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      patientId: "550e8400-e29b-41d4-a716-446655440000",
      reportType: "comprehensive",
      dateRange: {
        start: "2024-01-01T00:00:00.000Z",
        end: "2024-12-31T23:59:59.999Z"
      },
      includeFiles: true,
      format: "html"
    })
  });
  
  return await response.json();
};
```

**Response:**
```typescript
{
  "success": true,
  "report": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "patientId": "550e8400-e29b-41d4-a716-446655440000",
    "reportType": "comprehensive",
    "title": "Comprehensive Medical Report - John Doe",
    "content": "<html>...</html>",
    "summary": "Patient has 15 medical records...",
    "generatedBy": "550e8400-e29b-41d4-a716-446655440002",
    "generatedAt": "2024-01-15T10:30:00.000Z",
    "dateRange": {
      "start": "2024-01-01T00:00:00.000Z",
      "end": "2024-12-31T23:59:59.999Z"
    },
    "includeFiles": true,
    "format": "html",
    "metadata": {
      "totalRecords": 15,
      "categories": ["cardiology", "neurology"],
      "priorityDistribution": { "high": 3, "medium": 8, "low": 4 }
    },
    "statistics": {
      "totalRecords": 15,
      "recordTypes": {
        "diagnosis": 5,
        "prescription": 8,
        "lab_result": 2
      },
      "dateRange": {
        "start": "2024-01-01T00:00:00.000Z",
        "end": "2024-12-31T23:59:59.999Z",
        "days": 365
      },
      "categories": {
        "cardiology": 8,
        "neurology": 7
      },
      "priorityDistribution": {
        "high": 3,
        "medium": 8,
        "low": 4
      },
      "statusDistribution": {
        "approved": 12,
        "pending": 2,
        "draft": 1
      }
    }
  }
}
```

### 2. Get Medical Report
**Endpoint:** `GET /reports/medical/:id`  
**Authentication:** Required (Bearer token)  
**Roles:** Healthcare Provider, Admin, Patient

**Example Request:**
```typescript
const getMedicalReport = async (reportId: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/reports/medical/${reportId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 3. Export Report
**Endpoint:** `POST /reports/export`  
**Authentication:** Required (Bearer token)  
**Roles:** Healthcare Provider, Admin

**Request Body (ExportReportDto):**
```typescript
interface ExportReportDto {
  reportId: string;                    // Required: Report UUID
  format: 'csv' | 'pdf' | 'excel';    // Required: Export format
  includeAttachments?: boolean;        // Optional: Include files
  centerId?: string;                   // Optional: Center ID
}
```

**Example Request:**
```typescript
const exportReport = async (exportData: ExportReportDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/reports/export', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reportId: "550e8400-e29b-41d4-a716-446655440001",
      format: "pdf",
      includeAttachments: true,
      centerId: "550e8400-e29b-41d4-a716-446655440003"
    })
  });
  
  // Handle file download
  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-report-${exportData.reportId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
  
  return response;
};
```

---

## 📈 Analytics Endpoints

### 1. Get Basic Analytics
**Endpoint:** `GET /reports/analytics/:centerId`  
**Authentication:** Required (Bearer token)  
**Roles:** Healthcare Provider, Admin

**Query Parameters:**
```typescript
interface BasicAnalyticsQuery {
  startDate?: string;                  // Optional: Start date (ISO)
  endDate?: string;                   // Optional: End date (ISO)
}
```

**Example Request:**
```typescript
const getBasicAnalytics = async (centerId: string, filters: BasicAnalyticsQuery = {}) => {
  const token = localStorage.getItem('access_token');
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value);
    }
  });
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/reports/analytics/${centerId}?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 2. Get Comprehensive Analytics
**Endpoint:** `POST /reports/analytics/comprehensive`  
**Authentication:** Required (Bearer token)  
**Roles:** Healthcare Provider, Admin

**Request Body (AnalyticsQueryDto):**
```typescript
const getComprehensiveAnalytics = async (analyticsQuery: AnalyticsQueryDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/reports/analytics/comprehensive', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      centerId: "550e8400-e29b-41d4-a716-446655440003",
      startDate: "2024-01-01T00:00:00.000Z",
      endDate: "2024-12-31T23:59:59.999Z",
      timeFrame: "monthly",
      entityType: "all",
      providerIds: [
        "550e8400-e29b-41d4-a716-446655440004",
        "550e8400-e29b-41d4-a716-446655440005"
      ],
      recordTypes: ["diagnosis", "prescription", "lab_result"],
      includeTrends: true,
      includeComparison: true
    })
  });
  
  return await response.json();
};
```

**Response:**
```typescript
{
  "summary": {
    "medicalRecords": {
      "totalRecords": 1250,
      "newRecords": 45,
      "updatedRecords": 12,
      "categories": {
        "cardiology": 320,
        "neurology": 280,
        "orthopedics": 200
      },
      "recordTypes": {
        "diagnosis": 450,
        "prescription": 600,
        "lab_result": 200
      },
      "priorityDistribution": {
        "high": 150,
        "medium": 800,
        "low": 300
      },
      "statusDistribution": {
        "approved": 1100,
        "pending": 100,
        "draft": 50
      }
    },
    "referrals": {
      "totalReferrals": 85,
      "pendingReferrals": 15,
      "completedReferrals": 65,
      "avgResponseTime": 2.5,
      "referralTypes": {
        "specialist": 50,
        "imaging": 25,
        "lab": 10
      }
    },
    "appointments": {
      "totalAppointments": 320,
      "scheduledAppointments": 280,
      "completedAppointments": 250,
      "cancelledAppointments": 30,
      "cancellationRate": 0.094,
      "appointmentTypes": {
        "consultation": 200,
        "follow_up": 80,
        "emergency": 40
      }
    }
  },
  "timeSeries": [
    {
      "period": "2024-01",
      "records": 120,
      "referrals": 8,
      "appointments": 25,
      "total": 153
    },
    {
      "period": "2024-02",
      "records": 135,
      "referrals": 12,
      "appointments": 28,
      "total": 175
    }
  ],
  "comparisons": {
    "medicalRecords": {
      "current": 1250,
      "previous": 1100,
      "change": 150,
      "changePercent": 13.6
    },
    "referrals": {
      "current": 85,
      "previous": 75,
      "change": 10,
      "changePercent": 13.3
    },
    "appointments": {
      "current": 320,
      "previous": 300,
      "change": 20,
      "changePercent": 6.7
    }
  },
  "trends": {
    "medicalRecords": [
      { "period": "2024-01", "records": 120, "referrals": 0, "appointments": 0, "total": 120 },
      { "period": "2024-02", "records": 135, "referrals": 0, "appointments": 0, "total": 135 }
    ],
    "referrals": [
      { "period": "2024-01", "records": 0, "referrals": 8, "appointments": 0, "total": 8 },
      { "period": "2024-02", "records": 0, "referrals": 12, "appointments": 0, "total": 12 }
    ],
    "appointments": [
      { "period": "2024-01", "records": 0, "referrals": 0, "appointments": 25, "total": 25 },
      { "period": "2024-02", "records": 0, "referrals": 0, "appointments": 28, "total": 28 }
    ]
  },
  "metadata": {
    "generatedAt": "2024-01-15T10:30:00.000Z",
    "centerId": "550e8400-e29b-41d4-a716-446655440003",
    "dateRange": {
      "start": "2024-01-01T00:00:00.000Z",
      "end": "2024-12-31T23:59:59.999Z"
    },
    "timeFrame": "monthly",
    "entityType": "all"
  }
}
```

### 3. Get Available Time Frames
**Endpoint:** `GET /reports/analytics/timeframes`  
**Authentication:** Required (Bearer token)  
**Roles:** Healthcare Provider, Admin

**Example Request:**
```typescript
const getTimeFrames = async () => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/reports/analytics/timeframes', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

**Response:**
```typescript
{
  "timeFrames": ["daily", "weekly", "monthly", "quarterly", "yearly"],
  "entityTypes": ["medical_records", "referrals", "appointments", "all"]
}
```

---

## 🎨 Frontend Implementation Examples

### React Medical Reports Dashboard Component

```typescript
import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement);

interface MedicalReportsDashboardProps {
  centerId: string;
  token: string;
}

const MedicalReportsDashboard: React.FC<MedicalReportsDashboardProps> = ({ centerId, token }) => {
  const [analytics, setAnalytics] = useState<ComprehensiveAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<AnalyticsTimeFrame>('monthly');
  const [selectedEntityType, setSelectedEntityType] = useState<AnalyticsEntityType>('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadAnalytics();
  }, [centerId, selectedTimeFrame, selectedEntityType, dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const analyticsData = await getComprehensiveAnalytics({
        centerId,
        startDate: dateRange.start,
        endDate: dateRange.end,
        timeFrame: selectedTimeFrame,
        entityType: selectedEntityType,
        includeTrends: true,
        includeComparison: true
      });
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (patientId: string, reportType: string) => {
    try {
      const report = await generateMedicalReport({
        patientId,
        reportType,
        dateRange: {
          start: dateRange.start,
          end: dateRange.end
        },
        includeFiles: true,
        format: 'html'
      });
      
      // Open report in new window
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(report.report.content);
        newWindow.document.close();
      }
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const exportReport = async (reportId: string, format: ExportFormat) => {
    try {
      await exportReport({
        reportId,
        format,
        includeAttachments: true,
        centerId
      });
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  // Chart data preparation
  const prepareChartData = () => {
    if (!analytics?.timeSeries) return null;

    return {
      labels: analytics.timeSeries.map(item => item.period),
      datasets: [
        {
          label: 'Medical Records',
          data: analytics.timeSeries.map(item => item.records),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
        {
          label: 'Referrals',
          data: analytics.timeSeries.map(item => item.referrals),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
        {
          label: 'Appointments',
          data: analytics.timeSeries.map(item => item.appointments),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
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
        text: 'Healthcare Activity Over Time',
      },
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  return (
    <div className="medical-reports-dashboard">
      {/* Header Controls */}
      <div className="dashboard-header">
        <h1>Medical Reports Dashboard</h1>
        <div className="controls">
          <select 
            value={selectedTimeFrame} 
            onChange={(e) => setSelectedTimeFrame(e.target.value as AnalyticsTimeFrame)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
          
          <select 
            value={selectedEntityType} 
            onChange={(e) => setSelectedEntityType(e.target.value as AnalyticsEntityType)}
          >
            <option value="all">All Entities</option>
            <option value="medical_records">Medical Records</option>
            <option value="referrals">Referrals</option>
            <option value="appointments">Appointments</option>
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
      {analytics?.summary && (
        <div className="summary-cards">
          <div className="summary-card">
            <h3>Medical Records</h3>
            <div className="metric">
              <span className="value">{analytics.summary.medicalRecords?.totalRecords || 0}</span>
              <span className="label">Total Records</span>
            </div>
            <div className="metric">
              <span className="value">{analytics.summary.medicalRecords?.newRecords || 0}</span>
              <span className="label">New This Period</span>
            </div>
            {analytics.comparisons?.medicalRecords && (
              <div className="change">
                <span className={`change-value ${analytics.comparisons.medicalRecords.changePercent >= 0 ? 'positive' : 'negative'}`}>
                  {analytics.comparisons.medicalRecords.changePercent >= 0 ? '+' : ''}{analytics.comparisons.medicalRecords.changePercent.toFixed(1)}%
                </span>
                <span className="change-label">vs Previous Period</span>
              </div>
            )}
          </div>

          <div className="summary-card">
            <h3>Referrals</h3>
            <div className="metric">
              <span className="value">{analytics.summary.referrals?.totalReferrals || 0}</span>
              <span className="label">Total Referrals</span>
            </div>
            <div className="metric">
              <span className="value">{analytics.summary.referrals?.avgResponseTime?.toFixed(1) || 0} days</span>
              <span className="label">Avg Response Time</span>
            </div>
            {analytics.comparisons?.referrals && (
              <div className="change">
                <span className={`change-value ${analytics.comparisons.referrals.changePercent >= 0 ? 'positive' : 'negative'}`}>
                  {analytics.comparisons.referrals.changePercent >= 0 ? '+' : ''}{analytics.comparisons.referrals.changePercent.toFixed(1)}%
                </span>
                <span className="change-label">vs Previous Period</span>
              </div>
            )}
          </div>

          <div className="summary-card">
            <h3>Appointments</h3>
            <div className="metric">
              <span className="value">{analytics.summary.appointments?.totalAppointments || 0}</span>
              <span className="label">Total Appointments</span>
            </div>
            <div className="metric">
              <span className="value">{((analytics.summary.appointments?.cancellationRate || 0) * 100).toFixed(1)}%</span>
              <span className="label">Cancellation Rate</span>
            </div>
            {analytics.comparisons?.appointments && (
              <div className="change">
                <span className={`change-value ${analytics.comparisons.appointments.changePercent >= 0 ? 'positive' : 'negative'}`}>
                  {analytics.comparisons.appointments.changePercent >= 0 ? '+' : ''}{analytics.comparisons.appointments.changePercent.toFixed(1)}%
                </span>
                <span className="change-label">vs Previous Period</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="charts-section">
        <div className="chart-container">
          <h3>Activity Trends</h3>
          {prepareChartData() && (
            <Bar data={prepareChartData()!} options={chartOptions} />
          )}
        </div>

        <div className="chart-container">
          <h3>Time Series</h3>
          {prepareChartData() && (
            <Line data={prepareChartData()!} options={chartOptions} />
          )}
        </div>
      </div>

      {/* Report Generation */}
      <div className="report-generation">
        <h3>Generate Reports</h3>
        <div className="report-controls">
          <input
            type="text"
            placeholder="Patient ID"
            id="patientId"
          />
          <select id="reportType">
            <option value="comprehensive">Comprehensive Report</option>
            <option value="medical_summary">Medical Summary</option>
            <option value="diagnosis_report">Diagnosis Report</option>
            <option value="prescription_report">Prescription Report</option>
            <option value="lab_results">Lab Results</option>
          </select>
          <button onClick={() => {
            const patientId = (document.getElementById('patientId') as HTMLInputElement).value;
            const reportType = (document.getElementById('reportType') as HTMLSelectElement).value;
            if (patientId) generateReport(patientId, reportType);
          }}>
            Generate Report
          </button>
        </div>
      </div>

      {/* Data Tables */}
      {analytics?.summary && (
        <div className="data-tables">
          <div className="table-container">
            <h3>Record Categories</h3>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Count</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(analytics.summary.medicalRecords?.categories || {}).map(([category, count]) => (
                  <tr key={category}>
                    <td>{category}</td>
                    <td>{count}</td>
                    <td>{((count / (analytics.summary.medicalRecords?.totalRecords || 1)) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-container">
            <h3>Record Types</h3>
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Count</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(analytics.summary.medicalRecords?.recordTypes || {}).map(([type, count]) => (
                  <tr key={type}>
                    <td>{type}</td>
                    <td>{count}</td>
                    <td>{((count / (analytics.summary.medicalRecords?.totalRecords || 1)) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalReportsDashboard;
```

### CSS Styling

```css
.medical-reports-dashboard {
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
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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

.change {
  margin-top: 10px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.change-value {
  font-weight: bold;
  font-size: 16px;
}

.change-value.positive {
  color: #28a745;
}

.change-value.negative {
  color: #dc3545;
}

.change-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-top: 2px;
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

.report-generation {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.report-generation h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.report-controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

.report-controls input,
.report-controls select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.report-controls button {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.report-controls button:hover {
  background: #0056b3;
}

.data-tables {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.table-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.table-container h3 {
  margin: 0 0 15px 0;
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
  
  .data-tables {
    grid-template-columns: 1fr;
  }
  
  .report-controls {
    flex-direction: column;
    align-items: stretch;
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
  "message": "Insufficient permissions to generate reports",
  "error": "Forbidden"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Report not found",
  "error": "Not Found"
}

// 500 Internal Server Error
{
  "statusCode": 500,
  "message": "Failed to generate report",
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
// services/medicalReportsApi.ts
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

export const medicalReportsApi = {
  // Report Generation
  generateReport: (data: GenerateReportDto) => apiClient.post('/reports/generate', data),
  getMedicalReport: (id: string) => apiClient.get(`/reports/medical/${id}`),
  exportReport: (data: ExportReportDto) => apiClient.post('/reports/export', data, {
    responseType: 'blob'
  }),
  
  // Analytics
  getBasicAnalytics: (centerId: string, params: BasicAnalyticsQuery) => 
    apiClient.get(`/reports/analytics/${centerId}`, { params }),
  getComprehensiveAnalytics: (data: AnalyticsQueryDto) => 
    apiClient.post('/reports/analytics/comprehensive', data),
  getTimeFrames: () => apiClient.get('/reports/analytics/timeframes'),
};
```

### 3. Environment Configuration

```typescript
// config/environment.ts
export const environment = {
  production: false,
  apiUrl: 'https://api.unlimtedhealth.com/api',
  appName: 'Medical Reports Dashboard',
  version: '1.0.0'
};
```

---

## 📋 Summary

This comprehensive Medical Reports Dashboard guide provides:

✅ **Complete API Documentation** - All report endpoints with real DTOs  
✅ **Analytics Integration** - Comprehensive analytics with charts and trends  
✅ **Report Generation** - Multiple report types with export capabilities  
✅ **TypeScript Interfaces** - Full type definitions for all data structures  
✅ **Frontend Implementation** - React components with Chart.js integration  
✅ **Data Visualization** - Bar charts, line charts, and summary cards  
✅ **Export Functionality** - PDF, CSV, and Excel export options  
✅ **Real-time Analytics** - Time series data with trend analysis  
✅ **Error Handling** - Comprehensive error response documentation  
✅ **Mobile Responsive** - CSS grid layouts for all screen sizes  

The dashboard supports:
- Medical report generation and export
- Comprehensive analytics and data visualization
- Time series analysis with trend comparisons
- Multiple export formats (PDF, CSV, Excel)
- Real-time data filtering and aggregation
- Mobile-responsive design
- Role-based access control

**Base URL:** `https://api.unlimtedhealth.com/api`  
**Authentication:** Bearer token required for all endpoints  
**Documentation:** Swagger/OpenAPI available at `/api/docs`
