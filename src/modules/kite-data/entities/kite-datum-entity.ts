import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  KiteDataMetaData,
  KiteDataMetadataSchema,
} from '../schema/kitedata-metadata.schema';

@Schema({
  timestamps: true,
  collection: 'kite_data',
  timeseries: {
    timeField: 'timestamp',
    metaField: 'metadata',
    granularity: 'minutes',
  },
})
export class KiteDatum {
  @Prop({ type: String, default: uuidv4 })
  _id: string;

  @Prop({ type: Date })
  timestamp: Date;

  @Prop({ type: KiteDataMetadataSchema })
  metadata: KiteDataMetaData;

  @Prop()
  temperature: number;

  @Prop()
  pressure: number;

  @Prop()
  altitude: number;
}

export type KiteDatumDocument = KiteDatum & Document;
export const KiteDatumSchema = SchemaFactory.createForClass(KiteDatum);
