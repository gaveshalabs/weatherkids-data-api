import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ICoordinates } from 'src/modules/common/interfaces/coordinates.interface';
import { User } from 'src/modules/users/entities/user.entity';
import { WeatherStation } from 'src/modules/weather-stations/entities/weather-station.entity';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class WeatherDataMetadata {
  @Prop({ type: String, ref: User.name })
  author_user_id: string;

  @Prop({ type: String, ref: WeatherStation.name })
  weather_station_id: string;

  @Prop({ type: Object })
  coordinates: ICoordinates;

  @Prop({ type: String, default: 'weathercomv3' })
  sensor_id: string;
}

export const WeatherDataMetadataSchema =
  SchemaFactory.createForClass(WeatherDataMetadata);
