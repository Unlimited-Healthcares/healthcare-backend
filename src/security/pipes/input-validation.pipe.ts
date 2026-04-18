import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException, Logger } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import * as DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

@Injectable()
export class InputValidationPipe implements PipeTransform<unknown> {
  private readonly logger = new Logger(InputValidationPipe.name);
  private readonly window = new JSDOM('').window;
  private readonly purify = DOMPurify(this.window);

  async transform(value: unknown, { metatype }: ArgumentMetadata): Promise<unknown> {
    if (!metatype || !this.toValidate(metatype)) {
      return this.sanitizeData(value);
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const errorMessages = errors.map(err => {
        const constraints = err.constraints ? Object.values(err.constraints) : ['Invalid input'];
        return `${err.property}: ${constraints.join(', ')}`;
      });

      this.logger.warn(`Validation failed: ${errorMessages.join('; ')}`);
      throw new BadRequestException('Validation failed: ' + errorMessages.join(', '));
    }

    return this.sanitizeData(object);
  }

  private toValidate(metatype: unknown): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype as never);
  }

  private sanitizeData(data: unknown): unknown {
    if (typeof data === 'string') {
      return this.purify.sanitize(data);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    if (data !== null && typeof data === 'object') {
      return Object.keys(data as Record<string, unknown>).reduce((sanitized, key) => {
        sanitized[key] = this.sanitizeData((data as Record<string, unknown>)[key]);
        return sanitized;
      }, {} as Record<string, unknown>);
    }

    return data;
  }
} 