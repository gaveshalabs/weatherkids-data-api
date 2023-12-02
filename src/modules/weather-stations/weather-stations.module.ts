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
import { WeatherDataModule } from '../weather-data/weather-data.module';
import { PointsModule } from '../points/points.module';

@Module({
  imports: [
    PointsModule,
    WeatherDataModule,
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
