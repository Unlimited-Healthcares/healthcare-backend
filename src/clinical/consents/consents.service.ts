import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsentForm } from './entities/consent-form.entity';
import { CreateConsentDto } from './dto';

@Injectable()
export class ConsentsService {
    constructor(
        @InjectRepository(ConsentForm)
        private readonly consentRepository: Repository<ConsentForm>,
    ) { }

    async create(createConsentDto: CreateConsentDto): Promise<ConsentForm> {
        const consent = (this.consentRepository.create({
            ...createConsentDto,
            signedAt: new Date(),
            ipAddress: createConsentDto.ipAddress,
            status: 'signed',
        }) as unknown) as ConsentForm;
        return this.consentRepository.save(consent);
    }

    async sign(id: string, ipAddress: string): Promise<ConsentForm> {
        const consent = await this.consentRepository.findOne({ where: { id } });
        if (!consent) throw new NotFoundException('Consent form not found');
        consent.status = 'signed';
        consent.signedAt = new Date();
        consent.ipAddress = ipAddress;
        return this.consentRepository.save(consent);
    }

    async getPatientConsents(patientId: string): Promise<ConsentForm[]> {
        return this.consentRepository.find({
            where: { patientId },
            order: { createdAt: 'DESC' },
        });
    }
}
