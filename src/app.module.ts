import { AuthModule } from './modules/auth/auth.module';

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { WeatherDataModule } from './modules/weather-data/weather-data.module';
import { ConfigModule } from '@nestjs/config';
import { WeatherStationsModule } from './modules/weather-stations/weather-stations.module';
import { UsersModule } from './modules/users/users.module';
import { SessionModule } from './modules/users/session/session.module';
@Module({
  imports: [
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
