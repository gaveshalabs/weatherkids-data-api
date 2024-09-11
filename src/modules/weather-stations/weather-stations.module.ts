import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PointsModule } from '../points/points.module';
import { TokenModule } from '../users/token/token.module';
import { UsersModule } from '../users/users.module';
import { WeatherDataModule } from '../weather-data/weather-data.module';
import { GeoJsonHexagonSchema } from './entities/geojson-hexagon-coordinates.schema';
import { SyncDataSchema } from './entities/sync-data.schema';

import { DownloadsModule } from '../downloads/downloads.module';
import { DownloadsService } from '../downloads/downloads.service';
import {
  WeatherStation,
  WeatherStationSchema,
} from './entities/weather-station.entity';
import { WeatherStationsController } from './weather-stations.controller';
import { WeatherStationsService } from './weather-stations.service';

@Module({
  imports: [
    PointsModule,
    forwardRef(()=>WeatherDataModule),
    UsersModule,
    TokenModule,
    DownloadsModule,
    MongooseModule.forFeature([
      { name: WeatherStation.name, schema: WeatherStationSchema },
      { name: 'SyncData', schema: SyncDataSchema },
      {name:'GeoJsonHexagonCoordinates', schema: GeoJsonHexagonSchema}
    ]),
  ],
  controllers: [WeatherStationsController],
  providers: [WeatherStationsService, WeatherStation, DownloadsService],
  exports: [WeatherStationsService],
})
export class WeatherStationsModule {}
