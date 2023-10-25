import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from 'src/modules/users/entities/user.entity';

@Schema({
  timestamps: true,
  collection: 'weather_stations',
})
export class WeatherStation {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  coordinates: string;

  @Prop({ type: [{ type: 'ObjectId', ref: 'User' }] })
  users: User[];
}

export type WeatherStationDocument = WeatherStation & Document;
export const WeatherStationSchema =
  SchemaFactory.createForClass(WeatherStation);
