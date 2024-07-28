import { Module } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { AuthModule } from 'src/modules/auth/auth.module';
import { AuthService } from 'src/modules/auth/auth.service';
import { KitePlayersModule } from 'src/modules/kite-players/kite-players.module';
import { ClientsModule } from '../../clients/clients.module';
import { WeatherStationsModule } from '../../weather-stations/weather-stations.module';
import { TokenModule } from '../token/token.module';
import { UsersModule } from '../users.module';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    WeatherStationsModule,
    TokenModule,
    ClientsModule,
    KitePlayersModule
  ],
  controllers: [SessionController],
  providers: [SessionService, OAuth2Client, AuthService],
  exports: [SessionService],
})
export class SessionModule {}
