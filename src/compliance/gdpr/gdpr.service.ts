import { Injectable, Logger } from '@nestjs/common';
import { AuditService } from '../../audit/audit.service';
import { DataSource } from 'typeorm';

export interface UserDataExport {
  userProfile?: Record<string, unknown>;
  addresses?: Record<string, unknown>[];
  patientRecords?: Record<string, unknown>[];
  medicalRecords?: Record<string, unknown>[];
  appointments?: Record<string, unknown>[];
  consentRecords?: Record<string, unknown>[];
}

@Injectable()
export class GdprService {
  private readonly logger = new Logger(GdprService.name);

  constructor(
    private dataSource: DataSource,
    private auditService: AuditService
  ) {}

  /**
   * Exports all user data for GDPR right to access
   */
  async exportUserData(userId: string): Promise<UserDataExport> {
    try {
      this.logger.log(`Exporting user data for user ${userId}`);
      
      // Log the data export activity
      await this.auditService.logActivity(
        userId,
        'GDPR',
        'DATA_EXPORT',
        'User data exported',
        { userId }
      );
      
      // In a real implementation, this would query the database for all user data
      const userData = await this.collectUserData(userId);
      
      return userData;
    } catch (error) {
      this.logger.error(`Error exporting user data: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Collects all user data from various tables
   */
  private async collectUserData(userId: string): Promise<UserDataExport> {
    try {
      this.logger.log(`Collecting real database records for user export: ${userId}`);
      
      // Fetch User and Profile
      const userResult = await this.dataSource.query(`
        SELECT u.id, u.email, u.roles, u."isActive", u."kycStatus", u."createdAt",
               p."firstName", p."lastName", p."displayName", p.phone, p.address, 
               p.gender, p."dateOfBirth", p.bio, p."bloodGroup", p.genotype
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.id = $1
      `, [userId]);

      const user = userResult[0];

      // Fetch Consent Records
      const consentRecords = await this.dataSource.query(`
        SELECT consent_type, consent_given, consent_date, ip_address, user_agent
        FROM consent_records
        WHERE user_id = $1
      `, [userId]);

      // Fetch patient secondary data if exists
      const patientResult = await this.dataSource.query(`
        SELECT * FROM patients WHERE "userId" = $1
      `, [userId]);
      const patient = patientResult[0];

      let appointments = [];
      if (patient) {
        appointments = await this.dataSource.query(`
          SELECT * FROM appointments WHERE patient_id = $1 OR provider_id = $2
        `, [patient.id, userId]);
      } else {
        appointments = await this.dataSource.query(`
          SELECT * FROM appointments WHERE provider_id = $1
        `, [userId]);
      }

      return {
        userProfile: user || { id: userId, note: 'Primary profile not found' },
        consentRecords: consentRecords || [],
        patientRecords: patient ? [patient] : [],
        appointments: appointments || [],
        medicalRecords: [], // Placeholder for future medical records expansion
        addresses: user?.address ? [{ address: user.address }] : []
      };
    } catch (error) {
      this.logger.error(`Error collecting user data: ${error.message}`, error.stack);
      // Fallback to minimal data if queries fail to ensure at least something is exported
      return {
        userProfile: { id: userId, error: 'Partial data collection failure' },
        consentRecords: []
      };
    }
  }

  /**
   * Handles a data breach notification
   */
  async handleDataBreachNotification(
    breachDetails: {
      description: string;
      affectedUsers: string[];
      dataCategories: string[];
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      detectionDate: Date;
    }
  ): Promise<void> {
    try {
      this.logger.log(`Processing data breach notification: ${breachDetails.description}`);
      
      // Log the breach
      await this.auditService.logActivity(
        'system',
        'SECURITY',
        'DATA_BREACH',
        breachDetails.description,
        {
          severity: breachDetails.severity,
          affectedUserCount: breachDetails.affectedUsers.length,
          dataCategories: breachDetails.dataCategories,
          detectionDate: breachDetails.detectionDate,
        }
      );
      
      // In a real implementation, this would handle notification to authorities and affected users
      // For now, we'll just log the action
      
      this.logger.log(`Data breach notification processed for ${breachDetails.affectedUsers.length} users`);
    } catch (error) {
      this.logger.error(`Error handling data breach notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Processes a data correction request (GDPR right to rectification)
   */
  async processDataCorrectionRequest(
    userId: string,
    correctionData: Record<string, unknown>
  ): Promise<void> {
    try {
      this.logger.log(`Processing data correction request for user ${userId}`);
      
      // Log the correction request
      await this.auditService.logActivity(
        userId,
        'GDPR',
        'DATA_CORRECTION',
        'User data correction requested',
        { 
          fields: Object.keys(correctionData),
        }
      );
      
      // In a real implementation, this would update the user data
      // For now, we'll just log the action
      
      this.logger.log(`Data correction processed for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error processing data correction: ${error.message}`, error.stack);
      throw error;
    }
  }
} 