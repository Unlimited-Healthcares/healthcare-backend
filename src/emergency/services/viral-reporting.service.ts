import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ViralReport, ViralReportType, ReportStatus } from '../entities/viral-report.entity';
import { ContactTrace, ContactType, ExposureRisk } from '../entities/contact-trace.entity';
import { SmsService } from '../../integrations/sms.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { AuditLogService } from '../../audit/audit-log.service';
import { JsonObject } from 'type-fest';

interface ContactInformation {
  phone?: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
}

export interface TestResults {
  testType: string;
  result: 'positive' | 'negative' | 'pending';
  testDate: string;
  labName?: string;
  notes?: string;
}

@Injectable()
export class ViralReportingService {
  private readonly logger = new Logger(ViralReportingService.name);

  constructor(
    @InjectRepository(ViralReport)
    private reportRepository: Repository<ViralReport>,
    @InjectRepository(ContactTrace)
    private contactTraceRepository: Repository<ContactTrace>,
    private smsService: SmsService,
    private notificationsService: NotificationsService,
    private auditLogService: AuditLogService,
  ) {}

  async createViralReport(reportData: {
    type: ViralReportType;
    reportedBy?: string;
    isAnonymous?: boolean;
    diseaseType: string;
    symptoms: string[];
    onsetDate?: Date;
    exposureDate?: Date;
    locationLatitude?: number;
    locationLongitude?: number;
    locationAddress?: string;
    contactInformation?: ContactInformation;
    affectedCount?: number;
    description?: string;
    riskFactors?: string[];
    preventiveMeasures?: string[];
    healthcareFacilityVisited?: string;
    testResults?: TestResults;
  }): Promise<ViralReport> {
    try {
      // Generate unique report number
      const reportNumber = `VR-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const report = this.reportRepository.create({
        ...reportData,
        reportNumber,
        status: ReportStatus.SUBMITTED,
        affectedCount: reportData.affectedCount || 1,
        isAnonymous: reportData.isAnonymous || false,
      });

      const savedReport = await this.reportRepository.save(report);

      // Notify health authorities for serious outbreaks
      if (this.shouldNotifyHealthAuthorities(savedReport)) {
        await this.notifyHealthAuthorities(savedReport);
      }

      // Send confirmation to reporter (if not anonymous)
      if (!savedReport.isAnonymous && reportData.contactInformation?.phone) {
        await this.sendReportConfirmation(savedReport);
      }

      await this.auditLogService.log({
        action: 'CREATE_VIRAL_REPORT',
        entityType: 'ViralReport',
        entityId: savedReport.id,
        userId: reportData.reportedBy || 'anonymous',
        details: {
          reportNumber: savedReport.reportNumber,
          type: savedReport.type,
          diseaseType: savedReport.diseaseType,
          affectedCount: savedReport.affectedCount,
          isAnonymous: savedReport.isAnonymous,
        },
      });

      this.logger.log(`Viral report created: ${savedReport.reportNumber}`);
      return savedReport;
    } catch (error) {
      this.logger.error(`Failed to create viral report: ${error.message}`, error.stack);
      throw error;
    }
  }

  async addContactTrace(traceData: {
    viralReportId: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    contactType: ContactType;
    exposureDate: Date;
    exposureDurationMinutes?: number;
    riskLevel: ExposureRisk;
    exposureLocation?: string;
    exposureDetails?: string;
    maskWornByCase?: boolean;
    maskWornByContact?: boolean;
    outdoorExposure?: boolean;
    notes?: string;
  }): Promise<ContactTrace> {
    try {
      const trace = this.contactTraceRepository.create(traceData);
      const savedTrace = await this.contactTraceRepository.save(trace);

      // Send notification to contact if phone number provided
      if (traceData.contactPhone && !this.isHighRiskTrace(traceData)) {
        await this.notifyContact(savedTrace);
      }

      // For high-risk contacts, immediate notification
      if (this.isHighRiskTrace(traceData)) {
        await this.notifyHighRiskContact(savedTrace);
      }

      this.logger.log(`Contact trace added for report ${traceData.viralReportId}`);
      return savedTrace;
    } catch (error) {
      this.logger.error(`Failed to add contact trace: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateReportStatus(
    reportId: string,
    status: ReportStatus,
    investigatedBy?: string,
    investigationNotes?: string,
    publicHealthActions?: string[]
  ): Promise<ViralReport> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Viral report not found');
    }

    const updateData: Partial<ViralReport> = { 
      status,
      investigatedBy,
      investigationNotes,
      publicHealthActions,
    };

    await this.reportRepository.update(reportId, updateData);

    // Send status update notification
    if (!report.isAnonymous && report.contactInformation?.phone) {
      await this.sendStatusUpdateNotification(report, status);
    }

    return this.reportRepository.findOne({ where: { id: reportId } });
  }

  async getViralReports(filters: {
    type?: ViralReportType;
    status?: ReportStatus;
    diseaseType?: string;
    locationRadius?: { latitude: number; longitude: number; radiusKm: number };
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  } = {}): Promise<{ reports: ViralReport[]; total: number }> {
    const query = this.reportRepository.createQueryBuilder('report');

    if (filters.type) {
      query.andWhere('report.type = :type', { type: filters.type });
    }

    if (filters.status) {
      query.andWhere('report.status = :status', { status: filters.status });
    }

    if (filters.diseaseType) {
      query.andWhere('report.diseaseType ILIKE :diseaseType', { diseaseType: `%${filters.diseaseType}%` });
    }

    if (filters.dateFrom) {
      query.andWhere('report.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      query.andWhere('report.createdAt <= :dateTo', { dateTo: filters.dateTo });
    }

    // TODO: Add location-based filtering using PostGIS functions for production

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    query.orderBy('report.createdAt', 'DESC');
    query.skip(offset).take(limit);

    const [reports, total] = await query.getManyAndCount();

    return { reports, total };
  }

  async getContactTraces(reportId: string): Promise<ContactTrace[]> {
    return this.contactTraceRepository.find({
      where: { viralReportId: reportId },
      order: { exposureDate: 'DESC' },
    });
  }

  async getPublicHealthSummary(filters: JsonObject): Promise<JsonObject> {
    const queryBuilder = this.reportRepository.createQueryBuilder('report');

    if (filters.diseaseType) {
      queryBuilder.andWhere('report.diseaseType = :diseaseType', { diseaseType: filters.diseaseType });
    }

    if (filters.dateFrom) {
      queryBuilder.andWhere('report.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      queryBuilder.andWhere('report.createdAt <= :dateTo', { dateTo: filters.dateTo });
    }

    const [reports, total] = await queryBuilder.getManyAndCount();

    return {
      totalReports: total,
      diseaseBreakdown: this.groupByDisease(reports),
      geographicDistribution: this.groupByLocation(reports),
      timelineTrends: this.analyzeTimeline(reports),
      riskAssessment: this.calculateRiskLevel(reports),
    };
  }

  private shouldNotifyHealthAuthorities(report: ViralReport): boolean {
    // Criteria for notifying health authorities
    return (
      report.affectedCount >= 5 || // Multiple cases
      report.type === ViralReportType.OUTBREAK_REPORT ||
      ['covid-19', 'influenza', 'measles', 'tuberculosis'].includes(report.diseaseType.toLowerCase()) ||
      (report.riskFactors && report.riskFactors.includes('high_transmission_risk'))
    );
  }

  private async notifyHealthAuthorities(report: ViralReport): Promise<void> {
    try {
      // Mark as notified
      await this.reportRepository.update(report.id, {
        healthAuthorityNotified: true,
        notificationSentAt: new Date(),
      });

      // In a real implementation, this would integrate with CDC/WHO reporting protocols
      this.logger.warn(`HEALTH AUTHORITY NOTIFICATION: ${report.reportNumber}`, {
        type: report.type,
        diseaseType: report.diseaseType,
        affectedCount: report.affectedCount,
        location: report.locationAddress,
        symptoms: report.symptoms,
      });

      // TODO: Integrate with actual health authority APIs
      // This could involve:
      // - Sending reports to CDC surveillance systems
      // - Notifying WHO for international concerns
      // - Alerting local health departments
      // - Integrating with disease reporting protocols

      this.logger.log(`Health authorities notified for report ${report.reportNumber}`);
    } catch (error) {
      this.logger.error(`Failed to notify health authorities: ${error.message}`, error.stack);
    }
  }

  private async sendReportConfirmation(report: ViralReport): Promise<void> {
    try {
      const message = `Thank you for submitting viral report ${report.reportNumber}. Your report is being reviewed by health authorities. You will be contacted if additional information is needed.`;

      await this.smsService.sendSms({
        to: report.contactInformation.phone,
        message,
        type: 'transactional',
      });

      this.logger.log(`Report confirmation sent for ${report.reportNumber}`);
    } catch (error) {
      this.logger.error(`Failed to send report confirmation: ${error.message}`, error.stack);
    }
  }

  private isHighRiskTrace(traceData: Partial<ContactTrace>): boolean {
    return (
      traceData.riskLevel === ExposureRisk.HIGH ||
      traceData.riskLevel === ExposureRisk.VERY_HIGH ||
      (traceData.exposureDurationMinutes && traceData.exposureDurationMinutes >= 15 && !traceData.outdoorExposure)
    );
  }

  private async notifyContact(trace: ContactTrace): Promise<void> {
    try {
      if (!trace.contactPhone) return;

      const message = `Health Notice: You may have been exposed to a communicable disease. Please monitor your health and contact your healthcare provider if you develop symptoms. Reference: ${trace.id.substr(0, 8)}`;

      await this.smsService.sendSms({
        to: trace.contactPhone,
        message,
        type: 'transactional',
      });

      await this.contactTraceRepository.update(trace.id, {
        notifiedAt: new Date(),
      });

      this.logger.log(`Contact notification sent for trace ${trace.id}`);
    } catch (error) {
      this.logger.error(`Failed to notify contact: ${error.message}`, error.stack);
    }
  }

  private async notifyHighRiskContact(trace: ContactTrace): Promise<void> {
    try {
      if (!trace.contactPhone) return;

      const message = `URGENT Health Notice: You have been identified as a high-risk exposure contact. Please quarantine immediately and contact your healthcare provider. Reference: ${trace.id.substr(0, 8)}`;

      await this.smsService.sendSms({
        to: trace.contactPhone,
        message,
        type: 'transactional',
      });

      // Set quarantine recommendations
      const quarantineStart = new Date();
      const quarantineEnd = new Date(quarantineStart.getTime() + (14 * 24 * 60 * 60 * 1000)); // 14 days

      await this.contactTraceRepository.update(trace.id, {
        notifiedAt: new Date(),
        quarantineStartDate: quarantineStart,
        quarantineEndDate: quarantineEnd,
        testScheduledDate: new Date(Date.now() + (3 * 24 * 60 * 60 * 1000)), // 3 days from now
      });

      this.logger.log(`High-risk contact notification sent for trace ${trace.id}`);
    } catch (error) {
      this.logger.error(`Failed to notify high-risk contact: ${error.message}`, error.stack);
    }
  }

  private async sendStatusUpdateNotification(report: ViralReport, status: ReportStatus): Promise<void> {
    try {
      let message = '';

      switch (status) {
        case ReportStatus.UNDER_REVIEW:
          message = `Your viral report ${report.reportNumber} is now under review by health authorities.`;
          break;
        case ReportStatus.VERIFIED:
          message = `Your viral report ${report.reportNumber} has been verified. Thank you for your contribution to public health.`;
          break;
        case ReportStatus.INVESTIGATED:
          message = `Investigation complete for your viral report ${report.reportNumber}. Appropriate public health measures have been taken.`;
          break;
        case ReportStatus.CLOSED:
          message = `Your viral report ${report.reportNumber} has been closed. Thank you for your report.`;
          break;
        case ReportStatus.DISMISSED:
          message = `Your viral report ${report.reportNumber} has been reviewed and dismissed. If you have concerns, please contact your healthcare provider.`;
          break;
      }

      if (message && report.contactInformation?.phone) {
        await this.smsService.sendSms({
          to: report.contactInformation.phone,
          message,
          type: 'transactional',
        });
      }

      this.logger.log(`Status update notification sent for report ${report.reportNumber}: ${status}`);
    } catch (error) {
      this.logger.error(`Failed to send status update notification: ${error.message}`, error.stack);
    }
  }

  private groupByDisease(reports: ViralReport[]): Record<string, number> {
    return reports.reduce((acc, report) => {
      acc[report.diseaseType] = (acc[report.diseaseType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupByLocation(reports: ViralReport[]): Record<string, number> {
    return reports.reduce((acc, report) => {
      const location = report.locationAddress || 'Unknown';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private analyzeTimeline(reports: ViralReport[]): Record<string, number> {
    const timeline = reports.reduce((acc, report) => {
      const date = report.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return timeline;
  }

  private calculateRiskLevel(reports: ViralReport[]): string {
    const recentReports = reports.filter(
      report => new Date(report.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    
    if (recentReports > 10) return 'HIGH';
    if (recentReports > 5) return 'MEDIUM';
    return 'LOW';
  }
}
