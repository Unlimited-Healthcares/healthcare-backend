// Equipment Vendor Interface
interface EquipmentVendor {
  id: string;                           // UUID - Primary key
  companyName: string;                  // Company name
  contactPerson?: string;               // Contact person name
  email?: string;                       // Contact email
  phone?: string;                       // Contact phone
  address?: string;                     // Business address
  businessLicense?: string;             // Business license number
  taxId?: string;                       // Tax ID
  verificationStatus: 'pending' | 'verified' | 'rejected'; // Verification status
  verificationDate?: Date;              // Verification date
  verifiedBy?: string;                  // UUID - Verified by user ID
  ratingAverage?: number;               // Average rating
  totalRatings?: number;                // Total number of ratings
  isActive: boolean;                    // Is active
  businessHours?: {                     // Business hours
    monday?: { open?: string; close?: string; isClosed?: boolean };
    tuesday?: { open?: string; close?: string; isClosed?: boolean };
    wednesday?: { open?: string; close?: string; isClosed?: boolean };
    thursday?: { open?: string; close?: string; isClosed?: boolean };
    friday?: { open?: string; close?: string; isClosed?: boolean };
    saturday?: { open?: string; close?: string; isClosed?: boolean };
    sunday?: { open?: string; close?: string; isClosed?: boolean };
    timezone?: string;
    is24x7?: boolean;
  };
  specialties?: string[];               // Vendor specialties
  websiteUrl?: string;                  // Website URL
  description?: string;                 // Vendor description
  logoUrl?: string;                     // Logo URL
  createdAt: Date;                      // Creation timestamp
  updatedAt: Date;                      // Last update timestamp
}
```

---

## 🛒 Equipment Rental & Sales Endpoints

### 1. Create Rental Request
**Endpoint:** `POST /equipment/rentals`  
**Authentication:** Required (Bearer token)  
**Roles:** All authenticated users

**Request Body (CreateRentalRequestDto):**
```typescript
interface CreateRentalRequestDto {
  equipmentId: string;                  // Required: Equipment ID (UUID)
  startDate: string;                    // Required: Rental start date (ISO date)
  endDate: string;                      // Required: Rental end date (ISO date)
  quantity: number;                     // Required: Quantity to rent (default: 1)
  deliveryAddress?: string;             // Optional: Delivery address
  pickupAddress?: string;               // Optional: Pickup address
  specialInstructions?: string;         // Optional: Special instructions
  contactPhone?: string;                // Optional: Contact phone
  contactEmail?: string;                // Optional: Contact email
  isUrgent?: boolean;                   // Optional: Is urgent request (default: false)
  requestedBy?: string;                 // Optional: Requested by user ID
}
```

**Example Request:**
```typescript
const createRentalRequest = async (rentalData: CreateRentalRequestDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/equipment/rentals', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      equipmentId: "550e8400-e29b-41d4-a716-446655440000",
      startDate: "2023-12-01",
      endDate: "2023-12-15",
      quantity: 1,
      deliveryAddress: "123 Medical Center, Healthcare City",
      specialInstructions: "Please deliver during business hours",
      contactPhone: "+1-555-0123",
      contactEmail: "user@example.com",
      isUrgent: false
    })
  });
  
  return await response.json();
};
```

### 2. Get Rental Requests
**Endpoint:** `GET /equipment/rentals`  
**Authentication:** Required (Bearer token)

**Query Parameters:**
```typescript
interface RentalFilters {
  page?: number;                        // Page number (default: 1)
  limit?: number;                       // Items per page (default: 20)
  status?: RentalStatus;                // Filter by status
  equipmentId?: string;                 // Filter by equipment ID
  requestedBy?: string;                 // Filter by requester ID
  startDate?: string;                   // Filter by start date
  endDate?: string;                     // Filter by end date
  isUrgent?: boolean;                   // Filter by urgent requests
}
```

**Example Request:**
```typescript
const getRentalRequests = async (filters: RentalFilters = {}) => {
  const token = localStorage.getItem('access_token');
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/equipment/rentals?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 3. Update Rental Request Status
**Endpoint:** `PATCH /equipment/rentals/:id/status`  
**Authentication:** Required (Bearer token)  
**Roles:** `equipment_vendor`, `equipment_manager`, `admin`

**Request Body:**
```typescript
{
  status: RentalStatus;                 // Required: New status
  notes?: string;                       // Optional: Status change notes
  approvedBy?: string;                  // Optional: Approved by user ID
  rejectionReason?: string;             // Optional: Rejection reason
}
```

**Example Request:**
```typescript
const updateRentalStatus = async (rentalId: string, status: RentalStatus, notes?: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/equipment/rentals/${rentalId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: "approved",
      notes: "Equipment available for requested dates",
      approvedBy: "admin-user-id"
    })
  });
  
  return await response.json();
};
```

### 4. Create Sales Order
**Endpoint:** `POST /equipment/sales`  
**Authentication:** Required (Bearer token)  
**Roles:** All authenticated users

**Request Body (CreateSalesOrderDto):**
```typescript
interface CreateSalesOrderDto {
  equipmentId: string;                  // Required: Equipment ID (UUID)
  quantity: number;                     // Required: Quantity to purchase (default: 1)
  deliveryAddress: string;              // Required: Delivery address
  billingAddress?: string;              // Optional: Billing address
  contactPhone?: string;                // Optional: Contact phone
  contactEmail?: string;                // Optional: Contact email
  specialInstructions?: string;         // Optional: Special instructions
  paymentMethod?: string;               // Optional: Payment method
  requestedBy?: string;                 // Optional: Requested by user ID
}
```

**Example Request:**
```typescript
const createSalesOrder = async (salesData: CreateSalesOrderDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/equipment/sales', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      equipmentId: "550e8400-e29b-41d4-a716-446655440000",
      quantity: 1,
      deliveryAddress: "123 Medical Center, Healthcare City",
      billingAddress: "123 Medical Center, Healthcare City",
      contactPhone: "+1-555-0123",
      contactEmail: "user@example.com",
      specialInstructions: "Please include installation service",
      paymentMethod: "credit_card"
    })
  });
  
  return await response.json();
};
```

---

## 🔧 Equipment Maintenance Endpoints

### 1. Create Maintenance Record
**Endpoint:** `POST /equipment/maintenance`  
**Authentication:** Required (Bearer token)  
**Roles:** `equipment_vendor`, `equipment_manager`, `admin`

**Request Body (CreateMaintenanceRecordDto):**
```typescript
interface CreateMaintenanceRecordDto {
  equipmentId: string;                  // Required: Equipment ID (UUID)
  maintenanceType: MaintenanceType;     // Required: Type of maintenance
  description: string;                  // Required: Maintenance description
  performedBy: string;                  // Required: Performed by user ID
  maintenanceDate: string;              // Required: Maintenance date (ISO date)
  nextMaintenanceDate?: string;         // Optional: Next maintenance date
  cost?: number;                        // Optional: Maintenance cost
  partsReplaced?: string[];             // Optional: Parts replaced
  notes?: string;                       // Optional: Additional notes
  attachments?: string[];               // Optional: Attachment URLs
  vendorId?: string;                    // Optional: Vendor ID if external
}
```

**Example Request:**
```typescript
const createMaintenanceRecord = async (maintenanceData: CreateMaintenanceRecordDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/equipment/maintenance', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      equipmentId: "550e8400-e29b-41d4-a716-446655440000",
      maintenanceType: "scheduled",
      description: "Routine maintenance and calibration",
      performedBy: "technician-user-id",
      maintenanceDate: "2023-12-01",
      nextMaintenanceDate: "2024-06-01",
      cost: 500.00,
      partsReplaced: ["Filter A", "Calibration Kit"],
      notes: "Equipment functioning optimally after maintenance",
      vendorId: "550e8400-e29b-41d4-a716-446655440002"
    })
  });
  
  return await response.json();
};
```

### 2. Get Maintenance Records
**Endpoint:** `GET /equipment/maintenance`  
**Authentication:** Required (Bearer token)

**Query Parameters:**
```typescript
interface MaintenanceFilters {
  page?: number;                        // Page number (default: 1)
  limit?: number;                       // Items per page (default: 20)
  equipmentId?: string;                 // Filter by equipment ID
  maintenanceType?: MaintenanceType;    // Filter by maintenance type
  performedBy?: string;                 // Filter by performer ID
  startDate?: string;                   // Filter by start date
  endDate?: string;                     // Filter by end date
  vendorId?: string;                    // Filter by vendor ID
}
```

**Example Request:**
```typescript
const getMaintenanceRecords = async (filters: MaintenanceFilters = {}) => {
  const token = localStorage.getItem('access_token');
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/equipment/maintenance?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 3. Get Maintenance Schedule
**Endpoint:** `GET /equipment/maintenance/schedule`  
**Authentication:** Required (Bearer token)

**Query Parameters:**
```typescript
{
  startDate?: string;                   // Start date filter (default: today)
  endDate?: string;                     // End date filter (default: +30 days)
  equipmentId?: string;                 // Filter by equipment ID
  centerId?: string;                    // Filter by center ID
}
```

**Example Request:**
```typescript
const getMaintenanceSchedule = async (startDate?: string, endDate?: string) => {
  const token = localStorage.getItem('access_token');
  const queryParams = new URLSearchParams();
  
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/equipment/maintenance/schedule?${queryParams}`, {
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

## 📊 Equipment Analytics Endpoints

### 1. Get Equipment Analytics
**Endpoint:** `GET /equipment/analytics`  
**Authentication:** Required (Bearer token)  
**Roles:** `equipment_manager`, `admin`

**Query Parameters:**
```typescript
{
  startDate?: string;                   // Start date filter
  endDate?: string;                     // End date filter
  centerId?: string;                    // Filter by center ID
  categoryId?: string;                  // Filter by category ID
  vendorId?: string;                    // Filter by vendor ID
  groupBy?: 'day' | 'week' | 'month' | 'year'; // Group by period
}
```

**Example Request:**
```typescript
const getEquipmentAnalytics = async (filters: {
  startDate?: string;
  endDate?: string;
  centerId?: string;
  groupBy?: 'day' | 'week' | 'month' | 'year';
} = {}) => {
  const token = localStorage.getItem('access_token');
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/equipment/analytics?${queryParams}`, {
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
  "data": {
    "overview": {
      "totalEquipment": 150,
      "availableEquipment": 120,
      "rentedEquipment": 25,
      "maintenanceEquipment": 5,
      "totalValue": 2500000.00,
      "monthlyRentalRevenue": 45000.00,
      "monthlySalesRevenue": 120000.00
    },
    "utilization": {
      "averageUtilizationRate": 0.75,
      "topPerformingEquipment": [
        {
          "equipmentId": "550e8400-e29b-41d4-a716-446655440000",
          "name": "Philips MX450 Ultrasound Machine",
          "utilizationRate": 0.95,
          "rentalCount": 28,
          "revenue": 15000.00
        }
      ],
      "underutilizedEquipment": [
        {
          "equipmentId": "550e8400-e29b-41d4-a716-446655440001",
          "name": "Siemens MRI Scanner",
          "utilizationRate": 0.25,
          "rentalCount": 3,
          "revenue": 5000.00
        }
      ]
    },
    "maintenance": {
      "totalMaintenanceCost": 15000.00,
      "averageMaintenanceCost": 100.00,
      "upcomingMaintenance": [
        {
          "equipmentId": "550e8400-e29b-41d4-a716-446655440000",
          "name": "Philips MX450 Ultrasound Machine",
          "nextMaintenanceDate": "2023-12-15",
          "maintenanceType": "scheduled",
          "estimatedCost": 500.00
        }
      ],
      "maintenanceByType": {
        "scheduled": 12,
        "emergency": 3,
        "repair": 8,
        "calibration": 15
      }
    },
    "revenue": {
      "totalRevenue": 165000.00,
      "rentalRevenue": 45000.00,
      "salesRevenue": 120000.00,
      "revenueByCategory": {
        "diagnostic": 80000.00,
        "surgical": 45000.00,
        "therapeutic": 40000.00
      },
      "revenueByVendor": {
        "550e8400-e29b-41d4-a716-446655440002": {
          "vendorName": "MedTech Solutions Inc.",
          "revenue": 75000.00,
          "equipmentCount": 25
        }
      }
    },
    "trends": {
      "rentalTrends": [
        { "date": "2023-11-01", "count": 15, "revenue": 7500.00 },
        { "date": "2023-11-02", "count": 18, "revenue": 9000.00 }
      ],
      "maintenanceTrends": [
        { "date": "2023-11-01", "count": 2, "cost": 1000.00 },
        { "date": "2023-11-02", "count": 1, "cost": 500.00 }
      ]
    }
  }
}
```

### 2. Get Equipment Performance Metrics
**Endpoint:** `GET /equipment/analytics/performance`  
**Authentication:** Required (Bearer token)  
**Roles:** `equipment_manager`, `admin`

**Example Request:**
```typescript
const getEquipmentPerformance = async (equipmentId?: string) => {
  const token = localStorage.getItem('access_token');
  const url = equipmentId 
    ? `https://api.unlimtedhealth.com/api/equipment/analytics/performance?equipmentId=${equipmentId}`
    : 'https://api.unlimtedhealth.com/api/equipment/analytics/performance';
  
  const response = await fetch(url, {
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

## 🏷️ Additional TypeScript Interfaces

### Rental & Sales Interfaces

```typescript
// Rental Status Enum
enum RentalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Maintenance Type Enum
enum MaintenanceType {
  SCHEDULED = 'scheduled',
  EMERGENCY = 'emergency',
  REPAIR = 'repair',
  CALIBRATION = 'calibration',
  INSPECTION = 'inspection',
  UPGRADE = 'upgrade'
}

// Rental Request Interface
interface RentalRequest {
  id: string;                           // UUID - Primary key
  equipmentId: string;                  // UUID - Equipment ID
  requestedBy: string;                  // UUID - Requested by user ID
  startDate: Date;                      // Rental start date
  endDate: Date;                        // Rental end date
  quantity: number;                     // Quantity to rent
  status: RentalStatus;                 // Rental status
  deliveryAddress?: string;             // Delivery address
  pickupAddress?: string;               // Pickup address
  specialInstructions?: string;         // Special instructions
  contactPhone?: string;                // Contact phone
  contactEmail?: string;                // Contact email
  isUrgent: boolean;                    // Is urgent request
  approvedBy?: string;                  // UUID - Approved by user ID
  approvedAt?: Date;                    // Approval date
  rejectionReason?: string;             // Rejection reason
  totalCost?: number;                   // Total rental cost
  createdAt: Date;                      // Creation timestamp
  updatedAt: Date;                      // Last update timestamp
}

// Sales Order Interface
interface SalesOrder {
  id: string;                           // UUID - Primary key
  equipmentId: string;                  // UUID - Equipment ID
  requestedBy: string;                  // UUID - Requested by user ID
  quantity: number;                     // Quantity to purchase
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  deliveryAddress: string;              // Delivery address
  billingAddress?: string;              // Billing address
  contactPhone?: string;                // Contact phone
  contactEmail?: string;                // Contact email
  specialInstructions?: string;         // Special instructions
  paymentMethod?: string;               // Payment method
  totalCost?: number;                   // Total purchase cost
  approvedBy?: string;                  // UUID - Approved by user ID
  approvedAt?: Date;                    // Approval date
  rejectionReason?: string;             // Rejection reason
  createdAt: Date;                      // Creation timestamp
  updatedAt: Date;                      // Last update timestamp
}

// Maintenance Record Interface
interface MaintenanceRecord {
  id: string;                           // UUID - Primary key
  equipmentId: string;                  // UUID - Equipment ID
  maintenanceType: MaintenanceType;     // Type of maintenance
  description: string;                  // Maintenance description
  performedBy: string;                  // UUID - Performed by user ID
  maintenanceDate: Date;                // Maintenance date
  nextMaintenanceDate?: Date;           // Next maintenance date
  cost?: number;                        // Maintenance cost
  partsReplaced?: string[];             // Parts replaced
  notes?: string;                       // Additional notes
  attachments?: string[];               // Attachment URLs
  vendorId?: string;                    // UUID - Vendor ID if external
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;                      // Creation timestamp
  updatedAt: Date;                      // Last update timestamp
}
```

---

## 🎨 Frontend Implementation Examples

### React Component Example

```typescript
import React, { useState, useEffect } from 'react';

interface EquipmentDashboardProps {
  centerId?: string;
}

const EquipmentDashboard: React.FC<EquipmentDashboardProps> = ({ centerId }) => {
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [vendors, setVendors] = useState<EquipmentVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<EquipmentFilters>({
    page: 1,
    limit: 20,
    centerId
  });

  useEffect(() => {
    loadEquipmentData();
  }, [filters]);

  const loadEquipmentData = async () => {
    try {
      setLoading(true);
      const [equipmentRes, categoriesRes, vendorsRes] = await Promise.all([
        getEquipmentItems(filters),
        getEquipmentCategories(),
        getEquipmentVendors()
      ]);
      
      setEquipment(equipmentRes.data);
      setCategories(categoriesRes.data);
      setVendors(vendorsRes.data);
    } catch (error) {
      console.error('Error loading equipment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<EquipmentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleRentalRequest = async (equipmentId: string) => {
    try {
      const rentalData = {
        equipmentId,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        quantity: 1,
        deliveryAddress: 'Default address',
        contactPhone: '+1-555-0123',
        contactEmail: 'user@example.com'
      };
      
      await createRentalRequest(rentalData);
      alert('Rental request submitted successfully!');
    } catch (error) {
      console.error('Error creating rental request:', error);
      alert('Failed to submit rental request');
    }
  };

  if (loading) {
    return <div className="loading">Loading equipment data...</div>;
  }

  return (
    <div className="equipment-dashboard">
      <h1>Health Equipment Dashboard</h1>
      
      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search equipment..."
          value={filters.search || ''}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
        />
        
        <select
          value={filters.category || ''}
          onChange={(e) => handleFilterChange({ category: e.target.value })}
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        
        <select
          value={filters.condition || ''}
          onChange={(e) => handleFilterChange({ condition: e.target.value as EquipmentCondition })}
        >
          <option value="">All Conditions</option>
          <option value="new">New</option>
          <option value="refurbished">Refurbished</option>
          <option value="used">Used</option>
        </select>
      </div>
      
      {/* Equipment Grid */}
      <div className="equipment-grid">
        {equipment.map(item => (
          <div key={item.id} className="equipment-card">
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            <p><strong>Manufacturer:</strong> {item.manufacturer}</p>
            <p><strong>Condition:</strong> {item.condition}</p>
            <p><strong>Status:</strong> {item.availabilityStatus}</p>
            
            {item.isRentable && (
              <p><strong>Daily Rental:</strong> ${item.rentalPriceDaily}</p>
            )}
            
            {item.isForSale && (
              <p><strong>Sale Price:</strong> ${item.salePrice}</p>
            )}
            
            <div className="equipment-actions">
              {item.isRentable && item.availabilityStatus === 'available' && (
                <button onClick={() => handleRentalRequest(item.id)}>
                  Request Rental
                </button>
              )}
              
              {item.isForSale && (
                <button onClick={() => {/* Handle purchase */}}>
                  Purchase
                </button>
              )}
              
              <button onClick={() => {/* View details */}}>
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EquipmentDashboard;
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
      "field": "name",
      "message": "Name is required"
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
  "message": "Insufficient permissions",
  "error": "Forbidden"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Equipment not found",
  "error": "Not Found"
}

// 409 Conflict
{
  "statusCode": 409,
  "message": "Equipment not available for requested dates",
  "error": "Conflict"
}

// 500 Internal Server Error
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## 📱 Mobile Responsiveness

### CSS Grid Layout Example

```css
.equipment-dashboard {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.filters input,
.filters select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  min-width: 200px;
}

.equipment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.equipment-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.equipment-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  flex-wrap: wrap;
}

.equipment-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.equipment-actions button:first-child {
  background: #007bff;
  color: white;
}

.equipment-actions button:last-child {
  background: #6c757d;
  color: white;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .filters {
    flex-direction: column;
  }
  
  .filters input,
  .filters select {
    min-width: 100%;
  }
  
  .equipment-grid {
    grid-template-columns: 1fr;
  }
  
  .equipment-actions {
    flex-direction: column;
  }
  
  .equipment-actions button {
    width: 100%;
  }
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
// services/equipmentApi.ts
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

export const equipmentApi = {
  // Equipment items
  getItems: (filters: EquipmentFilters) => apiClient.get('/equipment/items', { params: filters }),
  getItem: (id: string) => apiClient.get(`/equipment/items/${id}`),
  createItem: (data: CreateEquipmentItemDto) => apiClient.post('/equipment/items', data),
  updateItem: (id: string, data: UpdateEquipmentItemDto) => apiClient.patch(`/equipment/items/${id}`, data),
  deleteItem: (id: string) => apiClient.delete(`/equipment/items/${id}`),
  
  // Categories
  getCategories: () => apiClient.get('/equipment/categories'),
  getCategoryHierarchy: () => apiClient.get('/equipment/categories/hierarchy'),
  
  // Vendors
  getVendors: () => apiClient.get('/equipment/vendors'),
  getVendor: (id: string) => apiClient.get(`/equipment/vendors/${id}`),
  
  // Rentals
  createRental: (data: CreateRentalRequestDto) => apiClient.post('/equipment/rentals', data),
  getRentals: (filters: RentalFilters) => apiClient.get('/equipment/rentals', { params: filters }),
  updateRentalStatus: (id: string, status: RentalStatus, notes?: string) => 
    apiClient.patch(`/equipment/rentals/${id}/status`, { status, notes }),
  
  // Sales
  createSalesOrder: (data: CreateSalesOrderDto) => apiClient.post('/equipment/sales', data),
  
  // Maintenance
  createMaintenance: (data: CreateMaintenanceRecordDto) => apiClient.post('/equipment/maintenance', data),
  getMaintenance: (filters: MaintenanceFilters) => apiClient.get('/equipment/maintenance', { params: filters }),
  
  // Analytics
  getAnalytics: (filters: any) => apiClient.get('/equipment/analytics', { params: filters }),
  getPerformance: (equipmentId?: string) => 
    apiClient.get('/equipment/analytics/performance', { 
      params: equipmentId ? { equipmentId } : {} 
    }),
};
```

### 3. Environment Configuration

```typescript
// config/environment.ts
export const environment = {
  production: false,
  apiUrl: 'https://api.unlimtedhealth.com/api',
  appName: 'Health Equipment Dashboard',
  version: '1.0.0'
};
```

---

## 📋 Summary

This comprehensive Health Equipment Dashboard guide provides:

✅ **Complete API Documentation** - All endpoints with request/response examples  
✅ **TypeScript Interfaces** - Full type definitions for all data structures  
✅ **Frontend Implementation** - React components and styling examples  
✅ **Error Handling** - Comprehensive error response documentation  
✅ **Mobile Responsiveness** - CSS grid layouts for all screen sizes  
✅ **Authentication** - JWT token handling and role-based access  
✅ **Real-world Examples** - Practical implementation patterns  

The dashboard supports:
- Equipment discovery and search
- Rental and sales management
- Maintenance tracking
- Analytics and reporting
- Multi-role access control
- Mobile-responsive design

**Base URL:** `https://api.unlimtedhealth.com/api`  
**Authentication:** Bearer token required for all endpoints  
**Documentation:** Swagger/OpenAPI available at `/api/docs`UID - Primary key
  companyName: string;                  // Company name
  contactPerson?: string;               // Contact person name
  email?: string;                       // Contact email
  phone?: string;                       // Contact phone
  address?: string;                     // Business address
  businessLicense?: string;             // Business license number
  taxId?: string;                       // Tax ID
  verificationStatus: 'pending' | 'verified' | 'rejected'; // Verification status
  verificationDate?: Date;              // Verification date
  verifiedBy?: string;                  // UUID - Verified by user ID
  ratingAverage?: number;               // Average rating
  totalRatings?: number;                // Total number of ratings
  isActive: boolean;                    // Is active
  businessHours?: {                     // Business hours
    monday?: { open?: string; close?: string; isClosed?: boolean };
    tuesday?: { open?: string; close?: string; isClosed?: boolean };
    wednesday?: { open?: string; close?: string; isClosed?: boolean };
    thursday?: { open?: string; close?: string; isClosed?: boolean };
    friday?: { open?: string; close?: string; isClosed?: boolean };
    saturday?: { open?: string; close?: string; isClosed?: boolean };
    sunday?: { open?: string; close?: string; isClosed?: boolean };
    timezone?: string;
    is24x7?: boolean;
  };
  specialties?: string[];               // Vendor specialties
  websiteUrl?: string;                  // Website URL
  description?: string;                 // Vendor description
  logoUrl?: string;                     // Logo URL
  createdAt: Date;                      // Creation timestamp
  updatedAt: Date;                      // Last update timestamp
}
```

---

## 🛒 Equipment Rental & Sales Endpoints

### 1. Create Rental Request
**Endpoint:** `POST /equipment/rentals`  
**Authentication:** Required (Bearer token)  
**Roles:** All authenticated users

**Request Body (CreateRentalRequestDto):**
```typescript
interface CreateRentalRequestDto {
  equipmentId: string;                  // Required: Equipment ID (UUID)
  startDate: string;                    // Required: Rental start date (ISO date)
  endDate: string;                      // Required: Rental end date (ISO date)
  quantity: number;                     // Required: Quantity to rent (default: 1)
  deliveryAddress?: string;             // Optional: Delivery address
  pickupAddress?: string;               // Optional: Pickup address
  specialInstructions?: string;         // Optional: Special instructions
  contactPhone?: string;                // Optional: Contact phone
  contactEmail?: string;                // Optional: Contact email
  isUrgent?: boolean;                   // Optional: Is urgent request (default: false)
  requestedBy?: string;                 // Optional: Requested by user ID
}
```

**Example Request:**
```typescript
const createRentalRequest = async (rentalData: CreateRentalRequestDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/equipment/rentals', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      equipmentId: "550e8400-e29b-41d4-a716-446655440000",
      startDate: "2023-12-01",
      endDate: "2023-12-15",
      quantity: 1,
      deliveryAddress: "123 Medical Center, Healthcare City",
      specialInstructions: "Please deliver during business hours",
      contactPhone: "+1-555-0123",
      contactEmail: "user@example.com",
      isUrgent: false
    })
  });
  
  return await response.json();
};
```

### 2. Get Rental Requests
**Endpoint:** `GET /equipment/rentals`  
**Authentication:** Required (Bearer token)

**Query Parameters:**
```typescript
interface RentalFilters {
  page?: number;                        // Page number (default: 1)
  limit?: number;                       // Items per page (default: 20)
  status?: RentalStatus;                // Filter by status
  equipmentId?: string;                 // Filter by equipment ID
  requestedBy?: string;                 // Filter by requester ID
  startDate?: string;                   // Filter by start date
  endDate?: string;                     // Filter by end date
  isUrgent?: boolean;                   // Filter by urgent requests
}
```

**Example Request:**
```typescript
const getRentalRequests = async (filters: RentalFilters = {}) => {
  const token = localStorage.getItem('access_token');
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/equipment/rentals?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 3. Update Rental Request Status
**Endpoint:** `PATCH /equipment/rentals/:id/status`  
**Authentication:** Required (Bearer token)  
**Roles:** `equipment_vendor`, `equipment_manager`, `admin`

**Request Body:**
```typescript
{
  status: RentalStatus;                 // Required: New status
  notes?: string;                       // Optional: Status change notes
  approvedBy?: string;                  // Optional: Approved by user ID
  rejectionReason?: string;             // Optional: Rejection reason
}
```

**Example Request:**
```typescript
const updateRentalStatus = async (rentalId: string, status: RentalStatus, notes?: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/equipment/rentals/${rentalId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: "approved",
      notes: "Equipment available for requested dates",
      approvedBy: "admin-user-id"
    })
  });
  
  return await response.json();
};
```

### 4. Create Sales Order
**Endpoint:** `POST /equipment/sales`  
**Authentication:** Required (Bearer token)  
**Roles:** All authenticated users

**Request Body (CreateSalesOrderDto):**
```typescript
interface CreateSalesOrderDto {
  equipmentId: string;                  // Required: Equipment ID (UUID)
  quantity: number;                     // Required: Quantity to purchase (default: 1)
  deliveryAddress: string;              // Required: Delivery address
  billingAddress?: string;              // Optional: Billing address
  contactPhone?: string;                // Optional: Contact phone
  contactEmail?: string;                // Optional: Contact email
  specialInstructions?: string;         // Optional: Special instructions
  paymentMethod?: string;               // Optional: Payment method
  requestedBy?: string;                 // Optional: Requested by user ID
}
```

**Example Request:**
```typescript
const createSalesOrder = async (salesData: CreateSalesOrderDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/equipment/sales', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      equipmentId: "550e8400-e29b-41d4-a716-446655440000",
      quantity: 1,
      deliveryAddress: "123 Medical Center, Healthcare City",
      billingAddress: "123 Medical Center, Healthcare City",
      contactPhone: "+1-555-0123",
      contactEmail: "user@example.com",
      specialInstructions: "Please include installation service",
      paymentMethod: "credit_card"
    })
  });
  
  return await response.json();
};
```

---

## 🔧 Equipment Maintenance Endpoints

### 1. Create Maintenance Record
**Endpoint:** `POST /equipment/maintenance`  
**Authentication:** Required (Bearer token)  
**Roles:** `equipment_vendor`, `equipment_manager`, `admin`

**Request Body (CreateMaintenanceRecordDto):**
```typescript
interface CreateMaintenanceRecordDto {
  equipmentId: string;                  // Required: Equipment ID (UUID)
  maintenanceType: MaintenanceType;     // Required: Type of maintenance
  description: string;                  // Required: Maintenance description
  performedBy: string;                  // Required: Performed by user ID
  maintenanceDate: string;              // Required: Maintenance date (ISO date)
  nextMaintenanceDate?: string;         // Optional: Next maintenance date
  cost?: number;                        // Optional: Maintenance cost
  partsReplaced?: string[];             // Optional: Parts replaced
  notes?: string;                       // Optional: Additional notes
  attachments?: string[];               // Optional: Attachment URLs
  vendorId?: string;                    // Optional: Vendor ID if external
}
```

**Example Request:**
```typescript
const createMaintenanceRecord = async (maintenanceData: CreateMaintenanceRecordDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/equipment/maintenance', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      equipmentId: "550e8400-e29b-41d4-a716-446655440000",
      maintenanceType: "scheduled",
      description: "Routine maintenance and calibration",
      performedBy: "technician-user-id",
      maintenanceDate: "2023-12-01",
      nextMaintenanceDate: "2024-06-01",
      cost: 500.00,
      partsReplaced: ["Filter A", "Calibration Kit"],
      notes: "Equipment functioning optimally after maintenance",
      vendorId: "550e8400-e29b-41d4-a716-446655440002"
    })
  });
  
  return await response.json();
};
```

### 2. Get Maintenance Records
**Endpoint:** `GET /equipment/maintenance`  
**Authentication:** Required (Bearer token)

**Query Parameters:**
```typescript
interface MaintenanceFilters {
  page?: number;                        // Page number (default: 1)
  limit?: number;                       // Items per page (default: 20)
  equipmentId?: string;                 // Filter by equipment ID
  maintenanceType?: MaintenanceType;    // Filter by maintenance type
  performedBy?: string;                 // Filter by performer ID
  startDate?: string;                   // Filter by start date
  endDate?: string;                     // Filter by end date
  vendorId?: string;                    // Filter by vendor ID
}
```

**Example Request:**
```typescript
const getMaintenanceRecords = async (filters: MaintenanceFilters = {}) => {
  const token = localStorage.getItem('access_token');
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/equipment/maintenance?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 3. Get Maintenance Schedule
**Endpoint:** `GET /equipment/maintenance/schedule`  
**Authentication:** Required (Bearer token)

**Query Parameters:**
```typescript
{
  startDate?: string;                   // Start date filter (default: today)
  endDate?: string;                     // End date filter (default: +30 days)
  equipmentId?: string;                 // Filter by equipment ID
  centerId?: string;                    // Filter by center ID
}
```

**Example Request:**
```typescript
const getMaintenanceSchedule = async (startDate?: string, endDate?: string) => {
  const token = localStorage.getItem('access_token');
  const queryParams = new URLSearchParams();
  
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/equipment/maintenance/schedule?${queryParams}`, {
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

## 📊 Equipment Analytics Endpoints

### 1. Get Equipment Analytics
**Endpoint:** `GET /equipment/analytics`  
**Authentication:** Required (Bearer token)  
**Roles:** `equipment_manager`, `admin`

**Query Parameters:**
```typescript
{
  startDate?: string;                   // Start date filter
  endDate?: string;                     // End date filter
  centerId?: string;                    // Filter by center ID
  categoryId?: string;                  // Filter by category ID
  vendorId?: string;                    // Filter by vendor ID
  groupBy?: 'day' | 'week' | 'month' | 'year'; // Group by period
}
```

**Example Request:**
```typescript
const getEquipmentAnalytics = async (filters: {
  startDate?: string;
  endDate?: string;
  centerId?: string;
  groupBy?: 'day' | 'week' | 'month' | 'year';
} = {}) => {
  const token = localStorage.getItem('access_token');
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/equipment/analytics?${queryParams}`, {
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
  "data": {
    "overview": {
      "totalEquipment": 150,
      "availableEquipment": 120,
      "rentedEquipment": 25,
      "maintenanceEquipment": 5,
      "totalValue": 2500000.00,
      "monthlyRentalRevenue": 45000.00,
      "monthlySalesRevenue": 120000.00
    },
    "utilization": {
      "averageUtilizationRate": 0.75,
      "topPerformingEquipment": [
        {
          "equipmentId": "550e8400-e29b-41d4-a716-446655440000",
          "name": "Philips MX450 Ultrasound Machine",
          "utilizationRate": 0.95,
          "rentalCount": 28,
          "revenue": 15000.00
        }
      ],
      "underutilizedEquipment": [
        {
          "equipmentId": "550e8400-e29b-41d4-a716-446655440001",
          "name": "Siemens MRI Scanner",
          "utilizationRate": 0.25,
          "rentalCount": 3,
          "revenue": 5000.00
        }
      ]
    },
    "maintenance": {
      "totalMaintenanceCost": 15000.00,
      "averageMaintenanceCost": 100.00,
      "upcomingMaintenance": [
        {
          "equipmentId": "550e8400-e29b-41d4-a716-446655440000",
          "name": "Philips MX450 Ultrasound Machine",
          "nextMaintenanceDate": "2023-12-15",
          "maintenanceType": "scheduled",
          "estimatedCost": 500.00
        }
      ],
      "maintenanceByType": {
        "scheduled": 12,
        "emergency": 3,
        "repair": 8,
        "calibration": 15
      }
    },
    "revenue": {
      "totalRevenue": 165000.00,
      "rentalRevenue": 45000.00,
      "salesRevenue": 120000.00,
      "revenueByCategory": {
        "diagnostic": 80000.00,
        "surgical": 45000.00,
        "therapeutic": 40000.00
      },
      "revenueByVendor": {
        "550e8400-e29b-41d4-a716-446655440002": {
          "vendorName": "MedTech Solutions Inc.",
          "revenue": 75000.00,
          "equipmentCount": 25
        }
      }
    },
    "trends": {
      "rentalTrends": [
        { "date": "2023-11-01", "count": 15, "revenue": 7500.00 },
        { "date": "2023-11-02", "count": 18, "revenue": 9000.00 }
      ],
      "maintenanceTrends": [
        { "date": "2023-11-01", "count": 2, "cost": 1000.00 },
        { "date": "2023-11-02", "count": 1, "cost": 500.00 }
      ]
    }
  }
}
```

### 2. Get Equipment Performance Metrics
**Endpoint:** `GET /equipment/analytics/performance`  
**Authentication:** Required (Bearer token)  
**Roles:** `equipment_manager`, `admin`

**Example Request:**
```typescript
const getEquipmentPerformance = async (equipmentId?: string) => {
  const token = localStorage.getItem('access_token');
  const url = equipmentId 
    ? `https://api.unlimtedhealth.com/api/equipment/analytics/performance?equipmentId=${equipmentId}`
    : 'https://api.unlimtedhealth.com/api/equipment/analytics/performance';
  
  const response = await fetch(url, {
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

## 🏷️ Additional TypeScript Interfaces

### Rental & Sales Interfaces

```typescript
// Rental Status Enum
enum RentalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Maintenance Type Enum
enum MaintenanceType {
  SCHEDULED = 'scheduled',
  EMERGENCY = 'emergency',
  REPAIR = 'repair',
  CALIBRATION = 'calibration',
  INSPECTION = 'inspection',
  UPGRADE = 'upgrade'
}

// Rental Request Interface
interface RentalRequest {
  id: string;                           // UUID - Primary key
  equipmentId: string;                  // UUID - Equipment ID
  requestedBy: string;                  // UUID - Requested by user ID
  startDate: Date;                      // Rental start date
  endDate: Date;                        // Rental end date
  quantity: number;                     // Quantity to rent
  status: RentalStatus;                 // Rental status
  deliveryAddress?: string;             // Delivery address
  pickupAddress?: string;               // Pickup address
  specialInstructions?: string;         // Special instructions
  contactPhone?: string;                // Contact phone
  contactEmail?: string;                // Contact email
  isUrgent: boolean;                    // Is urgent request
  approvedBy?: string;                  // UUID - Approved by user ID
  approvedAt?: Date;                    // Approval date
  rejectionReason?: string;             // Rejection reason
  totalCost?: number;                   // Total rental cost
  createdAt: Date;                      // Creation timestamp
  updatedAt: Date;                      // Last update timestamp
}

// Sales Order Interface
interface SalesOrder {
  id: string;                           // UUID - Primary key
  equipmentId: string;                  // UUID - Equipment ID
  requestedBy: string;                  // UUID - Requested by user ID
  quantity: number;                     // Quantity to purchase
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  deliveryAddress: string;              // Delivery address
  billingAddress?: string;              // Billing address
  contactPhone?: string;                // Contact phone
  contactEmail?: string;                // Contact email
  specialInstructions?: string;         // Special instructions
  paymentMethod?: string;               // Payment method
  totalCost?: number;                   // Total purchase cost
  approvedBy?: string;                  // UUID - Approved by user ID
  approvedAt?: Date;                    // Approval date
  rejectionReason?: string;             // Rejection reason
  createdAt: Date;                      // Creation timestamp
  updatedAt: Date;                      // Last update timestamp
}

// Maintenance Record Interface
interface MaintenanceRecord {
  id: string;                           // UUID - Primary key
  equipmentId: string;                  // UUID - Equipment ID
  maintenanceType: MaintenanceType;     // Type of maintenance
  description: string;                  // Maintenance description
  performedBy: string;                  // UUID - Performed by user ID
  maintenanceDate: Date;                // Maintenance date
  nextMaintenanceDate?: Date;           // Next maintenance date
  cost?: number;                        // Maintenance cost
  partsReplaced?: string[];             // Parts replaced
  notes?: string;                       // Additional notes
  attachments?: string[];               // Attachment URLs
  vendorId?: string;                    // UUID - Vendor ID if external
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;                      // Creation timestamp
  updatedAt: Date;                      // Last update timestamp
}
```

---

## 🎨 Frontend Implementation Examples

### React Component Example

```typescript
import React, { useState, useEffect } from 'react';

interface EquipmentDashboardProps {
  centerId?: string;
}

const EquipmentDashboard: React.FC<EquipmentDashboardProps> = ({ centerId }) => {
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [vendors, setVendors] = useState<EquipmentVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<EquipmentFilters>({
    page: 1,
    limit: 20,
    centerId
  });

  useEffect(() => {
    loadEquipmentData();
  }, [filters]);

  const loadEquipmentData = async () => {
    try {
      setLoading(true);
      const [equipmentRes, categoriesRes, vendorsRes] = await Promise.all([
        getEquipmentItems(filters),
        getEquipmentCategories(),
        getEquipmentVendors()
      ]);
      
      setEquipment(equipmentRes.data);
      setCategories(categoriesRes.data);
      setVendors(vendorsRes.data);
    } catch (error) {
      console.error('Error loading equipment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<EquipmentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleRentalRequest = async (equipmentId: string) => {
    try {
      const rentalData = {
        equipmentId,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        quantity: 1,
        deliveryAddress: 'Default address',
        contactPhone: '+1-555-0123',
        contactEmail: 'user@example.com'
      };
      
      await createRentalRequest(rentalData);
      alert('Rental request submitted successfully!');
    } catch (error) {
      console.error('Error creating rental request:', error);
      alert('Failed to submit rental request');
    }
  };

  if (loading) {
    return <div className="loading">Loading equipment data...</div>;
  }

  return (
    <div className="equipment-dashboard">
      <h1>Health Equipment Dashboard</h1>
      
      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search equipment..."
          value={filters.search || ''}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
        />
        
        <select
          value={filters.category || ''}
          onChange={(e) => handleFilterChange({ category: e.target.value })}
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        
        <select
          value={filters.condition || ''}
          onChange={(e) => handleFilterChange({ condition: e.target.value as EquipmentCondition })}
        >
          <option value="">All Conditions</option>
          <option value="new">New</option>
          <option value="refurbished">Refurbished</option>
          <option value="used">Used</option>
        </select>
      </div>
      
      {/* Equipment Grid */}
      <div className="equipment-grid">
        {equipment.map(item => (
          <div key={item.id} className="equipment-card">
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            <p><strong>Manufacturer:</strong> {item.manufacturer}</p>
            <p><strong>Condition:</strong> {item.condition}</p>
            <p><strong>Status:</strong> {item.availabilityStatus}</p>
            
            {item.isRentable && (
              <p><strong>Daily Rental:</strong> ${item.rentalPriceDaily}</p>
            )}
            
            {item.isForSale && (
              <p><strong>Sale Price:</strong> ${item.salePrice}</p>
            )}
            
            <div className="equipment-actions">
              {item.isRentable && item.availabilityStatus === 'available' && (
                <button onClick={() => handleRentalRequest(item.id)}>
                  Request Rental
                </button>
              )}
              
              {item.isForSale && (
                <button onClick={() => {/* Handle purchase */}}>
                  Purchase
                </button>
              )}
              
              <button onClick={() => {/* View details */}}>
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EquipmentDashboard;
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
      "field": "name",
      "message": "Name is required"
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
  "message": "Insufficient permissions",
  "error": "Forbidden"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Equipment not found",
  "error": "Not Found"
}

// 409 Conflict
{
  "statusCode": 409,
  "message": "Equipment not available for requested dates",
  "error": "Conflict"
}

// 500 Internal Server Error
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## 📱 Mobile Responsiveness

### CSS Grid Layout Example

```css
.equipment-dashboard {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.filters input,
.filters select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  min-width: 200px;
}

.equipment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.equipment-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.equipment-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  flex-wrap: wrap;
}

.equipment-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.equipment-actions button:first-child {
  background: #007bff;
  color: white;
}

.equipment-actions button:last-child {
  background: #6c757d;
  color: white;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .filters {
    flex-direction: column;
  }
  
  .filters input,
  .filters select {
    min-width: 100%;
  }
  
  .equipment-grid {
    grid-template-columns: 1fr;
  }
  
  .equipment-actions {
    flex-direction: column;
  }
  
  .equipment-actions button {
    width: 100%;
  }
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
// services/equipmentApi.ts
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

export const equipmentApi = {
  // Equipment items
  getItems: (filters: EquipmentFilters) => apiClient.get('/equipment/items', { params: filters }),
  getItem: (id: string) => apiClient.get(`/equipment/items/${id}`),
  createItem: (data: CreateEquipmentItemDto) => apiClient.post('/equipment/items', data),
  updateItem: (id: string, data: UpdateEquipmentItemDto) => apiClient.patch(`/equipment/items/${id}`, data),
  deleteItem: (id: string) => apiClient.delete(`/equipment/items/${id}`),
  
  // Categories
  getCategories: () => apiClient.get('/equipment/categories'),
  getCategoryHierarchy: () => apiClient.get('/equipment/categories/hierarchy'),
  
  // Vendors
  getVendors: () => apiClient.get('/equipment/vendors'),
  getVendor: (id: string) => apiClient.get(`/equipment/vendors/${id}`),
  
  // Rentals
  createRental: (data: CreateRentalRequestDto) => apiClient.post('/equipment/rentals', data),
  getRentals: (filters: RentalFilters) => apiClient.get('/equipment/rentals', { params: filters }),
  updateRentalStatus: (id: string, status: RentalStatus, notes?: string) => 
    apiClient.patch(`/equipment/rentals/${id}/status`, { status, notes }),
  
  // Sales
  createSalesOrder: (data: CreateSalesOrderDto) => apiClient.post('/equipment/sales', data),
  
  // Maintenance
  createMaintenance: (data: CreateMaintenanceRecordDto) => apiClient.post('/equipment/maintenance', data),
  getMaintenance: (filters: MaintenanceFilters) => apiClient.get('/equipment/maintenance', { params: filters }),
  
  // Analytics
  getAnalytics: (filters: any) => apiClient.get('/equipment/analytics', { params: filters }),
  getPerformance: (equipmentId?: string) => 
    apiClient.get('/equipment/analytics/performance', { 
      params: equipmentId ? { equipmentId } : {} 
    }),
};
```

### 3. Environment Configuration

```typescript
// config/environment.ts
export const environment = {
  production: false,
  apiUrl: 'https://api.unlimtedhealth.com/api',
  appName: 'Health Equipment Dash