import { Prop } from '@nestjs/mongoose';
import { ICoordinates } from 'src/modules/common/interfaces/coordinates.interface';

export class GetWeatherDatumDto {
  @Prop()
  readonly _id: string;

  @Prop()
  readonly author_user_id: string;

  @Prop()
  readonly timestamp: Date;

  @Prop()
  readonly weather_station_id: string;

  @Prop()
  readonly sensor_id: string;

  @Prop()
  readonly coordinates: ICoordinates;

  @Prop()
  readonly temperature: number;

  @Prop()
  readonly humidity: number;

  @Prop()
  readonly pressure: number;

  @Prop()
  readonly precipitation: number;

  @Prop()
  readonly solar_irradiance: number;

  @Prop()
  readonly percentage_light_intensity: number;

  @Prop()
  readonly tvoc: number;
}
