import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { ICoordinates } from 'src/modules/common/interfaces/coordinates.interface';
import { WeatherDataPoint } from '../entities/weather-datapoint.entity';

export class CreateWeatherComBulkWeatherDataDto {
  @IsNotEmpty()
  readonly coordinates: ICoordinates;

  @IsOptional()
  readonly sensor_id?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => WeatherDataPoint)
  readonly data: WeatherDataPoint[];
}
