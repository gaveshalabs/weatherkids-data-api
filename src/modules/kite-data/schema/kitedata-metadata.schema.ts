import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ICoordinates } from 'src/modules/common/interfaces/coordinates.interface';
import { KitePlayer } from 'src/modules/kite-players/entities/kite-player.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class KiteDataMetaData {
    @Prop({ type: String, ref: User.name })
    author_user_id: string;

    @Prop({ type: String, ref: KitePlayer.name })
    kite_player_id: string;

    @Prop({ type: Object })
    coordinates: ICoordinates;

    @Prop({ type: Date })
    attempt_timestamp: Date; 

    @Prop({ type: String, default: '' })
    sensor_id: string;
}

export const KiteDataMetadataSchema =
  SchemaFactory.createForClass(KiteDataMetaData);