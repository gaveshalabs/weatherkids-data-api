import { Injectable } from '@nestjs/common';
import { logger } from 'firebase-functions/v1';

@Injectable()
/**
 * Service class for managing application wide logs.
 */
export class AppLoggerService {
  /**
   * Constructs a new instance of the AppLoggerService class.
   */
  constructor() {}

  logInfo(...args: any[]) {
    logger.info(args);
  }

  logWarn(...args: any[]) {
    logger.warn(args);
  }
}
