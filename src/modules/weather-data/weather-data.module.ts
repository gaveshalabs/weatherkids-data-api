import { Module } from '@nestjs/common';
import { WeatherDataService } from './weather-data.service';
import { WeatherDataController } from './weather-data.controller';
import {
  WeatherDatum,
  WeatherDatumSchema,
} from './entities/weather-datum.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { SessionModule } from '../users/session/session.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WeatherDatum.name, schema: WeatherDatumSchema },
    ]),
    SessionModule,
  ],
  controllers: [WeatherDataController],
  providers: [WeatherDataService, WeatherDatum],
})
export class WeatherDataModule {}
