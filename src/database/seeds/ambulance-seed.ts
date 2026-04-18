import { DataSource } from 'typeorm';
import { Ambulance, AmbulanceStatus, AmbulanceType } from '../../emergency/entities/ambulance.entity';

export async function seedAmbulances(dataSource: DataSource): Promise<void> {
  const ambulanceRepository = dataSource.getRepository(Ambulance);

  // Check if ambulances already exist
  const existingAmbulances = await ambulanceRepository.count();
  if (existingAmbulances > 0) {
    console.log('🚑 Ambulances already seeded, skipping...');
    return;
  }

  const ambulances = [
    {
      vehicleNumber: 'AMB-001',
      licensePlate: 'NYC-001',
      type: AmbulanceType.BASIC,
      status: AmbulanceStatus.AVAILABLE,
      isActive: true,
      currentLatitude: 40.7128,
      currentLongitude: -74.0060,
      contactNumber: '+1234567890',
      crewMembers: {
        paramedic: 'John Smith',
        emt: 'Jane Doe',
        driver: 'Mike Wilson',
        additional: ['Sarah Johnson']
      },
      equipmentList: ['Defibrillator', 'Oxygen', 'First Aid Kit'],
      lastMaintenance: new Date('2024-01-01'),
      nextMaintenance: new Date('2024-04-01'),
    },
    {
      vehicleNumber: 'AMB-002',
      licensePlate: 'NYC-002',
      type: AmbulanceType.ADVANCED,
      status: AmbulanceStatus.AVAILABLE,
      isActive: true,
      currentLatitude: 40.7589,
      currentLongitude: -73.9851,
      contactNumber: '+1234567891',
      crewMembers: {
        paramedic: 'Mike Johnson',
        emt: 'Sarah Wilson',
        driver: 'Tom Davis',
        additional: ['Emily Brown']
      },
      equipmentList: ['Defibrillator', 'Oxygen', 'Ventilator', 'Advanced Monitoring'],
      lastMaintenance: new Date('2024-01-15'),
      nextMaintenance: new Date('2024-04-15'),
    },
    {
      vehicleNumber: 'AMB-003',
      licensePlate: 'NYC-003',
      type: AmbulanceType.CRITICAL_CARE,
      status: AmbulanceStatus.AVAILABLE,
      isActive: true,
      currentLatitude: 40.7505,
      currentLongitude: -73.9934,
      contactNumber: '+1234567892',
      crewMembers: {
        paramedic: 'Dr. Emily Brown',
        emt: 'Nurse Tom Davis',
        driver: 'John Smith',
        additional: ['Dr. Sarah Wilson']
      },
      equipmentList: ['Defibrillator', 'Oxygen', 'Ventilator', 'ECG Monitor', 'IV Pumps'],
      lastMaintenance: new Date('2024-01-10'),
      nextMaintenance: new Date('2024-04-10'),
    },
  ];

  for (const ambulanceData of ambulances) {
    const ambulance = ambulanceRepository.create(ambulanceData);
    await ambulanceRepository.save(ambulance);
  }

  console.log(`🚑 Seeded ${ambulances.length} ambulances successfully`);
} 