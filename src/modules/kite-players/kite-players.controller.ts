import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ValidateGaveshaClientGuard } from '../common/guards/gavesha-client.guard';
import { ValidateGaveshaUserGuard } from '../common/guards/gavesha-user.guard';
import { KiteDataService } from '../kite-data/kite-data.service';
import { CreateKitePlayerDto } from './dto/create-kite-player-dto';
import { GetKitePlayerDto } from './dto/get-kite-player-dto';
import { KitePlayerUpdatedResponseDto } from './dto/kite-player-updated-response.dto';
import { UpdateKitePlayerDto } from './dto/update-kite-player-dto';
import { KitePlayer } from './entities/kite-player.entity';
import { KitePlayersService } from './kite-players.service';

@Controller('kite-players')
@ApiTags('kite-players')
export class KitePlayersController {
  constructor(
    private readonly kiteplayersService: KitePlayersService,
    private readonly kiteDataService: KiteDataService,
  ) {}

  @UseGuards(ValidateGaveshaClientGuard, ValidateGaveshaUserGuard)
  @Post()
  create(
    @Headers('gavesha-user-api-key') gaveshaUserApiKey: string,
    @Body() createKitePlayerDto: CreateKitePlayerDto,
  ) {
    return this.kiteplayersService.create(
      createKitePlayerDto,
      gaveshaUserApiKey,
    );
  }

  @Get()
  findAll(): Promise<GetKitePlayerDto[]> {
    return this.kiteplayersService.findAll();
  }

  @Get('nearest-district')
  async getKitePlayersCountByNearestDistrict() {
    return this.kiteplayersService.getKitePlayersCountByNearestDistrict();
  }

  @Get('age-group')
  async getKitePlayerStatsByAgeRange(): Promise<any> {
    try {
      const stats = await this.kiteplayersService.getKitePlayerStatsByAgeRange();
      return stats;
    } catch (error) {
      throw new Error('Failed to retrieve kite player statistics by age group.');
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Query('sortByHeight') sortByHeight?: string, @Query('sortByAttempt') sortByAttempt?: string) {
    const kitePlayer = await this.kiteplayersService.findOne(id);
    const attempts = await this.kiteDataService.getAttemptsByPlayerId(id, sortByHeight, sortByAttempt);
    return {
      kitePlayer,
      attempts
    };
  }

  @Get(':id/attempts/:attempt_timestamp')
  async getAttemptsByKitePlayerIdAndAttemptTimestamp(
    @Param('id') id: string,
    @Param('attempt_timestamp') attempt_timestamp: string
  ) {
    const attemptTimestamp = new Date(attempt_timestamp); 
    return this.kiteDataService.attemptsByKitePlayerIdAndAttemptTimestamp(id, attemptTimestamp);
  }

  @UseGuards(ValidateGaveshaClientGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateKiteplayerDto: UpdateKitePlayerDto,
  ): Promise<KitePlayerUpdatedResponseDto> {
    return this.kiteplayersService.update(id, updateKiteplayerDto);
  }

  @UseGuards(ValidateGaveshaClientGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.kiteplayersService.remove(+id);
  }

  @Get('users/:userId')
  async getKitePlayerByUserId(@Param('userId') userId: string): Promise<KitePlayer> {
    return this.kiteplayersService.findKitePlayerByUserId(userId);
  }
}
