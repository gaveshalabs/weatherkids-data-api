import { PartialType } from '@nestjs/mapped-types';
import { CreateWeatherDatumDto } from './create-weather-datum.dto';

export class UpdateWeatherDatumDto extends PartialType(CreateWeatherDatumDto) {}
