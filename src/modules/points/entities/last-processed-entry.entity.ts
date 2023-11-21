import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

@Schema({
  timestamps: true,
  collection: 'last_processed_entries',
})
export class LastProcessedEntry {
  @Prop({ type: String, default: uuidv4 })
  _id: string;

  @Prop({ type: String, ref: 'User' })
  author_user_id: string;

  @Prop({ type: Number })
  last_processed_timestamp: number;
}

export type LastProcessedEntryDocument = LastProcessedEntry & Document;
export const LastProcessedEntrySchema =
  SchemaFactory.createForClass(LastProcessedEntry);
