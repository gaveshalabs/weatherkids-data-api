import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User {
  @Prop({ type: String, default: uuidv4 })
  _id: string;

  @Prop({ type: String })
  uid: string;

  @Prop({ type: String })
  gavesha_user_api_key: string;

  @Prop({ type: String })
  name: string;

  @Prop({ type: String, unique: true })
  email: string;

  @Prop({ type: String })
  contact_no: string;

  @Prop({ type: String })
  nearest_city: string;

  @Prop({ type: String })
  nearest_city_postalcode: string;

  @Prop({ type: String })
  photo_url: string;

  @Prop({ type: Boolean, default: true })
  is_active: boolean;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
