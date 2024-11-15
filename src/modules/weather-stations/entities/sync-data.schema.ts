import { Document, Schema, model } from 'mongoose';

export const SyncDataSchema = new Schema({
  client_id: { type: String, required: true},
  weather_station_id: { type: String, required: true }, 
  status: {type: String, required: true },
  version_number: {type: String},
}, { timestamps: { createdAt: true, updatedAt: false }, collection: 'sync_data' });

export interface SyncDataDocument extends Document {
  client_id: string;
  weather_station_id: string;
  status: string;
  version_number: string; 
}

export const SyncDataModel = model<SyncDataDocument>('SyncData', SyncDataSchema, 'sync_data');
