import { Module } from '@nestjs/common';
import { WeatherStationsService } from './weather-stations.service';
import { WeatherStationsController } from './weather-stations.controller';

@Module({
  controllers: [WeatherStationsController],
  providers: [WeatherStationsService],
})
export class WeatherStationsModule {}
