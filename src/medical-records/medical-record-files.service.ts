import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalRecordFile } from './entities/medical-record-file.entity';
import { CreateMedicalRecordFileDto } from './dto/create-medical-record-file.dto';
import { SupabaseService } from '../supabase/supabase.service';
import * as path from 'path';
import * as sharp from 'sharp';
import { MulterFile } from '../types/express';

@Injectable()
export class MedicalRecordFilesService {
  constructor(
    @InjectRepository(MedicalRecordFile)
    private filesRepository: Repository<MedicalRecordFile>,
    private supabaseService: SupabaseService,
  ) {}

  async uploadFile(
    file: MulterFile,
    createFileDto: CreateMedicalRecordFileDto,
  ): Promise<MedicalRecordFile> {
    try {
      // Generate unique file path
      const fileExtension = path.extname(file.originalname);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
      const filePath = `medical-records/${createFileDto.recordId}/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await this.supabaseService
        .getClient()
        .storage
        .from('medical-records')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        throw new BadRequestException(`File upload failed: ${uploadError.message}`);
      }

      // Generate thumbnail for images
      let thumbnailPath: string | undefined;
      if (file.mimetype.startsWith('image/')) {
        thumbnailPath = await this.generateThumbnail(file, createFileDto.recordId);
      }

      // Extract metadata based on file type
      const metadata = await this.extractFileMetadata(file);

      // Save file record to database
      const fileRecord = this.filesRepository.create({
        ...createFileDto,
        fileName,
        originalFileName: file.originalname,
        filePath: (uploadData as { path: string })?.path || filePath,
        fileType: this.getFileType(file.mimetype),
        fileSize: file.size,
        mimeType: file.mimetype,
        thumbnailPath,
        metadata: { ...metadata, ...createFileDto.metadata },
        uploadStatus: 'completed',
      });

      return await this.filesRepository.save(fileRecord);
    } catch (error) {
      throw new BadRequestException(`File upload failed: ${(error as Error).message}`);
    }
  }

  async getFilesByRecordId(recordId: string): Promise<MedicalRecordFile[]> {
    return await this.filesRepository.find({
      where: { recordId },
      order: { createdAt: 'DESC' },
    });
  }

  async getFileById(fileId: string): Promise<MedicalRecordFile> {
    const file = await this.filesRepository.findOne({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  async deleteFile(fileId: string): Promise<void> {
    const file = await this.getFileById(fileId);

    // Delete from Supabase Storage
    const { error: deleteError } = await this.supabaseService
      .getClient()
      .storage
      .from('medical-records')
      .remove([file.filePath]);

    if (deleteError) {
      console.error('Error deleting file from storage:', deleteError);
    }

    // Delete thumbnail if exists
    if (file.thumbnailPath) {
      await this.supabaseService
        .getClient()
        .storage
        .from('medical-records')
        .remove([file.thumbnailPath]);
    }

    // Delete from database
    await this.filesRepository.delete(fileId);
  }

  async getFileUrl(fileId: string): Promise<string> {
    const file = await this.getFileById(fileId);

    const { data } = this.supabaseService
      .getClient()
      .storage
      .from('medical-records')
      .getPublicUrl(file.filePath);

    return data.publicUrl;
  }

  async convertDicomToJpeg(fileId: string): Promise<string> {
    const file = await this.getFileById(fileId);
    
    if (file.fileType !== 'dicom') {
      throw new BadRequestException('File is not a DICOM file');
    }
    
    try {
      // In a real implementation, we would:
      // 1. Download the DICOM file
      // 2. Use a DICOM library to parse and extract image data
      // 3. Convert to JPEG
      // 4. Upload the JPEG
      
      // For now, we'll create a placeholder implementation that just creates a new record
      
      // Generate a new filename for the converted file
      const jpegFilename = `${file.fileName.replace(/\.dcm$/, '')}-converted.jpg`;
      const jpegPath = `medical-records/${file.recordId}/${jpegFilename}`;
      
      // Create a new file record for the converted JPEG
      const jpegFile = this.filesRepository.create({
        recordId: file.recordId,
        fileName: jpegFilename,
        originalFileName: file.originalFileName.replace(/\.dcm$/, '.jpg'),
        filePath: jpegPath,
        fileType: 'image',
        fileSize: 0, // Will be updated when we implement real conversion
        mimeType: 'image/jpeg',
        metadata: {
          ...file.metadata,
          convertedFrom: file.id,
          conversionType: 'dicom-to-jpeg',
          conversionDate: new Date().toISOString(),
          width: 512,
          height: 512,
          note: 'This is a placeholder. DICOM conversion not fully implemented.'
        },
        uploadStatus: 'pending',
      });
      
      await this.filesRepository.save(jpegFile);
      
      // In a complete implementation, we would upload the actual converted file here
      
      // For now, return a message indicating this is a placeholder
      return `DICOM conversion initiated for file ID: ${fileId}. Full implementation coming soon.`;
    } catch (error) {
      throw new BadRequestException(`DICOM conversion failed: ${error.message}`);
    }
  }

  private async generateThumbnail(
    file: MulterFile,
    recordId: string,
  ): Promise<string> {
    try {
      const thumbnailBuffer = await sharp(file.buffer)
        .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

      const thumbnailPath = `medical-records/${recordId}/thumbnails/${Date.now()}-thumb.jpg`;

      const { error } = await this.supabaseService
        .getClient()
        .storage
        .from('medical-records')
        .upload(thumbnailPath, thumbnailBuffer, {
          contentType: 'image/jpeg',
        });

      if (error) {
        console.error('Error uploading thumbnail:', error);
        return undefined;
      }

      return thumbnailPath;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return undefined;
    }
  }

  private async extractFileMetadata(file: MulterFile): Promise<Record<string, unknown>> {
    const metadata: Record<string, unknown> = {
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };

    // Add image-specific metadata
    if (file.mimetype.startsWith('image/')) {
      try {
        const imageMetadata = await sharp(file.buffer).metadata();
        metadata.dimensions = {
          width: imageMetadata.width,
          height: imageMetadata.height,
        };
        metadata.format = imageMetadata.format;
        metadata.colorSpace = imageMetadata.space;
      } catch (error) {
        console.error('Error extracting image metadata:', error);
      }
    }

    // For DICOM files, you would extract DICOM tags here
    if (file.mimetype === 'application/dicom') {
      // Placeholder for DICOM metadata extraction
      metadata.isDicom = true;
    }

    return metadata;
  }

  private getFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType === 'application/dicom') return 'dicom';
    if (mimeType.startsWith('text/')) return 'text';
    if (mimeType.startsWith('video/')) return 'video';
    return 'other';
  }
}
