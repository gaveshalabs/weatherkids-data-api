import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ValidateGaveshaClientGuard } from '../common/guards/gavesha-client.guard';
import { ValidateGaveshaUserGuard } from '../common/guards/gavesha-user.guard';
import { KitePlayersService } from '../kite-players/kite-players.service';
import { BulkCreateKiteDataResponseDto } from './dto/bulk-create-kite-data-response.dto';
import { CreateBulkKiteDataDto } from './dto/create-bulk-kite-data.dto';
import { KiteDataService } from './kite-data.service';

@Controller('kite-data')
@ApiTags('kite-data')
export class KiteDataController {
  constructor(
    private readonly kiteDataService: KiteDataService,
    private readonly kitePlayerService: KitePlayersService,
  ) {}

  @UseGuards(ValidateGaveshaClientGuard, ValidateGaveshaUserGuard)
  @Post('bulk')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => new BadRequestException(errors),
    }),
  )
  async bulkCommit(
    @Body() createBulkKiteData: CreateBulkKiteDataDto,
  ): Promise<BulkCreateKiteDataResponseDto[]> {
    const res = await this.kiteDataService.bulkCommit(createBulkKiteData);
    console.info(
      res.length,
      'data committed to player',
      createBulkKiteData.kite_player_id,
    );
    return res;
  }

      @Get('all')
      findAll() {
      return this.kiteDataService.findAll();
    }

    @Get('players-height')
    async getPlayersHeight() {
      return await this.kiteDataService.getKitePlayersHeight();
    }

    @Get('flying-mins/:kite_player_id')
    async getFlyingMins(@Param('kite_player_id') kitePlayerId: string):Promise<{kite_player_id: string,flying_mins: number}>{
      const flyingMins = await this.kiteDataService.getFlyingMinsByKitePlayerId(kitePlayerId);
      return { kite_player_id: kitePlayerId,flying_mins: flyingMins };
    }
}
