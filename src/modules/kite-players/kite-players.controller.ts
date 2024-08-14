import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
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

  @Get('age-group')
  async getKitePlayerStatsByAgeRange(): Promise<any> {
    try {
      const stats = await this.kiteplayersService.getKitePlayerStatsByAgeRange();
      return stats;
    } catch (error) {
      throw new Error('Failed to retrieve kite player statistics by age group.');
    }
  }

  @Get()
  findAll(): Promise<GetKitePlayerDto[]> {
    return this.kiteplayersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.kiteplayersService.findOne(id);
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
