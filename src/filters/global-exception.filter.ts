import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { TypeORMError } from 'typeorm';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    let status: number;
    let message: string;
    let error: string;
    let code: string;
    let stack: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse() as {
        message?: string;
        error?: string;
        code?: string;
      };
      message = errorResponse.message || exception.message;
      error = errorResponse.error || 'Http Exception';
      code = errorResponse.code || 'HTTP_EXCEPTION';
    } else if (exception instanceof TypeORMError) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
      error = 'Database Error';
      code = 'DATABASE_ERROR';
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message;
      error = 'Internal Server Error';
      code = 'INTERNAL_SERVER_ERROR';
      stack = exception.stack;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Unknown error occurred';
      error = 'Internal Server Error';
      code = 'UNKNOWN_ERROR';
    }

    // Don't expose the stack trace in production
    if (process.env.NODE_ENV === 'production') {
      stack = undefined;
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
      code,
      ...(stack && { stack }),
    };

    // Log the error
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status}: ${message}`,
        stack,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${status}: ${message}`,
      );
    }

    if (response.headersSent || response.writableEnded) {
      this.logger.warn(
        `${request.method} ${request.url} - response already sent; skipping JSON error response`,
      );
      return;
    }

    // Send the error response
    response.status(status).json(errorResponse);
  }
} 