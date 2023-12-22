import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ICoordinates } from 'src/modules/common/interfaces/coordinates.interface';

export class CreateWeatherDatumDto {
  @IsNotEmpty()
  readonly author_user_id: string;

  @IsNotEmpty()
  readonly weather_station_id: string;

  @IsNotEmpty()
  readonly timestamp: number;

  @IsOptional()
  readonly metadata: {
    joined_sensor_key: string;
    source: string;
    topic: string;
  };

  @IsNotEmpty()
  readonly coordinates: ICoordinates;

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
