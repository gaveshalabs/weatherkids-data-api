import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { AuthService } from 'src/modules/auth/auth.service';
import { OAuth2Client } from 'google-auth-library';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          secret: configService.get<string>('JWT_SECRET'),
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [SessionController],
  providers: [SessionService, OAuth2Client, AuthService],
  exports: [SessionService],
})
export class SessionModule {}
