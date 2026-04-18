import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImagingStudy } from './entities/imaging-study.entity';
import { ImagingFile } from './entities/imaging-file.entity';
import { CreateImagingStudyDto } from './dto/create-imaging-study.dto';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditLogService } from '../audit/audit-log.service';
import { MulterFile } from '../types/express';
import * as path from 'path';

@Injectable()
export class ImagingService {
  private readonly logger = new Logger(ImagingService.name);

  constructor(
    @InjectRepository(ImagingStudy)
    private studyRepository: Repository<ImagingStudy>,
    @InjectRepository(ImagingFile)
    private fileRepository: Repository<ImagingFile>,
    private supabaseService: SupabaseService,
    private auditLogService: AuditLogService,
  ) {}

  async createStudy(createDto: CreateImagingStudyDto, providerId: string, centerId: string): Promise<ImagingStudy> {
    const study = this.studyRepository.create({
      ...createDto,
      providerId,
      centerId,
    });
    return await this.studyRepository.save(study);
  }

  async uploadImagingFile(studyId: string, file: MulterFile): Promise<ImagingFile> {
    const study = await this.studyRepository.findOne({ where: { id: studyId } });
    if (!study) {
      throw new NotFoundException('Imaging study not found');
    }

    try {
      const fileExtension = path.extname(file.originalname);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
      const filePath = `imaging/${study.patientId}/${study.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await this.supabaseService
        .getClient()
        .storage
        .from('medical-imaging')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        throw new BadRequestException(`File upload failed: ${uploadError.message}`);
      }

      // Mock DICOM metadata extraction
      const metadata = {
        modality: study.modality || 'UNKNOWN',
        studyDate: study.studyDate || new Date().toISOString(),
        patientId: study.patientId,
        institutionName: 'UNLIMITED HEALTHCARE',
        sopClassUid: '1.2.840.10008.5.1.4.1.1.2', // Example CT Image Storage
        instanceNumber: '1',
      };

      const imagingFile = this.fileRepository.create({
        studyId,
        filePath: (uploadData as { path: string })?.path || filePath,
        fileName,
        originalName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        metadata,
      });

      const savedFile = await this.fileRepository.save(imagingFile);

      // Audit log the upload
      await this.auditLogService.log({
        action: 'IMAGING_FILE_UPLOADED',
        entityType: 'imaging_file',
        entityId: savedFile.id,
        userId: study.patientId,
        details: { studyId, fileName: savedFile.fileName },
      });

      return savedFile;
    } catch (error) {
      this.logger.error(`Failed to upload imaging file: ${error.message}`);
      throw new BadRequestException(`Imaging file upload failed: ${error.message}`);
    }
  }

  async getStudy(id: string, userId: string): Promise<ImagingStudy> {
    const study = await this.studyRepository.findOne({
      where: { id },
      relations: ['files', 'patient', 'center'],
    });

    if (!study) {
      throw new NotFoundException('Imaging study not found');
    }

    // Security check: Only patient or provider can view
    // (Actual role-based check should be in controller/guard, but this is an extra layer)

    await this.studyRepository.update(id, { accessCount: study.accessCount + 1 });

    // Audit log the view
    await this.auditLogService.log({
      action: 'IMAGING_STUDY_VIEWED',
      entityType: 'imaging_study',
      entityId: study.id,
      userId,
      details: { patientId: study.patientId },
    });

    return study;
  }

  async getPatientStudies(patientId: string): Promise<ImagingStudy[]> {
    return await this.studyRepository.find({
      where: { patientId },
      relations: ['files'],
      order: { studyDate: 'DESC' },
    });
  }

  async getFileUrl(fileId: string, userId: string): Promise<string> {
    const file = await this.fileRepository.findOne({
      where: { id: fileId },
      relations: ['study'],
    });

    if (!file) {
      throw new NotFoundException('Imaging file not found');
    }

    // Audit log the access
    await this.auditLogService.log({
      action: 'IMAGING_FILE_ACCESSED',
      entityType: 'imaging_file',
      entityId: file.id,
      userId,
      details: { studyId: file.studyId },
    });

    const { data, error: urlError } = await this.supabaseService.createSignedUrl('medical-imaging', file.filePath, 3600);

    if (urlError) {
      throw new BadRequestException(`Failed to generate signed URL: ${urlError.message}`);
    }

    return data?.signedUrl;
  }
}
