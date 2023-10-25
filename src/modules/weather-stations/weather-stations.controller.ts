import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { WeatherStationsService } from './weather-stations.service';
import { CreateWeatherStationDto } from './dto/create-weather-station.dto';
import { UpdateWeatherStationDto } from './dto/update-weather-station.dto';
import { GetWeatherStationDto } from './dto/get-weather-station.dto';
import { AddUsersToWeatherStationDto } from './dto/add-users-to-weather-station.dto';

@Controller('weather-stations')
export class WeatherStationsController {
  constructor(
    private readonly weatherStationsService: WeatherStationsService,
  ) {}

  @Post()
  create(@Body() createWeatherStationDto: CreateWeatherStationDto) {
    return this.weatherStationsService.create(createWeatherStationDto);
  }

  @Get()
  findAll(): Promise<GetWeatherStationDto[]> {
    return this.weatherStationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.weatherStationsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWeatherStationDto: UpdateWeatherStationDto,
  ) {
    return this.weatherStationsService.update(+id, updateWeatherStationDto);
  }

  @Patch(':id/add-users')
  async addUsersToWeatherStation(
    @Param('id') weatherStationId: string,
    @Body() addUsersToWeatherStationDto: AddUsersToWeatherStationDto,
  ) {
    const { user_ids } = addUsersToWeatherStationDto;
    return this.weatherStationsService.addUsersToWeatherStation(
      weatherStationId,
      user_ids,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.weatherStationsService.remove(+id);
  }
}
