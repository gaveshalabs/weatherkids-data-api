import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { Module } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, OAuth2Client],
})
export class AuthModule {}
