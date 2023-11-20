import { Module } from '@nestjs/common';
import { WeatherStationsService } from './weather-stations.service';
import { WeatherStationsController } from './weather-stations.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  WeatherStation,
  WeatherStationSchema,
} from './entities/weather-station.entity';
import { SessionModule } from '../users/session/session.module';

@Module({
  imports: [
    SessionModule,
    MongooseModule.forFeature([
      { name: WeatherStation.name, schema: WeatherStationSchema },
    ]),
  ],
  controllers: [WeatherStationsController],
  providers: [WeatherStationsService, WeatherStation],
})
export class WeatherStationsModule {}
