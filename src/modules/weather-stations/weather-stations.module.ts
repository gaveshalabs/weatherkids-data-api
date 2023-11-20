import { Module } from '@nestjs/common';
import { WeatherStationsService } from './weather-stations.service';
import { WeatherStationsController } from './weather-stations.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  WeatherStation,
  WeatherStationSchema,
} from './entities/weather-station.entity';
import { SessionModule } from '../users/session/session.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    SessionModule,
    MongooseModule.forFeature([
      { name: WeatherStation.name, schema: WeatherStationSchema },
    ]),
  ],
  controllers: [WeatherStationsController],
  providers: [WeatherStationsService, WeatherStation],
})
export class WeatherStationsModule {}
