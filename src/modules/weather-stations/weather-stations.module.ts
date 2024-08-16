import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PointsModule } from '../points/points.module';
import { TokenModule } from '../users/token/token.module';
import { UsersModule } from '../users/users.module';
import { WeatherDataModule } from '../weather-data/weather-data.module';
import { GeoJsonHexagonSchema } from './entities/geojson-hexagon-coordinates';
import { SyncDataSchema } from './entities/sync-data.schema';

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
    MongooseModule.forFeature([
      { name: WeatherStation.name, schema: WeatherStationSchema },
      { name: 'SyncData', schema: SyncDataSchema },
      {name:'GeoJsonHexaCoordinates', schema: GeoJsonHexagonSchema}
    ]),
  ],
  controllers: [WeatherStationsController],
  providers: [WeatherStationsService, WeatherStation],
  exports: [WeatherStationsService],
})
export class WeatherStationsModule {}
