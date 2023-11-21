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
import { PointsUtils } from './utils/points.utils';
import { Point, PointSchema } from './entities/point.entity';

@Module({
  controllers: [PointsController],
  providers: [PointsService, PointsConfigs, PointsUtils],
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: PointTransaction.name, schema: PointTransactionSchema },
    ]),
    MongooseModule.forFeature([
      { name: LastProcessedEntry.name, schema: LastProcessedEntrySchema },
    ]),
    MongooseModule.forFeature([{ name: Point.name, schema: PointSchema }]),
  ],
  exports: [PointsService],
})
export class PointsModule {}
