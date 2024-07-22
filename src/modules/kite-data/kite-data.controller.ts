import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe
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

  @Get('latest')
  async findLatestByAllKitePlayers(@Query('include') include?: string): Promise<any> {
    const includeCurrentWeek = include === 'current_week';
    return await this.kiteDataService.findLatestByAllKitePlayers(includeCurrentWeek);
  }
  
  @Get('latest/:kite_player_id')
  async findLatestByKitePlayerId(
    @Param('kite_player_id', new ParseUUIDPipe({ version: '4' })) kitePlayerId: string,
    @Query('include') include?: string
  ) {
    const includeCurrentWeek = include === 'current_week';
    const kiteData = await this.kiteDataService.findLatestByKitePlayerId(kitePlayerId, includeCurrentWeek);
  
    if (!kiteData) {
      return { flying_mins: null, max_height: null, total_attempts: null };
    }
    return kiteData;
  }
  
  @Get('players-leaderboard')
  async getPlayersLeaderBoard() {
    return await this.kiteDataService.getPlayersLeaderBoard();
  }
}
