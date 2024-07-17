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
  ) {}

  async bulkCommit(
    createBulkKiteData: CreateBulkKiteDataDto,
  ): Promise<BulkCreateKiteDataResponseDto[]> {
    // Restructure the data to include the author_user_id, weather_station_id, metadata, coordinates.
    const {
      author_user_id,
      kite_player_id,
      coordinates,
      sensor_id,
      data,
      attempt_timestamp,
    } = createBulkKiteData;

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

      insertedKiteData =
        await this.kiteDatumModel.insertMany(populatedKiteData);

      // Hacky checks to check if the data was inserted.
      if (
        !insertedKiteData ||
        insertedKiteData.length !== populatedKiteData.length
      ) {
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
  ): Promise<{ max_height: number }> {
    const datum = (await this.kiteDatumModel
      .findOne({ 'metadata.kite_player_id': kitePlayerId })
      .sort({ timestamp: -1 })
      .exec()) as KiteDatum;
  
    if (!datum) {
      return null;
    }
  
    const maxHeight = await this.getMaxHeightByKitePlayerId(kitePlayerId);
  
    return {
      max_height: maxHeight
    };
  }
  
  async findAll(): Promise<GetKiteDatumDto[]> {
    const data = (await this.kiteDatumModel.find().exec()) as KiteDatum[];

    return data.map((datum) => {
      return this.transformKiteDatum(datum);
    });
  }

  async getKitePlayersHeight() {
    const aggregationPipeline: any[] = [
      {
        $group: {
          _id: {
            kite_player_id: "$metadata.kite_player_id",
            attempt_timestamp: "$metadata.attempt_timestamp"
          },
          max_altitude: { $max: "$altitude" },
          min_altitude: { $min: "$altitude" }
        }
      },
      {
        $group: {
          _id: "$_id.kite_player_id",
          attempts: {
            $push: {
              attempt_timestamp: "$_id.attempt_timestamp",
              maxAltitude: "$max_altitude",
              minAltitude: "$min_altitude",
              height: { $subtract: ["$max_altitude", "$min_altitude"] }
            }
          },
          kite_height: { $max: { $subtract: ["$max_altitude", "$min_altitude"] } }
        }
      },
      {
        $sort: { kite_height: -1 }
      },
      {
        $lookup: {
          from: "kite_players", 
          localField: "_id",
          foreignField: "_id",
          as: "player_details"
        }
      },
      {
        $unwind: {
          path: "$player_details",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          name: "$player_details.name",
          city: "$player_details.city",
          img_url: "$player_details.img_url",
          kite_height: 1,
        }
      }
    ];
  
    return await this.kiteDatumModel.aggregate(aggregationPipeline).exec();
  }
  
  async getFlyingMinsByKitePlayerId(kitePlayerId:string): Promise<number> {
    const aggregationPipeline: any[] = [
      {
        $match: {
          "metadata.kite_player_id": kitePlayerId
        }
      },
      {
        $group: {
          _id: {
            kite_player_id: "$metadata.kite_player_id",
            attempt_timestamp: "$metadata.attempt_timestamp"
          },
          data: {
            $push: {
              timestamp: "$timestamp",
              altitude: "$altitude"
            }
          },
          min_altitude: { $min: "$altitude" }
        }
      },
      {
        $addFields: {
          filteredData: {
            $filter: {
              input: "$data",
              as: "entry",
              cond: { $gte: ["$$entry.altitude", { $add: ["$min_altitude", 10] }] }
            }
          }
        }
      },
      {
        $addFields: {
          minTimestamp: {
            $min: "$filteredData.timestamp"
          },
          maxTimestamp: {
            $max: "$filteredData.timestamp"
          }
        }
      },
      {
        $addFields: {
          timestampDifference: {
            $divide: [
              { $subtract: ["$maxTimestamp", "$minTimestamp"] },
              60000 
            ]
          }
        }
      },
      {
        $group: {
          _id: "$_id.kite_player_id",
          flying_mins: { $sum: "$timestampDifference" },
          timestampDifferences: { $push: "$timestampDifference" },
          attempt_timestamp: { $first: "$_id.attempt_timestamp" }
        }
      },
      {
        $project: {
          _id: 0,
          kite_player_id: "$_id",
          flying_mins: 1
        }
      }
    ];

    const result = await this.kiteDatumModel.aggregate(aggregationPipeline).exec();
    return result.length > 0 ? result[0].flying_mins : 0;
  }

  async getMaxHeightByKitePlayerId(kitePlayerId: string): Promise<number>{
    const aggregationPipeline: any[] = [
      {
        $match:{
          "metadata.kite_player_id": kitePlayerId
        }
      },
      {
        $group: {
          _id: {
            kite_player_id: "$metadata.kite_player_id",
            attempt_timestamp: "$metadata.attempt_timestamp"
          },
          max_altitude: { $max: "$altitude" },
          min_altitude: { $min: "$altitude" }
        }
      },
      {
        $group: {
          _id: "$_id.kite_player_id",
          attempts: {
            $push: {
              attempt_timestamp: "$_id.attempt_timestamp",
              maxAltitude: "$max_altitude",
              minAltitude: "$min_altitude",
              height: { $subtract: ["$max_altitude", "$min_altitude"] }
            }
          },
          max_height: { $max: { $subtract: ["$max_altitude", "$min_altitude"] } }
        }
      },
      {
        $project: {
          max_height: 1
        }
      }
    ];

    const result = await this.kiteDatumModel.aggregate(aggregationPipeline).exec();
    return result.length>0 ? result[0].max_height : 0;
  }
}
