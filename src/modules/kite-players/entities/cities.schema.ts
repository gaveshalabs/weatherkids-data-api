import { Document, model, ObjectId, Schema } from "mongoose";

export class CityData {
    _id: ObjectId;
    district_id: number;
    name_en: string;
    name_si?: string;
    name_ta?: string;
    sub_name_en?: string;
    sub_name_si?: string;
    sub_name_ta?: string;
    postcode: string;
    location: {
        type: string;
        coordinates: [number, number];
    };
}

export const CityDataSchema = new Schema({
    district_id: { type: Number },
    name_en: { type: String, default: null },
    name_si: { type: String, default: null },
    name_ta: { type: String, default: null },
    sub_name_en: { type: String, default: null },
    sub_name_si: { type: String, default: null },
    sub_name_ta: { type: String, default: null },
    postcode: { type: String, default: null },
    location: {
        type: { type: String, default: "Point" },
        coordinates: { type: [Number] }
    }
}, {
    collection: 'cities'
});

// Create the 2dsphere index on the `location` field
CityDataSchema.index({ location: '2dsphere' });

export type CityDataDocument = CityData & Document;
export const CityDataModel = model<CityDataDocument>('CityData', CityDataSchema, 'cities');