# 🏥 Health Record Dashboard - Frontend Implementation Guide

## 📋 Overview

This guide provides comprehensive information for building a **Health Record Dashboard** that allows healthcare providers and patients to:
- View and manage medical records
- Search and filter records by various criteria
- Upload and manage medical files (including DICOM)
- Share records securely between healthcare centers
- Track record versions and changes
- Organize records by categories and tags

**Base URL:** `https://api.unlimtedhealth.com/api`

---

## 🎯 Frontend Dashboard Overview

### Main Dashboard Sections

1. **Record Management**
   - Medical record listing with advanced filters
   - Record creation and editing
   - Version history and comparison
   - Category and tag management

2. **File Management**
   - File upload and attachment
   - DICOM file conversion and viewing
   - File metadata management
   - Thumbnail generation

3. **Record Sharing**
   - Secure sharing between centers
   - Share request management
   - Access logging and tracking
   - Permission management

4. **Search & Discovery**
   - Advanced search with multiple criteria
   - Category-based filtering
   - Tag-based organization
   - Date range filtering

---

## 🔍 Medical Records Endpoints

### 1. Get All Medical Records
**Endpoint:** `GET /medical-records`  
**Authentication:** Required (Bearer token)  
**Roles:** `healthcare_provider`, `admin`, `doctor`, `nurse`, `patient`

**Query Parameters:**
```typescript
{
  patientId?: string;  // Filter by patient ID
}
```

**Example Request:**
```typescript
const getMedicalRecords = async (patientId?: string) => {
  const token = localStorage.getItem('access_token');
  const queryParams = patientId ? `?patientId=${patientId}` : '';
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/medical-records${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

**Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "patientId": "550e8400-e29b-41d4-a716-446655440001",
    "centerId": "550e8400-e29b-41d4-a716-446655440002",
    "createdBy": "550e8400-e29b-41d4-a716-446655440003",
    "recordType": "diagnosis",
    "title": "Hypertension Diagnosis",
    "description": "Initial diagnosis of hypertension with blood pressure readings",
    "recordData": {
      "vitals": {
        "bloodPressure": "150/95",
        "heartRate": 85,
        "temperature": 98.6
      },
      "symptoms": ["headache", "dizziness", "fatigue"]
    },
    "tags": ["cardiology", "hypertension", "urgent"],
    "category": "Cardiology",
    "diagnosis": "Essential Hypertension",
    "treatment": "Lifestyle modifications and medication",
    "notes": "Patient advised to reduce sodium intake",
    "followUp": "Follow up in 2 weeks",
    "medications": [
      {
        "name": "Lisinopril",
        "dosage": "10mg",
        "frequency": "daily"
      }
    ],
    "status": "active",
    "version": 1,
    "isSensitive": false,
    "isShareable": true,
    "isLatestVersion": true,
    "sharingRestrictions": {
      "allowedRoles": ["doctor", "nurse"],
      "restrictedFields": ["personalNotes"]
    },
    "fileAttachments": ["file-id-1", "file-id-2"],
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
]
```

### 2. Advanced Search Records
**Endpoint:** `GET /medical-records/search`  
**Authentication:** Required (Bearer token)  
**Roles:** `healthcare_provider`, `admin`, `doctor`, `nurse`, `patient`

**Query Parameters:**
```typescript
{
  q?: string;                    // Search query
  category?: string;             // Filter by category
  tags?: string;                 // Comma-separated tags
  recordType?: string;           // Filter by record type
  dateFrom?: string;             // Start date (YYYY-MM-DD)
  dateTo?: string;               // End date (YYYY-MM-DD)
  patientId?: string;            // Filter by patient ID
  page?: number;                 // Page number (default: 1)
  limit?: number;                // Items per page (default: 10)
}
```

**Example Request:**
```typescript
const searchRecords = async (filters: {
  q?: string;
  category?: string;
  tags?: string[];
  recordType?: string;
  dateFrom?: string;
  dateTo?: string;
  patientId?: string;
  page?: number;
  limit?: number;
}) => {
  const token = localStorage.getItem('access_token');
  const queryParams = new URLSearchParams();
  
  if (filters.q) queryParams.append('q', filters.q);
  if (filters.category) queryParams.append('category', filters.category);
  if (filters.tags) queryParams.append('tags', filters.tags.join(','));
  if (filters.recordType) queryParams.append('recordType', filters.recordType);
  if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
  if (filters.patientId) queryParams.append('patientId', filters.patientId);
  if (filters.page) queryParams.append('page', filters.page.toString());
  if (filters.limit) queryParams.append('limit', filters.limit.toString());
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/medical-records/search?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Hypertension Diagnosis",
      "recordType": "diagnosis",
      "category": "Cardiology",
      "tags": ["cardiology", "hypertension"],
      "createdAt": "2023-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### 3. Get Record by ID
**Endpoint:** `GET /medical-records/:id`  
**Authentication:** Required (Bearer token)  
**Roles:** `healthcare_provider`, `admin`, `doctor`, `nurse`, `patient`

**Example Request:**
```typescript
const getRecordById = async (recordId: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/medical-records/${recordId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 4. Create Medical Record
**Endpoint:** `POST /medical-records`  
**Authentication:** Required (Bearer token)  
**Roles:** `healthcare_provider`, `admin`, `doctor`, `nurse`

**Request Body (CreateMedicalRecordDto):**
```typescript
interface CreateMedicalRecordDto {
  patientId: string;                           // Required: UUID - Patient ID
  centerId?: string;                           // Optional: UUID - Center ID (auto-set from user context)
  createdBy?: string;                          // Optional: UUID - Creator ID (auto-set from user context)
  recordType: string;                          // Required: Record type (diagnosis, prescription, lab_result, etc.)
  title: string;                               // Required: Record title
  description?: string;                        // Optional: Record description
  recordData?: Record<string, unknown>;        // Optional: Structured medical data
  tags?: string[];                             // Optional: Array of tags
  category?: string;                           // Optional: Category name
  diagnosis?: string;                          // Optional: Diagnosis
  treatment?: string;                          // Optional: Treatment
  notes?: string;                              // Optional: Additional notes
  followUp?: string;                           // Optional: Follow-up instructions
  medications?: Record<string, unknown> | unknown[];  // Optional: Medications
  isSensitive?: boolean;                       // Optional: Is sensitive record
  isShareable?: boolean;                       // Optional: Is shareable
  sharingRestrictions?: Record<string, unknown>;  // Optional: Sharing restrictions
  fileAttachments?: string[];                  // Optional: Array of file IDs
}
```

**Example Request:**
```typescript
const createMedicalRecord = async (recordData: CreateMedicalRecordDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/medical-records', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      patientId: '550e8400-e29b-41d4-a716-446655440001',
      recordType: 'diagnosis',
      title: 'Hypertension Diagnosis',
      description: 'Initial diagnosis of hypertension',
      recordData: {
        vitals: {
          bloodPressure: '150/95',
          heartRate: 85
        },
        symptoms: ['headache', 'dizziness']
      },
      tags: ['cardiology', 'hypertension'],
      category: 'Cardiology',
      diagnosis: 'Essential Hypertension',
      treatment: 'Lifestyle modifications and medication',
      medications: [
        {
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'daily'
        }
      ],
      isSensitive: false,
      isShareable: true
    })
  });
  
  return await response.json();
};
```

### 5. Update Medical Record
**Endpoint:** `PATCH /medical-records/:id`  
**Authentication:** Required (Bearer token)  
**Roles:** `healthcare_provider`, `admin`, `doctor`, `nurse`

**Request Body (UpdateMedicalRecordDto):**
```typescript
interface UpdateMedicalRecordDto {
  title?: string;                               // Optional: Record title
  description?: string;                         // Optional: Record description
  recordType?: string;                          // Optional: Record type
  category?: string;                            // Optional: Category name
  tags?: string[];                              // Optional: Array of tags
  diagnosis?: string;                           // Optional: Diagnosis
  treatment?: string;                           // Optional: Treatment
  notes?: string;                               // Optional: Additional notes
  followUp?: string;                            // Optional: Follow-up instructions
  medications?: Record<string, unknown> | unknown[];  // Optional: Medications
  isSensitive?: boolean;                        // Optional: Is sensitive record
  isShareable?: boolean;                        // Optional: Is shareable
  sharingRestrictions?: Record<string, unknown>;  // Optional: Sharing restrictions
  changesSummary?: string;                      // Optional: Summary of changes
}
```

### 6. Delete Medical Record
**Endpoint:** `DELETE /medical-records/:id`  
**Authentication:** Required (Bearer token)  
**Roles:** `healthcare_provider`, `admin`, `doctor`, `nurse`

---

## 📁 File Management Endpoints

### 1. Upload File to Record
**Endpoint:** `POST /medical-records/:id/files`  
**Authentication:** Required (Bearer token)  
**Roles:** `healthcare_provider`, `admin`, `doctor`, `nurse`

**Request Body (FormData):**
```typescript
interface FileUploadDto {
  recordId: string;                             // Required: Record ID
  description?: string;                         // Optional: File description
  tags?: string[];                              // Optional: File tags
  metadata?: Record<string, unknown>;           // Optional: File metadata
}
```

**Example Request:**
```typescript
const uploadFileToRecord = async (recordId: string, file: File, uploadData: FileUploadDto) => {
  const token = localStorage.getItem('access_token');
  const formData = new FormData();
  
  formData.append('file', file);
  formData.append('recordId', recordId);
  if (uploadData.description) formData.append('description', uploadData.description);
  if (uploadData.tags) formData.append('tags', JSON.stringify(uploadData.tags));
  if (uploadData.metadata) formData.append('metadata', JSON.stringify(uploadData.metadata));
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/medical-records/${recordId}/files`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData
  });
  
  return await response.json();
};
```

**Response (201 Created):**
```json
{
  "id": "file-id-123",
  "recordId": "550e8400-e29b-41d4-a716-446655440000",
  "fileName": "xray-chest-2023.jpg",
  "originalFileName": "chest-xray.jpg",
  "filePath": "/uploads/medical-records/file-id-123.jpg",
  "fileType": "jpg",
  "fileSize": 2048576,
  "mimeType": "image/jpeg",
  "isEncrypted": true,
  "thumbnailPath": "/uploads/thumbnails/file-id-123-thumb.jpg",
  "metadata": {
    "dicomTags": {
      "PatientName": "John Doe",
      "StudyDate": "20230101"
    }
  },
  "uploadStatus": "completed",
  "createdAt": "2023-01-01T00:00:00Z"
}
```

### 2. Get Record Files
**Endpoint:** `GET /medical-records/:id/files`  
**Authentication:** Required (Bearer token)  
**Roles:** `healthcare_provider`, `admin`, `doctor`, `nurse`, `patient`

### 3. Get File URL
**Endpoint:** `GET /medical-records/files/:fileId/url`  
**Authentication:** Required (Bearer token)  
**Roles:** `healthcare_provider`, `admin`, `doctor`, `nurse`, `patient`

### 4. Convert DICOM to JPEG
**Endpoint:** `POST /medical-records/:id/files/:fileId/convert-dicom`  
**Authentication:** Required (Bearer token)  
**Roles:** `healthcare_provider`, `admin`

---

## 🏷️ Categories and Tags Management

### 1. Get All Categories
**Endpoint:** `GET /medical-records/categories`  
**Authentication:** Required (Bearer token)

**Response (200 OK):**
```json
[
  {
    "id": "cat-1",
    "name": "Cardiology",
    "description": "Heart and cardiovascular system",
    "parentCategoryId": null,
    "isActive": true,
    "children": [
      {
        "id": "cat-2",
        "name": "Echocardiography",
        "description": "Heart ultrasound studies",
        "parentCategoryId": "cat-1",
        "isActive": true
      }
    ],
    "createdAt": "2023-01-01T00:00:00Z"
  }
]
```

### 2. Get Category Hierarchy
**Endpoint:** `GET /medical-records/categories/hierarchy`  
**Authentication:** Required (Bearer token)

### 3. Get All Tags
**Endpoint:** `GET /medical-records/tags`  
**Authentication:** Required (Bearer token)

**Response (200 OK):**
```json
[
  "cardiology",
  "hypertension",
  "urgent",
  "follow-up",
  "lab-results",
  "imaging"
]
```

---

## 🔄 Version Management Endpoints

### 1. Get Version History
**Endpoint:** `GET /medical-records/:id/versions`  
**Authentication:** Required (Bearer token)

### 2. Get Specific Version
**Endpoint:** `GET /medical-records/versions/:versionId`  
**Authentication:** Required (Bearer token)

### 3. Revert to Version
**Endpoint:** `POST /medical-records/:id/revert/:versionNumber`  
**Authentication:** Required (Bearer token)

### 4. Compare Versions
**Endpoint:** `GET /medical-records/versions/:versionId1/compare/:versionId2`  
**Authentication:** Required (Bearer token)

---

## 🔐 Record Sharing Endpoints

### 1. Create Share Request
**Endpoint:** `POST /medical-records/sharing/requests`  
**Authentication:** Required (Bearer token)  
**Roles:** `healthcare_provider`, `admin`

**Request Body:**
```typescript
interface CreateShareRequestDto {
  recordId: string;                             // Required: Record ID to share
  targetCenterId: string;                       // Required: Target center ID
  requestedBy: string;                          // Required: Requester ID
  purpose: string;                              // Required: Purpose of sharing
  requestedFields?: string[];                   // Optional: Specific fields to share
  expirationDate?: string;                      // Optional: Expiration date
  accessLevel: 'view' | 'download' | 'edit';    // Required: Access level
}
```

### 2. Get Share Requests
**Endpoint:** `GET /medical-records/sharing/requests/center/:centerId`  
**Authentication:** Required (Bearer token)  
**Roles:** `healthcare_provider`, `admin`

### 3. Respond to Share Request
**Endpoint:** `PATCH /medical-records/sharing/requests/:id/respond`  
**Authentication:** Required (Bearer token)  
**Roles:** `healthcare_provider`, `admin`

### 4. Get Active Shares
**Endpoint:** `GET /medical-records/sharing/record/:recordId/shares`  
**Authentication:** Required (Bearer token)

---

## 🎨 Frontend UI/UX Recommendations

### 1. Record Dashboard Layout
```typescript
// Main Dashboard Component Structure
interface RecordDashboardProps {
  records: MedicalRecord[];
  filters: RecordFilters;
  onFilterChange: (filters: RecordFilters) => void;
  onRecordSelect: (record: MedicalRecord) => void;
  onRecordCreate: () => void;
}

// Recommended Layout:
// - Search bar and filters at top
// - Record cards in grid/list view
// - Quick actions sidebar
// - Category and tag filters
// - Pagination at bottom
```

### 2. Record Detail View
```typescript
// Record Detail Component Structure
interface RecordDetailProps {
  record: MedicalRecord;
  files: MedicalRecordFile[];
  versions: MedicalRecordVersion[];
  onRecordUpdate: (record: MedicalRecord) => void;
  onFileUpload: (file: File) => void;
  onVersionRevert: (versionNumber: number) => void;
}

// Recommended Layout:
// - Record header with title and metadata
// - Tabs: Overview, Files, Versions, Sharing
// - Action buttons: Edit, Share, Download
// - Version history timeline
```

### 3. File Management Interface
```typescript
// File Management Component
interface FileManagementProps {
  files: MedicalRecordFile[];
  onFileUpload: (file: File) => void;
  onFileDelete: (fileId: string) => void;
  onFileView: (file: MedicalRecordFile) => void;
}

// Features:
// - Drag and drop file upload
// - File preview thumbnails
// - DICOM viewer integration
// - File metadata display
// - Bulk operations
```

### 4. Search and Filter Interface
```typescript
// Advanced Search Component
interface RecordSearchProps {
  onSearch: (filters: SearchFilters) => void;
  categories: MedicalRecordCategory[];
  tags: string[];
  recordTypes: string[];
}

// Features:
// - Full-text search
// - Category tree selection
// - Tag cloud selection
// - Date range picker
// - Record type filters
// - Saved search presets
```

---

## 🔧 TypeScript Interfaces

### Core Medical Record Interface
```typescript
interface MedicalRecord {
  id: string;                                   // UUID - Primary key
  patientId: string;                            // UUID - Patient ID
  centerId?: string;                            // UUID - Center ID
  createdBy?: string;                           // UUID - Creator ID
  recordType: string;                           // Record type (diagnosis, prescription, etc.)
  title: string;                                // Record title
  description?: string;                         // Record description
  recordData?: Record<string, unknown>;         // Structured medical data
  tags?: string[];                              // Array of tags
  category?: string;                            // Category name
  diagnosis?: string;                           // Diagnosis
  treatment?: string;                           // Treatment
  notes?: string;                               // Additional notes
  followUp?: string;                            // Follow-up instructions
  medications?: Record<string, unknown> | unknown[];  // Medications
  status: string;                               // Record status (active, archived, deleted)
  version: number;                              // Version number
  parentRecordId?: string;                      // UUID - Parent record for versions
  isSensitive: boolean;                         // Is sensitive record
  isShareable: boolean;                         // Is shareable
  isLatestVersion: boolean;                     // Is latest version
  sharingRestrictions?: Record<string, unknown>;  // Sharing restrictions
  fileAttachments?: string[];                   // Array of file IDs
  createdAt: string;                            // Creation timestamp
  updatedAt: string;                            // Last update timestamp
}
```

### Medical Record File Interface
```typescript
interface MedicalRecordFile {
  id: string;                                   // UUID - Primary key
  recordId: string;                             // UUID - Record ID
  fileName: string;                             // Generated file name
  originalFileName: string;                     // Original file name
  filePath: string;                             // File storage path
  fileType: string;                             // File type (pdf, jpg, dicom, etc.)
  fileSize: number;                             // File size in bytes
  mimeType?: string;                            // MIME type
  isEncrypted: boolean;                         // Is file encrypted
  encryptionKeyId?: string;                     // Encryption key ID
  thumbnailPath?: string;                       // Thumbnail path
  metadata?: Record<string, unknown>;           // File metadata
  uploadStatus: string;                         // Upload status
  createdBy?: string;                           // UUID - Creator ID
  createdAt: string;                            // Creation timestamp
  updatedAt: string;                            // Last update timestamp
}
```

### Medical Record Category Interface
```typescript
interface MedicalRecordCategory {
  id: string;                                   // UUID - Primary key
  name: string;                                 // Category name
  description?: string;                         // Category description
  parentCategoryId?: string;                    // UUID - Parent category ID
  isActive: boolean;                            // Is category active
  parent?: MedicalRecordCategory;               // Parent category
  children?: MedicalRecordCategory[];           // Child categories
  createdAt: string;                            // Creation timestamp
  updatedAt: string;                            // Last update timestamp
}
```

### Search and Filter Interfaces
```typescript
interface SearchFilters {
  q?: string;                                   // Search query
  category?: string;                            // Category filter
  tags?: string[];                              // Tag filters
  recordType?: string;                          // Record type filter
  dateFrom?: string;                            // Start date filter
  dateTo?: string;                              // End date filter
  patientId?: string;                           // Patient ID filter
  page?: number;                                // Page number
  limit?: number;                               // Items per page
}

interface RecordFilters {
  search?: string;                              // Search term
  category?: string;                            // Selected category
  tags?: string[];                              // Selected tags
  recordType?: string;                          // Selected record type
  dateRange?: {                                 // Date range
    from: string;
    to: string;
  };
  status?: string;                              // Record status
  isSensitive?: boolean;                        // Sensitive records filter
  isShareable?: boolean;                        // Shareable records filter
}
```

### DTO Interfaces (for API requests)
```typescript
interface CreateMedicalRecordDto {
  patientId: string;                            // Required: UUID - Patient ID
  centerId?: string;                            // Optional: UUID - Center ID
  createdBy?: string;                           // Optional: UUID - Creator ID
  recordType: string;                           // Required: Record type
  title: string;                                // Required: Record title
  description?: string;                         // Optional: Record description
  recordData?: Record<string, unknown>;         // Optional: Structured data
  tags?: string[];                              // Optional: Array of tags
  category?: string;                            // Optional: Category name
  diagnosis?: string;                           // Optional: Diagnosis
  treatment?: string;                           // Optional: Treatment
  notes?: string;                               // Optional: Additional notes
  followUp?: string;                            // Optional: Follow-up instructions
  medications?: Record<string, unknown> | unknown[];  // Optional: Medications
  isSensitive?: boolean;                        // Optional: Is sensitive
  isShareable?: boolean;                        // Optional: Is shareable
  sharingRestrictions?: Record<string, unknown>;  // Optional: Sharing restrictions
  fileAttachments?: string[];                   // Optional: File IDs
}

interface UpdateMedicalRecordDto {
  title?: string;                               // Optional: Record title
  description?: string;                         // Optional: Record description
  recordType?: string;                          // Optional: Record type
  category?: string;                            // Optional: Category name
  tags?: string[];                              // Optional: Array of tags
  diagnosis?: string;                           // Optional: Diagnosis
  treatment?: string;                           // Optional: Treatment
  notes?: string;                               // Optional: Additional notes
  followUp?: string;                            // Optional: Follow-up instructions
  medications?: Record<string, unknown> | unknown[];  // Optional: Medications
  isSensitive?: boolean;                        // Optional: Is sensitive
  isShareable?: boolean;                        // Optional: Is shareable
  sharingRestrictions?: Record<string, unknown>;  // Optional: Sharing restrictions
  changesSummary?: string;                      // Optional: Changes summary
}

interface FileUploadDto {
  recordId: string;                             // Required: Record ID
  description?: string;                         // Optional: File description
  tags?: string[];                              // Optional: File tags
  metadata?: Record<string, unknown>;           // Optional: File metadata
}
```

---

## 📋 Complete API Endpoints Summary

### Medical Records Management

| Method | Endpoint | Description | Roles | Query Parameters |
|--------|----------|-------------|-------|------------------|
| `GET` | `/medical-records` | Get all medical records | All | `patientId` |
| `GET` | `/medical-records/search` | Advanced search records | All | `q`, `category`, `tags`, `recordType`, `dateFrom`, `dateTo`, `patientId`, `page`, `limit` |
| `GET` | `/medical-records/:id` | Get record by ID | All | None |
| `POST` | `/medical-records` | Create new record | `healthcare_provider`, `admin`, `doctor`, `nurse` | Body: `CreateMedicalRecordDto` |
| `PATCH` | `/medical-records/:id` | Update record | `healthcare_provider`, `admin`, `doctor`, `nurse` | Body: `UpdateMedicalRecordDto` |
| `DELETE` | `/medical-records/:id` | Delete record | `healthcare_provider`, `admin`, `doctor`, `nurse` | None |

### File Management

| Method | Endpoint | Description | Roles | Query Parameters |
|--------|----------|-------------|-------|------------------|
| `POST` | `/medical-records/:id/files` | Upload file to record | `healthcare_provider`, `admin`, `doctor`, `nurse` | FormData: `FileUploadDto` |
| `GET` | `/medical-records/:id/files` | Get record files | All | None |
| `GET` | `/medical-records/files/:fileId` | Get file by ID | All | None |
| `GET` | `/medical-records/files/:fileId/url` | Get file download URL | All | None |
| `DELETE` | `/medical-records/files/:fileId` | Delete file | `healthcare_provider`, `admin`, `doctor`, `nurse` | None |
| `POST` | `/medical-records/:id/files/:fileId/convert-dicom` | Convert DICOM to JPEG | `healthcare_provider`, `admin` | None |

### Categories and Tags

| Method | Endpoint | Description | Roles | Query Parameters |
|--------|----------|-------------|-------|------------------|
| `GET` | `/medical-records/categories` | Get all categories | All | None |
| `GET` | `/medical-records/categories/hierarchy` | Get category hierarchy | All | None |
| `POST` | `/medical-records/categories` | Create category | `healthcare_provider`, `admin` | Body: `CreateCategoryDto` |
| `PATCH` | `/medical-records/categories/:id` | Update category | `healthcare_provider`, `admin` | Body: `UpdateCategoryDto` |
| `DELETE` | `/medical-records/categories/:id` | Delete category | `healthcare_provider`, `admin` | None |
| `GET` | `/medical-records/tags` | Get all tags | All | None |

### Version Management

| Method | Endpoint | Description | Roles | Query Parameters |
|--------|----------|-------------|-------|------------------|
| `GET` | `/medical-records/:id/versions` | Get version history | All | None |
| `GET` | `/medical-records/versions/:versionId` | Get specific version | All | None |
| `POST` | `/medical-records/:id/revert/:versionNumber` | Revert to version | `healthcare_provider`, `admin`, `doctor`, `nurse` | None |
| `GET` | `/medical-records/versions/:versionId1/compare/:versionId2` | Compare versions | All | None |

### Record Sharing

| Method | Endpoint | Description | Roles | Query Parameters |
|--------|----------|-------------|-------|------------------|
| `POST` | `/medical-records/sharing/requests` | Create share request | `healthcare_provider`, `admin` | Body: `CreateShareRequestDto` |
| `GET` | `/medical-records/sharing/requests/:id` | Get share request | `healthcare_provider`, `admin`, `patient` | None |
| `GET` | `/medical-records/sharing/requests/center/:centerId` | Get center share requests | `healthcare_provider`, `admin` | `status` |
| `GET` | `/medical-records/sharing/requests/patient/:patientId` | Get patient share requests | `healthcare_provider`, `admin`, `patient` | `status` |
| `PATCH` | `/medical-records/sharing/requests/:id/respond` | Respond to share request | `healthcare_provider`, `admin` | Body: `RespondShareRequestDto` |
| `DELETE` | `/medical-records/sharing/requests/:id/cancel` | Cancel share request | `healthcare_provider`, `admin` | None |
| `GET` | `/medical-records/sharing/record/:recordId/shares` | Get active shares | `healthcare_provider`, `admin`, `patient` | None |
| `GET` | `/medical-records/sharing/shares/:id` | Get share by ID | `healthcare_provider`, `admin`, `patient` | None |
| `DELETE` | `/medical-records/sharing/shares/:id/revoke` | Revoke share | `healthcare_provider`, `admin`, `patient` | `reason` |
| `POST` | `/medical-records/sharing/shares/:id/access` | Log access | `healthcare_provider`, `admin` | `accessType`, `details` |
| `GET` | `/medical-records/sharing/shares/:id/logs` | Get access logs | `healthcare_provider`, `admin`, `patient` | None |

---

## 🚨 Error Handling

### Common Error Responses
```typescript
// 400 Bad Request
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
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
  "message": "Insufficient permissions",
  "error": "Forbidden"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Medical record not found",
  "error": "Not Found"
}

// 409 Conflict
{
  "statusCode": 409,
  "message": "Record already exists",
  "error": "Conflict"
}
```

---

## 🎯 Implementation Checklist

### Phase 1: Core Record Management
- [ ] Implement record listing with pagination
- [ ] Add search and filter functionality
- [ ] Create record detail pages
- [ ] Implement record creation and editing
- [ ] Add responsive design

### Phase 2: File Management
- [ ] Build file upload interface
- [ ] Implement file preview and viewing
- [ ] Add DICOM file support
- [ ] Create file metadata management
- [ ] Add bulk file operations

### Phase 3: Advanced Features
- [ ] Implement version management
- [ ] Add record sharing functionality
- [ ] Create category and tag management
- [ ] Add access logging and tracking
- [ ] Implement advanced search

### Phase 4: Optimization
- [ ] Add caching strategies
- [ ] Implement offline support
- [ ] Optimize file loading
- [ ] Add analytics tracking
- [ ] Implement security features

---

## 📚 Additional Resources

- **Swagger Documentation:** `https://api.unlimtedhealth.com/api/docs`
- **Health Check:** `GET https://api.unlimtedhealth.com/api/health`
- **API Version:** v1 (current)

---

**Note**: This comprehensive guide provides all the necessary information to build a complete Health Record Dashboard frontend. The API endpoints, DTOs, and interfaces are based on the actual backend implementation, ensuring type safety and proper integration. Focus on implementing the core features first, then add advanced functionality as needed.

