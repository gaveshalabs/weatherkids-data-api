import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from 'src/modules/users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Schema({
  timestamps: true,
  collection: 'weather_stations',
})
export class WeatherStation {
  @Prop({ type: String, default: uuidv4 })
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: Object })
  coordinates: ICoordinates;

  @Prop({ type: [{ type: String, default: uuidv4, ref: User.name }] })
  user_ids: User[];
}

export type WeatherStationDocument = WeatherStation & Document;
export const WeatherStationSchema =
  SchemaFactory.createForClass(WeatherStation);
