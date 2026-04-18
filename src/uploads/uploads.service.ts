import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly BUCKET_NAME = 'avatars';

  constructor(private readonly supabaseService: SupabaseService) { }

  async uploadProfilePicture(file: Express.Multer.File, userId: string): Promise<string> {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${userId}-${uuidv4()}.${fileExtension}`;
    const filePath = `profile-pics/${fileName}`;

    this.logger.log(`Uploading profile picture for user ${userId}: ${filePath}`);

    try {
      await this.supabaseService.uploadFile(
        this.BUCKET_NAME,
        filePath,
        file.buffer,
        file.mimetype,
      );

      const publicUrl = await this.supabaseService.getFileUrl(this.BUCKET_NAME, filePath);
      return publicUrl;
    } catch (error) {
      this.logger.error(`Failed to upload profile picture: ${error.message}`, error.stack);
      throw error;
    }
  }

  async uploadBusinessAsset(file: Express.Multer.File, userId: string, type: 'logo' | 'document' = 'logo'): Promise<string> {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${userId}-${uuidv4()}_${type}.${fileExtension}`;
    const bucket = 'medical-imaging';
    const filePath = `${userId}/${fileName}`;

    this.logger.log(`Uploading business asset (${type}) for user ${userId}: ${filePath}`);

    try {
      await this.supabaseService.uploadFile(
        bucket,
        filePath,
        file.buffer,
        file.mimetype,
      );

      const publicUrl = await this.supabaseService.getFileUrl(bucket, filePath);
      return publicUrl;
    } catch (error) {
      this.logger.error(`Failed to upload business asset: ${error.message}`, error.stack);
      throw error;
    }
  }

  async uploadIdentityDocument(file: Express.Multer.File, userId: string): Promise<string> {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${userId}-id-${uuidv4()}.${fileExtension}`;
    const bucket = 'medical-imaging';
    const filePath = `${userId}/${fileName}`;

    this.logger.log(`Uploading identity document for user ${userId}: ${filePath}`);

    try {
      await this.supabaseService.uploadFile(
        bucket,
        filePath,
        file.buffer,
        file.mimetype,
      );

      const publicUrl = await this.supabaseService.getFileUrl(bucket, filePath);
      return publicUrl;
    } catch (error) {
      this.logger.error(`Failed to upload identity document: ${error.message}`, error.stack);
      throw error;
    }
  }

  async uploadCommunityMedia(file: Express.Multer.File, userId: string): Promise<string> {
    const fileExtension = file.originalname.split('.').pop();
    const isVideo = file.mimetype.startsWith('video/');
    const folder = isVideo ? 'videos' : 'images';
    const fileName = `${userId}-${uuidv4()}.${fileExtension}`;
    const bucket = 'community';
    const filePath = `${folder}/${fileName}`;

    this.logger.log(`Uploading community ${folder} for user ${userId}: ${filePath}`);

    try {
      await this.supabaseService.uploadFile(
        bucket,
        filePath,
        file.buffer,
        file.mimetype,
      );

      const publicUrl = await this.supabaseService.getFileUrl(bucket, filePath);
      return publicUrl;
    } catch (error) {
      this.logger.error(`Failed to upload community media: ${error.message}`, error.stack);
      throw error;
    }
  }

  async uploadChatMedia(file: Express.Multer.File, userId: string): Promise<string> {
    const fileExtension = file.originalname.split('.').pop();
    const isVideo = file.mimetype.startsWith('video/');
    const folder = isVideo ? 'videos' : 'files';
    const fileName = `${userId}-${uuidv4()}.${fileExtension}`;
    const bucket = 'chat'; // Ensure this bucket exists in Supabase
    const filePath = `${folder}/${fileName}`;

    this.logger.log(`Uploading chat ${folder} for user ${userId}: ${filePath}`);

    try {
      await this.supabaseService.uploadFile(
        bucket,
        filePath,
        file.buffer,
        file.mimetype,
      );

      const publicUrl = await this.supabaseService.getFileUrl(bucket, filePath);
      return publicUrl;
    } catch (error) {
      this.logger.error(`Failed to upload chat media: ${error.message}`, error.stack);
      throw error;
    }
  }
}
