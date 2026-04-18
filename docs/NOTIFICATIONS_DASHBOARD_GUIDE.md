# 🔔 Notifications Dashboard Guide

## 📋 Overview

This comprehensive guide provides everything needed to implement a Notifications Dashboard for the healthcare management system. The dashboard enables users to manage, track, and analyze notifications with real-time updates, preferences management, and comprehensive analytics.

**Base URL:** `https://api.unlimtedhealth.com/api`  
**Authentication:** Bearer token required for all endpoints  
**WebSocket:** `wss://api.unlimtedhealth.com/notifications` for real-time updates  
**Documentation:** Swagger/OpenAPI available at `/api/docs`

---

## 🏷️ TypeScript Interfaces

### Core Notification Types

```typescript
// Notification Types
enum NotificationType {
  APPOINTMENT = 'appointment',
  MEDICAL_RECORD = 'medical_record',
  SYSTEM = 'system',
  REFERRAL = 'referral',
  PAYMENT = 'payment',
  TEST_RESULT = 'test_result',
  MESSAGE = 'message',
  EMERGENCY = 'emergency',
  APPOINTMENT_REQUEST = 'appointment_request'
}

// Delivery Methods
enum DeliveryMethod {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  BOTH = 'both',
  ALL = 'all'
}

// Delivery Status
enum DeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed'
}

// Priority Levels
enum PriorityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

// Alert Severity
enum AlertSeverity {
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}
```

### Notification DTOs

```typescript
// Create Notification Request
interface CreateNotificationDto {
  userId?: string;                    // Optional: Target user ID
  centerId?: string;                  // Optional: Target center ID
  title: string;                      // Required: Notification title
  message: string;                    // Required: Notification message
  type: string;                       // Required: Notification type
  deliveryMethod?: string;            // Optional: Delivery method
  relatedType?: string;               // Optional: Related entity type
  relatedId?: string;                 // Optional: Related entity ID
  data?: Record<string, unknown>;     // Optional: Additional data
  isUrgent?: boolean;                 // Optional: Urgent flag
  scheduledFor?: string;              // Optional: Scheduled delivery time
  expiresAt?: string;                 // Optional: Expiration time
}

// Get Notifications Query
interface GetNotificationsDto {
  page?: number;                      // Optional: Page number (1+)
  limit?: number;                     // Optional: Items per page (1-100)
  type?: string;                      // Optional: Filter by type
  isRead?: boolean;                   // Optional: Filter by read status
}

// Update Notification Preferences
interface UpdateNotificationPreferencesDto {
  emailVerified?: boolean;            // Optional: Email verification status
  phoneVerified?: boolean;            // Optional: Phone verification status
  medicalRecordRequest?: string;      // Optional: Medical record request preference
  medicalRecordAccess?: string;       // Optional: Medical record access preference
  recordShareExpiring?: string;       // Optional: Record share expiring preference
  appointment?: string;               // Optional: Appointment preference
  message?: string;                   // Optional: Message preference
  system?: string;                    // Optional: System preference
  referral?: string;                  // Optional: Referral preference
  testResult?: string;                // Optional: Test result preference
  payment?: string;                   // Optional: Payment preference
  marketing?: string;                 // Optional: Marketing preference
  quietHoursStart?: string;           // Optional: Quiet hours start time
  quietHoursEnd?: string;             // Optional: Quiet hours end time
  timezone?: string;                  // Optional: User timezone
}
```

### Response Interfaces

```typescript
// Notification Entity
interface Notification {
  id: string;                         // UUID - Primary key
  userId: string;                     // UUID - User ID
  centerId?: string;                  // UUID - Center ID
  title: string;                      // Notification title
  message: string;                    // Notification message
  type: string;                       // Notification type
  deliveryMethod: string;             // Delivery method
  relatedType?: string;               // Related entity type
  relatedId?: string;                 // Related entity ID
  data?: Record<string, unknown>;     // Additional data
  isRead: boolean;                    // Read status
  isUrgent: boolean;                  // Urgent flag
  readAt?: Date;                      // Read timestamp
  sentAt?: Date;                      // Sent timestamp
  scheduledFor?: Date;                // Scheduled delivery time
  expiresAt?: Date;                   // Expiration time
  deliveryStatus: string;             // Delivery status
  errorMessage?: string;              // Error message if failed
  createdAt: Date;                    // Creation timestamp
  updatedAt: Date;                    // Last update timestamp
  user?: User;                        // User information
}

// Notification Preferences Entity
interface NotificationPreference {
  id: string;                         // UUID - Primary key
  userId: string;                     // UUID - User ID
  emailVerified: boolean;             // Email verification status
  phoneVerified: boolean;             // Phone verification status
  medicalRecordRequest: string;       // Medical record request preference
  medicalRecordAccess: string;        // Medical record access preference
  recordShareExpiring: string;        // Record share expiring preference
  appointment: string;                // Appointment preference
  message: string;                    // Message preference
  system: string;                     // System preference
  referral: string;                   // Referral preference
  testResult: string;                 // Test result preference
  payment: string;                    // Payment preference
  marketing: string;                  // Marketing preference
  quietHoursStart?: string;           // Quiet hours start time
  quietHoursEnd?: string;             // Quiet hours end time
  timezone: string;                   // User timezone
  createdAt: Date;                    // Creation timestamp
  updatedAt: Date;                    // Last update timestamp
  user?: User;                        // User information
}

// Notification Filters
interface NotificationFilters {
  type?: string;                      // Filter by type
  isRead?: boolean;                   // Filter by read status
  page: number;                       // Page number
  limit: number;                      // Items per page
}

// Notification Response
interface NotificationResponse {
  notifications: Notification[];      // Array of notifications
  total: number;                      // Total count
  page: number;                       // Current page
  limit: number;                      // Items per page
  totalPages: number;                 // Total pages
}

// WebSocket Notification Data
interface NotificationData {
  id: string;                         // Notification ID
  type: string;                       // Notification type
  title: string;                      // Notification title
  message: string;                    // Notification message
  userId: string;                     // User ID
  createdAt: Date;                    // Creation timestamp
  metadata?: Record<string, unknown>; // Additional metadata
}

// Alert Data
interface AlertData {
  type: string;                       // Alert type
  title: string;                      // Alert title
  message: string;                    // Alert message
  severity: AlertSeverity;            // Alert severity
  actionRequired?: boolean;           // Action required flag
  metadata?: Record<string, unknown>; // Additional metadata
}

// System Notification
interface SystemNotification {
  type: string;                       // Notification type
  title: string;                      // Notification title
  message: string;                    // Notification message
  priority: PriorityLevel;            // Priority level
  targetAudience?: string[];          // Target audience
  metadata?: Record<string, unknown>; // Additional metadata
}
```

---

## 📊 Notification Management Endpoints

### 1. Get Notifications
**Endpoint:** `GET /notifications`  
**Authentication:** Required (Bearer token)  
**Roles:** All authenticated users

```typescript
const getNotifications = async (filters: GetNotificationsDto = {}) => {
  const token = localStorage.getItem('access_token');
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/notifications?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};

// Example usage:
const notifications = await getNotifications({
  page: 1,
  limit: 20,
  type: 'appointment',
  isRead: false
});
```

### 2. Get Unread Count
**Endpoint:** `GET /notifications/unread-count`  
**Authentication:** Required (Bearer token)  
**Roles:** All authenticated users

```typescript
const getUnreadCount = async () => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/notifications/unread-count', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 3. Create Notification
**Endpoint:** `POST /notifications`  
**Authentication:** Required (Bearer token)  
**Roles:** Admin, Doctor, Staff, Patient (restricted)

```typescript
const createNotification = async (notificationData: CreateNotificationDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/notifications', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      centerId: "550e8400-e29b-41d4-a716-446655440001",
      title: "Appointment Reminder",
      message: "Your appointment is scheduled for tomorrow at 2:00 PM",
      type: "appointment",
      deliveryMethod: "both",
      relatedType: "appointment",
      relatedId: "550e8400-e29b-41d4-a716-446655440002",
      isUrgent: false,
      data: {
        appointmentId: "550e8400-e29b-41d4-a716-446655440002",
        doctorName: "Dr. Smith",
        location: "Main Clinic"
      }
    })
  });
  
  return await response.json();
};
```

### 4. Mark Notification as Read
**Endpoint:** `PUT /notifications/:id/read`  
**Authentication:** Required (Bearer token)  
**Roles:** All authenticated users

```typescript
const markAsRead = async (notificationId: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/notifications/${notificationId}/read`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 5. Mark All Notifications as Read
**Endpoint:** `PUT /notifications/mark-all-read`  
**Authentication:** Required (Bearer token)  
**Roles:** All authenticated users

```typescript
const markAllAsRead = async () => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/notifications/mark-all-read', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return response.ok;
};
```

### 6. Delete Notification
**Endpoint:** `DELETE /notifications/:id`  
**Authentication:** Required (Bearer token)  
**Roles:** All authenticated users

```typescript
const deleteNotification = async (notificationId: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/notifications/${notificationId}`, {
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

## ⚙️ Preferences Management Endpoints

### 1. Get Notification Preferences
**Endpoint:** `GET /notifications/preferences`  
**Authentication:** Required (Bearer token)  
**Roles:** All authenticated users

```typescript
const getNotificationPreferences = async () => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/notifications/preferences', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 2. Update Notification Preferences
**Endpoint:** `PUT /notifications/preferences`  
**Authentication:** Required (Bearer token)  
**Roles:** All authenticated users

```typescript
const updateNotificationPreferences = async (preferences: UpdateNotificationPreferencesDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/notifications/preferences', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      appointment: "both",
      medicalRecordRequest: "email",
      system: "push",
      marketing: "none",
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00",
      timezone: "America/New_York"
    })
  });
  
  return await response.json();
};
```

### 3. Send Test Notification
**Endpoint:** `POST /notifications/test/:type`  
**Authentication:** Required (Bearer token)  
**Roles:** All authenticated users

```typescript
const sendTestNotification = async (type: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/notifications/test/${type}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return response.ok;
};
```

---

## 🔌 WebSocket Integration

### Real-time Notification Connection

```typescript
import { io, Socket } from 'socket.io-client';

class NotificationWebSocket {
  private socket: Socket | null = null;
  private token: string;
  private userId: string;

  constructor(token: string, userId: string) {
    this.token = token;
    this.userId = userId;
  }

  connect() {
    this.socket = io('wss://api.unlimtedhealth.com/notifications', {
      auth: {
        token: this.token,
        userId: this.userId
      }
    });

    this.socket.on('connect', () => {
      console.log('Connected to notification WebSocket');
      this.authenticate();
    });

    this.socket.on('authenticated', (data) => {
      console.log('WebSocket authenticated:', data);
    });

    this.socket.on('notification', (notification: NotificationData) => {
      this.handleNotification(notification);
    });

    this.socket.on('urgent_alert', (alert: AlertData) => {
      this.handleUrgentAlert(alert);
    });

    this.socket.on('system_notification', (notification: SystemNotification) => {
      this.handleSystemNotification(notification);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from notification WebSocket');
    });
  }

  private authenticate() {
    if (this.socket) {
      this.socket.emit('authenticate', {
        userId: this.userId,
        token: this.token
      });
    }
  }

  joinCenter(centerId: string) {
    if (this.socket) {
      this.socket.emit('join_center', { centerId });
    }
  }

  leaveCenter(centerId: string) {
    if (this.socket) {
      this.socket.emit('leave_center', { centerId });
    }
  }

  private handleNotification(notification: NotificationData) {
    // Handle incoming notification
    console.log('New notification:', notification);
    // Update UI, show toast, etc.
  }

  private handleUrgentAlert(alert: AlertData) {
    // Handle urgent alert
    console.log('Urgent alert:', alert);
    // Show modal, play sound, etc.
  }

  private handleSystemNotification(notification: SystemNotification) {
    // Handle system notification
    console.log('System notification:', notification);
    // Show banner, update status, etc.
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Usage
const notificationWS = new NotificationWebSocket(token, userId);
notificationWS.connect();
```

---

## 🎨 Frontend Implementation Examples

### React Notifications Dashboard Component

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { NotificationWebSocket } from './NotificationWebSocket';

interface NotificationsDashboardProps {
  token: string;
  userId: string;
}

const NotificationsDashboard: React.FC<NotificationsDashboardProps> = ({ token, userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<GetNotificationsDto>({
    page: 1,
    limit: 20,
    isRead: undefined
  });
  const [ws, setWs] = useState<NotificationWebSocket | null>(null);

  useEffect(() => {
    loadDashboardData();
    initializeWebSocket();
    
    return () => {
      if (ws) {
        ws.disconnect();
      }
    };
  }, [token, userId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [notificationsData, unreadData, preferencesData] = await Promise.all([
        getNotifications(filters),
        getUnreadCount(),
        getNotificationPreferences()
      ]);
      
      setNotifications(notificationsData.notifications || []);
      setUnreadCount(unreadData.count || 0);
      setPreferences(preferencesData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeWebSocket = () => {
    const notificationWS = new NotificationWebSocket(token, userId);
    notificationWS.connect();
    setWs(notificationWS);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true, readAt: new Date() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const deletedNotification = notifications.find(n => n.id === notificationId);
        return deletedNotification && !deletedNotification.isRead ? prev - 1 : prev;
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const updatePreferences = async (newPreferences: UpdateNotificationPreferencesDto) => {
    try {
      const updated = await updateNotificationPreferences(newPreferences);
      setPreferences(updated);
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  const sendTestNotification = async (type: string) => {
    try {
      await sendTestNotification(type);
      // Refresh notifications to show the test notification
      loadDashboardData();
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment': return '📅';
      case 'medical_record': return '📋';
      case 'system': return '⚙️';
      case 'referral': return '🔄';
      case 'payment': return '💳';
      case 'test_result': return '🧪';
      case 'message': return '💬';
      case 'emergency': return '🚨';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type: string, isUrgent: boolean) => {
    if (isUrgent) return '#ff4444';
    switch (type) {
      case 'emergency': return '#ff4444';
      case 'appointment': return '#4CAF50';
      case 'medical_record': return '#2196F3';
      case 'system': return '#9C27B0';
      case 'referral': return '#FF9800';
      case 'payment': return '#795548';
      case 'test_result': return '#00BCD4';
      case 'message': return '#607D8B';
      default: return '#757575';
    }
  };

  if (loading) {
    return <div className="loading">Loading notifications...</div>;
  }

  return (
    <div className="notifications-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Notifications Dashboard</h1>
        <div className="header-actions">
          <span className="unread-count">
            {unreadCount} unread
          </span>
          <button 
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="mark-all-read-btn"
          >
            Mark All Read
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <select 
          value={filters.type || ''} 
          onChange={(e) => setFilters(prev => ({ 
            ...prev, 
            type: e.target.value || undefined 
          }))}
        >
          <option value="">All Types</option>
          <option value="appointment">Appointments</option>
          <option value="medical_record">Medical Records</option>
          <option value="system">System</option>
          <option value="referral">Referrals</option>
          <option value="payment">Payments</option>
          <option value="test_result">Test Results</option>
          <option value="message">Messages</option>
          <option value="emergency">Emergency</option>
        </select>
        
        <select 
          value={filters.isRead === undefined ? '' : filters.isRead.toString()} 
          onChange={(e) => setFilters(prev => ({ 
            ...prev, 
            isRead: e.target.value === '' ? undefined : e.target.value === 'true' 
          }))}
        >
          <option value="">All Status</option>
          <option value="false">Unread</option>
          <option value="true">Read</option>
        </select>
      </div>

      {/* Notifications List */}
      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <p>No notifications found</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`notification-item ${notification.isRead ? 'read' : 'unread'} ${notification.isUrgent ? 'urgent' : ''}`}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="notification-content">
                <div className="notification-header">
                  <h3 className="notification-title">{notification.title}</h3>
                  <span className="notification-time">
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                </div>
                
                <p className="notification-message">{notification.message}</p>
                
                {notification.data && (
                  <div className="notification-data">
                    <pre>{JSON.stringify(notification.data, null, 2)}</pre>
                  </div>
                )}
                
                <div className="notification-meta">
                  <span className="notification-type">{notification.type}</span>
                  {notification.isUrgent && (
                    <span className="urgent-badge">URGENT</span>
                  )}
                  <span className="delivery-status">{notification.deliveryStatus}</span>
                </div>
              </div>
              
              <div className="notification-actions">
                {!notification.isRead && (
                  <button 
                    onClick={() => markAsRead(notification.id)}
                    className="mark-read-btn"
                  >
                    Mark Read
                  </button>
                )}
                <button 
                  onClick={() => deleteNotification(notification.id)}
                  className="delete-btn"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Preferences Panel */}
      {preferences && (
        <div className="preferences-panel">
          <h3>Notification Preferences</h3>
          <div className="preferences-grid">
            <div className="preference-item">
              <label>Appointments</label>
              <select 
                value={preferences.appointment}
                onChange={(e) => updatePreferences({ appointment: e.target.value })}
              >
                <option value="none">None</option>
                <option value="email">Email</option>
                <option value="push">Push</option>
                <option value="both">Both</option>
              </select>
            </div>
            
            <div className="preference-item">
              <label>Medical Records</label>
              <select 
                value={preferences.medicalRecordRequest}
                onChange={(e) => updatePreferences({ medicalRecordRequest: e.target.value })}
              >
                <option value="none">None</option>
                <option value="email">Email</option>
                <option value="push">Push</option>
                <option value="both">Both</option>
              </select>
            </div>
            
            <div className="preference-item">
              <label>System</label>
              <select 
                value={preferences.system}
                onChange={(e) => updatePreferences({ system: e.target.value })}
              >
                <option value="none">None</option>
                <option value="email">Email</option>
                <option value="push">Push</option>
                <option value="both">Both</option>
              </select>
            </div>
            
            <div className="preference-item">
              <label>Marketing</label>
              <select 
                value={preferences.marketing}
                onChange={(e) => updatePreferences({ marketing: e.target.value })}
              >
                <option value="none">None</option>
                <option value="email">Email</option>
                <option value="push">Push</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
          
          <div className="test-notifications">
            <h4>Test Notifications</h4>
            <div className="test-buttons">
              <button onClick={() => sendTestNotification('appointment')}>
                Test Appointment
              </button>
              <button onClick={() => sendTestNotification('system')}>
                Test System
              </button>
              <button onClick={() => sendTestNotification('emergency')}>
                Test Emergency
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDashboard;
```

### CSS Styling

```css
.notifications-dashboard {
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.unread-count {
  background: #ff4444;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.mark-all-read-btn {
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.mark-all-read-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.filters select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.notifications-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

.notification-item {
  display: flex;
  padding: 20px;
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background: #f8f9fa;
}

.notification-item.unread {
  background: #f0f8ff;
  border-left: 4px solid #2196F3;
}

.notification-item.urgent {
  background: #fff5f5;
  border-left: 4px solid #ff4444;
}

.notification-icon {
  font-size: 24px;
  margin-right: 15px;
  margin-top: 5px;
}

.notification-content {
  flex: 1;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.notification-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.notification-time {
  font-size: 12px;
  color: #666;
}

.notification-message {
  margin: 0 0 10px 0;
  color: #555;
  line-height: 1.4;
}

.notification-data {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
  font-size: 12px;
  overflow-x: auto;
}

.notification-meta {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 10px;
}

.notification-type {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  text-transform: uppercase;
}

.urgent-badge {
  background: #ff4444;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
}

.delivery-status {
  background: #e8f5e8;
  color: #2e7d32;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
}

.notification-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: 15px;
}

.mark-read-btn, .delete-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
}

.mark-read-btn {
  color: #4CAF50;
  border-color: #4CAF50;
}

.delete-btn {
  color: #f44336;
  border-color: #f44336;
}

.mark-read-btn:hover, .delete-btn:hover {
  background: #f8f9fa;
}

.preferences-panel {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-top: 20px;
}

.preferences-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.preference-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preference-item label {
  font-weight: 600;
  color: #333;
}

.preference-item select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.test-notifications {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.test-buttons {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.test-buttons button {
  padding: 8px 16px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.test-buttons button:hover {
  background: #1976d2;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
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
  
  .notification-item {
    flex-direction: column;
  }
  
  .notification-actions {
    flex-direction: row;
    margin-left: 0;
    margin-top: 15px;
  }
  
  .preferences-grid {
    grid-template-columns: 1fr;
  }
  
  .test-buttons {
    flex-wrap: wrap;
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
      "field": "title",
      "message": "Title is required"
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
  "message": "Insufficient permissions to create notifications",
  "error": "Forbidden"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Notification not found",
  "error": "Not Found"
}
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install socket.io-client axios
# or
yarn add socket.io-client axios
```

### 2. Create API Service

```typescript
// services/notificationApi.ts
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

export const notificationApi = {
  // Notification Management
  getNotifications: (params: GetNotificationsDto) => apiClient.get('/notifications', { params }),
  getUnreadCount: () => apiClient.get('/notifications/unread-count'),
  createNotification: (data: CreateNotificationDto) => apiClient.post('/notifications', data),
  markAsRead: (id: string) => apiClient.put(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.put('/notifications/mark-all-read'),
  deleteNotification: (id: string) => apiClient.delete(`/notifications/${id}`),
  
  // Preferences
  getPreferences: () => apiClient.get('/notifications/preferences'),
  updatePreferences: (data: UpdateNotificationPreferencesDto) => 
    apiClient.put('/notifications/preferences', data),
  
  // Testing
  sendTestNotification: (type: string) => 
    apiClient.post(`/notifications/test/${type}`),
};
```

---

## 📋 Summary

This comprehensive Notifications Dashboard guide provides:

✅ **Complete API Documentation** - All notification endpoints with real DTOs  
✅ **WebSocket Integration** - Real-time notification updates  
✅ **Preferences Management** - User notification preferences  
✅ **TypeScript Interfaces** - Full type definitions for all data structures  
✅ **Frontend Implementation** - React components with real-time updates  
✅ **Error Handling** - Comprehensive error response documentation  
✅ **Mobile Responsive** - CSS grid layouts for all screen sizes  

The dashboard supports:
- Real-time notification updates via WebSocket
- Notification management (read, delete, mark all read)
- User preference management
- Test notification functionality
- Mobile-responsive design
- Role-based access control

**Base URL:** `https://api.unlimtedhealth.com/api`  
**WebSocket:** `wss://api.unlimtedhealth.com/notifications`  
**Authentication:** Bearer token required for most endpoints  
**Documentation:** Swagger/OpenAPI available at `/api/docs`
