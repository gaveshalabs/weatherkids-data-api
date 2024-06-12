import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { Module } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { ClientsModule } from '../clients/clients.module';
import { TokenModule } from '../users/token/token.module';
import { WeatherStationsModule } from '../weather-stations/weather-stations.module';

@Module({
  imports: [
    UsersModule,
    ClientsModule,
    TokenModule,
    WeatherStationsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, OAuth2Client],
})
export class AuthModule {}
