import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function seedClinicalData() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await dataSource.initialize();
    console.log('Connected to database');

    // Get a patient and center to link data
    const patients = await dataSource.query('SELECT id FROM patients LIMIT 1');
    const centers = await dataSource.query('SELECT id FROM healthcare_centers LIMIT 1');
    const users = await dataSource.query('SELECT id FROM users LIMIT 1');

    if (patients.length === 0 || centers.length === 0 || users.length === 0) {
      console.log('Missing core data (patients/centers/users). Please ensure they exist first.');
      return;
    }

    const patientId = patients[0].id;
    const centerId = centers[0].id;
    const userId = users[0].id;

    console.log('Seeding care tasks...');
    await dataSource.query(`
      INSERT INTO care_tasks (id, "patientId", "assignedToId", "createdBy", title, description, status, priority, "dueAt")
      VALUES 
        (uuid_generate_v4(), '${patientId}', '${userId}', '${userId}', 'Review Vitals', 'Monitor blood pressure every 4 hours', 'pending', 'high', now() + interval '2 hours'),
        (uuid_generate_v4(), '${patientId}', '${userId}', '${userId}', 'Morning Rounds', 'Daily clinical assessment', 'pending', 'medium', now() + interval '4 hours')
      ON CONFLICT DO NOTHING;
    `);

    console.log('Seeding prescriptions...');
    await dataSource.query(`
      INSERT INTO prescriptions (id, "patientId", "providerId", "prescriptionNumber", "drugName", dosage, frequency, status, "verificationStatus")
      VALUES 
        (uuid_generate_v4(), '${patientId}', '${userId}', 'RX-001', 'Amoxicillin', '500mg', 'TID', 'active', 'awaiting'),
        (uuid_generate_v4(), '${patientId}', '${userId}', 'RX-002', 'Paracetamol', '1g', 'PRN', 'active', 'awaiting')
      ON CONFLICT DO NOTHING;
    `);

    console.log('Seeding encounters...');
    await dataSource.query(`
      INSERT INTO encounters (id, "patientId", "practitionerId", "centerId", type, title, summary, status)
      VALUES 
        (uuid_generate_v4(), '${patientId}', '${userId}', '${centerId}', 'consultation', 'Initial Assessment', 'Patient presents with mild fever.', 'finished'),
        (uuid_generate_v4(), '${patientId}', '${userId}', '${centerId}', 'lab', 'Routine Blood Test', 'CBC and lipid profile ordered.', 'active')
      ON CONFLICT DO NOTHING;
    `);

    console.log('Seeding audit logs...');
    await dataSource.query(`
      INSERT INTO audit_logs (id, "userId", action, "entityType", "entityId", timestamp)
      VALUES 
        (uuid_generate_v4(), '${userId}', 'ACCESS_PATIENT_RECORDS', 'Patient', '${patientId}', now() - interval '1 hour'),
        (uuid_generate_v4(), '${userId}', 'CREATE_PRESCRIPTION', 'Prescription', uuid_generate_v4(), now() - interval '30 minutes')
      ON CONFLICT DO NOTHING;
    `);

    console.log('✅ Clinical seed data inserted successfully');
  } catch (error) {
    console.error('Error seeding clinical data:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

seedClinicalData();
