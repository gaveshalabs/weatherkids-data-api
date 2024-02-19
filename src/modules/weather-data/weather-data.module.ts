import { Module } from '@nestjs/common';
import { WeatherDataService } from './weather-data.service';
import { WeatherDataController } from './weather-data.controller';
import {
  WeatherDatum,
  WeatherDatumSchema,
} from './entities/weather-datum.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { PointsModule } from '../points/points.module';
import { TokenModule } from '../users/token/token.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WeatherDatum.name, schema: WeatherDatumSchema },
    ]),
    TokenModule,
    PointsModule,
  ],
  controllers: [WeatherDataController],
  providers: [WeatherDataService, WeatherDatum],
  exports: [WeatherDataService],
})
export class WeatherDataModule {}
