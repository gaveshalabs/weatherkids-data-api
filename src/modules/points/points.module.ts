import { Module } from '@nestjs/common';
import { PointsService } from './points.service';
import { PointsController } from './points.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/entities/user.entity';
import {
  PointTransaction,
  PointTransactionSchema,
} from './entities/point-transaction.entity';
import {
  LastProcessedEntry,
  LastProcessedEntrySchema,
} from './entities/last-processed-entry.entity';
import { PointsConfigs } from './configs/points.config';
import { Point, PointSchema } from './entities/point.entity';
import {
  WeatherDatum,
  WeatherDatumSchema,
} from '../weather-data/entities/weather-datum.entity';
import {
  PointTracker,
  PointTrackerSchema,
} from './entities/point-tracker.entity';
import { TokenModule } from '../users/token/token.module';

@Module({
  controllers: [PointsController],
  providers: [PointsService, PointsConfigs],
  imports: [
    TokenModule,
    MongooseModule.forFeature([
      { name: PointTracker.name, schema: PointTrackerSchema },
    ]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: PointTransaction.name, schema: PointTransactionSchema },
    ]),
    MongooseModule.forFeature([
      { name: LastProcessedEntry.name, schema: LastProcessedEntrySchema },
    ]),
    MongooseModule.forFeature([{ name: Point.name, schema: PointSchema }]),
    MongooseModule.forFeature([
      { name: WeatherDatum.name, schema: WeatherDatumSchema },
    ]),
  ],
  exports: [PointsService],
})
export class PointsModule {}
