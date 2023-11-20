import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { UsersModule } from '../users.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { AuthService } from 'src/modules/auth/auth.service';
import { OAuth2Client } from 'google-auth-library';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [SessionController],
  providers: [SessionService, OAuth2Client, AuthService],
  exports: [SessionService],
})
export class SessionModule {}
