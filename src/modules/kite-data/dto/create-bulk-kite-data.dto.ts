import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsOptional, ValidateNested } from "class-validator";
import { ICoordinates } from "src/modules/common/interfaces/coordinates.interface";
import { KiteDataPoint } from "../entities/kite-datapoint.entity";

export class CreateBulkKiteDataDto{
    @IsNotEmpty()
    readonly author_user_id: string;
  
    @IsNotEmpty()
    readonly kite_player_id: string;
  
    @IsNotEmpty()
    readonly coordinates: ICoordinates;

    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => KiteDataPoint)
    readonly data: KiteDataPoint[];

    @IsOptional()
    readonly gavesha_user_api_key?: string;
  
    @IsOptional()
    readonly client_id?: string;

    @IsOptional()
    readonly sensor_id?: string;
}
