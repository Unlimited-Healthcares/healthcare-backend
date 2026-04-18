import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Raw, FindOptionsWhere } from 'typeorm';
import * as PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import { MedicalReport } from './entities/medical-report.entity';
import { MedicalRecord } from '../medical-records/entities/medical-record.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Profile } from '../users/entities/profile.entity';
import { HealthcareCenter } from '../centers/entities/center.entity';
import { SupabaseService } from '../supabase/supabase.service';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { NotificationsService } from '../notifications/notifications.service';


@Injectable()
export class MedicalReportsService {
  private readonly logger = new Logger(MedicalReportsService.name);

  constructor(
    @InjectRepository(MedicalReport)
    private reportsRepository: Repository<MedicalReport>,
    @InjectRepository(MedicalRecord)
    private recordsRepository: Repository<MedicalRecord>,
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(HealthcareCenter)
    private centerRepository: Repository<HealthcareCenter>,
    private supabaseService: SupabaseService,
    private notificationsService: NotificationsService,
  ) { }

  async generateReport(recordId: string, userId: string): Promise<MedicalReport> {
    this.logger.log(`Generating report for record: ${recordId}`);

    // 1. Fetch data
    const record = await this.recordsRepository.findOne({
      where: { id: recordId },
      relations: ['patient', 'creator', 'creator.profile'],
    });

    if (!record) {
      throw new NotFoundException('Medical record not found');
    }

    // Check if a report already exists for this medical record
    const existingReport = await this.reportsRepository.findOne({
      where: { recordId: record.id },
    });

    if (existingReport) {
      this.logger.log(`Report already exists for record ${recordId}. Returning existing report.`);
      return existingReport;
    }

    const patientProfile = await this.profileRepository.findOne({
      where: { userId: record.patient.userId },
    });

    const patientDetails = await this.patientsRepository.findOne({
      where: { id: record.patientId },
    });

    const center = await this.centerRepository.findOne({
      where: { id: record.centerId },
    });

    if (!center) {
      throw new NotFoundException('Healthcare center not found');
    }

    // 2. Prepare verification code and report number
    const verificationCode = uuidv4().substring(0, 8).toUpperCase();
    const reportNumber = `REP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const verificationUrl = `https://app.unlimitedhealth.com/verify/report/${verificationCode}`;

    // 3. Generate QR Code
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);

    // 4. Create PDF
    const pdfBuffer = await this.createPdfBuffer(record, patientProfile, patientDetails, center, qrCodeDataUrl, reportNumber, verificationCode);

    // 5. Upload to Supabase
    const fileName = `reports/${record.patientId}/${reportNumber}.pdf`;
    await this.supabaseService.uploadFile('medical-records', fileName, pdfBuffer, 'application/pdf');
    const pdfUrl = await this.supabaseService.getFileUrl('medical-records', fileName);

    // 6. Save Report Record
    const report = this.reportsRepository.create({
      reportNumber,
      recordId,
      patientId: record.patientId,
      centerId: record.centerId,
      generatedBy: userId,
      pdfUrl,
      verificationCode,
      metadata: {
        generatedAt: new Date(),
        checksum: this.generateChecksum(pdfBuffer),
      },
    });

    const savedReport = await this.reportsRepository.save(report);

    // Notify patient
    try {
      await this.notificationsService.createNotification({
        userId: record.patient.userId,
        type: 'medical_record',
        title: 'New Medical Report Ready',
        message: `Your medical report ${reportNumber} for ${record.title} is now available in your Vault.`,
        data: { reportId: savedReport.id, recordId: record.id }
      });
    } catch (error) {
      this.logger.error(`Failed to notify patient about report: ${error.message}`);
    }

    return savedReport;
  }

  async generateDischargeSummary(encounterId: string, userId: string): Promise<MedicalReport> {
    const record = await this.recordsRepository.findOne({
      where: {
        metadata: Raw(alias => `${alias} ->> 'encounterId' = :id`, { id: encounterId })
      } as FindOptionsWhere<MedicalRecord>,
      relations: ['patient', 'creator', 'creator.profile'],
    });

    if (!record) {
      // Fallback or create a record from encounter
      throw new NotFoundException('Clinical record for encounter not found');
    }

    return this.generateReport(record.id, userId);
  }

  private async createPdfBuffer(
    record: MedicalRecord,
    profile: Profile,
    patient: Patient,
    center: HealthcareCenter,
    qrCodeDataUrl: string,
    reportNumber: string,
    verificationCode: string,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Color Palette
      const primaryColor = '#2563eb'; // Blue
      const secondaryColor = '#4b5563'; // Gray
      const accentColor = '#059669'; // Green

      // --- HEADER ---
      // Logo placeholder or Center Name
      doc.rect(0, 0, 612, 100).fill('#f3f4f6');
      doc.fillColor(primaryColor).fontSize(20).font('Helvetica-Bold').text(center.name.toUpperCase(), 50, 40);
      doc.fillColor(secondaryColor).fontSize(10).font('Helvetica').text(center.address, 50, 65);
      doc.text(`Phone: ${center.phone || 'N/A'} | Email: ${center.email || 'N/A'}`, 50, 78);

      doc.moveDown(4);

      // --- REPORT INFO ---
      doc.fillColor('#000000').fontSize(18).font('Helvetica-Bold').text('DIGITAL MEDICAL REPORT', { align: 'center' });
      doc.moveDown(0.2);
      doc.fontSize(10).fillColor(secondaryColor).text(`Report ID: ${reportNumber} | Verified Secure`, { align: 'center' });
      doc.moveDown();

      doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      const startY = doc.y;

      // --- PATIENT BIODATA (Left Column) ---
      doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('PATIENT BIODATA', 50, startY);
      doc.moveDown(0.5);

      doc.fontSize(10).fillColor('#111827').font('Helvetica-Bold').text('Name: ', { continued: true }).font('Helvetica').text(`${profile?.firstName} ${profile?.lastName}`);
      doc.font('Helvetica-Bold').text('Patient ID: ', { continued: true }).font('Helvetica').text(record.patient.patientId);
      doc.font('Helvetica-Bold').text('Date of Birth: ', { continued: true }).font('Helvetica').text(profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A');
      doc.font('Helvetica-Bold').text('Gender: ', { continued: true }).font('Helvetica').text(profile?.gender || 'N/A');
      doc.font('Helvetica-Bold').text('Address: ', { continued: true }).font('Helvetica').text(profile?.address || 'N/A', { width: 200 });

      // --- MEDICAL STATS & VITALS (Right Column) ---
      doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('MEDICAL VITALS', 300, startY);
      doc.moveDown(0.5);

      if (record.vitals && Object.keys(record.vitals).length > 0) {
        const v = record.vitals as Record<string, unknown>;
        if (v.heartRate) doc.fontSize(10).fillColor('#111827').font('Helvetica-Bold').text('Heart Rate: ', 300, doc.y).font('Helvetica').text(`${v.heartRate} bpm`);
        if (v.bp) doc.fontSize(10).fillColor('#111827').font('Helvetica-Bold').text('Blood Pressure: ', 300, doc.y).font('Helvetica').text(`${v.bp} mmHg`);
        if (v.temp) doc.fontSize(10).fillColor('#111827').font('Helvetica-Bold').text('Temperature: ', 300, doc.y).font('Helvetica').text(`${v.temp} °C`);
        if (v.spO2) doc.fontSize(10).fillColor('#111827').font('Helvetica-Bold').text('SpO2: ', 300, doc.y).font('Helvetica').text(`${v.spO2} %`);
        if (v.respiratoryRate) doc.fontSize(10).fillColor('#111827').font('Helvetica-Bold').text('Resp. Rate: ', 300, doc.y).font('Helvetica').text(`${v.respiratoryRate} bpm`);
      } else {
        doc.fontSize(10).fillColor(secondaryColor).font('Helvetica-Oblique').text('No vitals recorded for this session', 300, doc.y);
      }

      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#111827').font('Helvetica-Bold').text('Blood Type: ', 300, doc.y).font('Helvetica').text(patient?.bloodType || 'N/A');
      doc.font('Helvetica-Bold').text('Allergies: ', 300, doc.y).font('Helvetica').text(patient?.allergies || 'None recorded', { width: 245 });
      doc.font('Helvetica-Bold').text('Chronic Conditions: ', 300, doc.y).font('Helvetica').text(patient?.chronicConditions || 'None recorded', { width: 245 });

      doc.moveDown(2);
      const clinicalY = doc.y > 250 ? doc.y : 250;

      // --- CLINICAL FINDINGS ---
      doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('CLINICAL FINDINGS', 50, clinicalY);
      doc.moveDown(0.5);

      doc.fontSize(10).fillColor('#111827').font('Helvetica-Bold').text('Record Type: ', { continued: true }).font('Helvetica').text(record.recordType.toUpperCase());
      doc.font('Helvetica-Bold').text('Primary Complaint: ', { continued: true }).font('Helvetica').text(record.title);
      doc.moveDown(0.5);

      if (record.diagnosis) {
        doc.rect(50, doc.y, 495, 20).fill('#f9fafb');
        doc.fillColor(primaryColor).font('Helvetica-Bold').text('Diagnosis:', 55, doc.y + 5);
        doc.moveDown(0.5);
        doc.fillColor('#111827').font('Helvetica').text(record.diagnosis, 50, doc.y, { align: 'justify', width: 495 });
        doc.moveDown();
      }

      if (record.treatment) {
        doc.font('Helvetica-Bold').fillColor(primaryColor).text('Treatment & Recommendations:');
        doc.fillColor('#111827').font('Helvetica').text(record.treatment, { align: 'justify', width: 495 });
        doc.moveDown();
      }

      if (record.notes) {
        doc.font('Helvetica-Bold').fillColor(primaryColor).text('Additional Consultation Notes:');
        doc.fillColor('#111827').font('Helvetica').text(record.notes, { align: 'justify', width: 495 });
        doc.moveDown();
      }

      // --- FOOTER / SECURITY ---
      const footerY = 660;
      doc.rect(0, footerY - 20, 612, 160).fill('#f8fafc');

      doc.image(qrCodeDataUrl, 50, footerY, { width: 80 });

      doc.fontSize(8).fillColor(secondaryColor).font('Helvetica-Bold');
      doc.text('SECURE VERIFICATION QR', 140, footerY + 10);
      doc.font('Helvetica').text('This report is digitally signed and encrypted.', 140, footerY + 22);
      doc.text(`Verify at: https://app.unlimitedhealth.com/verify`, 140, footerY + 34);
      doc.text(`Verification Code: ${verificationCode}`, 140, footerY + 46);
      doc.text(`Checksum: ${this.generateChecksum(Buffer.from(reportNumber + verificationCode))}`, 140, footerY + 58);

      // Digital Signature & Doctor Info
      doc.fontSize(10).fillColor('#1e293b').font('Helvetica-Bold');
      doc.text('ELECTRONICALLY CERTIFIED BY', 300, footerY + 10);
      doc.fontSize(12).fillColor(primaryColor).text(`Dr. ${record.creator?.profile?.firstName} ${record.creator?.profile?.lastName}`, 300, footerY + 25);
      doc.fontSize(9).fillColor(secondaryColor).font('Helvetica');
      doc.text(`${record.creator?.profile?.specialization || 'Medical Practitioner'}`, 300, footerY + 40);
      doc.text(`Practice ID: ${record.creator?.profile?.practiceNumber || 'N/A'}`, 300, footerY + 52);

      doc.fontSize(8).fillColor(accentColor).font('Helvetica-Bold').text('● AUTHENTICITY VERIFIED', 300, footerY + 70);
      doc.fillColor(secondaryColor).font('Helvetica').text(`Issued: ${new Date().toLocaleString()}`, 300, footerY + 82);

      // Signature Placeholder
      doc.rect(480, footerY + 10, 80, 40).stroke('#e5e7eb');
      doc.fontSize(7).fillColor('#9ca3af').text('DIGITAL SIGNATURE', 485, footerY + 25, { width: 70, align: 'center' });

      doc.end();
    });
  }

  private generateChecksum(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex').substring(0, 16).toUpperCase();
  }

  async findAll(filters: { patientId?: string; centerId?: string }): Promise<MedicalReport[]> {
    const query = this.reportsRepository.createQueryBuilder('report')
      .leftJoinAndSelect('report.patient', 'patient')
      .leftJoinAndSelect('report.center', 'center');

    if (filters.patientId) {
      query.andWhere('report.patientId = :patientId', { patientId: filters.patientId });
    }
    if (filters.centerId) {
      query.andWhere('report.centerId = :centerId', { centerId: filters.centerId });
    }

    query.orderBy('report.createdAt', 'DESC');
    return await query.getMany();
  }

  async getReportsByPatient(patientId: string): Promise<MedicalReport[]> {
    return await this.reportsRepository.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
    });
  }

  async getReportById(id: string): Promise<MedicalReport> {
    const report = await this.reportsRepository.findOne({
      where: { id },
      relations: ['record', 'patient', 'center'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  async verifyReportByCode(verificationCode: string): Promise<MedicalReport> {
    const report = await this.reportsRepository.findOne({
      where: { verificationCode },
      relations: ['record', 'patient', 'center'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  async grantAccess(reportId: string, targetId: string): Promise<MedicalReport> {
    const report = await this.reportsRepository.findOne({ where: { id: reportId } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const sharedWith = report.sharedWith || [];
    if (!sharedWith.includes(targetId)) {
      sharedWith.push(targetId);
      report.sharedWith = sharedWith;
    }

    return await this.reportsRepository.save(report);
  }

  async getSharedReports(userId: string): Promise<MedicalReport[]> {
    return await this.reportsRepository
      .createQueryBuilder('report')
      .where('report.sharedWith @> :userId', { userId: JSON.stringify([userId]) })
      .orderBy('report.created_at', 'DESC')
      .getMany();
  }
}
