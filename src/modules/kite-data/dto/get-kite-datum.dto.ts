import { Prop } from "@nestjs/mongoose";
import { ICoordinates } from "src/modules/common/interfaces/coordinates.interface";

export class GetKiteDatumDto {
    @Prop()
    readonly _id: string;
  
    @Prop()
    readonly author_user_id: string;
  
    @Prop()
    readonly timestamp: Date;
  
    @Prop()
    readonly kite_player_id: string;

    @Prop()
    readonly coordinates: ICoordinates;

    @Prop()
    readonly temperature: number;

    @Prop()
    readonly pressure: number;

    @Prop()
    readonly altitude: number;

    @Prop()
    readonly sensor_id: string;
}