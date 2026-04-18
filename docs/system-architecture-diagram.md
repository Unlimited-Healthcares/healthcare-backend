# System Architecture & User Interaction Diagram

## 🏗️ **Healthcare System Architecture - User Interaction View**

This diagram shows the system architecture and how different user types interact with the backend services.

```mermaid
graph TB
    %% User Types
    subgraph Users [👥 User Types]
        Patient[Patient<br/>Health Management]
        Doctor[Doctor/Provider<br/>Care Delivery]
        Staff[Center Staff<br/>Operations]
        Admin[Administrator<br/>System Management]
    end
    
    %% Frontend Layer
    subgraph Frontend [📱 Frontend Applications]
        WebApp[Web Application<br/>Progressive Web App]
        MobileApp[Mobile App<br/>React Native]
        AdminPanel[Admin Dashboard<br/>System Management]
    end
    
    %% API Gateway
    subgraph Gateway [🚪 API Gateway]
        Auth[Authentication<br/>JWT + Passport]
        RateLimit[Rate Limiting<br/>Security]
        Validation[Input Validation<br/>class-validator]
    end
    
    %% Core Backend Services
    subgraph Backend [⚙️ Backend Services - NestJS]
        AuthService[Auth Service<br/>User Management]
        UserService[User Service<br/>Profiles + Roles]
        PatientService[Patient Service<br/>Medical Records]
        CenterService[Center Service<br/>Healthcare Facilities]
        AppointmentService[Appointment Service<br/>Scheduling]
        MedicalRecordService[Medical Record Service<br/>Document Management]
        ReferralService[Referral Service<br/>Provider Network]
        NotificationService[Notification Service<br/>Multi-channel]
        AIService[AI Service<br/>Health Assistant]
        EmergencyService[Emergency Service<br/>Ambulance + Alerts]
        EquipmentService[Equipment Service<br/>Marketplace]
        BloodDonationService[Blood Donation Service<br/>Donor Management]
        ChatService[Chat Service<br/>Real-time Communication]
        VideoService[Video Service<br/>Conferencing]
        AuditService[Audit Service<br/>Compliance Logging]
        CacheService[Cache Service<br/>Redis]
        FileService[File Service<br/>Supabase Storage]
    end
    
    %% External Integrations
    subgraph External [🌐 External Services]
        Supabase[Supabase<br/>File Storage]
        Redis[Redis<br/>Caching + Sessions]
        PostgreSQL[PostgreSQL<br/>Primary Database]
        EmailProvider[Email Service<br/>SMTP]
        SMSService[SMS Service<br/>Twilio]
        PushService[Push Notifications<br/>FCM/APNS]
        PaymentGateway[Payment Gateway<br/>Stripe]
        MapsAPI[Maps API<br/>Location Services]
    end
    
    %% User Connections to Frontend
    Users --> Frontend
    
    %% Frontend to Gateway
    Frontend --> Gateway
    
    %% Gateway to Backend
    Gateway --> Backend
    
    %% Backend to External
    Backend --> External
    
    %% Key User Flows
    subgraph PatientFlow [🩺 Patient Journey Flow]
        P1[Registration] --> P2[Profile Setup]
        P2 --> P3[Center Discovery]
        P3 --> P4[Appointment Booking]
        P4 --> P5[Consultation]
        P5 --> P6[Follow-up Care]
    end
    
    subgraph ProviderFlow [👨‍⚕️ Provider Journey Flow]
        PR1[Staff Onboarding] --> PR2[Patient Management]
        PR2 --> PR3[Appointment Calendar]
        PR3 --> PR4[Consultation Tools]
        PR4 --> PR5[Medical Records]
    end
    
    %% Service Dependencies
    AuthService --> UserService
    UserService --> PatientService
    PatientService --> MedicalRecordService
    CenterService --> AppointmentService
    AppointmentService --> NotificationService
    MedicalRecordService --> FileService
    AIService --> MedicalRecordService
    EmergencyService --> NotificationService
    EquipmentService --> FileService
    BloodDonationService --> NotificationService
    ChatService --> NotificationService
    VideoService --> NotificationService
    
    %% Data Flow
    subgraph DataFlow [💾 Data Flow]
        D1[User Input] --> D2[Validation]
        D2 --> D3[Processing]
        D3 --> D4[Storage]
        D4 --> D5[Response]
        D5 --> D6[Real-time Updates]
    end
    
    %% Security Layer
    subgraph Security [🔒 Security & Compliance]
        JWT[JWT Tokens]
        RBAC[Role-Based Access Control]
        Audit[Audit Logging]
        Encryption[Data Encryption]
        GDPR[GDPR Compliance]
        HIPAA[HIPAA Compliance]
    end
    
    %% Connect Security to Services
    Security -.->|Protects| Backend
    Security -.->|Monitors| AuditService
    
    %% Real-time Features
    subgraph RealTime [⚡ Real-time Features]
        WebSockets[WebSocket Connections]
        LiveChat[Live Chat]
        VideoCalls[Video Conferencing]
        PushNotifications[Push Notifications]
        LiveUpdates[Live Data Updates]
    end
    
    %% Connect Real-time to Services
    RealTime -.->|Enables| ChatService
    RealTime -.->|Supports| VideoService
    RealTime -.->|Delivers| NotificationService
    
    %% Success Metrics
    subgraph Metrics [📊 Success Metrics]
        Performance[System Performance]
        Security[Security Compliance]
        UserExperience[User Experience]
        Scalability[System Scalability]
        Reliability[Service Reliability]
    end
    
    %% Styling
    classDef users fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef frontend fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef gateway fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef backend fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef external fill:#e0f2f1,stroke:#00796b,stroke-width:2px
    classDef flow fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef security fill:#ffebee,stroke:#d32f2f,stroke-width:2px
    classDef realtime fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef metrics fill:#f1f8e9,stroke:#689f38,stroke-width:2px
    
    class Patient,Doctor,Staff,Admin users
    class WebApp,MobileApp,AdminPanel frontend
    class Auth,RateLimit,Validation gateway
    class AuthService,UserService,PatientService,CenterService,AppointmentService,MedicalRecordService,ReferralService,NotificationService,AIService,EmergencyService,EquipmentService,BloodDonationService,ChatService,VideoService,AuditService,CacheService,FileService backend
    class Supabase,Redis,PostgreSQL,EmailProvider,SMSService,PushService,PaymentGateway,MapsAPI external
    class P1,P2,P3,P4,P5,P6,PR1,PR2,PR3,PR4,PR5 flow
    class JWT,RBAC,Audit,Encryption,GDPR,HIPAA security
    class WebSockets,LiveChat,VideoCalls,PushNotifications,LiveUpdates realtime
    class Performance,Security,UserExperience,Scalability,Reliability metrics
```

## 🔄 **System Interaction Patterns**

### **1. User Authentication Flow**
```
User Input → API Gateway → Authentication Service → JWT Token → 
Role Assignment → Service Access Control
```

### **2. Data Processing Flow**
```
User Request → Validation → Service Processing → Database → 
Cache Update → Real-time Notification → User Response
```

### **3. Real-time Communication Flow**
```
User Action → WebSocket → Service Update → Database → 
Cache Invalidation → Push Notification → Real-time UI Update
```

### **4. Security & Compliance Flow**
```
User Request → JWT Validation → Role Check → Service Access → 
Audit Logging → Data Encryption → Secure Response
```

## 🎯 **Key Architecture Features**

### **1. Microservices Architecture**
- **Service Independence**: Each service handles specific domain
- **Scalable Design**: Services can scale independently
- **Technology Flexibility**: Different services can use different tech stacks

### **2. Real-time Capabilities**
- **WebSocket Support**: Live chat and video conferencing
- **Push Notifications**: Instant updates across devices
- **Live Data Sync**: Real-time database updates

### **3. Security & Compliance**
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Granular permissions for different user types
- **Audit Logging**: Complete activity tracking for compliance
- **Data Encryption**: Secure storage and transmission

### **4. Performance & Scalability**
- **Redis Caching**: Fast data access and session management
- **Database Optimization**: PostgreSQL with TypeORM
- **CDN Integration**: Supabase for file storage and delivery
- **Load Balancing**: API gateway with rate limiting

## 🚀 **Deployment Architecture**

### **Production Environment**
- **Domain**: `api.unlimtedhealth.com`
- **SSL**: HTTPS with valid certificates
- **Load Balancer**: Nginx configuration
- **Database**: PostgreSQL with connection pooling
- **Cache**: Redis cluster for high availability
- **Storage**: Supabase with CDN

### **Staging Environment**
- **Development**: Local development setup
- **Testing**: Automated testing pipeline
- **CI/CD**: Continuous integration and deployment
- **Monitoring**: Health checks and performance metrics

## 📊 **System Performance Metrics**

### **Response Times**
- **API Endpoints**: < 200ms average response time
- **Database Queries**: < 100ms for simple queries
- **File Uploads**: < 2s for 10MB files
- **Real-time Updates**: < 50ms for WebSocket messages

### **Scalability Targets**
- **Concurrent Users**: 10,000+ simultaneous users
- **API Requests**: 100,000+ requests per minute
- **File Storage**: 1TB+ medical document storage
- **Database**: 100GB+ patient data storage

---

**This architecture diagram shows how the healthcare system is built with scalability, security, and real-time capabilities in mind, supporting the complex user journeys while maintaining performance and compliance.**
