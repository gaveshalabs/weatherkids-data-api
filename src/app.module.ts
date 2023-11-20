import { AuthModule } from './modules/auth/auth.module';

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { WeatherDataModule } from './modules/weather-data/weather-data.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WeatherStationsModule } from './modules/weather-stations/weather-stations.module';
import { UsersModule } from './modules/users/users.module';
import { SessionModule } from './modules/users/session/session.module';
import { GuardsModule } from './modules/common/guards/guards.module';
import { JwtModule } from '@nestjs/jwt';
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
    AuthModule,
    UsersModule,

    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URL),
    WeatherDataModule,
    WeatherStationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
