import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from 'src/modules/users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Schema({
  timestamps: true,
  collection: 'weather_data',
  timeseries: {
    timeField: 'updatedAt',
    granularity: 'seconds',
  },
})
export class WeatherDatum {
  @Prop({ type: String, default: uuidv4 })
  _id: string;

  @Prop({ type: String, default: uuidv4, ref: User.name })
  author_user_id: string;

  // get station id by user id (assume one user one station)

  @Prop({ type: Object })
  metadata: {
    joined_sensor_key: string;
    source: string;
    topic: string;
  };

  @Prop({ type: Object })
  coordinates: {
    lat: number;
    long: number;
  };

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
