import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ICoordinates } from 'src/modules/common/interfaces/coordinates.interface';
import { User } from 'src/modules/users/entities/user.entity';
import { WeatherStation } from 'src/modules/weather-stations/entities/weather-station.entity';
import { v4 as uuidv4 } from 'uuid';

@Schema({
  timestamps: true,
  collection: 'weather_data',
  timeseries: {
    timeField: 'timestamp',
    metaField: 'metadata',
    granularity: 'minutes',
  },
})
export class WeatherDatum {
  @Prop({ type: String, default: uuidv4 })
  _id: string;

  // The field for the timeseries to use as the time field.
  @Prop({ type: Number })
  timestamp: number;

  @Prop({ type: String, default: uuidv4, ref: User.name })
  author_user_id: string;

  @Prop({ type: String, default: uuidv4, ref: WeatherStation.name })
  weather_station_id: string;

  @Prop({ type: Object })
  metadata: {
    joined_sensor_key: string;
    source: string;
    topic: string;
  };

  @Prop({ type: Object })
  coordinates: ICoordinates;

  @Prop()
  temperature: number;

  @Prop()
  humidity: number;

  @Prop()
  pressure: number;

  @Prop()
  precipitation: number;

  @Prop()
  solar_irradiance: number;

  @Prop()
  percentage_light_intensity: number;
}

export type WeatherDatumDocument = WeatherDatum & Document;
export const WeatherDatumSchema = SchemaFactory.createForClass(WeatherDatum);
