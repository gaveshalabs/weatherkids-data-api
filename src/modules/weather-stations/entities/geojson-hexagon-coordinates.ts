import { model, ObjectId, Schema } from 'mongoose';

export class GeoJsonHexagon {
  _id: ObjectId;
  hexagon_name: string;
  location: {
    type: 'Polygon';
    coordinates: [][][];
  };
}

export const GeoJsonHexagonSchema = new Schema({
  hexagon_name: { type: String },
  location: {
    type: {
      type: String,
      enum: ['Polygon'],
    },
    coordinates: {
      type: [[[Number]]],
    },
  },
},{collection: 'geo_json_hexagon_coordinates'});

GeoJsonHexagonSchema.index({ location: '2dsphere' });

export type GeoJsonHexagonDocument = GeoJsonHexagon & Document;
export const GeoJsonHexagonCoordinatesModel = model<GeoJsonHexagonDocument>('GeoJsonHexagonCoordinates', GeoJsonHexagonSchema);