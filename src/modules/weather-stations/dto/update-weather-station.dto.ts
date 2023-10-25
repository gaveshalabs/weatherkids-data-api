import { PartialType } from '@nestjs/mapped-types';
import { CreateWeatherStationDto } from './create-weather-station.dto';

export class UpdateWeatherStationDto extends PartialType(CreateWeatherStationDto) {}
