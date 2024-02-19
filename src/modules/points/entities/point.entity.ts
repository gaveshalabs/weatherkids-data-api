import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

@Schema({
  timestamps: true,
  collection: 'points',
})
export class Point {
  @Prop({ type: String, default: uuidv4 })
  _id: string;

  @Prop({ type: String, ref: 'User' })
  author_user_id: string;

  @Prop({ type: Number, default: 0 })
  amount: number;

  @Prop({ type: Number, default: 0 })
  last_point_calculated_timestamp: number;

  @Prop({ type: Date })
  last_point_calculated_datetime: number;

  @Prop({ type: Boolean, default: false })
  freeze_points: boolean;
}

export type PointDocument = Point & Document;
export const PointSchema = SchemaFactory.createForClass(Point);
