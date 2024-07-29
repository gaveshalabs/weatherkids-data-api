import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
  collection: 'clients',
})
export class Client {
  @Prop({ type: String })
  _id: string;

  @Prop({ type: String })
  type: string;

  @Prop({ type: String })
  client_secret: string;

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  @Prop({ type: Array<string> })
  scopes: string[];
}

export type ClientDocument = Client & Document;
export const ClientSchema = SchemaFactory.createForClass(Client);
