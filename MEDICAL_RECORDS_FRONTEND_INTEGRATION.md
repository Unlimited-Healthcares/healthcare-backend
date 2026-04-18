# Medical Records Frontend Integration Guide

This guide provides comprehensive instructions for integrating the Medical Records feature with the healthcare backend API. The UI template has already been implemented - this guide focuses on connecting it to the real backend APIs.

## Table of Contents
- [Authentication & Authorization](#authentication--authorization)
- [Base Configuration](#base-configuration)
- [API Endpoints Reference](#api-endpoints-reference)
- [Data Structures](#data-structures)
- [Implementation Examples](#implementation-examples)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Authentication & Authorization

### Authentication Requirements
All medical records endpoints require JWT authentication. Include the Bearer token in the Authorization header:

```typescript
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
};
```

### User Roles
The following roles have access to medical records:
- `healthcare_provider` - Full access to create, read, update, delete
- `admin` - Full administrative access
- `doctor` - Full access to medical records
- `nurse` - Read access and limited create/update
- `patient` - Limited access to own records

### Getting User Profile
```typescript
// GET /api/auth/me
const getUserProfile = async (token: string) => {
  const response = await fetch('https://api.unlimtedhealth.com/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

## Base Configuration

### API Base URL
```typescript
const API_BASE_URL = 'https://api.unlimtedhealth.com/api';
```

### Environment Setup
```typescript
// config/api.ts
export const API_CONFIG = {
  baseUrl: process.env.REACT_APP_API_URL || 'https://api.unlimtedhealth.com/api',
  timeout: 30000,
  retryAttempts: 3
};
```

## API Endpoints Reference

### 1. Medical Records Management

#### Get All Medical Records
```typescript
// GET /api/medical-records
const getMedicalRecords = async (patientId?: string) => {
  const params = new URLSearchParams();
  if (patientId) params.append('patientId', patientId);
  
  const response = await fetch(`${API_BASE_URL}/medical-records?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

#### Search Medical Records
```typescript
// GET /api/medical-records/search
const searchMedicalRecords = async (searchParams: {
  q?: string;
  category?: string;
  tags?: string;
  recordType?: string;
  dateFrom?: string;
  dateTo?: string;
  patientId?: string;
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value.toString());
    }
  });
  
  const response = await fetch(`${API_BASE_URL}/medical-records/search?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

#### Get Single Medical Record
```typescript
// GET /api/medical-records/:id
const getMedicalRecord = async (recordId: string) => {
  const response = await fetch(`${API_BASE_URL}/medical-records/${recordId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

#### Create Medical Record
```typescript
// POST /api/medical-records
const createMedicalRecord = async (recordData: CreateMedicalRecordDto) => {
  const response = await fetch(`${API_BASE_URL}/medical-records`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(recordData)
  });
  return response.json();
};
```

#### Update Medical Record
```typescript
// PATCH /api/medical-records/:id
const updateMedicalRecord = async (recordId: string, updateData: UpdateMedicalRecordDto) => {
  const response = await fetch(`${API_BASE_URL}/medical-records/${recordId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  });
  return response.json();
};
```

#### Delete Medical Record
```typescript
// DELETE /api/medical-records/:id
const deleteMedicalRecord = async (recordId: string) => {
  const response = await fetch(`${API_BASE_URL}/medical-records/${recordId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

### 2. Categories Management

#### Get All Categories
```typescript
// GET /api/medical-records/categories
const getCategories = async () => {
  const response = await fetch(`${API_BASE_URL}/medical-records/categories`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

#### Get Category Hierarchy
```typescript
// GET /api/medical-records/categories/hierarchy
const getCategoryHierarchy = async () => {
  const response = await fetch(`${API_BASE_URL}/medical-records/categories/hierarchy`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

#### Create Category
```typescript
// POST /api/medical-records/categories
const createCategory = async (categoryData: CreateCategoryDto) => {
  const response = await fetch(`${API_BASE_URL}/medical-records/categories`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(categoryData)
  });
  return response.json();
};
```

### 3. File Management

#### Upload File to Medical Record
```typescript
// POST /api/medical-records/:id/files
const uploadFile = async (recordId: string, file: File, metadata?: Record<string, unknown>) => {
  const formData = new FormData();
  formData.append('file', file);
  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }
  
  const response = await fetch(`${API_BASE_URL}/medical-records/${recordId}/files`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  return response.json();
};
```

#### Get Files for Medical Record
```typescript
// GET /api/medical-records/:id/files
const getRecordFiles = async (recordId: string) => {
  const response = await fetch(`${API_BASE_URL}/medical-records/${recordId}/files`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

#### Get File Download URL
```typescript
// GET /api/medical-records/files/:fileId/url
const getFileUrl = async (fileId: string) => {
  const response = await fetch(`${API_BASE_URL}/medical-records/files/${fileId}/url`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

#### Convert DICOM to JPEG
```typescript
// POST /api/medical-records/:id/files/:fileId/convert-dicom
const convertDicomToJpeg = async (recordId: string, fileId: string) => {
  const response = await fetch(`${API_BASE_URL}/medical-records/${recordId}/files/${fileId}/convert-dicom`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

### 4. Tags Management

#### Get All Tags
```typescript
// GET /api/medical-records/tags
const getAllTags = async () => {
  const response = await fetch(`${API_BASE_URL}/medical-records/tags`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

### 5. Patient Management for Medical Records

#### Get All Patients (for doctors/healthcare providers)
```typescript
// GET /api/patients
const getAllPatients = async (page = 1, limit = 20) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  const response = await fetch(`${API_BASE_URL}/patients?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

#### Search Patients
```typescript
// GET /api/patients/search
const searchPatients = async (query: string) => {
  const params = new URLSearchParams({ query });
  
  const response = await fetch(`${API_BASE_URL}/patients/search?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

#### Get Patient by ID
```typescript
// GET /api/patients/:id
const getPatientById = async (patientId: string) => {
  const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

#### Get Approved Doctors for a Patient
```typescript
// GET /api/patients/:id/approved-doctors
const getApprovedDoctors = async (patientId: string) => {
  const response = await fetch(`${API_BASE_URL}/patients/${patientId}/approved-doctors`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

### 6. Version Management

#### Get Version History
```typescript
// GET /api/medical-records/:id/versions
const getVersionHistory = async (recordId: string) => {
  const response = await fetch(`${API_BASE_URL}/medical-records/${recordId}/versions`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

#### Revert to Version
```typescript
// POST /api/medical-records/:id/revert/:versionNumber
const revertToVersion = async (recordId: string, versionNumber: number) => {
  const response = await fetch(`${API_BASE_URL}/medical-records/${recordId}/revert/${versionNumber}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

### 7. Sharing Management

#### Create Share Request
```typescript
// POST /api/medical-records/sharing/requests
const createShareRequest = async (shareRequestData: CreateShareRequestDto) => {
  const response = await fetch(`${API_BASE_URL}/medical-records/sharing/requests`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(shareRequestData)
  });
  return response.json();
};
```

#### Get Share Requests
```typescript
// GET /api/medical-records/sharing/requests
const getShareRequests = async (status?: string) => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  
  const response = await fetch(`${API_BASE_URL}/medical-records/sharing/requests?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

## Data Structures

### Patient Entity
```typescript
interface Patient {
  id: string;
  userId: string;
  patientId: string; // Generated display ID like PT123456789
  medicalRecordNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  bloodType?: string;
  allergies?: string;
  chronicConditions?: string;
  currentMedications?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  preferredLanguage: string;
  consentDataSharing: boolean;
  consentResearch: boolean;
  consentMarketing: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  visits?: PatientVisit[];
  user?: User; // User profile information
}
```

### Patient Provider Relationship Entity
```typescript
interface PatientProviderRelationship {
  id: string;
  patientId: string;
  providerId: string;
  providerType: 'doctor' | 'center';
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: Date;
  approvedBy?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  patient?: Patient;
  provider?: User; // Doctor information
  center?: HealthcareCenter; // Center information
  approver?: User;
}
```

### User Profile Entity
```typescript
interface UserProfile {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  avatar?: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  specialization?: string; // For doctors
  licenseNumber?: string; // For medical professionals
  experience?: string;
  qualifications?: string[];
  location?: {
    city: string;
    state: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  availability?: {
    schedule: Record<string, { start: string; end: string }>;
    timezone: string;
  };
  privacySettings?: {
    profileVisibility: 'public' | 'private' | 'professional_only';
    dataSharing: Record<string, boolean>;
    contactPreferences: Record<string, boolean>;
  };
  createdAt: Date;
  updatedAt: Date;
}
```
```typescript
interface MedicalRecord {
  id: string;
  patientId: string;
  centerId?: string;
  createdBy?: string;
  recordType: string; // diagnosis, prescription, lab_result, imaging, surgery, etc.
  title: string;
  description?: string;
  recordData?: Record<string, unknown>; // Structured medical data
  tags?: string[]; // Array of tags for categorization
  category?: string; // General category like cardiology, neurology, etc.
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  followUp?: string;
  medications?: Record<string, unknown> | unknown[];
  status: string; // active, archived, deleted
  version: number;
  parentRecordId?: string;
  isSensitive: boolean;
  isShareable: boolean;
  isLatestVersion: boolean;
  sharingRestrictions?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  patient?: Patient;
  creator?: User;
  files?: MedicalRecordFile[];
  shares?: MedicalRecordShare[];
}
```

### Create Medical Record DTO
```typescript
interface CreateMedicalRecordDto {
  patientId: string;
  centerId?: string;
  createdBy?: string;
  recordType: string;
  title: string;
  description?: string;
  recordData?: Record<string, unknown>;
  tags?: string[];
  category?: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  followUp?: string;
  medications?: Record<string, unknown> | unknown[];
  isSensitive?: boolean;
  isShareable?: boolean;
  sharingRestrictions?: Record<string, unknown>;
  fileAttachments?: string[];
}
```

### Medical Record File Entity
```typescript
interface MedicalRecordFile {
  id: string;
  recordId: string;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  mimeType?: string;
  isEncrypted?: boolean;
  encryptionKeyId?: string;
  thumbnailPath?: string;
  metadata?: Record<string, unknown>;
  uploadStatus?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  record?: MedicalRecord;
  creator?: User;
}
```

### Category Entity
```typescript
interface MedicalRecordCategory {
  id: string;
  name: string;
  description?: string;
  parentCategoryId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  parent?: MedicalRecordCategory;
  children?: MedicalRecordCategory[];
}
```

### Share Request Entity
```typescript
interface MedicalRecordShareRequest {
  id: string;
  recordId: string;
  patientId: string;
  requestingCenterId: string;
  owningCenterId: string;
  requestedBy?: string;
  purpose: string;
  urgencyLevel: string; // urgent, normal, low
  requestStatus: string; // pending, approved, denied, expired
  requestedAccessLevel: string;
  requestedDurationDays: number;
  responseNotes?: string;
  approvedBy?: string;
  respondedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## Implementation Examples

### 1. Patient Selection for Medical Record Creation
```typescript
// Patient selection component for creating medical records
const PatientSelector = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Fetch patients on component mount
  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      try {
        const response = await getAllPatients(1, 50); // Get first 50 patients
        setPatients(response.data || response);
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // Search patients with debouncing
  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(async () => {
        setLoading(true);
        try {
          const response = await searchPatients(searchQuery);
          setPatients(response.data || response);
        } catch (error) {
          console.error('Error searching patients:', error);
        } finally {
          setLoading(false);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery]);

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    // You can emit an event or call a callback here
    onPatientSelect?.(patient);
  };

  return (
    <div className="patient-selector">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search patients by name, ID, or medical record number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="patients-list">
        {loading ? (
          <div className="loading">Loading patients...</div>
        ) : (
          patients.map((patient) => (
            <div
              key={patient.id}
              className={`patient-card ${selectedPatient?.id === patient.id ? 'selected' : ''}`}
              onClick={() => handlePatientSelect(patient)}
            >
              <div className="patient-info">
                <h3>{patient.user?.profile?.displayName || `${patient.user?.profile?.firstName} ${patient.user?.profile?.lastName}`}</h3>
                <p>Patient ID: {patient.patientId}</p>
                <p>Medical Record #: {patient.medicalRecordNumber || 'N/A'}</p>
                <p>Phone: {patient.user?.profile?.phone || 'N/A'}</p>
                {patient.allergies && (
                  <p className="allergies">⚠️ Allergies: {patient.allergies}</p>
                )}
                {patient.chronicConditions && (
                  <p className="conditions">🏥 Conditions: {patient.chronicConditions}</p>
                )}
              </div>
              <div className="patient-actions">
                <button onClick={() => handlePatientSelect(patient)}>
                  Select Patient
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedPatient && (
        <div className="selected-patient-summary">
          <h4>Selected Patient:</h4>
          <p><strong>Name:</strong> {selectedPatient.user?.profile?.displayName}</p>
          <p><strong>Patient ID:</strong> {selectedPatient.patientId}</p>
          <p><strong>Blood Type:</strong> {selectedPatient.bloodType || 'Unknown'}</p>
          <p><strong>Preferred Language:</strong> {selectedPatient.preferredLanguage}</p>
        </div>
      )}
    </div>
  );
};
```

### 2. Dashboard Summary Cards
```typescript
// Fetch summary data for dashboard cards
const fetchDashboardSummary = async () => {
  try {
    // Get total records count
    const recordsResponse = await getMedicalRecords();
    const totalRecords = recordsResponse.length;
    
    // Get shared records count
    const sharedResponse = await getShareRequests('approved');
    const sharedRecords = sharedResponse.length;
    
    // Get pending requests count
    const pendingResponse = await getShareRequests('pending');
    const pendingRequests = pendingResponse.length;
    
    // Get recent activity (last 7 days)
    const recentResponse = await searchMedicalRecords({
      dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    });
    const recentActivity = recentResponse.length;
    
    return {
      totalRecords,
      sharedRecords,
      pendingRequests,
      recentActivity
    };
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    throw error;
  }
};
```

### 3. Records List with Filtering
```typescript
// Fetch and display medical records with filters
const fetchRecordsWithFilters = async (filters: {
  search?: string;
  category?: string;
  recordType?: string;
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
}) => {
  try {
    const searchParams = {
      q: filters.search,
      category: filters.category,
      recordType: filters.recordType,
      page: filters.page || 1,
      limit: filters.limit || 10
    };
    
    const response = await searchMedicalRecords(searchParams);
    return response;
  } catch (error) {
    console.error('Error fetching records:', error);
    throw error;
  }
};
```

### 4. File Upload with Progress
```typescript
// Upload file with progress tracking
const uploadFileWithProgress = async (
  recordId: string, 
  file: File, 
  onProgress?: (progress: number) => void
) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = (event.loaded / event.total) * 100;
        onProgress(progress);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });
    
    xhr.open('POST', `${API_BASE_URL}/medical-records/${recordId}/files`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
};
```

### 5. Real-time Search with Debouncing
```typescript
// Debounced search implementation
import { useCallback, useEffect, useState } from 'react';

const useDebouncedSearch = (searchTerm: string, delay: number = 300) => {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [searchTerm, delay]);
  
  useEffect(() => {
    if (debouncedTerm) {
      setLoading(true);
      searchMedicalRecords({ q: debouncedTerm })
        .then(setResults)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [debouncedTerm]);
  
  return { results, loading };
};
```

## Error Handling

### API Error Response Structure
```typescript
interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}
```

### Error Handling Implementation
```typescript
const handleApiError = (error: any) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return 'Invalid request data. Please check your input.';
      case 401:
        return 'Authentication required. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'A conflict occurred. The resource may already exist.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return data.message || 'An unexpected error occurred.';
    }
  } else if (error.request) {
    // Network error
    return 'Network error. Please check your connection.';
  } else {
    // Other error
    return 'An unexpected error occurred.';
  }
};
```

### Retry Logic for Failed Requests
```typescript
const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as Error;
      
      if (i === maxRetries - 1) {
        throw lastError;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  
  throw lastError!;
};
```

## Best Practices

### 1. State Management
```typescript
// Use React Query for server state management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const useMedicalRecords = (filters?: RecordFilters) => {
  return useQuery({
    queryKey: ['medical-records', filters],
    queryFn: () => fetchRecordsWithFilters(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

const useCreateMedicalRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createMedicalRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-records'] });
    },
  });
};
```

### 2. Loading States
```typescript
// Implement loading states for better UX
const MedicalRecordsList = () => {
  const { data: records, isLoading, error } = useMedicalRecords();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return <ErrorMessage error={error} />;
  }
  
  return (
    <div>
      {records?.map(record => (
        <MedicalRecordCard key={record.id} record={record} />
      ))}
    </div>
  );
};
```

### 3. Pagination
```typescript
// Implement pagination for large datasets
const usePaginatedRecords = (page: number, limit: number = 10) => {
  return useQuery({
    queryKey: ['medical-records', 'paginated', page, limit],
    queryFn: () => searchMedicalRecords({ page, limit }),
    keepPreviousData: true, // Keep previous data while loading new page
  });
};
```

### 4. File Handling
```typescript
// Handle different file types appropriately
const handleFileDownload = async (fileId: string, fileName: string) => {
  try {
    const response = await getFileUrl(fileId);
    const { url } = response;
    
    // Create temporary link for download
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading file:', error);
  }
};
```

### 5. Security Considerations
```typescript
// Sanitize user input
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

// Validate file types before upload
const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

// Check user permissions before showing actions
const canEditRecord = (record: MedicalRecord, user: User): boolean => {
  return user.roles.includes('admin') || 
         user.roles.includes('doctor') || 
         record.createdBy === user.id;
};
```

### 6. Performance Optimization
```typescript
// Implement virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';

const VirtualizedRecordsList = ({ records }: { records: MedicalRecord[] }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <MedicalRecordCard record={records[index]} />
    </div>
  );
  
  return (
    <List
      height={600}
      itemCount={records.length}
      itemSize={120}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

### 7. Accessibility
```typescript
// Ensure proper ARIA labels and keyboard navigation
const MedicalRecordCard = ({ record }: { record: MedicalRecord }) => {
  return (
    <div 
      role="article"
      aria-label={`Medical record: ${record.title}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          // Handle card selection
        }
      }}
    >
      <h3>{record.title}</h3>
      <p>{record.description}</p>
      {/* ... other content */}
    </div>
  );
};
```

## Testing

### Unit Tests
```typescript
// Test API functions
import { createMedicalRecord } from '../api/medical-records';

describe('Medical Records API', () => {
  it('should create a medical record', async () => {
    const mockRecord = {
      patientId: 'patient-123',
      recordType: 'lab_result',
      title: 'Blood Test Results',
      description: 'Complete blood count'
    };
    
    const result = await createMedicalRecord(mockRecord);
    expect(result).toBeDefined();
    expect(result.title).toBe(mockRecord.title);
  });
});
```

### Integration Tests
```typescript
// Test component integration
import { render, screen, waitFor } from '@testing-library/react';
import { MedicalRecordsList } from '../MedicalRecordsList';

describe('MedicalRecordsList', () => {
  it('should display medical records', async () => {
    render(<MedicalRecordsList />);
    
    await waitFor(() => {
      expect(screen.getByText('Blood Test Results')).toBeInTheDocument();
    });
  });
});
```

## Troubleshooting

### Common Issues

1. **Authentication Errors (401)**
   - Ensure JWT token is valid and not expired
   - Check token format: `Bearer <token>`
   - Verify token is included in Authorization header

2. **Permission Errors (403)**
   - Check user roles and permissions
   - Verify user has access to the specific resource
   - Ensure proper role-based access control

3. **File Upload Issues**
   - Check file size limits
   - Verify file type is allowed
   - Ensure proper multipart/form-data encoding

4. **Search Performance**
   - Implement debouncing for search inputs
   - Use pagination for large result sets
   - Consider caching frequently accessed data

### Debug Tools
```typescript
// Enable API request/response logging in development
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

if (process.env.NODE_ENV === 'development') {
  apiClient.interceptors.request.use(request => {
    console.log('API Request:', request);
    return request;
  });
  
  apiClient.interceptors.response.use(
    response => {
      console.log('API Response:', response);
      return response;
    },
    error => {
      console.error('API Error:', error);
      return Promise.reject(error);
    }
  );
}
```

This guide provides everything needed to integrate the medical records feature with the backend API. Follow the examples and best practices to ensure a robust, secure, and performant implementation.
