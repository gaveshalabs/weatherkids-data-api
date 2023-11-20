import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  BadRequestException,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { WeatherDataService } from './weather-data.service';
import { CreateWeatherDatumDto } from './dto/create-weather-datum.dto';
import { UpdateWeatherDatumDto } from './dto/update-weather-datum.dto';
import { ApiTags } from '@nestjs/swagger';
import { ValidateGaveshaClientGuard } from '../common/guards/gavesha-client.guard';
import { ValidateGaveshaUserGuard } from '../common/guards/gavesha-user.guard';

@Controller('weather-data')
@ApiTags('weather-data')
export class WeatherDataController {
  constructor(private readonly weatherDataService: WeatherDataService) {}

  @UseGuards(ValidateGaveshaClientGuard, ValidateGaveshaUserGuard)
  @Post()
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => new BadRequestException(errors),
    }),
  )
  create(@Body() createWeatherDatumDto: CreateWeatherDatumDto) {
    return this.weatherDataService.create(createWeatherDatumDto);
  }

  @Get()
  findAll() {
    return this.weatherDataService.findAll();
  }

  @Get('/with-user-details')
  findAllWithUserDetails() {
    return this.weatherDataService.findAllWithUserDetails();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.weatherDataService.findOne(+id);
  }

  @Get(':weather_station_id')
  async findAllByWeatherStationId(
    @Param('weather_station_id', new ParseUUIDPipe({ version: '4' }))
    weatherStationId: string,
  ) {
    return this.weatherDataService.findAllByWeatherStationId(weatherStationId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWeatherDatumDto: UpdateWeatherDatumDto,
  ) {
    return this.weatherDataService.update(+id, updateWeatherDatumDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.weatherDataService.remove(+id);
  }
}
