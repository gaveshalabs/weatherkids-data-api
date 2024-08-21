import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import * as moment from 'moment-timezone';
import { ValidateGaveshaClientGuard } from '../common/guards/gavesha-client.guard';
import { ValidateGaveshaUserGuard } from '../common/guards/gavesha-user.guard';
import { DownloadsService } from '../downloads/downloads.service';
import { PointsService } from '../points/points.service';
import { WeatherDataService } from '../weather-data/weather-data.service';
import { AddUsersToWeatherStationDto } from './dto/add-users-to-weather-station.dto';
import { CreateWeatherStationDto } from './dto/create-weather-station.dto';
import { GetWeatherStationDto } from './dto/get-weather-station.dto';
import { UpdateWeatherStationDto } from './dto/update-weather-station.dto';
import { WeatherStationUpdatedResponseDto } from './dto/weather-station-updated-response.dto';
import { WeatherStationsService } from './weather-stations.service';

@Controller('weather-stations')
@ApiTags('weather-stations')
export class WeatherStationsController {
  constructor(
    private readonly weatherStationsService: WeatherStationsService,
    private readonly weatherDataService: WeatherDataService,
    private readonly pointsService: PointsService,
    private readonly downloadsService: DownloadsService
  ) {}

  @UseGuards(ValidateGaveshaClientGuard, ValidateGaveshaUserGuard)
  @Post()
  create(
    @Headers('gavesha-user-api-key') gaveshaUserApiKey: string,
    @Body() createWeatherStationDto: CreateWeatherStationDto,
  ) {
    return this.weatherStationsService.create(
      createWeatherStationDto,
      gaveshaUserApiKey,
    );
  }

  @Get()
  findAll(): Promise<GetWeatherStationDto[]> {
    return this.weatherStationsService.findAll();
  }

  @UseGuards(ValidateGaveshaClientGuard)
  @Get('/sync')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => new BadRequestException(errors),
    }),
  )
  async sync(
    @Req() req: any,
  ){
    const station = await this.weatherStationsService.findByClientId(req.clientId);
    if (!station) {
      throw new NotFoundException('Weather station not found');
    }
    const utcTimestamp = new Date().toISOString();
    const sriLankanTime = moment.utc(utcTimestamp).tz('Asia/Colombo').format('YYYY-MM-DDTHH:mm:ss');
    
    const topFirmware = this.downloadsService.getTopFirmware();
    const { version_number, crc } = topFirmware;

    await this.weatherStationsService.saveSyncData(req.clientId,station._id);
    return {
      server_timestamp: sriLankanTime,
      version_number,
      crc,
    };
  }

  @Get('hexagon/:hexagonName')
  async findWeatherStationByHexagonId(@Param('hexagonName') hexagonName: string) {
    const weatherStationData = await this.weatherStationsService.findWeatherStationByHexagonName(hexagonName);
    if (!weatherStationData) {
      return { message: `No weather stations found for hexagon name: ${hexagonName}` };
    }
    return weatherStationData;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.weatherStationsService.findOne(id);
  }

  // TODO: refactor to weather-data module.
  @Get('latest/:weather_station_id')
  async findLatestByWeatherStationId(
    @Param('weather_station_id', new ParseUUIDPipe({ version: '4' }))
    weatherStationId: string,
  ) {
    // TODO: return points as well.
    // TODO: Assumed only one user per weather station.

    // Get weather data.
    const weatherData =
      await this.weatherDataService.findLatestByWeatherStationId(
        weatherStationId,
      );

    if (!weatherData) {
      return {
        weatherData: null,
        pointsOfUser: null,
      };
    }

    // Get points of the user of the weather station.
    const pointsOfUser = await this.pointsService.findByUserId(
      weatherData.author_user_id,
    );

    return {
      weatherData,
      pointsOfUser,
    };
  }

  @UseGuards(ValidateGaveshaClientGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateWeatherStationDto: UpdateWeatherStationDto,
  ): Promise<WeatherStationUpdatedResponseDto> {
    return this.weatherStationsService.update(id, updateWeatherStationDto);
  }

  @UseGuards(ValidateGaveshaClientGuard)
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

  @UseGuards(ValidateGaveshaClientGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.weatherStationsService.remove(+id);
  }
}
