import { PartialType } from '@nestjs/mapped-types';
import { WeatherStationCreatedResponseDto } from './weather-station-created-response.dto';

export class WeatherStationUpdatedResponseDto extends PartialType(
  WeatherStationCreatedResponseDto,
) {}
