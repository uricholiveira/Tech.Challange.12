// logger/logger.service.ts
import { Injectable, LoggerService } from '@nestjs/common';
import { createLogger, format, transports } from 'winston';
import * as path from 'path';
import 'winston-daily-rotate-file';

@Injectable()
export class CustomLogger implements LoggerService {
  private readonly logger = createLogger({
    level: 'info',
    format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.printf(
        (info) =>
          `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`,
      ),
    ),
    transports: [
      new transports.Console(),
      new transports.DailyRotateFile({
        filename: path.join(__dirname, '../../logs/application-%DATE%.log'),
        datePattern: 'DD-MM-YYYY',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
      }),
    ],
  });

  log(message: string) {
    this.logger.info(message);
  }

  error(message: string, trace: string) {
    this.logger.error(`${message} -> Trace: ${trace}`);
  }

  warn(message: string) {
    this.logger.warn(message);
  }

  debug(message: string) {
    this.logger.debug(message);
  }

  verbose(message: string) {
    this.logger.verbose(message);
  }
}
