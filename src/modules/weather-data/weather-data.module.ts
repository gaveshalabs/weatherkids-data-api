import { Module } from '@nestjs/common';
import { WeatherDataService } from './weather-data.service';
import { WeatherDataController } from './weather-data.controller';
import {
  WeatherDatum,
  WeatherDatumSchema,
} from './entities/weather-datum.entity';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WeatherDatum.name, schema: WeatherDatumSchema },
    ]),
  ],
  controllers: [WeatherDataController],
  providers: [WeatherDataService, WeatherDatum],
})
export class WeatherDataModule {}
