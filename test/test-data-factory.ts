import { faker } from '@faker-js/faker';
import { ReferralType, ReferralPriority } from '../src/referrals/entities/referral.entity';

/**
 * Test data factory for generating consistent test data
 * across all automated tests in the healthcare system
 */
export class TestDataFactory {
  /**
   * Generate test user data for different roles
   */
  static createUser(role: 'patient' | 'doctor' | 'admin' | 'nurse' = 'patient') {
    const timestamp = Date.now();
    const processId = process.pid || Math.floor(Math.random() * 10000);
    const uniqueId = Math.floor(Math.random() * 1000000);
    
    const baseUser = {
      name: faker.person.fullName(), // Required field for RegisterDto
      email: `test-${role}-${timestamp}-${processId}-${uniqueId}@example.com`,
      password: 'TestPassword123!',
      phone: faker.phone.number(),
      roles: [role],
    };

    switch (role) {
      case 'doctor':
        return {
          ...baseUser,
          specialization: faker.helpers.arrayElement(['Cardiology', 'Neurology', 'Pediatrics']),
          licenseNumber: faker.string.alphanumeric(10),
          yearsOfExperience: faker.number.int({ min: 1, max: 30 }),
        };
      case 'patient':
        return {
          ...baseUser,
          dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
          gender: faker.helpers.arrayElement(['male', 'female', 'other']),
          emergencyContact: {
            name: faker.person.fullName(),
            phone: faker.phone.number(),
            relationship: faker.helpers.arrayElement(['spouse', 'parent', 'sibling']),
          },
        };
      case 'admin':
        return {
          ...baseUser,
          department: faker.helpers.arrayElement(['IT', 'Administration', 'Management']),
          accessLevel: 'high',
        };
      default:
        return baseUser;
    }
  }

  /**
   * Generate test patient data
   */
  static createPatient(userId?: string) {
    return {
      userId: userId || faker.string.uuid(),
      medicalRecordNumber: faker.string.alphanumeric(10),
      emergencyContactName: faker.person.fullName(),
      emergencyContactPhone: faker.phone.number(),
      emergencyContactRelationship: faker.helpers.arrayElement(['spouse', 'parent', 'sibling', 'friend']),
      bloodType: faker.helpers.arrayElement(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
      allergies: faker.helpers.arrayElements(['Penicillin', 'Peanuts', 'Shellfish'], { min: 0, max: 2 }).join(', '),
      chronicConditions: faker.helpers.arrayElements(['Diabetes', 'Hypertension', 'Asthma'], { min: 0, max: 2 }).join(', '),
      currentMedications: faker.helpers.arrayElements(['Aspirin', 'Metformin', 'Lisinopril'], { min: 0, max: 3 }).join(', '),
      insuranceProvider: faker.helpers.arrayElement(['Blue Cross', 'Aetna', 'Cigna', 'UnitedHealth']),
      insurancePolicyNumber: faker.string.alphanumeric(12),
      preferredLanguage: faker.helpers.arrayElement(['English', 'Spanish', 'French', 'German']),
      consentDataSharing: faker.datatype.boolean(),
      consentResearch: faker.datatype.boolean(),
      consentMarketing: faker.datatype.boolean(),
    };
  }

  /**
   * Generate test appointment data with proper foreign key relationships
   */
  static createAppointment(patientId?: string, doctorId?: string, centerId?: string) {
    const futureDate = faker.date.future();
    return {
      patientId: patientId || faker.string.uuid(),
      centerId: centerId || '550e8400-e29b-41d4-a716-446655440001', // Use the test center ID
      providerId: doctorId || faker.string.uuid(), // Add providerId for foreign key
      appointmentDate: futureDate.toISOString(),
      reason: faker.lorem.sentence(),
      notes: faker.lorem.paragraph(),
      durationMinutes: faker.helpers.arrayElement([15, 30, 45, 60]),
      priority: faker.helpers.arrayElement(['low', 'normal', 'high', 'urgent']),
      doctor: faker.person.fullName(), // Required field
      isRecurring: false,
    };
  }

  /**
   * Generate test medical record data with proper foreign key relationships
   */
  static createMedicalRecord(patientId?: string, doctorId?: string) {
    return {
      patientId: patientId || faker.string.uuid(),
      centerId: '550e8400-e29b-41d4-a716-446655440001', // Use the test center ID
      createdBy: doctorId || faker.string.uuid(), // Add createdBy for foreign key
      recordType: faker.helpers.arrayElement(['diagnosis', 'prescription', 'lab_result', 'imaging', 'surgery']),
      title: faker.lorem.words(3),
      description: faker.lorem.sentence(),
      diagnosis: faker.helpers.arrayElement([
        'Hypertension',
        'Type 2 Diabetes',
        'Common Cold',
        'Migraine',
        'Anxiety Disorder',
      ]),
      treatment: faker.lorem.paragraph(),
      notes: faker.lorem.paragraph(),
      followUp: faker.lorem.sentence(),
      medications: [
        {
          name: faker.helpers.arrayElement(['Aspirin', 'Metformin', 'Lisinopril']),
          dosage: faker.helpers.arrayElement(['5mg', '10mg', '25mg', '50mg']),
          frequency: faker.helpers.arrayElement(['Once daily', 'Twice daily', 'Three times daily']),
          duration: faker.helpers.arrayElement(['7 days', '14 days', '30 days', 'Ongoing']),
        },
      ],
      recordData: {
        vitals: {
          bloodPressure: `${faker.number.int({ min: 110, max: 140 })}/${faker.number.int({ min: 70, max: 90 })}`,
          heartRate: faker.number.int({ min: 60, max: 100 }),
          temperature: faker.number.float({ min: 97.0, max: 99.5, fractionDigits: 1 }),
          weight: faker.number.float({ min: 50, max: 120, fractionDigits: 1 }),
          height: faker.number.int({ min: 150, max: 200 }),
        },
        symptoms: faker.helpers.arrayElements([
          'Headache',
          'Fatigue',
          'Nausea',
          'Dizziness',
          'Chest pain',
        ], { min: 1, max: 3 }),
      },
      tags: faker.helpers.arrayElements(['urgent', 'follow-up', 'chronic', 'acute'], { min: 1, max: 2 }),
      category: faker.helpers.arrayElement(['cardiology', 'neurology', 'pediatrics', 'general']),
      isSensitive: faker.datatype.boolean(),
      isShareable: faker.datatype.boolean(),
    };
  }

  /**
   * Generate test chat room data
   */
  static createChatRoom(participantIds: string[] = []) {
    return {
      name: faker.company.name() + ' Consultation',
      type: faker.helpers.arrayElement(['direct', 'group', 'consultation', 'emergency', 'support']),
      participantIds: participantIds.length > 0 ? participantIds : [faker.string.uuid(), faker.string.uuid()],
      maxParticipants: faker.number.int({ min: 2, max: 50 }),
      isEncrypted: faker.datatype.boolean(),
      autoDeleteAfterDays: faker.number.int({ min: 30, max: 365 }),
      roomSettings: {
        allowFileSharing: faker.datatype.boolean(),
        maxFileSize: faker.number.int({ min: 1024, max: 10485760 }),
        allowedFileTypes: ['pdf', 'jpg', 'png', 'doc', 'docx'],
      },
    };
  }

  /**
   * Generate test message data
   */
  static createMessage(roomId?: string, senderId?: string) {
    return {
      roomId: roomId || faker.string.uuid(),
      senderId: senderId || faker.string.uuid(),
      content: faker.lorem.sentence(),
      messageType: faker.helpers.arrayElement(['text', 'image', 'file', 'voice']),
      metadata: {
        priority: faker.helpers.arrayElement(['low', 'normal', 'high', 'urgent']),
        category: faker.helpers.arrayElement(['general', 'medical', 'administrative']),
      },
    };
  }

  /**
   * Generate test healthcare center data
   */
  static createHealthcareCenter() {
    return {
      name: faker.company.name() + ' Medical Center',
      type: faker.helpers.arrayElement(['hospital', 'clinic', 'urgent_care', 'specialty']),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: 'USA',
      },
      phone: faker.phone.number(),
      email: faker.internet.email(),
      website: faker.internet.url(),
      services: faker.helpers.arrayElements([
        'Emergency Care',
        'Primary Care',
        'Cardiology',
        'Neurology',
        'Pediatrics',
        'Radiology',
      ], { min: 2, max: 4 }),
      operatingHours: {
        monday: '8:00 AM - 6:00 PM',
        tuesday: '8:00 AM - 6:00 PM',
        wednesday: '8:00 AM - 6:00 PM',
        thursday: '8:00 AM - 6:00 PM',
        friday: '8:00 AM - 6:00 PM',
        saturday: '9:00 AM - 2:00 PM',
        sunday: 'Closed',
      },
      isActive: true,
    };
  }

  /**
   * Generate test referral data with proper foreign key relationships
   */
  static createReferral(patientId?: string, fromDoctorId?: string, toDoctorId?: string) {
    return {
      patientId: patientId || faker.string.uuid(),
      referringCenterId: '550e8400-e29b-41d4-a716-446655440001', // Use the test center ID
      receivingCenterId: '550e8400-e29b-41d4-a716-446655440001', // Use the test center ID
      receivingProviderId: toDoctorId || faker.string.uuid(), // Add receiving provider ID
      referralType: ReferralType.SPECIALIST, // Required enum value
      priority: ReferralPriority.NORMAL, // Required enum value
      reason: faker.lorem.sentence(), // Required field
      clinicalNotes: faker.lorem.paragraph(),
      diagnosis: faker.helpers.arrayElement(['Hypertension', 'Diabetes', 'Asthma', 'Migraine']),
      instructions: faker.lorem.sentence(),
      scheduledDate: faker.date.future(),
      expirationDate: faker.date.future({ years: 1 }),
      metadata: {
        urgencyScore: faker.number.int({ min: 1, max: 10 }),
        insuranceVerified: faker.datatype.boolean(),
      },
      medications: [
        {
          name: faker.helpers.arrayElement(['Metformin', 'Lisinopril', 'Aspirin']),
          dosage: faker.helpers.arrayElement(['5mg', '10mg', '25mg', '50mg']),
          frequency: faker.helpers.arrayElement(['Once daily', 'Twice daily', 'Three times daily']),
        },
      ],
      allergies: [
        {
          allergen: faker.helpers.arrayElement(['Penicillin', 'Sulfa drugs', 'Peanuts']),
          reaction: faker.helpers.arrayElement(['Rash', 'Anaphylaxis', 'Hives']),
          severity: faker.helpers.arrayElement(['Mild', 'Moderate', 'Severe']),
        },
      ],
      medicalHistory: faker.lorem.paragraph(),
    };
  }

  /**
   * Generate multiple test entities
   */
  static createMultiple<T>(factory: () => T, count: number): T[] {
    return Array.from({ length: count }, () => factory());
  }

  /**
   * Generate test credentials for authentication
   */
  static createCredentials(role: string = 'patient') {
    return {
      email: `test-${role}-${faker.string.alphanumeric(8)}@example.com`,
      password: 'TestPassword123!',
    };
  }

  /**
   * Generate test file upload data
   */
  static createFileUpload() {
    return {
      fieldname: 'file',
      originalname: 'test-document.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 1024,
      buffer: Buffer.from('test file content'),
      destination: '',
      filename: '',
      path: '',
      stream: null,
    };
  }
} 