import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DataRetentionService {
  private readonly logger = new Logger(DataRetentionService.name);
  
  constructor(
    private dataSource: DataSource,
    private auditService: AuditService,
  ) {}

  /**
   * Runs weekly to purge data based on retention policies
   */
  @Cron('0 0 * * 0') // Run at midnight every Sunday
  async applyRetentionPolicies() {
    this.logger.log('Running data retention policies');
    try {
      await this.purgeTemporaryData();
      await this.archiveOldMedicalRecords();
      await this.anonymizeInactiveUsers();
      
      this.logger.log('Data retention policies completed successfully');
    } catch (error) {
      this.logger.error(`Error applying retention policies: ${error.message}`, error.stack);
    }
  }

  /**
   * Purges temporary data older than the specified retention period
   */
  private async purgeTemporaryData() {
    try {
      // Define cutoff dates for different data types
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Delete temporary login sessions older than 1 month
      const loginResult = await this.dataSource.query(
        `DELETE FROM user_sessions WHERE last_active < $1 RETURNING id`,
        [oneMonthAgo]
      );
      
      // Delete temporary files older than 6 months
      const filesResult = await this.dataSource.query(
        `DELETE FROM temporary_files WHERE created_at < $1 RETURNING id`,
        [sixMonthsAgo]
      );
      
      this.logger.log(`Purged ${loginResult.length} old sessions and ${filesResult.length} temporary files`);
      
      await this.auditService.logActivity(
        'system',
        'DATA_RETENTION',
        'PURGED',
        'Purged temporary data',
        { sessions: loginResult.length, files: filesResult.length }
      );
    } catch (error) {
      this.logger.error(`Error purging temporary data: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Archives medical records older than retention period
   */
  private async archiveOldMedicalRecords() {
    try {
      // Archive records older than 7 years that haven't been accessed
      const sevenYearsAgo = new Date();
      sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);
      
      const result = await this.dataSource.query(
        `UPDATE medical_records 
         SET status = 'ARCHIVED', archived_at = NOW() 
         WHERE created_at < $1 AND last_accessed < $2 AND status = 'ACTIVE'
         RETURNING id`,
        [sevenYearsAgo, sevenYearsAgo]
      );
      
      this.logger.log(`Archived ${result.length} old medical records`);
      
      await this.auditService.logActivity(
        'system',
        'DATA_RETENTION',
        'ARCHIVED',
        'Archived old medical records',
        { records: result.length }
      );
    } catch (error) {
      this.logger.error(`Error archiving old medical records: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Anonymizes data for inactive users
   */
  private async anonymizeInactiveUsers() {
    try {
      // Anonymize users inactive for 3+ years
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      
      // First identify users to anonymize
      const inactiveUsers = await this.dataSource.query(
        `SELECT id FROM users 
         WHERE last_login < $1 
         AND status != 'ANONYMIZED'
         AND opt_out_of_anonymization = false
         LIMIT 100`,
        [threeYearsAgo]
      );
      
      if (inactiveUsers.length === 0) {
        return;
      }
      
      const userIds = inactiveUsers.map(user => user.id);
      
      // Anonymize users
      for (const userId of userIds) {
        await this.dataSource.transaction(async manager => {
          // Anonymize personal information
          await manager.query(
            `UPDATE users
             SET 
               email = $1,
               phone_number = NULL,
               first_name = 'Anonymized',
               last_name = 'User',
               date_of_birth = NULL,
               status = 'ANONYMIZED',
               anonymized_at = NOW()
             WHERE id = $2`,
            [`anon_${userId.substring(0, 8)}@example.com`, userId]
          );
          
          // Anonymize addresses
          await manager.query(
            `UPDATE addresses
             SET 
               street = 'Anonymized',
               city = 'Anonymized',
               postal_code = 'ANON'
             WHERE user_id = $1`,
            [userId]
          );
        });
        
        await this.auditService.logActivity(
          'system',
          'DATA_RETENTION',
          'ANONYMIZED',
          'Anonymized inactive user data',
          { userId }
        );
      }
      
      this.logger.log(`Anonymized ${userIds.length} inactive users`);
    } catch (error) {
      this.logger.error(`Error anonymizing inactive users: ${error.message}`, error.stack);
      throw error;
    }
  }
} 