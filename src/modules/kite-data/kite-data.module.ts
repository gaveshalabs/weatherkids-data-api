import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KitePlayersModule } from '../kite-players/kite-players.module';
import { TokenModule } from '../users/token/token.module';
import { KiteDatum, KiteDatumSchema } from './entities/kite-datum-entity';
import { KiteDataController } from './kite-data.controller';
import { KiteDataService } from './kite-data.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: KiteDatum.name, schema: KiteDatumSchema },
    ]),
    TokenModule,
    forwardRef(() => KitePlayersModule),
  ],
  controllers: [KiteDataController],
  providers: [KiteDataService, KiteDatum],
  exports: [KiteDataService],
})
export class KiteDataModule {}
