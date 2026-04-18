# 🤖 AI Health Chat Dashboard - Frontend Implementation Guide

## 📋 Overview

This guide provides comprehensive information for building an **AI Health Chat Dashboard** that allows users to:
- Start AI-powered health conversations
- Get symptom analysis and medical advice
- Receive personalized health recommendations
- Perform health risk assessments
- Access medical knowledge base

**Base URL:** `https://api.unlimtedhealth.com/api`

---

## 🎯 Frontend Dashboard Overview

### Main Dashboard Sections

1. **AI Chat Interface**
   - Real-time chat with AI health assistant
   - Multiple conversation types (general, symptom checker, medical advice)
   - Message history and session management
   - Typing indicators and message status

2. **Symptom Analysis**
   - Interactive symptom input forms
   - AI-powered symptom analysis
   - Urgency level assessment
   - Follow-up recommendations

3. **Health Recommendations**
   - Personalized health recommendations
   - Recommendation feedback system
   - Priority-based recommendation display
   - Action tracking and completion

4. **Health Risk Assessment**
   - Interactive health questionnaires
   - Risk score visualization
   - Preventive care recommendations
   - Assessment history tracking

---

## 🔍 AI Chat Endpoints

### 1. Create Chat Session
**Endpoint:** `POST /ai/chat/sessions`  
**Authentication:** Required (Bearer token)  
**Roles:** All authenticated users

**Request Body (CreateChatSessionDto):**
```typescript
interface CreateChatSessionDto {
  patientId?: string;                    // Optional: UUID - Patient ID
  sessionType: ChatSessionType;          // Required: Session type
  title?: string;                        // Optional: Session title
  metadata?: Record<string, unknown>;    // Optional: Additional metadata
}

enum ChatSessionType {
  GENERAL = 'general',
  SYMPTOM_CHECKER = 'symptom_checker',
  MEDICAL_ADVICE = 'medical_advice',
  DRUG_INTERACTION = 'drug_interaction',
  HEALTH_ASSESSMENT = 'health_assessment'
}
```

**Example Request:**
```typescript
const createChatSession = async (sessionData: CreateChatSessionDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/ai/chat/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionType: 'symptom_checker',
      title: 'Symptom Analysis - Headache',
      metadata: {
        urgency: 'medium',
        symptoms: ['headache', 'fever']
      }
    })
  });
  
  return await response.json();
};
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "550e8400-e29b-41d4-a716-446655440001",
  "patientId": null,
  "sessionType": "symptom_checker",
  "title": "Symptom Analysis - Headache",
  "status": "active",
  "metadata": {
    "urgency": "medium",
    "symptoms": ["headache", "fever"]
  },
  "createdAt": "2023-01-01T00:00:00Z",
  "updatedAt": "2023-01-01T00:00:00Z",
  "endedAt": null
}
```

### 2. Get Chat Sessions
**Endpoint:** `GET /ai/chat/sessions`  
**Authentication:** Required (Bearer token)

**Query Parameters:**
```typescript
{
  page?: number;          // Pagination page (default: 1)
  limit?: number;         // Items per page (default: 10)
  sessionType?: string;   // Filter by session type
  status?: string;        // Filter by status (active, completed, archived)
}
```

**Example Request:**
```typescript
const getChatSessions = async (filters: {
  page?: number;
  limit?: number;
  sessionType?: string;
  status?: string;
}) => {
  const token = localStorage.getItem('access_token');
  const queryParams = new URLSearchParams();
  
  if (filters.page) queryParams.append('page', filters.page.toString());
  if (filters.limit) queryParams.append('limit', filters.limit.toString());
  if (filters.sessionType) queryParams.append('sessionType', filters.sessionType);
  if (filters.status) queryParams.append('status', filters.status);
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/ai/chat/sessions?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 3. Send Chat Message
**Endpoint:** `POST /ai/chat/sessions/:id/messages`  
**Authentication:** Required (Bearer token)

**Request Body (SendChatMessageDto):**
```typescript
interface SendChatMessageDto {
  content: string;                        // Required: Message content
  messageType: MessageType;               // Required: Message type
  sessionType?: string;                   // Optional: Session type for direct messages
  messageData?: Record<string, unknown>;  // Optional: Additional message data
}

enum MessageType {
  USER = 'user',
  SYSTEM = 'system'
}
```

**Example Request:**
```typescript
const sendChatMessage = async (sessionId: string, messageData: SendChatMessageDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/ai/chat/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: "I have a severe headache and fever for 2 days",
      messageType: "user",
      messageData: {
        symptoms: ["headache", "fever"],
        duration: "2 days",
        severity: "severe"
      }
    })
  });
  
  return await response.json();
};
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "messageType": "user",
  "content": "I have a severe headache and fever for 2 days",
  "messageData": {
    "symptoms": ["headache", "fever"],
    "duration": "2 days",
    "severity": "severe"
  },
  "aiModel": null,
  "tokensUsed": null,
  "processingTimeMs": null,
  "confidenceScore": null,
  "createdAt": "2023-01-01T00:00:00Z"
}
```

### 4. Get Session Messages
**Endpoint:** `GET /ai/chat/sessions/:id/messages`  
**Authentication:** Required (Bearer token)

**Query Parameters:**
```typescript
{
  page?: number;          // Pagination page (default: 1)
  limit?: number;         // Items per page (default: 50)
}
```

**Example Request:**
```typescript
const getSessionMessages = async (sessionId: string, page = 1, limit = 50) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/ai/chat/sessions/${sessionId}/messages?page=${page}&limit=${limit}`, {
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

## 🔬 Symptom Analysis Endpoints

### 1. Analyze Symptoms
**Endpoint:** `POST /ai/symptom-analysis/analyze`  
**Authentication:** Required (Bearer token)

**Request Body:**
```typescript
interface SymptomAnalysisRequest {
  symptoms: Record<string, unknown>[];  // Array of symptom objects
  sessionId?: string;                   // Optional: Associated chat session
}
```

**Example Request:**
```typescript
const analyzeSymptoms = async (symptoms: Record<string, unknown>[], sessionId?: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/ai/symptom-analysis/analyze', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      symptoms: [
        {
          description: "Severe headache",
          severity: "severe",
          duration: "2 days",
          location: "forehead"
        },
        {
          description: "High fever",
          severity: "moderate",
          duration: "1 day",
          temperature: "102°F"
        }
      ],
      sessionId: sessionId
    })
  });
  
  return await response.json();
};
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "550e8400-e29b-41d4-a716-446655440001",
  "symptoms": {
    "symptoms": [
      {
        "description": "Severe headache",
        "severity": "severe",
        "duration": "2 days",
        "location": "forehead"
      }
    ],
    "age": 30,
    "gender": "other",
    "weight": 70,
    "height": 170
  },
  "analysisResult": {
    "summary": "Based on your symptoms, you may be experiencing a viral infection or migraine",
    "possibleConditions": ["Viral infection", "Migraine", "Tension headache"],
    "urgencyLevel": "moderate",
    "recommendations": [
      "Rest and stay hydrated",
      "Monitor temperature",
      "Consider over-the-counter pain relief",
      "Seek medical attention if symptoms worsen"
    ],
    "disclaimer": "This is not medical advice. Please consult a healthcare professional."
  },
  "suggestedConditions": [
    {
      "condition": "Viral infection",
      "probability": 0.75,
      "description": "Common viral illness with fever and headache"
    }
  ],
  "urgencyLevel": "moderate",
  "recommendations": "Rest, stay hydrated, monitor symptoms. Seek medical attention if condition worsens.",
  "followUpRequired": true,
  "createdAt": "2023-01-01T00:00:00Z"
}
```

---

## 💡 Health Recommendations Endpoints

### 1. Generate Recommendations
**Endpoint:** `POST /ai/medical-recommendations/generate`  
**Authentication:** Required (Bearer token)

**Example Request:**
```typescript
const generateRecommendations = async () => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/ai/medical-recommendations/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440004",
  "userId": "550e8400-e29b-41d4-a716-446655440001",
  "recommendationType": "lifestyle",
  "title": "Improve Sleep Quality",
  "description": "Based on your health profile, focus on getting 7-9 hours of quality sleep",
  "recommendationData": {
    "category": "sleep",
    "priority": "high",
    "actions": [
      "Maintain consistent sleep schedule",
      "Create bedtime routine",
      "Limit screen time before bed",
      "Ensure comfortable sleep environment"
    ],
    "benefits": [
      "Improved cognitive function",
      "Better immune system",
      "Reduced stress levels"
    ]
  },
  "priorityScore": 85,
  "status": "pending",
  "expiresAt": "2023-02-01T00:00:00Z",
  "createdAt": "2023-01-01T00:00:00Z",
  "updatedAt": "2023-01-01T00:00:00Z"
}
```

---

## 📊 Health Analytics Endpoints

### 1. Analyze Health Trends
**Endpoint:** `GET /ai/health-analytics/trends`  
**Authentication:** Required (Bearer token)

**Example Request:**
```typescript
const analyzeHealthTrends = async () => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/ai/health-analytics/trends', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 2. Perform Risk Assessment
**Endpoint:** `POST /ai/health-analytics/risk-assessment`  
**Authentication:** Required (Bearer token)

**Request Body:**
```typescript
interface RiskAssessmentRequest {
  assessmentType: string;                // Type of assessment
  inputData: Record<string, unknown>;    // Assessment input data
}
```

**Example Request:**
```typescript
const performRiskAssessment = async (assessmentType: string, inputData: Record<string, unknown>) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/ai/health-analytics/risk-assessment', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      assessmentType: "cardiovascular",
      inputData: {
        age: 35,
        gender: "male",
        bloodPressure: "140/90",
        cholesterol: 220,
        smoking: false,
        exercise: "moderate",
        familyHistory: ["heart_disease"]
      }
    })
  });
  
  return await response.json();
};
```

---

## 🎨 Frontend UI/UX Implementation

### 1. Chat Interface Component
```typescript
// AI Chat Interface Component
interface ChatInterfaceProps {
  sessionId?: string;
  sessionType: ChatSessionType;
  onSessionCreate: (session: AiChatSession) => void;
  onMessageSend: (message: AiChatMessage) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  sessionId,
  sessionType,
  onSessionCreate,
  onMessageSend
}) => {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    setIsLoading(true);
    try {
      const message = await sendChatMessage(sessionId!, {
        content: inputMessage,
        messageType: MessageType.USER
      });
      
      setMessages(prev => [...prev, message]);
      setInputMessage('');
      onMessageSend(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-interface">
      <div className="messages-container">
        {messages.map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isLoading && <TypingIndicator />}
      </div>
      
      <div className="input-container">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button onClick={sendMessage} disabled={isLoading || !inputMessage.trim()}>
          Send
        </button>
      </div>
    </div>
  );
};
```

### 2. Symptom Analysis Component
```typescript
// Symptom Analysis Component
interface SymptomAnalysisProps {
  onAnalysisComplete: (result: SymptomCheckerResult) => void;
}

const SymptomAnalysis: React.FC<SymptomAnalysisProps> = ({ onAnalysisComplete }) => {
  const [symptoms, setSymptoms] = useState<SymptomInput[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const addSymptom = () => {
    setSymptoms(prev => [...prev, {
      description: '',
      severity: 'mild',
      duration: '',
      location: ''
    }]);
  };

  const analyzeSymptoms = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeSymptoms(symptoms);
      onAnalysisComplete(result);
    } catch (error) {
      console.error('Symptom analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="symptom-analysis">
      <h3>Symptom Analysis</h3>
      
      {symptoms.map((symptom, index) => (
        <SymptomInput
          key={index}
          symptom={symptom}
          onChange={(updatedSymptom) => {
            const newSymptoms = [...symptoms];
            newSymptoms[index] = updatedSymptom;
            setSymptoms(newSymptoms);
          }}
          onRemove={() => {
            setSymptoms(prev => prev.filter((_, i) => i !== index));
          }}
        />
      ))}
      
      <button onClick={addSymptom} className="add-symptom-btn">
        + Add Symptom
      </button>
      
      <button 
        onClick={analyzeSymptoms} 
        disabled={isAnalyzing || symptoms.length === 0}
        className="analyze-btn"
      >
        {isAnalyzing ? 'Analyzing...' : 'Analyze Symptoms'}
      </button>
    </div>
  );
};
```

### 3. Health Recommendations Component
```typescript
// Health Recommendations Component
interface HealthRecommendationsProps {
  recommendations: AiRecommendation[];
  onRecommendationAction: (id: string, action: string) => void;
}

const HealthRecommendations: React.FC<HealthRecommendationsProps> = ({
  recommendations,
  onRecommendationAction
}) => {
  const getPriorityColor = (score: number) => {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  };

  return (
    <div className="health-recommendations">
      <h3>Your Health Recommendations</h3>
      
      {recommendations.map(recommendation => (
        <div 
          key={recommendation.id} 
          className={`recommendation-card priority-${getPriorityColor(recommendation.priorityScore)}`}
        >
          <div className="recommendation-header">
            <h4>{recommendation.title}</h4>
            <span className="priority-badge">
              Priority: {recommendation.priorityScore}/100
            </span>
          </div>
          
          <p className="recommendation-description">
            {recommendation.description}
          </p>
          
          <div className="recommendation-actions">
            <button 
              onClick={() => onRecommendationAction(recommendation.id, 'accept')}
              className="accept-btn"
            >
              Accept
            </button>
            <button 
              onClick={() => onRecommendationAction(recommendation.id, 'dismiss')}
              className="dismiss-btn"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## 🔧 TypeScript Interfaces

### Core AI Chat Interfaces
```typescript
// AI Chat Session (from AiChatSession entity)
interface AiChatSession {
  id: string;                           // UUID - Primary key
  userId: string;                       // UUID - User ID
  patientId?: string;                   // UUID - Patient ID (optional)
  sessionType: string;                  // Session type
  title?: string;                       // Session title
  status: string;                       // Session status (active, completed, archived)
  metadata: Record<string, unknown>;    // Session metadata
  createdAt: string;                    // Creation timestamp
  updatedAt: string;                    // Last update timestamp
  endedAt?: string;                     // End timestamp (optional)
}

// AI Chat Message (from AiChatMessage entity)
interface AiChatMessage {
  id: string;                           // UUID - Primary key
  sessionId: string;                    // UUID - Session ID
  messageType: string;                  // Message type (user, system)
  content: string;                      // Message content
  messageData: Record<string, unknown>; // Message data
  aiModel?: string;                     // AI model used
  tokensUsed?: number;                  // Tokens used
  processingTimeMs?: number;            // Processing time
  confidenceScore?: number;             // AI confidence score
  createdAt: string;                    // Creation timestamp
}

// Symptom Checker Result (from SymptomCheckerResult entity)
interface SymptomCheckerResult {
  id: string;                           // UUID - Primary key
  sessionId?: string;                   // UUID - Session ID (optional)
  userId: string;                       // UUID - User ID
  symptoms: SymptomCheckerInput;        // Input symptoms
  analysisResult: MedicalAnalysisResult; // AI analysis
  suggestedConditions: SuggestedCondition[]; // Suggested conditions
  urgencyLevel: string;                 // Urgency level (low, moderate, high, critical)
  recommendations: string;              // AI recommendations
  followUpRequired: boolean;            // Whether follow-up is required
  createdAt: string;                    // Creation timestamp
}

// AI Recommendation (from AiRecommendation entity)
interface AiRecommendation {
  id: string;                           // UUID - Primary key
  userId: string;                       // UUID - User ID
  recommendationType: string;           // Type of recommendation
  title: string;                        // Recommendation title
  description?: string;                 // Recommendation description
  recommendationData: Record<string, unknown>; // Recommendation data
  priorityScore: number;                // Priority score (1-100)
  status: string;                       // Status (pending, accepted, dismissed)
  expiresAt?: string;                   // Expiration date
  createdAt: string;                    // Creation timestamp
  updatedAt: string;                    // Last update timestamp
}

// Health Risk Assessment (from HealthRiskAssessment entity)
interface HealthRiskAssessment {
  id: string;                           // UUID - Primary key
  userId: string;                       // UUID - User ID
  assessmentType: string;               // Type of assessment
  inputData: Record<string, unknown>;   // Input data
  riskScores: Record<string, unknown>;  // Risk scores
  recommendations: Record<string, unknown>[]; // Recommendations
  overallRiskLevel?: string;            // Overall risk level
  nextAssessmentDue?: string;           // Next assessment due date
  createdAt: string;                    // Creation timestamp
}

// Supporting Interfaces
interface SymptomCheckerInput {
  symptoms: SymptomInput[];
  age: number;
  gender: 'male' | 'female' | 'other';
  weight?: number;
  height?: number;
}

interface SymptomInput {
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration: string;
  location?: string;
  temperature?: string;
}

interface MedicalAnalysisResult {
  summary: string;
  possibleConditions: string[];
  urgencyLevel: string;
  recommendations: string[];
  disclaimer: string;
}

interface SuggestedCondition {
  condition: string;
  probability: number;
  description: string;
}

// DTO Interfaces (for API requests)
interface CreateChatSessionDto {
  patientId?: string;                   // UUID - Patient ID (optional)
  sessionType: ChatSessionType;         // Session type
  title?: string;                       // Session title
  metadata?: Record<string, unknown>;   // Additional metadata
}

interface SendChatMessageDto {
  content: string;                      // Message content
  messageType: MessageType;             // Message type
  sessionType?: string;                 // Session type for direct messages
  messageData?: Record<string, unknown>; // Additional message data
}

interface UpdateChatSessionDto {
  title?: string;                       // Session title
  status?: 'active' | 'completed' | 'archived'; // Session status
  sessionMetadata?: Record<string, unknown>; // Session metadata
}

// Enums
enum ChatSessionType {
  GENERAL = 'general',
  SYMPTOM_CHECKER = 'symptom_checker',
  MEDICAL_ADVICE = 'medical_advice',
  DRUG_INTERACTION = 'drug_interaction',
  HEALTH_ASSESSMENT = 'health_assessment'
}

enum MessageType {
  USER = 'user',
  SYSTEM = 'system'
}
```

---

## 🚀 Complete API Endpoints Summary

### AI Chat Management Endpoints

| Method | Endpoint | Description | Roles | Query Parameters |
|--------|----------|-------------|-------|------------------|
| `POST` | `/ai/chat/sessions` | Create chat session | All authenticated | Body: `CreateChatSessionDto` |
| `GET` | `/ai/chat/sessions` | Get chat sessions | All authenticated | `page`, `limit`, `sessionType`, `status` |
| `GET` | `/ai/chat/sessions/:id` | Get session by ID | All authenticated | None |
| `PATCH` | `/ai/chat/sessions/:id` | Update session | All authenticated | Body: `UpdateChatSessionDto` |
| `DELETE` | `/ai/chat/sessions/:id` | Delete session | All authenticated | None |
| `GET` | `/ai/chat/sessions/:id/messages` | Get session messages | All authenticated | `page`, `limit` |
| `POST` | `/ai/chat/sessions/:id/messages` | Send message | All authenticated | Body: `SendChatMessageDto` |
| `POST` | `/ai/chat/message` | Send direct message | All authenticated | Body: `SendChatMessageDto` |
| `GET` | `/ai/chat/history` | Get chat history | All authenticated | None |

### AI Analysis Endpoints

| Method | Endpoint | Description | Roles | Query Parameters |
|--------|----------|-------------|-------|------------------|
| `POST` | `/ai/symptom-analysis/analyze` | Analyze symptoms | All authenticated | Body: `{symptoms: Record<string, unknown>[], sessionId?: string}` |
| `POST` | `/ai/medical-recommendations/generate` | Generate recommendations | All authenticated | None |
| `GET` | `/ai/health-analytics/trends` | Get health trends | All authenticated | None |
| `POST` | `/ai/health-analytics/risk-assessment` | Perform risk assessment | All authenticated | Body: `{assessmentType: string, inputData: Record<string, unknown>}` |

---

## 🎯 Implementation Checklist

### Phase 1: Core Chat Infrastructure
- [ ] Set up API client with authentication
- [ ] Implement chat session management
- [ ] Create basic chat interface
- [ ] Add message sending/receiving
- [ ] Implement session persistence

### Phase 2: AI Analysis Features
- [ ] Build symptom analysis workflow
- [ ] Implement health recommendations display
- [ ] Add risk assessment forms
- [ ] Create analysis result visualization
- [ ] Add urgency level indicators

### Phase 3: Advanced Features
- [ ] Add real-time typing indicators
- [ ] Implement message history
- [ ] Add session search and filtering
- [ ] Create recommendation feedback system
- [ ] Add assessment history tracking

### Phase 4: UI/UX Polish
- [ ] Implement responsive design
- [ ] Add loading states and animations
- [ ] Create error handling and retry logic
- [ ] Add accessibility features
- [ ] Implement dark/light theme support

---

## 📚 Additional Resources

- **Swagger Documentation**: `https://api.unlimtedhealth.com/api/docs`
- **Health Check**: `GET https://api.unlimtedhealth.com/api/health`
- **API Version**: v1 (current)
- **Authentication**: JWT Bearer tokens
- **Rate Limiting**: Check response headers for rate limit information

---

**Note**: This comprehensive guide provides all the necessary information to build a complete AI Health Chat Dashboard frontend. The API endpoints, DTOs, and interfaces are based on the actual backend implementation, ensuring type safety and proper integration. Focus on implementing the core chat functionality first, then add the analysis features progressively.