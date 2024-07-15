import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { UsersModule } from '../users.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { AuthService } from 'src/modules/auth/auth.service';
import { OAuth2Client } from 'google-auth-library';
import { WeatherStationsModule } from '../../weather-stations/weather-stations.module';
import { TokenModule } from '../token/token.module';
import { ClientsModule } from '../../clients/clients.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    WeatherStationsModule,
    TokenModule,
    ClientsModule,
  ],
  controllers: [SessionController],
  providers: [SessionService, OAuth2Client, AuthService],
  exports: [SessionService],
})
export class SessionModule {}
