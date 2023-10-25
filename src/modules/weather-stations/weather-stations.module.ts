import { Module } from '@nestjs/common';
import { WeatherStationsService } from './weather-stations.service';
import { WeatherStationsController } from './weather-stations.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  WeatherStation,
  WeatherStationSchema,
} from './entities/weather-station.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WeatherStation.name, schema: WeatherStationSchema },
    ]),
  ],
  controllers: [WeatherStationsController],
  providers: [WeatherStationsService, WeatherStation],
})
export class WeatherStationsModule {}
