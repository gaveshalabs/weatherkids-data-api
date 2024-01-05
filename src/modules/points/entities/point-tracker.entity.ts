import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

@Schema({
  timestamps: true,
  collection: 'point_trackers',
})
export class PointTracker {
  @Prop({ type: String, default: uuidv4 })
  _id: string;

  @Prop({ type: String, ref: 'User' })
  author_user_id: string;

  @Prop({ type: Date })
  date: Date;

  @Prop({ type: [Number] })
  hours_processed: number[];
}

export type PointTrackerDocument = PointTracker & Document;
export const PointTrackerSchema = SchemaFactory.createForClass(PointTracker);
