import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { ICoordinates } from 'src/modules/common/interfaces/coordinates.interface';
import { WeatherDataPoint } from '../entities/weather-datapoint.entity';

export class CreateWeatherComBulkWeatherDataDto {
  @IsNotEmpty()
  readonly coordinates: ICoordinates;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => WeatherDataPoint)
  readonly data: WeatherDataPoint[];
}
