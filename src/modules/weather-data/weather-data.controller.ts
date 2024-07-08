import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ValidateGaveshaClientGuard } from '../common/guards/gavesha-client.guard';
import { WeatherStationsService } from '../weather-stations/weather-stations.service';
import { BulkCreateWeatherDataResponseDto } from './dto/bulk-create-weather-data-response.dto';
import { CreateBulkWeatherDataDto } from './dto/create-bulk-weather-data.dto';
import { CreateWeatherComBulkWeatherDataDto } from './dto/create-weathercom-bulk-weather-data.dto';
import { GetWeatherDatumDto } from './dto/get-weather-datum.dto';
import { WeatherDataService } from './weather-data.service';
import { ValidateGaveshaUserGuard } from '../common/guards/gavesha-user.guard';

@Controller('weather-data')
@ApiTags('weather-data')
export class WeatherDataController {
  constructor(
    private readonly weatherDataService: WeatherDataService,
    private readonly weatherStationService: WeatherStationsService,
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
    @Body() createBulkWeatherData: CreateBulkWeatherDataDto,
  ): Promise<BulkCreateWeatherDataResponseDto[]> {
    const res = await this.weatherDataService.bulkCommit(createBulkWeatherData);
    console.info(
      res.length,
      'data committed to station',
      createBulkWeatherData.weather_station_id,
    );
    return res;
  }

  @UseGuards(ValidateGaveshaClientGuard)
  @Post('bulk/weathercom')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => new BadRequestException(errors),
    }),
  )
  async bulkCommitFromWeatherComputer(
    @Body() createBulkWeatherData: CreateWeatherComBulkWeatherDataDto,
    @Req() req: any,
  ): Promise<BulkCreateWeatherDataResponseDto[]> {
    const station = await this.weatherStationService.findByClient(req.clientId);
    if (!station) {
      console.error('Data commit attempted from invalid client:', req.clientId);
      throw new ForbiddenException('Invalid weather station');
    }
    const dto: CreateBulkWeatherDataDto = {
      ...createBulkWeatherData,
      author_user_id: station.user_ids[0],
      weather_station_id: station.id,
    };
    try {
      const res = await this.weatherDataService.bulkCommit(dto);
      console.info(res.length, 'data committed from weathercom', station.id);
      return res;
    } catch (err) {
      console.error(
        'ERROR in bulk commit from weather computer. Request body=',
        dto,
        err,
      );
    }
  }

  @UseGuards(ValidateGaveshaClientGuard)
  @Post('test')
  async reissueAuthToken(@Headers('authorization') h) {
    return h;
  }

  @Get('all')
  findAll() {
    return this.weatherDataService.findAll();
  }

  @Get('/with-user-details')
  findAllWithUserDetails() {
    return this.weatherDataService.findAllWithUserDetails();
  }

  @Get()
  async findAllByWeatherStationId(
    @Query('weather_station_id', new ParseUUIDPipe({ version: '4' }))
    weatherStationId: string,
    @Query('from_date') dateFrom?: string, // Optional parameter
    @Query('to_date') dateTo?: string, // Optional parameter
  ): Promise<GetWeatherDatumDto[]> {
    return await this.weatherDataService.findAllByWeatherStationId(
      weatherStationId,
      dateFrom,
      dateTo,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.weatherDataService.remove(+id);
  }
}
