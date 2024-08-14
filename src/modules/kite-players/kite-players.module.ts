import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KiteDataModule } from '../kite-data/kite-data.module';
import { TokenModule } from '../users/token/token.module';
import { UsersModule } from '../users/users.module';
import { CityDataSchema } from './entities/cities.schema';
import { DistrictDataSchema } from './entities/districts.schema';
import { KitePlayer, KitePlayerSchema } from './entities/kite-player.entity';
import { KitePlayersController } from './kite-players.controller';
import { KitePlayersService } from './kite-players.service';

@Module({
  imports: [
    forwardRef(() => KiteDataModule),
    UsersModule,
    TokenModule,
    MongooseModule.forFeature([
      { name: KitePlayer.name, schema: KitePlayerSchema },
      { name: 'CityData', schema: CityDataSchema},
      { name: 'DistrictData', schema: DistrictDataSchema},
    ]),
  ],
  controllers: [KitePlayersController],
  providers: [KitePlayersService, KitePlayer],
  exports: [KitePlayersService],
})
export class KitePlayersModule {}
