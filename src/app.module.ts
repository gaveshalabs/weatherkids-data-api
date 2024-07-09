import { AuthModule } from './modules/auth/auth.module';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule } from './modules/clients/clients.module';
import { GuardsModule } from './modules/common/guards/guards.module';
import { KiteDataModule } from './modules/kite-data/kite-data.module';
import { KitePlayersModule } from './modules/kite-players/kite-players.module';
import { PointsModule } from './modules/points/points.module';
import { SessionModule } from './modules/users/session/session.module';
import { TokenModule } from './modules/users/token/token.module';
import { UsersModule } from './modules/users/users.module';
import { WeatherDataModule } from './modules/weather-data/weather-data.module';
import { WeatherStationsModule } from './modules/weather-stations/weather-stations.module';
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          secret: configService.get<string>('JWT_SECRET'),
        };
      },
      global: true,
      inject: [ConfigService],
    }),
    GuardsModule,

    SessionModule,
    TokenModule,
    AuthModule,
    UsersModule,

    ConfigModule.forRoot({
      envFilePath: ['.env.local', '.env.dev', '.env.prod'],
    }),
    MongooseModule.forRoot(process.env.MONGO_URL),
    WeatherDataModule,
    WeatherStationsModule,
    PointsModule,
    ClientsModule,
    KitePlayersModule,
    KiteDataModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
