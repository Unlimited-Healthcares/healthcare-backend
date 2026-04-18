import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly encryptionKey: Buffer;

  constructor(private configService: ConfigService) {
    const key = this.configService.get<string>('ENCRYPTION_KEY');
    if (!key) {
      this.logger.error('Missing ENCRYPTION_KEY environment variable');
      throw new Error('Missing ENCRYPTION_KEY environment variable');
    }
    
    // Derive a key using PBKDF2
    const salt = this.configService.get<string>('ENCRYPTION_SALT', 'defaultSalt');
    this.encryptionKey = crypto.pbkdf2Sync(key, salt, 10000, 32, 'sha256');
  }

  /**
   * Encrypts sensitive data
   */
  encrypt(text: string): { encryptedData: string; iv: string; authTag: string } {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag().toString('hex');
      
      return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        authTag,
      };
    } catch (error) {
      this.logger.error(`Encryption error: ${error.message}`, error.stack);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypts encrypted data
   */
  decrypt(encryptedData: string, iv: string, authTag: string): string {
    try {
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.encryptionKey,
        Buffer.from(iv, 'hex')
      );
      
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      this.logger.error(`Decryption error: ${error.message}`, error.stack);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hashes data using SHA-256
   */
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generates a random token
   */
  generateToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
} 