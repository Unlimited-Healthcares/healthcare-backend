// Medical types and interfaces

/**
 * Health risk assessment data structure
 */
export interface HealthRiskData {
  riskFactors: string[];
  scores: Record<string, number>;
  recommendations: string[];
  confidenceLevel: number;
  assessmentDate: Date;
  nextReviewDate?: Date;
}

/**
 * Medical analysis input data
 */
export interface MedicalAnalysisInput {
  symptoms: string[];
  patientAge: number;
  patientGender: 'male' | 'female' | 'other';
  medicalHistory: string[];
  currentMedications: string[];
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    respiratoryRate?: number;
  };
  additionalNotes?: string;
}

/**
 * Medical analysis result data
 */
export interface MedicalAnalysisResult {
  possibleDiagnoses: {
    condition: string;
    probability: number;
    description: string;
    icd10Code?: string;
  }[];
  recommendedTests: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
  recommendations: string[];
  disclaimer: string;
  confidence: number;
}

/**
 * Medical image analysis data
 */
export interface MedicalImageAnalysis {
  imageType: 'xray' | 'mri' | 'ct' | 'ultrasound' | 'other';
  findings: {
    region: string;
    description: string;
    severity: 'normal' | 'mild' | 'moderate' | 'severe';
    confidence: number;
  }[];
  overallAssessment: string;
  recommendedActions: string[];
  technicalQuality: {
    clarity: number;
    positioning: string;
    artifacts: string[];
  };
}

/**
 * Symptom checker input data
 */
export interface SymptomCheckerInput {
  symptoms: {
    name: string;
    severity: 1 | 2 | 3 | 4 | 5;
    duration: string;
    location?: string;
  }[];
  patientInfo: {
    age: number;
    gender: 'male' | 'female' | 'other';
    weight?: number;
    height?: number;
  };
  medicalHistory: string[];
  currentMedications: string[];
}

/**
 * Symptom checker result data
 */
export interface SymptomCheckerResult {
  possibleConditions: {
    name: string;
    probability: number;
    description: string;
    commonSymptoms: string[];
    rareSymptoms: string[];
  }[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
  recommendedActions: string[];
  redFlags: string[];
  selfCareOptions: string[];
  whenToSeekCare: string;
}

/**
 * User health profile data
 */
export interface UserHealthProfileData {
  basicInfo: {
    age: number;
    gender: 'male' | 'female' | 'other';
    height: number;
    weight: number;
    bloodType?: string;
  };
  medicalHistory: {
    conditions: string[];
    surgeries: string[];
    allergies: string[];
    familyHistory: string[];
  };
  currentMedications: {
    name: string;
    dosage: string;
    frequency: string;
    startDate: Date;
    prescribedBy: string;
  }[];
  lifestyle: {
    smokingStatus: 'never' | 'former' | 'current';
    alcoholConsumption: 'none' | 'light' | 'moderate' | 'heavy';
    exerciseFrequency: 'none' | 'light' | 'moderate' | 'heavy';
    dietType: string;
  };
  vitalSigns: {
    bloodPressure: {
      systolic: number;
      diastolic: number;
      date: Date;
    }[];
    heartRate: {
      value: number;
      date: Date;
    }[];
    weight: {
      value: number;
      date: Date;
    }[];
  };
}

/**
 * AI chat message context data
 */
export interface ChatMessageContext {
  messageType: 'text' | 'image' | 'file' | 'symptom_report' | 'health_query';
  patientContext?: {
    age: number;
    gender: string;
    medicalHistory: string[];
    currentSymptoms: string[];
  };
  conversationHistory: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }[];
  sessionMetadata: {
    sessionId: string;
    startTime: Date;
    lastActivity: Date;
    messageCount: number;
  };
}

/**
 * Medical recommendation data
 */
export interface MedicalRecommendationData {
  category: 'lifestyle' | 'medication' | 'screening' | 'follow_up' | 'emergency';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionItems: {
    action: string;
    timeline: string;
    completed: boolean;
  }[];
  evidenceLevel: 'low' | 'moderate' | 'high';
  sources: string[];
  contraindications: string[];
}

/**
 * Blood donation related data
 */
export interface BloodDonationData {
  donorInfo: {
    bloodType: string;
    lastDonation?: Date;
    eligibilityStatus: 'eligible' | 'temporarily_deferred' | 'permanently_deferred';
    deferralReason?: string;
  };
  donationHistory: {
    date: Date;
    location: string;
    volume: number;
    complications?: string[];
  }[];
  healthScreening: {
    hemoglobin: number;
    bloodPressure: string;
    pulse: number;
    temperature: number;
    weight: number;
    screeningDate: Date;
  };
}

/**
 * Emergency medical data
 */
export interface EmergencyMedicalData {
  emergencyType: 'cardiac' | 'respiratory' | 'trauma' | 'neurological' | 'other';
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  symptoms: string[];
  vitalSigns: {
    consciousness: 'alert' | 'verbal' | 'pain' | 'unresponsive';
    breathing: 'normal' | 'labored' | 'absent';
    circulation: 'normal' | 'weak' | 'absent';
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
  };
  interventions: {
    intervention: string;
    timestamp: Date;
    performedBy: string;
    outcome: string;
  }[];
  transportInfo?: {
    destination: string;
    eta: Date;
    transportMode: 'ambulance' | 'helicopter' | 'other';
  };
} 