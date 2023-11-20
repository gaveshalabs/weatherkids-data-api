import { PartialType } from '@nestjs/mapped-types';
import { CreateWeatherStationDto } from './create-weather-station.dto';

export class WeatherStationCreatedResponseDto extends PartialType(
  CreateWeatherStationDto,
) {
  readonly gavesha_user_api_key: string;
  readonly _id: string;
}
