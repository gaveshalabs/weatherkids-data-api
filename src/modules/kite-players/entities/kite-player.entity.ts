import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ICoordinates } from 'src/modules/common/interfaces/coordinates.interface';
import { v4 as uuidv4 } from 'uuid';

@Schema({
  timestamps: true,
  collection: 'kite_players',
})
export class KitePlayer {
  @Prop({ type: String, default: uuidv4 })
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  birthday: Date;

  @Prop({ required: true })
  user_id: string;

  @Prop({ required: true, type: Object })
  coordinates: ICoordinates;

  @Prop({ required: true })
  city: string;

  @Prop()
  client_id: string;
}

export type KitePlayerDocument = KitePlayer & Document;
export const KitePlayerSchema = SchemaFactory.createForClass(KitePlayer);
