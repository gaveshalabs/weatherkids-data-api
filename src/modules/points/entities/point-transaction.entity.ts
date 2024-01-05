import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PointTransactionTypes } from 'src/modules/common/enums/point-transaction-types.enum';
import { v4 as uuidv4 } from 'uuid';

@Schema({
  timestamps: true,
  collection: 'point_transactions',
})
export class PointTransaction {
  @Prop({ type: String, default: uuidv4 })
  _id: string;

  @Prop({ type: String, ref: 'User' })
  author_user_id: string;

  @Prop()
  amount: number;

  @Prop()
  transaction_type: PointTransactionTypes;
}

export type PointTransactionDocument = PointTransaction & Document;
export const PointTransactionSchema =
  SchemaFactory.createForClass(PointTransaction);
