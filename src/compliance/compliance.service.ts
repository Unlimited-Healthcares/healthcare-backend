import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsentRecord } from './entities/consent-record.entity';
import { DataDeletionRequest } from './entities/data-deletion-request.entity';
import { AuditService } from '../audit/audit.service';
import { AuditLogService } from '../audit/audit-log.service';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    @InjectRepository(ConsentRecord)
    private consentRepository: Repository<ConsentRecord>,
    @InjectRepository(DataDeletionRequest)
    private dataDeletionRepository: Repository<DataDeletionRequest>,
    private auditService: AuditService,
    private auditLogService: AuditLogService,
  ) {}

  /**
   * Get recent security activity for a user
   */
  async getUserActivity(userId: string) {
    try {
      return await this.auditLogService.getAuditLogs({ userId }, 1, 20);
    } catch (error) {
      this.logger.error(`Failed to get user activity: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Records user consent for data processing
   */
  async recordConsent(userId: string, consentType: string, consentGiven: boolean, ipAddress: string): Promise<ConsentRecord> {
    try {
      const consent = this.consentRepository.create({
        userId,
        consentType,
        consentGiven,
        ipAddress,
        consentDate: new Date(),
      });

      const savedConsent = await this.consentRepository.save(consent);
      
      await this.auditService.logActivity(
        userId,
        'CONSENT',
        consentGiven ? 'GRANTED' : 'REVOKED',
        `User ${consentGiven ? 'granted' : 'revoked'} ${consentType} consent`,
        { consentId: savedConsent.id }
      );

      return savedConsent;
    } catch (error) {
      this.logger.error(`Failed to record consent: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Checks if a user has given consent for specific processing
   */
  async hasUserConsent(userId: string, consentType: string): Promise<boolean> {
    try {
      const consent = await this.consentRepository.findOne({
        where: { userId, consentType },
        order: { consentDate: 'DESC' },
      });

      return consent?.consentGiven || false;
    } catch (error) {
      this.logger.error(`Failed to check user consent: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Records a request for data deletion (GDPR right to be forgotten)
   */
  async requestDataDeletion(userId: string, reason?: string): Promise<DataDeletionRequest> {
    try {
      const request = this.dataDeletionRepository.create({
        userId,
        reason,
        requestDate: new Date(),
        status: 'PENDING',
      });

      const savedRequest = await this.dataDeletionRepository.save(request);
      
      await this.auditService.logActivity(
        userId,
        'DATA_DELETION',
        'REQUESTED',
        'User requested data deletion',
        { requestId: savedRequest.id }
      );

      return savedRequest;
    } catch (error) {
      this.logger.error(`Failed to request data deletion: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all active consents for a user
   */
  async getUserConsents(userId: string): Promise<ConsentRecord[]> {
    try {
      return this.consentRepository.find({
        where: { userId, consentGiven: true },
      });
    } catch (error) {
      this.logger.error(`Failed to get user consents: ${error.message}`, error.stack);
      throw error;
    }
  }
} 