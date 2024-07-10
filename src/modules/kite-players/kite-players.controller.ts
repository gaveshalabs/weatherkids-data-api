import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ValidateGaveshaClientGuard } from '../common/guards/gavesha-client.guard';
import { ValidateGaveshaUserGuard } from '../common/guards/gavesha-user.guard';
import { KiteDataService } from '../kite-data/kite-data.service';
import { CreateKitePlayerDto } from './dto/create-kite-player-dto';
import { GetKitePlayerDto } from './dto/get-kite-player-dto';
import { KitePlayersService } from './kite-players.service';


@Controller('kite-players')
@ApiTags('kite-players')
export class KitePlayersController {
    constructor(
        private readonly kiteplayersService: KitePlayersService,
        private readonly kiteDataService: KiteDataService,
    ){}

    @UseGuards(ValidateGaveshaClientGuard, ValidateGaveshaUserGuard)
    @Post()
    create(
      @Headers('gavesha-user-api-key') gaveshaUserApiKey: string,
      @Body() createKitePlayerDto: CreateKitePlayerDto,
    ){
     return this.kiteplayersService.create(
        createKitePlayerDto,
        gaveshaUserApiKey,
     );
    }

    @Get()
    findAll(): Promise<GetKitePlayerDto[]>{
        return this.kiteplayersService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.kiteplayersService.findOne(id);
    }

}
