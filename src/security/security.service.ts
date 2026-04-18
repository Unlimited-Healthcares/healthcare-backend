import { Injectable, Logger } from '@nestjs/common';
import { EncryptionService } from './encryption.service';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(private encryptionService: EncryptionService) {}

  /**
   * Detects and prevents SQL injection attacks
   */
  detectSqlInjection(input: string): boolean {
    const sqlInjectionPattern = /('|"|;|\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|EXEC|UNION|CREATE|WHERE)\b)/i;
    return sqlInjectionPattern.test(input);
  }

  /**
   * Detects and prevents XSS attacks
   */
  detectXss(input: string): boolean {
    const xssPattern = /<script|javascript:|onerror=|onload=|eval\(|setTimeout\(|setInterval\(|document\.cookie/i;
    return xssPattern.test(input);
  }

  /**
   * Checks password strength
   */
  checkPasswordStrength(password: string): { score: number; feedback: string } {
    let score = 0;
    const feedback = [];

    if (password.length < 8) {
      feedback.push('Password should be at least 8 characters long');
    } else {
      score += 1;
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password should contain at least one uppercase letter');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password should contain at least one lowercase letter');
    }

    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password should contain at least one number');
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password should contain at least one special character');
    }

    return {
      score,
      feedback: feedback.join('. '),
    };
  }

  /**
   * Masks sensitive information in logs or responses
   */
  maskSensitiveData(data: string): string {
    // Mask credit card numbers
    let masked = data.replace(/(\d{4})[- ]?(\d{4})[- ]?(\d{4})[- ]?(\d{4})/, '$1-xxxx-xxxx-$4');
    
    // Mask SSN
    masked = masked.replace(/(\d{3})-(\d{2})-(\d{4})/, 'xxx-xx-$3');
    
    // Mask email addresses
    masked = masked.replace(/([a-zA-Z0-9._-]+)@([a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi, '***@$2');
    
    return masked;
  }

  /**
   * Validates and sanitizes file uploads
   */
  validateFileUpload(filename: string, mimeType: string, size: number): { valid: boolean; reason?: string } {
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xlsx', '.xls'];
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    
    const extension = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    
    if (!allowedExtensions.includes(extension)) {
      return { valid: false, reason: 'File extension not allowed' };
    }
    
    if (!allowedMimeTypes.includes(mimeType)) {
      return { valid: false, reason: 'File type not allowed' };
    }
    
    if (size > maxSizeInBytes) {
      return { valid: false, reason: 'File size exceeds maximum allowed (10MB)' };
    }
    
    return { valid: true };
  }
} 