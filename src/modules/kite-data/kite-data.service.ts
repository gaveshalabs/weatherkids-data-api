import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment';
import { Connection, Model } from 'mongoose';
import { BulkCreateKiteDataResponseDto } from './dto/bulk-create-kite-data-response.dto';
import { CreateBulkKiteDataDto } from './dto/create-bulk-kite-data.dto';
import { GetKiteDatumDto } from './dto/get-kite-datum.dto';
import { KiteDataPoint } from './dto/kite-datapoint.dto';
import { KiteDatum, KiteDatumDocument } from './entities/kite-datum-entity';
import { KiteDataMetaData } from './schema/kitedata-metadata.schema';

@Injectable()
export class KiteDataService {
  constructor(
    @InjectModel(KiteDatum.name)
    private readonly kiteDatumModel: Model<KiteDatumDocument>,

    @InjectConnection() private readonly mongoConnection: Connection,
  ) { }

  async bulkCommit(
    createBulkKiteData: CreateBulkKiteDataDto,
  ): Promise<BulkCreateKiteDataResponseDto[]> {
    
    // Restructure the data to include the author_user_id, weather_station_id, metadata, coordinates.
    const { author_user_id, kite_player_id, coordinates, sensor_id, data, attempt_timestamp } = createBulkKiteData;

    for (let i = 0; i < data.length; i++) {
      const element = data[i];
      if (!element.timestamp) {
        if (!element.timestamp_iso) {
          throw new BadRequestException('Invalid data');
        }
        element.timestamp = new Date(element.timestamp_iso).getTime();
      }
    }

    let filteredKiteDataPoints: KiteDataPoint[] = [];
    let insertedKiteData = [];
    let existingKiteData = [];

    existingKiteData = await this.kiteDatumModel
    .find({
      timestamp: {
        $in: data.map((datum) => datum.timestamp),
      },
      'metadata.author_user_id': author_user_id,
    })
    .exec();

    try {
      const currentUtcTimestamp = new Date().getTime(); // Get current UTC timestamp

      filteredKiteDataPoints = data.filter((datum) => {
        const datumDate = new Date(datum.timestamp); // Convert timestamp to Date object
        return (
          datumDate.getTime() <= currentUtcTimestamp + 86400000 && // Check if the timestamp is not in the future
          !existingKiteData.some(
            (existingDatum) =>
              existingDatum.timestamp.getTime() === datumDate.getTime(),
          )
        );
      });

      const populatedKiteData = filteredKiteDataPoints.map((dataPoint) => {
        return {
          ...dataPoint,
          metadata: {
            author_user_id: author_user_id,
            kite_player_id: kite_player_id,
            coordinates: coordinates,
            attempt_timestamp: attempt_timestamp,
            sensor_id: sensor_id || '',
          } as KiteDataMetaData,
        };
      });

      insertedKiteData = await this.kiteDatumModel.insertMany(populatedKiteData);

      // Hacky checks to check if the data was inserted.
      if (!insertedKiteData || insertedKiteData.length !== populatedKiteData.length) {
        throw new Error('Error inserting kite data');
      }
    } catch (error) {
      // Handle any errors that occur during the insertion of time-series data.
      throw error;
    }

    const responseKiteData = [...insertedKiteData, ...existingKiteData];

    const finalKiteResponse = responseKiteData.map((datum) => {
      return {
        _id: datum._id,
        timestamp: datum.timestamp,
        timestamp_iso: moment(datum.timestamp).toISOString(true),
        created_at: datum.createdAt,
      } as BulkCreateKiteDataResponseDto;
    });
    return finalKiteResponse;
  }

  transformKiteDatum(datum): GetKiteDatumDto {
    const transformed = {
      _id: datum._id,
      author_user_id: datum.metadata?.author_user_id,
      sensor_id: datum.metadata?.sensor_id,
      kite_player_id: datum.metadata?.kite_player_id,
      coordinates: datum.metadata?.coordinates,
      timestamp: datum.timestamp,
      temperature: datum.temperature,
      pressure: datum.pressure,
      altitude: datum.altitude,
    } as GetKiteDatumDto;
    return transformed;
  }

  async findLatestByKitePlayerId(
    kitePlayerId: string,
  ): Promise<GetKiteDatumDto> {
    const datum = (await this.kiteDatumModel
      .findOne({ 'metadata.kite_player_id': kitePlayerId })
      .sort({ timestamp: -1 })
      .exec()) as KiteDatum;

    if (!datum) {
      return null;
    }
    const transformedDatum = this.transformKiteDatum(datum);
    const datumWithMaxHeight = {
      ...transformedDatum,
      max_height: 800,
    };
  
    return datumWithMaxHeight;
  }
}