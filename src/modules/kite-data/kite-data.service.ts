import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment-timezone';
import { Connection, Model } from 'mongoose';
import { BulkCreateKiteDataResponseDto } from './dto/bulk-create-kite-data-response.dto';
import { CreateBulkKiteDataDto } from './dto/create-bulk-kite-data.dto';
import { KiteDataPoint } from './dto/kite-datapoint.dto';
import { KiteDatum, KiteDatumDocument } from './entities/kite-datum-entity';
import { KiteDataMetaData } from './schema/kitedata-metadata.schema';
import { KitePlayer } from '../kite-players/entities/kite-player.entity';

@Injectable()
export class KiteDataService {
  constructor(
    @InjectModel(KitePlayer.name) private readonly kitePlayerModel: Model<KitePlayer>,
    @InjectModel(KiteDatum.name)
    private readonly kiteDatumModel: Model<KiteDatumDocument>,

    @InjectConnection() private readonly mongoConnection: Connection,
  ) { }

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


  async findLatestByKiteUserId(kiteUserId: string, includeCurrentWeek: boolean = false): Promise<any> {
    try {
      // Find the kitePlayerId associated with the given kiteUserId
      const kitePlayerId = await this.getKitePlayerIdByUserId(kiteUserId);

      if (!kitePlayerId) {
        return null;
      }

      // Use the existing findLatestByKitePlayerId method
      return this.findLatestByKitePlayerId(kitePlayerId, includeCurrentWeek);
    } catch (error) {
      console.error('Error in findLatestByKiteUserId:', error);
      throw error;
    }
  }

  // Method to get kitePlayerId from kiteUserId
  async getKitePlayerIdByUserId(kiteUserId: string): Promise<string | null> {
    const player = await this.kitePlayerModel 
      .findOne({ user_id: kiteUserId }) // Query based on user_id
      .select('_id') // Select the _id field which corresponds to kite_player_id
      .exec();

    return player ? player._id : null;
  }


  async findLatestByKitePlayerId(kitePlayerId: string, includeCurrentWeek: boolean = false): Promise<any> {
    try {
      
      const [
        allTimeMaxHeight,
        allTimeTotalAttempts,
        allTimeTotalFlyingMins,
        allTimeTotalHeight
      ] = await Promise.all([
        this.getMaxHeightByKitePlayerId(kitePlayerId),
        this.getTotalAttemptsByKitePlayerId(kitePlayerId),
        this.getFlyingMinsByKitePlayerId(kitePlayerId),
        this.getTotalHeightByKitePlayerId(kitePlayerId)
      ]);

      let currentWeekData = {};
      if (includeCurrentWeek) {
        const [
          currentWeekTotalHeight,
          currentWeekTotalAttempts,
          currentWeekTotalFlyingMins,
          currentWeekMaxHeight,
          currentWeekMinHeight
        ] = await Promise.all([
          this.getTotalHeightForCurrentWeekByPlayerId(kitePlayerId),
          this.getTotalAttemptsForCurrentWeekByPlayerId(kitePlayerId),
          this.getTotalFlyingMinsForCurrentWeekByPlayerId(kitePlayerId),
          this.getMaxHeightForCurrentWeekByPlayerId(kitePlayerId),
          this.getMinHeightForCurrentWeekByPlayerId(kitePlayerId)
        ]);

        currentWeekData = {
          current_week: {
            total_height: currentWeekTotalHeight,
            total_attempts: currentWeekTotalAttempts,
            total_flying_mins: currentWeekTotalFlyingMins,
            max_height: currentWeekMaxHeight,
            min_height: currentWeekMinHeight,
          }
        };
      }

      return {
          all_time: {
            max_height: allTimeMaxHeight,
            total_attempts: allTimeTotalAttempts,
            total_flying_mins: allTimeTotalFlyingMins,
            total_height: allTimeTotalHeight
          },
          ...currentWeekData,
        }
      
    } catch (error) {
      console.error("Error in findLatestByKitePlayerId:", error);
      throw error;
    }
  }


  async findLatestByKitePlayerIdNewFunction(kitePlayerId: string, includeCurrentWeek: boolean = false): Promise<any> {
    try {
      const playerDetails = await this.getPlayerDetailsByKitePlayerId(kitePlayerId);
      const [
        allTimeMaxHeight,
        allTimeTotalAttempts,
        allTimeTotalFlyingMins,
        allTimeTotalHeight
      ] = await Promise.all([
        this.getMaxHeightByKitePlayerId(kitePlayerId),
        this.getTotalAttemptsByKitePlayerId(kitePlayerId),
        this.getFlyingMinsByKitePlayerId(kitePlayerId),
        this.getTotalHeightByKitePlayerId(kitePlayerId)
      ]);

      let currentWeekData = {};
      if (includeCurrentWeek) {
        const [
          currentWeekTotalHeight,
          currentWeekTotalAttempts,
          currentWeekTotalFlyingMins,
          currentWeekMaxHeight,
          currentWeekMinHeight
        ] = await Promise.all([
          this.getTotalHeightForCurrentWeekByPlayerId(kitePlayerId),
          this.getTotalAttemptsForCurrentWeekByPlayerId(kitePlayerId),
          this.getTotalFlyingMinsForCurrentWeekByPlayerId(kitePlayerId),
          this.getMaxHeightForCurrentWeekByPlayerId(kitePlayerId),
          this.getMinHeightForCurrentWeekByPlayerId(kitePlayerId)
        ]);

        currentWeekData = {
          current_week: {
            total_height: currentWeekTotalHeight,
            total_attempts: currentWeekTotalAttempts,
            total_flying_mins: currentWeekTotalFlyingMins,
            max_height: currentWeekMaxHeight,
            min_height: currentWeekMinHeight,
          }
        };
      }

      return {
        "player": {
          name: playerDetails?.name ?? null,
          city: playerDetails?.city ?? null,
          rank: playerDetails?.rank ?? null,
          img_url: playerDetails?.img_url ?? null,
          user_id: playerDetails?.user_id ?? null,
        },

        "stat": {
          all_time: {
            max_height: allTimeMaxHeight,
            total_attempts: allTimeTotalAttempts,
            total_flying_mins: allTimeTotalFlyingMins,
            total_height: allTimeTotalHeight
          },
          ...currentWeekData,
        }
      };
    } catch (error) {
      console.error("Error in findLatestByKitePlayerId:", error);
      throw error;
    }
  }


  async getPlayerDetailsByKitePlayerId(kitePlayerId: string): Promise<any> {
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
        $setWindowFields: {
          sortBy: { kite_height: -1 },
          output: {
            rank: {
              $rank: {}
            }
          }
        }
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
          user_id: "$player_details.user_id",
          name: "$player_details.name",
          city: "$player_details.city",
          img_url: "$player_details.img_url",
          kite_height: 1,
          rank: 1
        }
      },
      {
        $match: {
          id: kitePlayerId
        }
      }
    ];

    const result = await this.kiteDatumModel.aggregate(aggregationPipeline).exec();
    return result.length > 0 ? result[0] : null;
  }



  async findLatestByAllKitePlayers(includeCurrentWeek: boolean = false): Promise<any> {
    try {
      
      const [totalHeight, totalAttempts, totalFlyingMins, totalMaxHeight,playerCount] = await Promise.all([
        this.getTotalHeightByAllKitePlayers(),
        this.getTotalAttemptsByAllKitePlayers(),
        this.getTotalFlyingMinsByAllKitePlayers(),
        this.getTotalMaxHeightByAllKitePlayers(),
        this.getTotalPlayersCount(),
      ]);

      let currentWeekData = {};
      if (includeCurrentWeek) {
        const [
          currentWeekTotalHeight,
          currentWeekTotalAttempts,
          currentWeekTotalFlyingMins,
          currentWeekMaxHeight,
          currentWeekMinHeight,
          currentWeekPlayerCount,
        ] = await Promise.all([
          this.getTotalHeightForCurrentWeek(),
          this.getTotalAttemptsForCurrentWeek(),
          this.getTotalFlyingMinsForCurrentWeek(),
          this.getMaxHeightForCurrentWeek(),
          this.getMinHeightForCurrentWeek(),
          this.getCurrentWeekPlayersCount(),
        ]);

        currentWeekData = {
          current_week: {
            total_height: currentWeekTotalHeight,
            total_attempts: currentWeekTotalAttempts,
            total_flying_mins: currentWeekTotalFlyingMins,
            max_height: currentWeekMaxHeight,
            min_height: currentWeekMinHeight,
            playerCount:currentWeekPlayerCount,
          }
        };
      }

      return {
        "stat": {
          all_time: {
            total_height: totalHeight,
            total_attempts: totalAttempts,
            total_flying_mins: totalFlyingMins,
            max_height: totalMaxHeight,
            player_count:playerCount
          },
          ...currentWeekData,
        }
      };
    } catch (error) {
      console.error("Error in findLatestByAllKitePlayers:", error);
      throw error;
    }
  }



  async getPlayersLeaderBoard() {
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
        $setWindowFields: {
          sortBy: { kite_height: -1 },
          output: {
            rank: {
              $rank: {}
            }
          }
        }
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
          rank: 1
        }
      }
      // {
      //   $limit: 10
      // }
    ];

    return await this.kiteDatumModel.aggregate(aggregationPipeline).exec();
  }



  async getTotalPlayersCount() {
    const aggregationPipeline: any[] = [
      {
          $match: {
              "metadata.kite_player_id": { $exists: true } 
          }
      },
      { // Group by unique player ID
          $group: {
              _id: "$metadata.kite_player_id" 
          }
      },
      {
          // Count the unique players
          $count: "playerCount" 
      }
  ];

    const result = await this.kiteDatumModel.aggregate(aggregationPipeline).exec();
    return result.length > 0 ? result[0].playerCount : 0;
}


async getCurrentWeekPlayersCount() {
  try {
      // Define the start and end of the current week
      const startOfCurrentWeek = moment().startOf('week').toDate();
      const endOfCurrentWeek = moment().endOf('week').toDate();

      const aggregationPipeline = [
          {
              $match: {
                  "metadata.attempt_timestamp": {
                      $gte: startOfCurrentWeek,
                      $lte: endOfCurrentWeek,
                  },
              },
          },
          {
              $group: {
                  _id: "$metadata.kite_player_id", 
              },
          },
          {
              $count: "current_week_player_count" 
          }
      ];

      const result = await this.kiteDatumModel.aggregate(aggregationPipeline).exec();
      return result.length > 0 ? result[0].current_week_player_count : 0; // Return the count or 0 if none
  } catch (error) {
      console.error("Error in getCurrentWeekPlayersCount:", error);
      throw error;
  }
}


  async getTotalHeightByAllKitePlayers(): Promise<number> {
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
        $addFields: {
          height: { $subtract: ["$max_altitude", "$min_altitude"] }
        }
      },
      {
        $group: {
          _id: "$_id.kite_player_id",
          total_height: { $sum: "$height" }
        }
      },
      {
        $group: {
          _id: null,
          total_height: { $sum: "$total_height" }
        }
      },
      {
        $project: {
          _id: 0,
          total_height: 1
        }
      }
    ];

    const result = await this.kiteDatumModel.aggregate(aggregationPipeline).exec();
    return result.length > 0 ? result[0].total_height : 0;
  }

  async getTotalAttemptsByAllKitePlayers(): Promise<number> {
    const aggregationPipeline: any[] = [
      {
        $group: {
          _id: {
            kite_player_id: "$metadata.kite_player_id",
            attempt_timestamp: "$metadata.attempt_timestamp"
          }
        }
      },
      {
        $group: {
          _id: "$_id.kite_player_id",
          count_attempt_timestamp: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          total_attempts: { $sum: "$count_attempt_timestamp" }
        }
      },
      {
        $project: {
          _id: 0,
          total_attempts: 1
        }
      }
    ];

    const result = await this.kiteDatumModel.aggregate(aggregationPipeline).exec();
    return result.length > 0 ? result[0].total_attempts : 0;
  }

  async getTotalFlyingMinsByAllKitePlayers(): Promise<number> {
    const aggregationPipeline: any[] = [
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
          minTimestamp: { $min: "$filteredData.timestamp" },
          maxTimestamp: { $max: "$filteredData.timestamp" }
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
        $group: {
          _id: null,
          total_flying_mins: { $sum: "$flying_mins" }
        }
      },
      {
        $project: {
          _id: 0,
          total_flying_mins: 1
        }
      }
    ];

    const result = await this.kiteDatumModel.aggregate(aggregationPipeline).exec();
    return result.length > 0 ? result[0].total_flying_mins : 0;
  }

  async getTotalMaxHeightByAllKitePlayers(): Promise<number> {
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
          max_height: { $max: { $subtract: ["$max_altitude", "$min_altitude"] } }
        }
      },
      {
        $sort: {
          max_height: -1
        }
      },
      {
        $limit: 1
      },
      {
        $project: {
          max_height: 1
        }
      }
    ]
    const result = await this.kiteDatumModel.aggregate(aggregationPipeline).exec();
    return result.length > 0 ? result[0].max_height : 0;
  }

  async getFlyingMinsByKitePlayerId(kitePlayerId: string): Promise<number> {
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

  async getMaxHeightByKitePlayerId(kitePlayerId: string): Promise<number> {
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
    return result.length > 0 ? result[0].max_height : 0;
  }

  async getTotalAttemptsByKitePlayerId(kitePlayerId: string): Promise<number> {
    const aggregationPipeline = [
      {
        $match: {
          "metadata.kite_player_id": kitePlayerId
        }
      },
      {
        $group: {
          _id: {
            attempt_timestamp: "$metadata.attempt_timestamp"
          }
        }
      },
      {
        $group: {
          _id: null,
          attempts: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          attempts: 1
        }
      }
    ];

    const result = await this.kiteDatumModel.aggregate(aggregationPipeline).exec();
    return result.length > 0 ? result[0].attempts : 0;
  }

  async getTotalHeightByKitePlayerId(kitePlayerId: string): Promise<number> {
    const aggregationPipeline = [
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
          max_altitude: { $max: "$altitude" },
          min_altitude: { $min: "$altitude" }
        }
      },
      {
        $addFields: {
          height: { $subtract: ["$max_altitude", "$min_altitude"] }
        }
      },
      {
        $group: {
          _id: "$_id.kite_player_id",
          total_height: { $sum: "$height" }
        }
      },
      {
        $group: {
          _id: null,
          total_height: { $sum: "$total_height" }
        }
      },
      {
        $project: {
          _id: 0,
          total_height: 1
        }
      }
    ]
    const result = await this.kiteDatumModel.aggregate(aggregationPipeline).exec();
    return result.length > 0 ? result[0].total_height : 0;
  }

  async getTotalAttemptsForCurrentWeek(): Promise<number> {
    try {
      const startOfCurrentWeek = moment().startOf('week').toDate();
      const endOfCurrentWeek = moment().endOf('week').toDate();

      const aggregationPipeline = [
        {
          $match: {
            "metadata.attempt_timestamp": {
              $gte: startOfCurrentWeek,
              $lte: endOfCurrentWeek,
            },
          },
        },
        {
          $project: {
            kite_player_id: "$metadata.kite_player_id",
            attempt_timestamp: "$metadata.attempt_timestamp",
          },
        },
        {
          $group: {
            _id: "$kite_player_id",
            unique_attempts: { $addToSet: "$attempt_timestamp" },
          },
        },
        {
          $project: {
            _id: 0,
            kite_player_id: "$_id",
            unique_attempts_count: { $size: "$unique_attempts" },
          },
        },
        {
          $group: {
            _id: null,
            total_attempts_for_week: { $sum: "$unique_attempts_count" },
          },
        },
        {
          $project: {
            _id: 0,
            total_attempts_for_week: 1,
          },
        },
      ];

      const result = await this.kiteDatumModel.aggregate(aggregationPipeline).exec();
      return result.length > 0 ? result[0].total_attempts_for_week : 0;
    } catch (error) {
      console.error("Error in getTotalAttemptsForCurrentWeek:", error);
      throw error;
    }
  }

  async getMaxHeightForCurrentWeek(): Promise<number> {
    try {
      const startOfCurrentWeek = moment().startOf('week').toDate();
      const endOfCurrentWeek = moment().endOf('week').toDate();

      const aggregationPipeline = [
        {
          $match: {
            "metadata.attempt_timestamp": {
              $gte: startOfCurrentWeek,
              $lte: endOfCurrentWeek,
            },
          },
        },
        {
          $group: {
            _id: {
              kite_player_id: "$metadata.kite_player_id",
              attempt_timestamp: "$metadata.attempt_timestamp"
            },
            max_altitude: { $max: "$altitude" },
            min_altitude: { $min: "$altitude" }
          },
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
          },
        },
        {
          $group: {
            _id: null,
            max_height_for_week: { $max: "$max_height" }
          },
        },
        {
          $project: {
            _id: 0,
            max_height_for_week: 1
          },
        },
      ];

      const result = await this.kiteDatumModel.aggregate(aggregationPipeline).exec();
      return result.length > 0 ? result[0].max_height_for_week : 0;
    } catch (error) {
      console.error("Error in getMaxHeightForCurrentWeek:", error);
      throw error;
    }
  }

  async getMinHeightForCurrentWeek(): Promise<number> {
    try {
      const startOfCurrentWeek = moment().startOf('week').toDate();
      const endOfCurrentWeek = moment().endOf('week').toDate();

      const aggregationPipeline = [
        {
          $match: {
            "metadata.attempt_timestamp": {
              $gte: startOfCurrentWeek,
              $lte: endOfCurrentWeek,
            },
          },
        },
        {
          $group: {
            _id: {
              kite_player_id: "$metadata.kite_player_id",
              attempt_timestamp: "$metadata.attempt_timestamp"
            },
            max_altitude: { $max: "$altitude" },
            min_altitude: { $min: "$altitude" }
          },
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
            min_height: { $min: { $subtract: ["$max_altitude", "$min_altitude"] } }
          },
        },
        {
          $group: {
            _id: null,
            min_height_for_week: { $min: "$min_height" }
          },
        },
        {
          $project: {
            _id: 0,
            min_height_for_week: 1
          },
        },
      ];

      const result = await this.kiteDatumModel.aggregate(aggregationPipeline).exec();
      return result.length > 0 ? result[0].min_height_for_week : 0;
    } catch (error) {
      console.error("Error in getMinHeightForCurrentWeek:", error);
      throw error;
    }
  }

  async getTotalFlyingMinsForCurrentWeek(): Promise<number> {
    try {
      const startOfCurrentWeek = moment().startOf('week').toDate();
      const endOfCurrentWeek = moment().endOf('week').toDate();

      const aggregationPipeline = [
        {
          $match: {
            "metadata.attempt_timestamp": {
              $gte: startOfCurrentWeek,
              $lte: endOfCurrentWeek,
            },
          },
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
          },
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
            minTimestamp: { $min: "$filteredData.timestamp" },
            maxTimestamp: { $max: "$filteredData.timestamp" }
          }
        },
        {
          $addFields: {
            timestampDifference: {
              $divide: [
                { $subtract: ["$maxTimestamp", "$minTimestamp"] },
                60000  // Convert milliseconds to minutes
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
          $group: {
            _id: null,
            total_flying_mins_for_week: { $sum: "$flying_mins" }
          }
        },
        {
          $project: {
            _id: 0,
            total_flying_mins_for_week: 1
          }
        }
      ];

      const result = await this.kiteDatumModel.aggregate(aggregationPipeline).exec();
      return result.length > 0 ? result[0].total_flying_mins_for_week : 0;
    } catch (error) {
      console.error("Error in getTotalFlyingMinutesForCurrentWeek:", error);
      throw error;
    }
  }

  async getTotalHeightForCurrentWeek(): Promise<number> {
    try {
      const startOfCurrentWeek = moment().startOf('week').toDate();
      const endOfCurrentWeek = moment().endOf('week').toDate();

      const aggregationPipeline = [
        {
          $match: {
            "metadata.attempt_timestamp": {
              $gte: startOfCurrentWeek,
              $lte: endOfCurrentWeek,
            },
          },
        },
        {
          $group: {
            _id: {
              kite_player_id: "$metadata.kite_player_id",
              attempt_timestamp: "$metadata.attempt_timestamp"
            },
            max_altitude: { $max: "$altitude" },
            min_altitude: { $min: "$altitude" }
          },
        },
        {
          $addFields: {
            height: { $subtract: ["$max_altitude", "$min_altitude"] }
          }
        },
        {
          $group: {
            _id: "$_id.kite_player_id",
            total_height: { $sum: "$height" }
          }
        },
        {
          $group: {
            _id: null,
            total_height_for_week: { $sum: "$total_height" }
          }
        },
        {
          $project: {
            _id: 0,
            total_height_for_week: 1
          }
        }
      ];

      const result = await this.kiteDatumModel.aggregate(aggregationPipeline).exec();
      return result.length > 0 ? result[0].total_height_for_week : 0;
    } catch (error) {
      console.error("Error in getTotalHeightForCurrentWeek:", error);
      throw error;
    }
  }

  async getTotalAttemptsForCurrentWeekByPlayerId(kitePlayerId: string): Promise<number> {
    try {
      const startOfCurrentWeek = moment().startOf('week').toDate();
      const endOfCurrentWeek = moment().endOf('week').toDate();

      const aggregationPipeline = [
        {
          $match: {
            "metadata.kite_player_id": kitePlayerId,
            "metadata.attempt_timestamp": {
              $gte: startOfCurrentWeek,
              $lte: endOfCurrentWeek,
            },
          },
        },
        {
          $project: {
            kite_player_id: "$metadata.kite_player_id",
            attempt_timestamp: "$metadata.attempt_timestamp",
          },
        },
        {
          $group: {
            _id: "$kite_player_id",
            unique_attempts: { $addToSet: "$attempt_timestamp" },
          },
        },
        {
          $project: {
            _id: 0,
            kite_player_id: "$_id",
            unique_attempts_count: { $size: "$unique_attempts" },
          },
        },
        {
          $group: {
            _id: null,
            total_attempts_for_week: { $sum: "$unique_attempts_count" },
          },
        },
        {
          $project: {
            _id: 0,
            total_attempts_for_week: 1,
          },
        },
      ];

      const result = await this.kiteDatumModel.aggregate(aggregationPipeline).exec();
      return result.length > 0 ? result[0].total_attempts_for_week : 0;
    } catch (error) {
      console.error("Error in getTotalAttemptsForCurrentWeek:", error);
      throw error;
    }
  }

  async getMaxHeightForCurrentWeekByPlayerId(kitePlayerId: string): Promise<number> {
    try {
      const startOfCurrentWeek = moment().startOf('week').toDate();
      const endOfCurrentWeek = moment().endOf('week').toDate();

      const aggregationPipeline = [
        {
          $match: {
            "metadata.kite_player_id": kitePlayerId,
            "metadata.attempt_timestamp": {
              $gte: startOfCurrentWeek,
              $lte: endOfCurrentWeek,
            },
          },
        },
        {
          $group: {
            _id: {
              kite_player_id: "$metadata.kite_player_id",
              attempt_timestamp: "$metadata.attempt_timestamp",
            },
            max_altitude: { $max: "$altitude" },
            min_altitude: { $min: "$altitude" },
          },
        },
        {
          $group: {
            _id: "$_id.kite_player_id",
            attempts: {
              $push: {
                attempt_timestamp: "$_id.attempt_timestamp",
                maxAltitude: "$max_altitude",
                minAltitude: "$min_altitude",
                height: { $subtract: ["$max_altitude", "$min_altitude"] },
              },
            },
            max_height: { $max: { $subtract: ["$max_altitude", "$min_altitude"] } },
          },
        },
        {
          $group: {
            _id: null,
            max_height_for_week: { $max: "$max_height" },
          },
        },
        {
          $project: {
            _id: 0,
            max_height_for_week: 1,
          },
        },
      ];

      const result = await this.kiteDatumModel.aggregate(aggregationPipeline).exec();
      return result.length > 0 ? result[0].max_height_for_week : 0;
    } catch (error) {
      console.error("Error in getMaxHeightForCurrentWeek:", error);
      throw error;
    }
  }

  async getMinHeightForCurrentWeekByPlayerId(kitePlayerId: string): Promise<number> {
    try {
      const startOfCurrentWeek = moment().startOf('week').toDate();
      const endOfCurrentWeek = moment().endOf('week').toDate();

      const aggregationPipeline = [
        {
          $match: {
            "metadata.kite_player_id": kitePlayerId,
            "metadata.attempt_timestamp": {
              $gte: startOfCurrentWeek,
              $lte: endOfCurrentWeek,
            },
          },
        },
        {
          $group: {
            _id: {
              kite_player_id: "$metadata.kite_player_id",
              attempt_timestamp: "$metadata.attempt_timestamp",
            },
            max_altitude: { $max: "$altitude" },
            min_altitude: { $min: "$altitude" },
          },
        },
        {
          $group: {
            _id: "$_id.kite_player_id",
            attempts: {
              $push: {
                attempt_timestamp: "$_id.attempt_timestamp",
                maxAltitude: "$max_altitude",
                minAltitude: "$min_altitude",
                height: { $subtract: ["$max_altitude", "$min_altitude"] },
              },
            },
            min_height: { $min: { $subtract: ["$max_altitude", "$min_altitude"] } },
          },
        },
        {
          $group: {
            _id: null,
            min_height_for_week: { $min: "$min_height" },
          },
        },
        {
          $project: {
            _id: 0,
            min_height_for_week: 1,
          },
        },
      ];

      const result = await this.kiteDatumModel.aggregate(aggregationPipeline).exec();
      return result.length > 0 ? result[0].min_height_for_week : 0;
    } catch (error) {
      console.error("Error in getMinHeightForCurrentWeek:", error);
      throw error;
    }
  }

  async getTotalFlyingMinsForCurrentWeekByPlayerId(kitePlayerId: string): Promise<number> {
    try {
      const startOfCurrentWeek = moment().startOf('week').toDate();
      const endOfCurrentWeek = moment().endOf('week').toDate();

      const aggregationPipeline = [
        {
          $match: {
            "metadata.kite_player_id": kitePlayerId,
            "metadata.attempt_timestamp": {
              $gte: startOfCurrentWeek,
              $lte: endOfCurrentWeek,
            },
          },
        },
        {
          $group: {
            _id: {
              kite_player_id: "$metadata.kite_player_id",
              attempt_timestamp: "$metadata.attempt_timestamp",
            },
            data: {
              $push: {
                timestamp: "$timestamp",
                altitude: "$altitude",
              },
            },
            min_altitude: { $min: "$altitude" },
          },
        },
        {
          $addFields: {
            filteredData: {
              $filter: {
                input: "$data",
                as: "entry",
                cond: { $gte: ["$$entry.altitude", { $add: ["$min_altitude", 10] }] },
              },
            },
          },
        },
        {
          $addFields: {
            minTimestamp: { $min: "$filteredData.timestamp" },
            maxTimestamp: { $max: "$filteredData.timestamp" },
          },
        },
        {
          $addFields: {
            timestampDifference: {
              $divide: [
                { $subtract: ["$maxTimestamp", "$minTimestamp"] },
                60000, // Convert milliseconds to minutes
              ],
            },
          },
        },
        {
          $group: {
            _id: "$_id.kite_player_id",
            flying_mins: { $sum: "$timestampDifference" },
            timestampDifferences: { $push: "$timestampDifference" },
            attempt_timestamp: { $first: "$_id.attempt_timestamp" },
          },
        },
        {
          $group: {
            _id: null,
            total_flying_mins_for_week: { $sum: "$flying_mins" },
          },
        },
        {
          $project: {
            _id: 0,
            total_flying_mins_for_week: 1,
          },
        },
      ];

      const result = await this.kiteDatumModel.aggregate(aggregationPipeline).exec();
      return result.length > 0 ? result[0].total_flying_mins_for_week : 0;
    } catch (error) {
      console.error("Error in getTotalFlyingMinutesForCurrentWeek:", error);
      throw error;
    }
  }

  async getTotalHeightForCurrentWeekByPlayerId(kitePlayerId: string): Promise<number> {
    try {
      const startOfCurrentWeek = moment().startOf('week').toDate();
      const endOfCurrentWeek = moment().endOf('week').toDate();


      const aggregationPipeline = [
        {
          $match: {
            "metadata.kite_player_id": kitePlayerId,
            "metadata.attempt_timestamp": {
              $gte: startOfCurrentWeek,
              $lte: endOfCurrentWeek,
            },
          },
        },
        {
          $group: {
            _id: {
              kite_player_id: "$metadata.kite_player_id",
              attempt_timestamp: "$metadata.attempt_timestamp",
            },
            max_altitude: { $max: "$altitude" },
            min_altitude: { $min: "$altitude" },
          },
        },
        {
          $addFields: {
            height: { $subtract: ["$max_altitude", "$min_altitude"] },
          },
        },
        {
          $group: {
            _id: "$_id.kite_player_id",
            total_height: { $sum: "$height" },
          },
        },
        {
          $group: {
            _id: null,
            total_height_for_week: { $sum: "$total_height" },
          },
        },
        {
          $project: {
            _id: 0,
            total_height_for_week: 1,
          },
        },
      ];

      const result = await this.kiteDatumModel.aggregate(aggregationPipeline).exec();
      return result.length > 0 ? result[0].total_height_for_week : 0;
    } catch (error) {
      console.error("Error in getTotalHeightForDateRange:", error);
      throw error;
    }
  }

  async getAttemptsByPlayerId(kitePlayerId: string, sortByHeight?: string, sortByAttempt?: string): Promise<{ attempt_timestamp: string, height: number }[]> {

    const pipeline: any[] = [
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
          max_altitude: { $max: "$altitude" },
          min_altitude: { $min: "$altitude" }
        }
      },
      {
        $addFields: {
          height: { $subtract: ["$max_altitude", "$min_altitude"] }
        }
      },
      {
        $project: {
          _id: 0,
          attempt_timestamp: "$_id.attempt_timestamp",
          height: 1
        }
      }
    ];

    if (sortByHeight === 'desc') {
      pipeline.push({
        $sort: { height: -1 } as any
      });
    } else if (sortByHeight === 'asc') {
      pipeline.push({
        $sort: { height: 1 } as any
      });
    }

    if (sortByAttempt === 'desc') {
      pipeline.push({
        $sort: { attempt_timestamp: -1 } as any
      });
    } else if (sortByAttempt === 'asc') {
      pipeline.push({
        $sort: { attempt_timestamp: 1 } as any
      });
    }

    const results = await this.kiteDatumModel.aggregate(pipeline).exec();
    return results.map(result => ({
      attempt_timestamp: moment(result.attempt_timestamp).tz('Asia/Colombo').format('YYYY-MM-DDTHH:mm:ss'),
      height: result.height
    }));
  }

  async attemptsByKitePlayerIdAndAttemptTimestamp(
    kitePlayerId: string,
    attemptTimestamp: Date
  ): Promise<{ data: { timestamp: string, height: number }[] }> {

    const pipeline: any[] = [
      {
        $match: {
          "metadata.kite_player_id": kitePlayerId,
          "metadata.attempt_timestamp": attemptTimestamp
        }
      },
      {
        $group: {
          _id: "$metadata.kite_player_id",
          min_altitude: { $min: "$altitude" },
          data: {
            $push: {
              timestamp: "$timestamp",
              altitude: "$altitude",
            }
          }
        }
      },
      {
        $addFields: {
          data: {
            $map: {
              input: "$data",
              as: "pair",
              in: {
                timestamp: "$$pair.timestamp",
                altitude: "$$pair.altitude",
                height: { $subtract: ["$$pair.altitude", "$min_altitude"] }
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          data: {
            timestamp: 1,
            height: 1
          }
        }
      }
    ];
    const result = await this.kiteDatumModel.aggregate(pipeline).exec();
    return {
      data: result.length > 0 ? result[0].data : []
    };
  }
}
