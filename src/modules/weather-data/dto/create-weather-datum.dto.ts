export class CreateWeatherDatumDto {
  readonly author_user_id: string;
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
