# Healthcare Appointment Booking Workflow Diagram

## Complete User Journey Flow

```mermaid
graph TD
    A[Patient Visits Website] --> B[Patient Registration]
    B --> C[Patient Profile Setup]
    
    D[Center Admin Registration] --> E[Center Profile Creation]
    E --> F[Center Services Setup]
    F --> G[Center Availability Setup]
    
    H[Doctor Registration by Center] --> I[Doctor Profile Setup]
    I --> J[Doctor Availability Setup]
    J --> K[Add Doctor to Center Staff]
    
    C --> L[Patient Searches Centers]
    L --> M[Patient Views Available Doctors]
    M --> N[Patient Books Appointment]
    
    N --> O[Appointment Created - Pending]
    O --> P[Doctor/Center Confirms]
    P --> Q[System Sends Confirmation]
    Q --> R[Reminder Notifications Sent]
    
    R --> S[Appointment Day]
    S --> T[Patient Checks In]
    T --> U[Doctor Consultation]
    U --> V[Medical Record Created]
    V --> W[Appointment Completed]
    
    W --> X{Follow-up Needed?}
    X -->|Yes| Y[Schedule Follow-up]
    X -->|No| Z[Process Complete]
    Y --> N
```

## Detailed System Interaction Flow

```mermaid
sequenceDiagram
    participant P as Patient
    participant API as Healthcare API
    participant C as Center
    participant D as Doctor
    participant N as Notification Service
    participant MR as Medical Records

    Note over P,MR: Phase 1: Account Setup
    P->>API: POST /auth/register (patient)
    API-->>P: Access token + user profile
    
    C->>API: POST /auth/register (center)
    API-->>C: Access token + user profile
    
    C->>API: POST /centers (create center)
    API-->>C: Center created
    
    C->>API: POST /auth/register/staff (doctor)
    API-->>C: Doctor account created
    
    C->>API: POST /centers/{id}/staff (add doctor)
    API-->>C: Doctor added to center
    
    D->>API: POST /appointments/availability (set schedule)
    API-->>D: Availability created

    Note over P,MR: Phase 2: Appointment Booking
    P->>API: GET /centers/types/hospital
    API-->>P: List of hospitals
    
    P->>API: GET /appointments/availability/provider/{id}
    API-->>P: Doctor availability
    
    P->>API: POST /appointments (book appointment)
    API-->>P: Appointment created (pending)
    
    Note over P,MR: Phase 3: Confirmation & Notifications
    D->>API: PATCH /appointments/{id}/confirm
    API-->>D: Appointment confirmed
    
    API->>N: Send confirmation notification
    N->>P: Email/SMS confirmation
    
    API->>N: Schedule reminders
    N->>P: 24h reminder
    N->>P: 2h reminder

    Note over P,MR: Phase 4: Appointment Day
    P->>API: PATCH /appointments/{id} (check-in)
    API-->>P: Status updated
    
    D->>API: PATCH /appointments/{id} (in-progress)
    API-->>D: Status updated
    
    D->>API: POST /medical-records (create record)
    API-->>MR: Medical record stored
    
    D->>API: PATCH /appointments/{id}/complete
    API-->>D: Appointment completed
    
    Note over P,MR: Phase 5: Follow-up
    alt Follow-up needed
        D->>API: POST /appointments (follow-up)
        API-->>D: Follow-up scheduled
        API->>N: Send follow-up notification
        N->>P: Follow-up appointment notification
    else No follow-up
        Note over P,MR: Process complete
    end
```

## Role-Based Access Control Flow

```mermaid
graph LR
    subgraph "Patient Capabilities"
        P1[View Own Appointments]
        P2[Book New Appointments]
        P3[Cancel Own Appointments]
        P4[View Own Medical Records]
        P5[Update Own Profile]
    end
    
    subgraph "Doctor Capabilities"
        D1[View Patient Appointments]
        D2[Confirm Appointments]
        D3[Create Medical Records]
        D4[Set Availability]
        D5[View Patient History]
        D6[Complete Appointments]
    end
    
    subgraph "Center Capabilities"
        C1[Manage Center Profile]
        C2[Add/Remove Staff]
        C3[Set Center Availability]
        C4[Manage Services]
        C5[View Center Analytics]
        C6[Manage Appointments]
    end
    
    subgraph "Staff Capabilities"
        S1[Assist with Appointments]
        S2[Update Appointment Status]
        S3[View Patient Information]
        S4[Manage Check-ins]
    end
    
    subgraph "Admin Capabilities"
        A1[Full System Access]
        A2[User Management]
        A3[System Configuration]
        A4[Analytics & Reports]
        A5[Create Admin Accounts]
    end
```

## Data Flow Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        WEB[Web Application]
        MOBILE[Mobile App]
    end
    
    subgraph "API Gateway"
        AUTH[Authentication Service]
        ROUTER[Request Router]
    end
    
    subgraph "Core Services"
        USER[User Service]
        APPT[Appointment Service]
        CENTER[Center Service]
        MED[Medical Records Service]
        NOTIF[Notification Service]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL Database)]
        CACHE[(Redis Cache)]
        FILES[(Supabase Storage)]
    end
    
    subgraph "External Services"
        EMAIL[Email Service]
        SMS[SMS Service]
        PAY[Payment Gateway]
    end
    
    WEB --> AUTH
    MOBILE --> AUTH
    AUTH --> ROUTER
    ROUTER --> USER
    ROUTER --> APPT
    ROUTER --> CENTER
    ROUTER --> MED
    ROUTER --> NOTIF
    
    USER --> DB
    APPT --> DB
    CENTER --> DB
    MED --> DB
    NOTIF --> DB
    
    APPT --> CACHE
    CENTER --> CACHE
    
    MED --> FILES
    
    NOTIF --> EMAIL
    NOTIF --> SMS
    APPT --> PAY
```

## Appointment Status Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Pending: Patient books appointment
    Pending --> Confirmed: Doctor/Center confirms
    Pending --> Cancelled: Patient cancels
    Pending --> Cancelled: Doctor/Center cancels
    
    Confirmed --> InProgress: Patient checks in
    Confirmed --> Cancelled: Last-minute cancellation
    Confirmed --> NoShow: Patient doesn't show
    
    InProgress --> Completed: Doctor completes consultation
    InProgress --> Cancelled: Emergency cancellation
    
    Completed --> [*]: Process finished
    Cancelled --> [*]: Process finished
    NoShow --> [*]: Process finished
    
    Completed --> FollowUp: Follow-up needed
    FollowUp --> Pending: New appointment scheduled
```

## Security & Compliance Flow

```mermaid
graph TD
    A[User Request] --> B{Authenticated?}
    B -->|No| C[Return 401 Unauthorized]
    B -->|Yes| D{Valid Token?}
    D -->|No| E[Return 401 Invalid Token]
    D -->|Yes| F{Has Required Role?}
    F -->|No| G[Return 403 Forbidden]
    F -->|Yes| H[Process Request]
    
    H --> I[Audit Log Entry]
    I --> J[Data Validation]
    J --> K{Valid Data?}
    K -->|No| L[Return 400 Bad Request]
    K -->|Yes| M[Execute Business Logic]
    M --> N[Update Database]
    N --> O[Send Notifications]
    O --> P[Return Success Response]
    
    I --> Q[Compliance Check]
    Q --> R[GDPR/HIPAA Validation]
    R --> S[Data Encryption]
    S --> T[Secure Storage]
```

This comprehensive workflow ensures that all stakeholders in the healthcare system can interact seamlessly while maintaining security, compliance, and data integrity throughout the appointment booking and management process.
