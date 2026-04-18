import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException, Logger } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<unknown> {
  private readonly logger = new Logger(ValidationPipe.name);

  async transform(value: unknown, { metatype }: ArgumentMetadata): Promise<unknown> {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    if (value === undefined || value === null) {
      throw new BadRequestException({
        message: ['Payload should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const errorMessages = errors.map(err => {
        const constraints = err.constraints ? Object.values(err.constraints) : ['Invalid input'];
        return `${err.property}: ${constraints.join(', ')}`;
      });

      this.logger.warn(`Validation failed: ${errorMessages.join('; ')}`);

      throw new BadRequestException({
        message: errorMessages,
        details: errors.map(err => ({
          property: err.property,
          constraints: err.constraints,
        })),
        code: 'VALIDATION_FAILED',
      });
    }

    return object;
  }

  private toValidate(metatype: unknown): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype as never);
  }
} 