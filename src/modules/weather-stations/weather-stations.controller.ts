import {
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

@UseGuards(ValidateGaveshaClientGuard)
@Post('/sync')
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
async syncWeatherStation(
  @Req() req: any,
  @Body() syncWeatherStationDto?: { update_begin?: boolean; update_version?: string; update_done?: boolean },
): Promise<{ server_timestamp?: string; version_number?: string; crc32?: string }> {
  const clientId = req.clientId;
  const station = await this.weatherStationsService.findByClientId(clientId);
  if (!station) {
    throw new NotFoundException('Weather station not found');
  }
  return this.weatherStationsService.handleSyncRequest(syncWeatherStationDto, clientId, station._id);
}
}
