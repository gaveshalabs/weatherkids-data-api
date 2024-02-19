import { Module } from '@nestjs/common';
import { AppLoggerService } from './app-logger.service';

@Module({
  controllers: [],
  providers: [AppLoggerService],
  imports: [],
  exports: [AppLoggerService],
})
export class AppLoggerModule {}
