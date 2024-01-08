import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
  BadRequestException,
  UsePipes,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { WeatherDataService } from './weather-data.service';
import { ApiTags } from '@nestjs/swagger';
import { ValidateGaveshaClientGuard } from '../common/guards/gavesha-client.guard';
import { ValidateGaveshaUserGuard } from '../common/guards/gavesha-user.guard';
import { CreateBulkWeatherDataDto } from './dto/create-bulk-weather-data.dto';
import { BulkCreateWeatherDataResponseDto } from './dto/bulk-create-weather-data-response.dto';
import { GetWeatherDatumDto } from './dto/get-weather-datum.dto';

@Controller('weather-data')
@ApiTags('weather-data')
export class WeatherDataController {
  constructor(private readonly weatherDataService: WeatherDataService) {}

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
    return await this.weatherDataService.bulkCommit(createBulkWeatherData);
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
    @Query('from_date') dateFrom?: string, // Optional date_from parameter
    @Query('to_date') dateTo?: string, // Optional date_to parameter
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
