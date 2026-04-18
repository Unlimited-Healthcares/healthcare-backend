export interface EmergencyMedicalData {
  allergies?: string[];
  medications?: string[];
  medicalConditions?: string[];
  bloodType?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
  };
  vitals?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
    respiratoryRate?: number;
  };
  symptoms?: string[];
  painLevel?: number;
  consciousness?: 'alert' | 'drowsy' | 'unconscious';
  mobility?: 'ambulatory' | 'wheelchair' | 'stretcher' | 'immobile';
  specialNeeds?: string[];
} 