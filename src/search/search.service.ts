import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { HealthcareCenter } from '../centers/entities/center.entity';
import { Patient } from '../patients/entities/patient.entity';
import { MedicalRecord } from '../medical-records/entities/medical-record.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { CenterService } from '../centers/entities/center-service.entity';

export interface SearchResult {
    id: string;
    entity_type: 'patient' | 'medical_record' | 'file' | 'appointment' | 'center' | 'doctor' | 'service';
    entity_id: string;
    title: string;
    description?: string;
    metadata: Record<string, unknown>;
    created_at: Date;
}

@Injectable()
export class SearchService {
    private readonly logger = new Logger(SearchService.name);

    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(HealthcareCenter)
        private centersRepository: Repository<HealthcareCenter>,
        @InjectRepository(Patient)
        private patientsRepository: Repository<Patient>,
        @InjectRepository(MedicalRecord)
        private recordsRepository: Repository<MedicalRecord>,
        @InjectRepository(Appointment)
        private appointmentsRepository: Repository<Appointment>,
        @InjectRepository(CenterService)
        private servicesRepository: Repository<CenterService>,
    ) { }

    async globalSearch(query: string, roles: string[], _userId: string): Promise<SearchResult[]> {
        const searchTasks: Promise<SearchResult[]>[] = [];

        // All roles can search for centers, doctors, and services
        searchTasks.push(this.searchCenters(query));
        searchTasks.push(this.searchDoctors(query));
        searchTasks.push(this.searchServices(query));

        // Role-based filtering for sensitive data
        const isMedicalPro = roles.some(role => ['admin', 'doctor', 'staff', 'center'].includes(role));

        if (isMedicalPro) {
            searchTasks.push(this.searchPatients(query));
            searchTasks.push(this.searchMedicalRecords(query));
            searchTasks.push(this.searchAppointments(query));
        }

        const taskResults = await Promise.all(searchTasks);
        return taskResults.flat().sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }

    private async searchCenters(query: string): Promise<SearchResult[]> {
        const centers = await this.centersRepository.createQueryBuilder('center')
            .where('(center.name ILIKE :query OR center.description ILIKE :query OR center.city ILIKE :query OR center.type ILIKE :query)', { query: `%${query}%` })
            .andWhere('center.isActive = :isActive', { isActive: true })
            .limit(10)
            .getMany();

        return centers.map(center => ({
            id: center.id,
            entity_type: 'center',
            entity_id: center.id,
            title: center.name,
            description: center.description,
            metadata: {
                type: center.type,
                city: center.city,
                address: center.address,
                phone: center.phone,
            },
            created_at: center.createdAt,
        }));
    }

    private async searchDoctors(query: string): Promise<SearchResult[]> {
        const doctors = await this.usersRepository.createQueryBuilder('user')
            .leftJoinAndSelect('user.profile', 'profile')
            .where('user.roles::text ILIKE :roleQuery', { roleQuery: '%doctor%' })
            .andWhere('(user.displayId ILIKE :query OR profile.firstName ILIKE :query OR profile.lastName ILIKE :query OR profile.specialization ILIKE :query OR profile.displayName ILIKE :query OR profile.practiceNumber ILIKE :query)', { query: `%${query}%` })
            .andWhere('user.isActive = :isActive', { isActive: true })
            .limit(10)
            .getMany();

        return doctors.map(doctor => ({
            id: doctor.id,
            entity_type: 'doctor',
            entity_id: doctor.id,
            title: `${doctor.profile?.firstName || ''} ${doctor.profile?.lastName || ''}`.trim() || doctor.profile?.displayName || 'Doctor',
            description: doctor.profile?.specialization || 'Healthcare Professional',
            metadata: {
                specialization: doctor.profile?.specialization,
                experience: doctor.profile?.experience,
                phone: doctor.profile?.phone,
                displayId: doctor.displayId,
            },
            created_at: doctor.createdAt,
        }));
    }

    private async searchServices(query: string): Promise<SearchResult[]> {
        const services = await this.servicesRepository.createQueryBuilder('service')
            .leftJoinAndSelect('service.center', 'center')
            .where('(service.serviceName ILIKE :query OR service.description ILIKE :query OR service.serviceCategory ILIKE :query)', { query: `%${query}%` })
            .andWhere('service.isActive = :isActive', { isActive: true })
            .limit(10)
            .getMany();

        return services.map(service => ({
            id: service.id,
            entity_type: 'service',
            entity_id: service.id,
            title: service.serviceName,
            description: service.description,
            metadata: {
                category: service.serviceCategory,
                price: service.basePrice,
                currency: service.currency,
                centerName: service.center?.name,
            },
            created_at: service.createdAt,
        }));
    }

    private async searchPatients(query: string): Promise<SearchResult[]> {
        const patients = await this.patientsRepository.createQueryBuilder('patient')
            .leftJoinAndSelect('patient.user', 'user')
            .leftJoinAndSelect('user.profile', 'profile')
            .where('patient.isActive = :isActive', { isActive: true })
            .andWhere('(patient.firstName ILIKE :query OR patient.lastName ILIKE :query OR patient.patientId ILIKE :query OR patient.medicalRecordNumber ILIKE :query OR profile.firstName ILIKE :query OR profile.lastName ILIKE :query OR patient.email ILIKE :query)', { query: `%${query}%` })
            .limit(10)
            .getMany();

        return patients.map(patient => ({
            id: patient.id,
            entity_type: 'patient',
            entity_id: patient.id,
            title: `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient',
            description: `Patient ID: ${patient.patientId}`,
            metadata: {
                patientId: patient.patientId,
                mrn: patient.medicalRecordNumber,
                email: patient.email,
                phone: patient.phone,
            },
            created_at: patient.createdAt,
        }));
    }

    private async searchMedicalRecords(query: string): Promise<SearchResult[]> {
        const records = await this.recordsRepository.createQueryBuilder('record')
            .leftJoinAndSelect('record.patient', 'patient')
            .where('(record.title ILIKE :query OR record.description ILIKE :query OR record.diagnosis ILIKE :query OR record.category ILIKE :query OR record.recordType ILIKE :query)', { query: `%${query}%` })
            .andWhere('record.status = :status', { status: 'active' })
            .limit(10)
            .getMany();

        return records.map(record => ({
            id: record.id,
            entity_type: 'medical_record',
            entity_id: record.id,
            title: record.title,
            description: record.diagnosis || record.description,
            metadata: {
                type: record.recordType,
                category: record.category,
                patientName: `${record.patient?.firstName || ''} ${record.patient?.lastName || ''}`.trim(),
            },
            created_at: record.createdAt,
        }));
    }

    private async searchAppointments(query: string): Promise<SearchResult[]> {
        const appointments = await this.appointmentsRepository.createQueryBuilder('appointment')
            .leftJoinAndSelect('appointment.patient', 'patient')
            .leftJoinAndSelect('appointment.center', 'center')
            .where('(appointment.reason ILIKE :query OR appointment.notes ILIKE :query OR appointment.doctor ILIKE :query)', { query: `%${query}%` })
            .limit(10)
            .getMany();

        return appointments.map(app => ({
            id: app.id,
            entity_type: 'appointment',
            entity_id: app.id,
            title: `Appt: ${app.reason || 'General'}`,
            description: `With ${app.doctor} on ${new Date(app.appointmentDate).toLocaleDateString()}`,
            metadata: {
                status: app.appointmentStatus,
                date: app.appointmentDate,
                patientName: `${app.patient?.firstName || ''} ${app.patient?.lastName || ''}`.trim(),
                centerName: app.center?.name,
            },
            created_at: app.createdAt,
        }));
    }

    async getSuggestions(query: string, type?: 'users' | 'centers'): Promise<string[]> {
        const suggestions: Set<string> = new Set();
        const searchTasks: Promise<void>[] = [];

        if (!type || type === 'users') {
            searchTasks.push(
                this.usersRepository.createQueryBuilder('user')
                    .leftJoinAndSelect('user.profile', 'profile')
                    .where('(profile.firstName ILIKE :query OR profile.lastName ILIKE :query OR profile.displayName ILIKE :query OR profile.specialization ILIKE :query)', { query: `%${query}%` })
                    .andWhere('user.isActive = :isActive', { isActive: true })
                    .limit(5)
                    .getMany()
                    .then(users => {
                        users.forEach(user => {
                            if (user.profile) {
                                if (user.profile.displayName) suggestions.add(user.profile.displayName);
                                if (user.profile.firstName) suggestions.add(user.profile.firstName);
                                if (user.profile.lastName) suggestions.add(user.profile.lastName);
                                if (user.profile.specialization) suggestions.add(user.profile.specialization);
                            }
                        });
                    })
            );
        }

        if (!type || type === 'centers') {
            searchTasks.push(
                this.centersRepository.createQueryBuilder('center')
                    .where('center.name ILIKE :query', { query: `%${query}%` })
                    .andWhere('center.isActive = :isActive', { isActive: true })
                    .limit(5)
                    .getMany()
                    .then(centers => {
                        centers.forEach(center => suggestions.add(center.name));
                    })
            );
        }

        // Add a task to search common diagnoses from medical records
        searchTasks.push(
            this.recordsRepository.createQueryBuilder('record')
                .select('DISTINCT record.diagnosis', 'diagnosis')
                .where('record.diagnosis ILIKE :query', { query: `%${query}%` })
                .limit(5)
                .getRawMany()
                .then(records => {
                    records.forEach(r => {
                        if (r.diagnosis) suggestions.add(r.diagnosis);
                    });
                })
        );

        await Promise.all(searchTasks);
        return Array.from(suggestions)
            .filter(s => s && s.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 10);
    }
}
