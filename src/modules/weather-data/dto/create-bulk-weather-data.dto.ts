import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { ICoordinates } from 'src/modules/common/interfaces/coordinates.interface';

export class CreateBulkWeatherDataDto {
  @IsNotEmpty()
  readonly author_user_id: string;

  @IsNotEmpty()
  readonly weather_station_id: string;

  @IsNotEmpty()
  readonly coordinates: ICoordinates;

  @IsNotEmpty()
  readonly metadata: {
    joined_sensor_key: string;
    source: string;
    topic: string;
  };

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateWeatherDataPointDto)
  readonly data: CreateWeatherDataPointDto[];
}

export class CreateWeatherDataPointDto {
  @IsNotEmpty()
  readonly timestamp: number;

  @IsNotEmpty()
  @IsNumber()
  readonly temperature: number;

  @IsNotEmpty()
  @IsNumber()
  readonly humidity: number;

  @IsNotEmpty()
  @IsNumber()
  readonly pressure: number;

  @IsNotEmpty()
  @IsNumber()
  readonly precipitation: number;

  @IsNotEmpty()
  @IsNumber()
  readonly solar_irradiance: number;

  @IsNotEmpty()
  @IsNumber()
  readonly percentage_light_intensity: number;
}
