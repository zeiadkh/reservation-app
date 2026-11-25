import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

import type { Request, Response } from 'express';

@Catch()
export class GenerallExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(GenerallExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();

    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    // 1. Handle NestJS HTTP exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const response = exceptionResponse as {
          message?: string | string[];
          error?: string;
        };

        message = response.message ?? exception.message;
        error = response.error ?? exception.name;
      } else {
        message = exception.message;
        error = exception.name;
      }
    } else {
      const dbError = exception as {
        name?: string;
        code?: number;
        message?: string;
      };

      // 2. Handle MongoDB duplicate key error
      if (dbError.code === 11000) {
        status = HttpStatus.CONFLICT;
        message = 'A record with this value already exists';
        error = 'Conflict';
      }

      // 3. Handle invalid MongoDB values and IDs
      else if (dbError.name === 'CastError') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid ID or value';
        error = 'Bad Request';
      }

      // 4. Handle Mongoose validation errors
      else if (dbError.name === 'ValidationError') {
        status = HttpStatus.BAD_REQUEST;
        message = dbError.message ?? 'Database validation failed';
        error = 'Bad Request';
      }

      // 5. Handle database connection errors
      else if (
        dbError.name === 'MongoNetworkError' ||
        dbError.name === 'MongoServerSelectionError' ||
        dbError.name === 'MongoTimeoutError'
      ) {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        message = 'Database service is temporarily unavailable';
        error = 'Service Unavailable';
      }
    }

    // Log unexpected errors on the server
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
