import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from './exceptions';
import { Response } from 'express';

@Catch()
export class ExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception.message || 'Internal server error';

    if (exception instanceof NotFoundError) {
      status = HttpStatus.NOT_FOUND;
    } else if (exception instanceof ConflictError) {
      status = HttpStatus.CONFLICT;
    } else if (exception instanceof BadRequestError) {
      status = HttpStatus.BAD_REQUEST;
    } else if (exception instanceof UnauthorizedError) {
      status = HttpStatus.UNAUTHORIZED;
    }

    response.status(status).json({
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
