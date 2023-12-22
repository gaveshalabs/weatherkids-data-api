import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
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

  @IsOptional()
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

  @IsNumber()
  @IsOptional()
  readonly temperature: number;

  @IsNumber()
  @IsOptional()
  readonly humidity: number;

  @IsNumber()
  @IsOptional()
  readonly pressure: number;

  @IsNumber()
  @IsOptional()
  readonly precipitation: number;

  @IsNumber()
  @IsOptional()
  readonly solar_irradiance: number;

  @IsNumber()
  @IsOptional()
  readonly percentage_light_intensity: number;

  @IsNumber()
  @IsOptional()
  readonly tvoc: number;
}
