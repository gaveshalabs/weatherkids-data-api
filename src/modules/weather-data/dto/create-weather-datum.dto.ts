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
