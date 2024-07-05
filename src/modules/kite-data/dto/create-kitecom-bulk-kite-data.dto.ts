import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsOptional, ValidateNested } from "class-validator";
import { ICoordinates } from "src/modules/common/interfaces/coordinates.interface";
import { KiteDataPoint } from "../entities/kite-datapoint.entity";

export class CreateKiteComBulkKiteDataDto{
    @IsNotEmpty()
    readonly coordinates: ICoordinates;
    
    @IsOptional()
    readonly sensor_id?: string;
  
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => KiteDataPoint)
    readonly data: KiteDataPoint[];
}