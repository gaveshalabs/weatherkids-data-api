import { ICoordinates } from 'src/modules/common/interfaces/coordinates.interface';

export class GetWeatherDatumDto {
  readonly _id: string;
  readonly author_user_id: string;
  readonly timestamp: Date;
  readonly weather_station_id: string;
  readonly metadata: {
    joined_sensor_key: string;
    source: string;
    topic: string;
  };
  readonly coordinates: ICoordinates;
  readonly temperature: number;
  readonly humidity: number;
  readonly pressure: number;
  readonly precipitation: number;
  readonly solar_irradiance: number;
  readonly percentage_light_intensity: number;
}
