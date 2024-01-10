import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  WeatherDataMetadata,
  WeatherDataMetadataSchema,
} from '../schema/weatherdata-metadata.schema';

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
  @Prop({ type: Date })
  timestamp: Date;

  @Prop({ type: WeatherDataMetadataSchema })
  metadata: WeatherDataMetadata;

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

  @Prop()
  tvoc: number;
}

export type WeatherDatumDocument = WeatherDatum & Document;
export const WeatherDatumSchema = SchemaFactory.createForClass(WeatherDatum);
