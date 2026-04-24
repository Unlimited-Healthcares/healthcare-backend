import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient | null = null;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      this.configService.get<string>('SUPABASE_KEY') ||
      this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn('Supabase credentials not configured properly. Storage features will be disabled.');
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  getClient(): SupabaseClient {
    if (!this.supabase) {
      throw new Error('Supabase client is not initialized. Check your credentials.');
    }
    return this.supabase;
  }

  async uploadFile(bucket: string, path: string, file: Buffer, contentType: string) {
    if (!this.supabase) {
      throw new Error('Supabase storage is not configured.');
    }
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw error;
    }

    return data;
  }

  async getFileUrl(bucket: string, path: string) {
    if (!this.supabase) {
      throw new Error('Supabase storage is not configured.');
    }
    const { data } = await this.supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async deleteFile(bucket: string, path: string) {
    if (!this.supabase) {
      throw new Error('Supabase storage is not configured.');
    }
    const { error } = await this.supabase.storage.from(bucket).remove([path]);
    if (error) {
      throw error;
    }
    return true;
  }
  async createSignedUrl(bucket: string, path: string, expiresIn: number = 3600) {
    if (!this.supabase) {
      throw new Error('Supabase storage is not configured.');
    }
    return await (this.supabase.storage.from(bucket) as any).createSignedUrl(path, expiresIn);
  }
}