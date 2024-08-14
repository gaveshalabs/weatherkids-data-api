import { model, ObjectId, Schema } from "mongoose";

export class DistrictData{
_id: ObjectId;
province_id: number;
name_en: string;
name_si?: string;
name_ta?: string;
}

export const DistrictDataSchema = new Schema({
    id: { type: Number },
    province_id: { type: Number },
    name_en: { type: String, default: null },
    name_si: { type: String, default: null },
    name_ta: { type: String, default: null }
},{
    collection: 'districts'
});

export type DistrictDataDocument = DistrictData & Document;
export const DistrictDataModel = model<DistrictDataDocument>('DistrictData', DistrictDataSchema, 'districts');