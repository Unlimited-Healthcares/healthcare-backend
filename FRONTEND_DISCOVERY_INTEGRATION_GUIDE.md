# 🚀 Frontend Discovery System Integration Guide

## 📋 Overview

This guide provides comprehensive instructions for integrating the new **Discovery & Matching System** APIs into your existing healthcare dashboard. The system enables users to discover, connect, and collaborate with healthcare professionals and centers.

**Base URL:** `https://api.unlimtedhealth.com/api`

---

## 🎯 Integration Strategy

### **Reuse Existing Components** ✅
- **Notification Center**: Already built - extend for discovery requests
- **Profile System**: Already built - enhance with new fields
- **Appointment System**: Already built - integrate with discovery workflow
- **User Management**: Already built - extend with search capabilities

### **New Components to Build** 🆕
- **Discovery Search Interface**
- **Request Management Dashboard**
- **Enhanced Profile Editor**
- **Invitation System UI**

---

## 🔧 Phase 1: Discovery Search Interface

### Identifiers & Resolution (New)

- Search results now include both identifiers when available:
  - `id`: UUID (always present)
  - `publicId`: Human-readable ID (optional)
- Endpoints that accept `{userId}` will accept either UUID or `publicId`.
- Dedicated resolver endpoint: `GET /users/resolve/{publicId}` returns the UUID.

Example search response user:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "publicId": "DR919768304",
  "displayName": "Dr. John Smith"
}
```

### **1.1 Search Page Component**

Create a new search page that integrates with your existing dashboard navigation:

```typescript
// components/discovery/SearchPage.tsx
import React, { useState, useEffect } from 'react';
import { SearchFilters, SearchResults, UserCard } from './components';

interface SearchPageProps {
  userRole: 'patient' | 'doctor' | 'center';
}

export const SearchPage: React.FC<SearchPageProps> = ({ userRole }) => {
  const [searchParams, setSearchParams] = useState({
    type: 'doctor',
    specialty: '',
    location: '',
    radius: 50,
    page: 1,
    limit: 20
  });
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async (params: SearchParams) => {
    setLoading(true);
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`/api/users/search?${queryString}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setResults(data.users || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchCenters = async (params: SearchParams) => {
    setLoading(true);
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`/api/centers/search?${queryString}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setResults(data.centers || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-page">
      <div className="search-header">
        <h1>Discover Healthcare Professionals</h1>
        <p>Find and connect with doctors, specialists, and healthcare centers</p>
      </div>

      <SearchFilters
        params={searchParams}
        onChange={setSearchParams}
        onSearch={() => searchParams.type === 'center' ? searchCenters(searchParams) : searchUsers(searchParams)}
        userRole={userRole}
      />

      <SearchResults
        results={results}
        loading={loading}
        onRequest={(user) => openRequestModal(user)}
        onViewProfile={(userId) => viewProfile(userId)}
      />
    </div>
  );
};
```

### **1.2 Search Filters Component**

```typescript
// components/discovery/SearchFilters.tsx
import React from 'react';

interface SearchFiltersProps {
  params: SearchParams;
  onChange: (params: SearchParams) => void;
  onSearch: () => void;
  userRole: string;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  params, onChange, onSearch, userRole
}) => {
  const specialties = [
    'Cardiology', 'Dermatology', 'Neurology', 'Orthopedics',
    'Pediatrics', 'Psychiatry', 'Radiology', 'Surgery'
  ];

  const centerTypes = [
    'Hospital', 'Clinic', 'Eye Clinic', 'Maternity Center',
    'Emergency Center', 'Rehabilitation Center'
  ];

  return (
    <div className="search-filters">
      <div className="filter-row">
        <div className="filter-group">
          <label>Search Type</label>
          <select
            value={params.type}
            onChange={(e) => onChange({...params, type: e.target.value})}
          >
            <option value="doctor">Doctors</option>
            <option value="center">Healthcare Centers</option>
            <option value="practitioner">Practitioners</option>
          </select>
        </div>

        {params.type === 'doctor' && (
          <div className="filter-group">
            <label>Specialty</label>
            <select
              value={params.specialty}
              onChange={(e) => onChange({...params, specialty: e.target.value})}
            >
              <option value="">All Specialties</option>
              {specialties.map(spec => (
                <option key={spec} value={spec.toLowerCase()}>{spec}</option>
              ))}
            </select>
          </div>
        )}

        {params.type === 'center' && (
          <div className="filter-group">
            <label>Center Type</label>
            <select
              value={params.centerType}
              onChange={(e) => onChange({...params, centerType: e.target.value})}
            >
              <option value="">All Types</option>
              {centerTypes.map(type => (
                <option key={type} value={type.toLowerCase()}>{type}</option>
              ))}
            </select>
          </div>
        )}

        <div className="filter-group">
          <label>Location</label>
          <input
            type="text"
            placeholder="City, State or ZIP"
            value={params.location}
            onChange={(e) => onChange({...params, location: e.target.value})}
          />
        </div>

        <div className="filter-group">
          <label>Radius (miles)</label>
          <select
            value={params.radius}
            onChange={(e) => onChange({...params, radius: parseInt(e.target.value)})}
          >
            <option value={10}>10 miles</option>
            <option value={25}>25 miles</option>
            <option value={50}>50 miles</option>
            <option value={100}>100 miles</option>
          </select>
        </div>
      </div>

      <div className="search-actions">
        <button onClick={onSearch} className="search-btn">
          Search
        </button>
        <button onClick={() => onChange({...params, specialty: '', location: '', radius: 50})} className="clear-btn">
          Clear Filters
        </button>
      </div>
    </div>
  );
};
```

### **1.3 User Card Component**

```typescript
// components/discovery/UserCard.tsx
import React from 'react';

interface UserCardProps {
  user: User;
  onRequest: (user: User) => void;
  onViewProfile: (userId: string) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onRequest, onViewProfile }) => {
  return (
    <div className="user-card">
      <div className="user-avatar">
        <img src={user.avatar || '/default-avatar.png'} alt={user.name} />
      </div>
      
      <div className="user-info">
        <h3>{user.name}</h3>
        {user.specialty && <span className="specialty">{user.specialty}</span>}
        {user.location && <p className="location">{user.location}</p>}
        {user.experience && <p className="experience">{user.experience} years experience</p>}
        {user.rating && (
          <div className="rating">
            <span>⭐ {user.rating}</span>
            <span>({user.reviewCount} reviews)</span>
          </div>
        )}
      </div>

      <div className="user-actions">
        <button 
          onClick={() => onRequest(user)}
          className="request-btn"
        >
          Send Request
        </button>
        <button 
          onClick={() => onViewProfile(user.id)}
          className="profile-btn"
        >
          View Profile
        </button>
      </div>
    </div>
  );
};
```

---

## 🔧 Phase 2: Request Management System

### **2.1 Request Dashboard Component**

Integrate with your existing notification system:

```typescript
// components/requests/RequestDashboard.tsx
import React, { useState, useEffect } from 'react';

export const RequestDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('received');
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [activeTab]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'received' ? 'received' : 'sent';
      const response = await fetch(`/api/requests/${endpoint}?status=pending&page=1&limit=20`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (activeTab === 'received') {
        setReceivedRequests(data.requests || []);
      } else {
        setSentRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'approve' | 'reject', message?: string) => {
    try {
      const response = await fetch(`/api/requests/${requestId}/respond`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, message })
      });

      if (response.ok) {
        loadRequests(); // Refresh the list
        // Show success notification
      }
    } catch (error) {
      console.error('Failed to respond to request:', error);
    }
  };

  return (
    <div className="request-dashboard">
      <div className="dashboard-header">
        <h1>Connection Requests</h1>
        <div className="request-tabs">
          <button 
            className={activeTab === 'received' ? 'active' : ''}
            onClick={() => setActiveTab('received')}
          >
            Received ({receivedRequests.length})
          </button>
          <button 
            className={activeTab === 'sent' ? 'active' : ''}
            onClick={() => setActiveTab('sent')}
          >
            Sent ({sentRequests.length})
          </button>
        </div>
      </div>

      <div className="request-content">
        {activeTab === 'received' ? (
          <RequestList
            requests={receivedRequests}
            loading={loading}
            onApprove={(id, message) => handleRequestAction(id, 'approve', message)}
            onReject={(id, message) => handleRequestAction(id, 'reject', message)}
            showActions={true}
          />
        ) : (
          <RequestList
            requests={sentRequests}
            loading={loading}
            onCancel={(id) => handleCancelRequest(id)}
            showActions={false}
          />
        )}
      </div>
    </div>
  );
};
```

### **2.2 Request Modal Component**

```typescript
// components/requests/RequestModal.tsx
import React, { useState } from 'react';

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: User;
  onSend: (requestData: RequestData) => void;
}

export const RequestModal: React.FC<RequestModalProps> = ({
  isOpen, onClose, recipient, onSend
}) => {
  const [requestType, setRequestType] = useState('connection');
  const [message, setMessage] = useState('');
  const [metadata, setMetadata] = useState({});

  const requestTypes = [
    { value: 'connection', label: 'Professional Connection' },
    { value: 'collaboration', label: 'Collaboration Request' },
    { value: 'patient_request', label: 'Patient Request' },
    { value: 'job_application', label: 'Job Application' },
    { value: 'staff_invitation', label: 'Staff Invitation' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const requestData = {
      recipientId: recipient.id,
      requestType,
      message,
      metadata
    };

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        onSend(requestData);
        onClose();
        // Show success notification
      }
    } catch (error) {
      console.error('Failed to send request:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="request-modal">
        <div className="modal-header">
          <h2>Send Request to {recipient.name}</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <form onSubmit={handleSubmit} className="request-form">
          <div className="form-group">
            <label>Request Type</label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              required
            >
              {requestTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message..."
              rows={4}
              required
            />
          </div>

          {requestType === 'patient_request' && (
            <div className="form-group">
              <label>Medical Condition</label>
              <input
                type="text"
                placeholder="Describe your condition"
                onChange={(e) => setMetadata({...metadata, medicalCondition: e.target.value})}
              />
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="send-btn">
              Send Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

---

## 🔧 Phase 3: Enhanced Profile System

### **3.1 Profile Editor Enhancement**

Extend your existing profile editor with new fields:

```typescript
// components/profile/EnhancedProfileEditor.tsx
import React, { useState, useEffect } from 'react';

export const EnhancedProfileEditor: React.FC = () => {
  const [profile, setProfile] = useState({
    // Existing fields
    name: '',
    email: '',
    phone: '',
    
    // New discovery fields
    specialization: '',
    qualifications: [],
    experience: '',
    location: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
      coordinates: { lat: 0, lng: 0 }
    },
    availability: {
      schedule: {},
      timezone: 'UTC'
    },
    privacySettings: {
      profileVisibility: 'public',
      dataSharing: {
        allowPatientRequests: true,
        allowCenterInvitations: true,
        allowCollaboration: true
      }
    }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      });

      if (response.ok) {
        // Show success notification
        console.log('Profile updated successfully');
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="enhanced-profile-editor">
      <div className="profile-section">
        <h3>Professional Information</h3>
        
        <div className="form-group">
          <label>Specialization</label>
          <select
            value={profile.specialization}
            onChange={(e) => setProfile({...profile, specialization: e.target.value})}
          >
            <option value="">Select Specialization</option>
            <option value="cardiology">Cardiology</option>
            <option value="dermatology">Dermatology</option>
            <option value="neurology">Neurology</option>
            <option value="orthopedics">Orthopedics</option>
            <option value="pediatrics">Pediatrics</option>
            <option value="psychiatry">Psychiatry</option>
            <option value="radiology">Radiology</option>
            <option value="surgery">Surgery</option>
          </select>
        </div>

        <div className="form-group">
          <label>Qualifications</label>
          <input
            type="text"
            placeholder="MD, Board Certified, etc."
            value={profile.qualifications.join(', ')}
            onChange={(e) => setProfile({
              ...profile, 
              qualifications: e.target.value.split(',').map(q => q.trim())
            })}
          />
        </div>

        <div className="form-group">
          <label>Years of Experience</label>
          <input
            type="number"
            value={profile.experience}
            onChange={(e) => setProfile({...profile, experience: e.target.value})}
            min="0"
            max="50"
          />
        </div>
      </div>

      <div className="profile-section">
        <h3>Location Information</h3>
        
        <div className="form-group">
          <label>Address</label>
          <input
            type="text"
            value={profile.location.address}
            onChange={(e) => setProfile({
              ...profile,
              location: {...profile.location, address: e.target.value}
            })}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              value={profile.location.city}
              onChange={(e) => setProfile({
                ...profile,
                location: {...profile.location, city: e.target.value}
              })}
            />
          </div>

          <div className="form-group">
            <label>State</label>
            <input
              type="text"
              value={profile.location.state}
              onChange={(e) => setProfile({
                ...profile,
                location: {...profile.location, state: e.target.value}
              })}
            />
          </div>

          <div className="form-group">
            <label>ZIP Code</label>
            <input
              type="text"
              value={profile.location.zipCode}
              onChange={(e) => setProfile({
                ...profile,
                location: {...profile.location, zipCode: e.target.value}
              })}
            />
          </div>
        </div>
      </div>

      <div className="profile-section">
        <h3>Privacy Settings</h3>
        
        <div className="form-group">
          <label>Profile Visibility</label>
          <select
            value={profile.privacySettings.profileVisibility}
            onChange={(e) => setProfile({
              ...profile,
              privacySettings: {
                ...profile.privacySettings,
                profileVisibility: e.target.value
              }
            })}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="professional_only">Professional Only</option>
          </select>
        </div>

        <div className="privacy-options">
          <h4>Data Sharing Preferences</h4>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={profile.privacySettings.dataSharing.allowPatientRequests}
              onChange={(e) => setProfile({
                ...profile,
                privacySettings: {
                  ...profile.privacySettings,
                  dataSharing: {
                    ...profile.privacySettings.dataSharing,
                    allowPatientRequests: e.target.checked
                  }
                }
              })}
            />
            Allow patient connection requests
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={profile.privacySettings.dataSharing.allowCenterInvitations}
              onChange={(e) => setProfile({
                ...profile,
                privacySettings: {
                  ...profile.privacySettings,
                  dataSharing: {
                    ...profile.privacySettings.dataSharing,
                    allowCenterInvitations: e.target.checked
                  }
                }
              })}
            />
            Allow center staff invitations
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={profile.privacySettings.dataSharing.allowCollaboration}
              onChange={(e) => setProfile({
                ...profile,
                privacySettings: {
                  ...profile.privacySettings,
                  dataSharing: {
                    ...profile.privacySettings.dataSharing,
                    allowCollaboration: e.target.checked
                  }
                }
              })}
            />
            Allow collaboration requests
          </label>
        </div>
      </div>

      <div className="form-actions">
        <button onClick={saveProfile} disabled={loading} className="save-btn">
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
};
```

---

## 🔧 Phase 4: Navigation Integration

### **4.1 Update Navigation Menu**

Add discovery features to your existing navigation:

```typescript
// components/navigation/NavigationMenu.tsx
export const NavigationMenu: React.FC = () => {
  const userRole = getUserRole(); // Your existing function

  return (
    <nav className="main-navigation">
      {/* Existing navigation items */}
      
      {/* Add new discovery items */}
      <div className="nav-section">
        <h4>Discovery</h4>
        <NavItem icon="search" label="Find Doctors" href="/discovery/doctors" />
        <NavItem icon="hospital" label="Find Centers" href="/discovery/centers" />
        <NavItem icon="users" label="My Connections" href="/connections" />
        <NavItem icon="inbox" label="Requests" href="/requests" />
      </div>

      {/* Role-specific items */}
      {userRole === 'center' && (
        <div className="nav-section">
          <h4>Center Management</h4>
          <NavItem icon="user-plus" label="Invite Staff" href="/invitations" />
          <NavItem icon="briefcase" label="Job Applications" href="/applications" />
        </div>
      )}

      {userRole === 'doctor' && (
        <div className="nav-section">
          <h4>Professional</h4>
          <NavItem icon="handshake" label="Collaborations" href="/collaborations" />
          <NavItem icon="user-plus" label="Invite Patients" href="/invite-patients" />
        </div>
      )}
    </nav>
  );
};
```

### **4.2 Dashboard Integration**

Add discovery widgets to your existing dashboard:

```typescript
// components/dashboard/DiscoveryWidget.tsx
export const DiscoveryWidget: React.FC = () => {
  const [recentConnections, setRecentConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // Load recent connections
    const connectionsResponse = await fetch('/api/users/search?type=doctor&limit=3', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });
    const connectionsData = await connectionsResponse.json();
    setRecentConnections(connectionsData.users || []);

    // Load pending requests
    const requestsResponse = await fetch('/api/requests/received?status=pending&limit=3', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });
    const requestsData = await requestsResponse.json();
    setPendingRequests(requestsData.requests || []);
  };

  return (
    <div className="discovery-widget">
      <div className="widget-header">
        <h3>Discovery & Connections</h3>
        <Link to="/discovery" className="view-all">View All</Link>
      </div>

      <div className="widget-content">
        <div className="quick-actions">
          <button className="action-btn" onClick={() => navigate('/discovery/doctors')}>
            <Icon name="search" />
            Find Doctors
          </button>
          <button className="action-btn" onClick={() => navigate('/discovery/centers')}>
            <Icon name="hospital" />
            Find Centers
          </button>
        </div>

        {pendingRequests.length > 0 && (
          <div className="pending-requests">
            <h4>Pending Requests ({pendingRequests.length})</h4>
            {pendingRequests.map(request => (
              <div key={request.id} className="request-item">
                <span>{request.senderName}</span>
                <span className="request-type">{request.requestType}</span>
              </div>
            ))}
          </div>
        )}

        {recentConnections.length > 0 && (
          <div className="recent-connections">
            <h4>Recent Connections</h4>
            {recentConnections.map(connection => (
              <div key={connection.id} className="connection-item">
                <img src={connection.avatar} alt={connection.name} />
                <span>{connection.name}</span>
                <span className="specialty">{connection.specialty}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
```

---

## 🔧 Phase 5: API Integration Helpers

### **5.1 API Service Layer**

Create a service layer for all discovery APIs:

```typescript
// services/discoveryService.ts
class DiscoveryService {
  private baseURL = 'https://api.unlimtedhealth.com/api';
  private token = localStorage.getItem('access_token');

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // User Search
  async searchUsers(params: SearchParams) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/users/search?${queryString}`);
  }

  async getUserProfile(userId: string) {
    return this.request(`/users/${userId}/public-profile`);
  }

  // Center Search
  async searchCenters(params: CenterSearchParams) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/centers/search?${queryString}`);
  }

  async getCenterDetails(centerId: string) {
    return this.request(`/centers/${centerId}`);
  }

  async getNearbyCenters(lat: number, lng: number, radius: number = 25) {
    return this.request(`/centers/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  // Request Management
  async createRequest(requestData: CreateRequestData) {
    return this.request('/requests', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
  }

  async getReceivedRequests(status?: string, page: number = 1, limit: number = 20) {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (status) params.append('status', status);
    return this.request(`/requests/received?${params}`);
  }

  async getSentRequests(status?: string, page: number = 1, limit: number = 20) {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (status) params.append('status', status);
    return this.request(`/requests/sent?${params}`);
  }

  async respondToRequest(requestId: string, action: 'approve' | 'reject', message?: string) {
    return this.request(`/requests/${requestId}/respond`, {
      method: 'PATCH',
      body: JSON.stringify({ action, message })
    });
  }

  async cancelRequest(requestId: string) {
    return this.request(`/requests/${requestId}`, {
      method: 'DELETE'
    });
  }

  // Invitation Management
  async sendInvitation(invitationData: CreateInvitationData) {
    return this.request('/invitations', {
      method: 'POST',
      body: JSON.stringify(invitationData)
    });
  }

  async getPendingInvitations(email: string) {
    return this.request(`/invitations/pending?email=${email}`);
  }

  async acceptInvitation(token: string, userData: AcceptInvitationData) {
    return this.request(`/invitations/${token}/accept`, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async declineInvitation(token: string, reason?: string) {
    return this.request(`/invitations/${token}/decline`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }
}

export const discoveryService = new DiscoveryService();
```

### **5.2 Type Definitions**

```typescript
// types/discovery.ts
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  specialty?: string;
  location?: string;
  experience?: string;
  rating?: number;
  reviewCount?: number;
  qualifications?: string[];
  availability?: Availability;
  privacySettings?: PrivacySettings;
}

export interface Center {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website?: string;
  services: string[];
  staff: User[];
  operatingHours: OperatingHours;
  coordinates: { lat: number; lng: number };
}

export interface SearchParams {
  type: 'doctor' | 'center' | 'practitioner';
  specialty?: string;
  location?: string;
  radius?: number;
  page?: number;
  limit?: number;
}

export interface CenterSearchParams {
  type?: string;
  location?: string;
  radius?: number;
  services?: string[];
  page?: number;
  limit?: number;
}

export interface Request {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  requestType: 'connection' | 'collaboration' | 'patient_request' | 'job_application' | 'staff_invitation' | 'referral';
  message: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRequestData {
  recipientId: string;
  requestType: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface Invitation {
  id: string;
  email: string;
  invitationType: 'staff_invitation' | 'patient_invitation' | 'doctor_invitation';
  role?: string;
  message: string;
  centerId?: string;
  metadata: Record<string, unknown>;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface CreateInvitationData {
  email: string;
  invitationType: string;
  role?: string;
  message: string;
  centerId?: string;
  metadata?: Record<string, unknown>;
}

export interface AcceptInvitationData {
  name: string;
  password: string;
  phone?: string;
  profileData?: Record<string, unknown>;
}
```

---

## 🎯 Integration Checklist

### **Phase 1: Search Interface** ✅
- [ ] Create SearchPage component
- [ ] Build SearchFilters component
- [ ] Implement UserCard component
- [ ] Add search functionality to navigation
- [ ] Test search APIs integration

### **Phase 2: Request Management** ✅
- [ ] Create RequestDashboard component
- [ ] Build RequestModal component
- [ ] Implement request actions (approve/reject/cancel)
- [ ] Integrate with existing notification system
- [ ] Test request workflow

### **Phase 3: Profile Enhancement** ✅
- [ ] Extend existing profile editor
- [ ] Add new profile fields
- [ ] Implement privacy settings
- [ ] Test profile update APIs
- [ ] Add location services

### **Phase 4: Navigation Integration** ✅
- [ ] Update navigation menu
- [ ] Add discovery widgets to dashboard
- [ ] Create routing for new pages
- [ ] Test navigation flow

### **Phase 5: API Integration** ✅
- [ ] Create discovery service layer
- [ ] Add type definitions
- [ ] Implement error handling
- [ ] Test all API endpoints
- [ ] Add loading states

---

## 🚀 Quick Start Implementation

### **1. Add to Existing Dashboard**

```typescript
// In your main dashboard component
import { DiscoveryWidget } from './components/discovery/DiscoveryWidget';

export const Dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      {/* Existing dashboard content */}
      
      {/* Add discovery widget */}
      <DiscoveryWidget />
    </div>
  );
};
```

### **2. Add Navigation Items**

```typescript
// In your navigation component
const navigationItems = [
  // Existing items...
  { icon: 'search', label: 'Find Doctors', href: '/discovery/doctors' },
  { icon: 'hospital', label: 'Find Centers', href: '/discovery/centers' },
  { icon: 'inbox', label: 'Requests', href: '/requests' },
];
```

### **3. Test Integration**

```bash
# Test the APIs first
curl -X GET "https://api.unlimtedhealth.com/api/users/search?type=doctor&page=1&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Then build the frontend components
```

---

## 📞 Support & Testing

### **API Testing**
Use the comprehensive testing guide: `DISCOVERY_SYSTEM_TESTING_WORKFLOW.md`

### **Frontend Testing**
1. Test search functionality with different filters
2. Test request creation and management
3. Test profile updates with new fields
4. Test navigation integration
5. Test responsive design on mobile

### **Common Issues**
- **CORS errors**: Ensure API allows your frontend domain
- **Authentication**: Verify JWT tokens are properly sent
- **Rate limiting**: Implement proper loading states
- **Error handling**: Show user-friendly error messages

---

This integration guide provides everything needed to seamlessly integrate the discovery system into your existing healthcare dashboard. The system builds on your existing components while adding powerful new discovery and networking capabilities! 🚀
