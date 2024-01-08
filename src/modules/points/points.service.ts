import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import mongoose, { Connection, Model } from 'mongoose';
import { PointTransactionTypes } from '../common/enums/point-transaction-types.enum';
import { CreateWeatherDatumDto } from '../weather-data/dto/create-weather-datum.dto';
import { WeatherDatum } from '../weather-data/entities/weather-datum.entity';
import { PointsConfigs } from './configs/points.config';
import {
  LastProcessedEntry,
  LastProcessedEntryDocument,
} from './entities/last-processed-entry.entity';
import {
  PointTransaction,
  PointTransactionDocument,
} from './entities/point-transaction.entity';
import { Point, PointDocument } from './entities/point.entity';
import {
  PointTracker,
  PointTrackerDocument,
} from './entities/point-tracker.entity';
import { RedeemPointsInputDto } from './dto/redeem-points.dto';
import { RedeemPointsResponseDto } from './dto/redeem-points-response.dto';

@Injectable()
/**
 * Service class for managing points related operations.
 */
export class PointsService {
  /**
   * Constructs a new instance of the PointsService class.
   * @param pointTransactionModel The model for PointTransaction documents.
   * @param lastProcessedEntryModel The model for LastProcessedEntry documents.
   * @param pointModel The model for Point documents.
   * @param weatherDatumModel The model for WeatherDatum documents.
   * @param mongoConnection The MongoDB connection.
   */
  constructor(
    @InjectModel(PointTracker.name)
    private pointTrackerModel: Model<PointTrackerDocument>,

    @InjectModel(PointTransaction.name)
    private pointTransactionModel: Model<PointTransactionDocument>,

    @InjectModel(LastProcessedEntry.name)
    private lastProcessedEntryModel: Model<LastProcessedEntryDocument>,

    @InjectModel(Point.name)
    private pointModel: Model<PointDocument>,

    @InjectModel(WeatherDatum.name)
    private weatherDatumModel: Model<WeatherDatum>,

    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

  // @Cron('*/10 * * * * *') // Every 5 seconds
  @Cron('15 18 * * *') // 6:15 PM server time (UTC), 11:45 PM local time
  async handleInspectPointReductionForTheDayCron() {
    console.log('Running cron');

    // t=20 11PM
    // t=21 11PM FAIL X
    // t=22 manually 8AM

    /**
     * Check if the user hasn't uploaded weather data for the day.
     * If so, then reduce points by a pre-defined amount.
     */
    // For testing the tomorrow day
    const date = new Date(); // TODO: 11PM
    //TODO: const date = new Date('2023-11-21 23:55:00');
    date.setDate(date.getDate() - 1);

    // Get the users who haven't uploaded weather data for 24 hours.
    const usersWithNoDataForTheDay = await this.pointModel.find({
      last_point_calculated_timestamp: {
        $lt: date.getTime(),
      },
    });

    if (usersWithNoDataForTheDay.length === 0) {
      return;
    }

    usersWithNoDataForTheDay.forEach(async (user) => {
      await this.deductPoints(
        PointTransactionTypes.DEDUCT,
        user.author_user_id,
        PointsConfigs.POINTS_DAILY_PENALTY,
      );
    });
  }

  async redeemPoints(
    redeemPointsInputDto: RedeemPointsInputDto,
  ): Promise<RedeemPointsResponseDto> {
    const { author_user_id, num_points } = redeemPointsInputDto;

    try {
      const result = await this.deductPoints(
        PointTransactionTypes.REDEEM,
        author_user_id,
        -1 * num_points,
      ); // Note the minus 1.

      return {
        success: true,
        message: `Successfully redeemed ${num_points} points.`,
        result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async deductPoints(
    transactionType: PointTransactionTypes,
    author_user_id: string,
    reduceBy: number,
  ): Promise<Point> {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();

    // TODO:

    // Retrieve the current points of the user.
    const currentUserPoints = await this.pointModel.findOne({ author_user_id });
    const currentPoints = currentUserPoints ? currentUserPoints.amount : 0;

    let updatedPoints = currentPoints;

    // Check the type of transaction and validate accordingly.
    if (
      transactionType === PointTransactionTypes.REDEEM &&
      currentPoints < Math.abs(reduceBy)
    ) {
      throw new Error('Not enough points to redeem.');
    } else if (transactionType === PointTransactionTypes.DEDUCT) {
      // For DEDUCT type, adjust the 'reduceBy' value to not go below zero.
      updatedPoints = Math.max(currentPoints - Math.abs(reduceBy), 0);
    }

    try {
      // Existing logic to update the user's points.
      const updateUserPoints = (await this.pointModel.findOneAndUpdate(
        {
          author_user_id,
        },
        {
          $set: {
            amount: updatedPoints,
          },
          last_point_calculated_timestamp: Date.now(),
        },
        {
          upsert: true,
          new: true,
          session: session,
        },
      )) as Point;

      // Create a new points transaction for user.
      const newPointTransaction = new this.pointTransactionModel({
        author_user_id,
        amount: reduceBy, // Negative value.
        transaction_type: transactionType,
      });
      await newPointTransaction.save({ session });

      // Commit.
      await session.commitTransaction();

      return updateUserPoints;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Retrieves the last processed entry timestamp for a given author user ID.
   * @param author_user_id - The ID of the author user.
   * @param session - The MongoDB client session.
   * @returns The last processed entry timestamp, or 0 if no entry is found.
   */
  async getLastProcessedEntryTimestamp(
    author_user_id: string,
    session: mongoose.mongo.ClientSession,
  ): Promise<number> {
    // Get last processed entry for user.
    const lastProcessedEntry = await this.lastProcessedEntryModel.findOne(
      {
        author_user_id,
      },
      null,
      { session },
    );

    if (!lastProcessedEntry) {
      return 0;
    }

    return lastProcessedEntry.last_processed_timestamp;
  }

  /**
   * Updates the point tracker for a given user.
   * @param {string} author_user_id - The ID of the user.
   * @param {Date} date - The date of the update.
   * @param {number[]} hours - The hours that were processed.
   * @param {mongoose.mongo.ClientSession} session - The MongoDB session.
   */
  async commitPointTrackerUpdate(
    author_user_id: string,
    dateOnly: Date,
    hours: number[],
    session: mongoose.mongo.ClientSession,
  ) {
    // Update point tracker.
    await this.pointTrackerModel.updateOne(
      {
        author_user_id: author_user_id,
        date: dateOnly,
      },
      {
        $addToSet: {
          hours_processed: hours,
        },
        $setOnInsert: {
          date: dateOnly,
        },
      },
      {
        upsert: true,
        session: session,
      },
    );
  }

  /**
   * Commits points to the database for a given user.
   * @param author_user_id - The ID of the user.
   * @param pointsToCommit - The number of points to commit.
   * @param session - The MongoDB session to use for the transaction.
   */
  async commitPointsToDatabase(
    author_user_id: string,
    pointsToCommit: number,
    session: mongoose.mongo.ClientSession,
  ) {
    if (pointsToCommit === 0) {
      return;
    }
    // Create a new points transaction for user.
    const newPointTransaction = new this.pointTransactionModel({
      author_user_id,
      amount: pointsToCommit,
      transaction_type: PointTransactionTypes.ADD,
    });
    await newPointTransaction.save({ session });

    // Update the user's points.
    await this.pointModel.updateOne(
      {
        author_user_id,
      },
      {
        $inc: {
          amount: pointsToCommit,
        },
        last_point_calculated_timestamp: Date.now(),
      },
      {
        upsert: true,
        session: session,
      },
    );
  }

  /**
   * Commits the last processed timestamp for a user.
   * If the entry does not exist, it creates a new one. Otherwise, it updates the existing entry.
   * @param newWeatherData - The new weather data to be processed.
   * @param lastProcessedTimestamp - The last processed timestamp to be committed.
   * @param session - The MongoDB client session.
   */
  async commitLastProcessedTimestampForUser(
    author_user_id: string,
    lastProcessedTimestamp: number,
    session: mongoose.mongo.ClientSession,
  ) {
    // Update last processed entry for user.
    // If not entry, create new otherwise update.
    await this.lastProcessedEntryModel.updateOne(
      { author_user_id: author_user_id },
      {
        $set: {
          last_processed_timestamp: lastProcessedTimestamp,
        },
      },
      {
        upsert: true,
        session: session,
      },
    );
  }

  /**
   * Calculates the points based on the provided parameters.
   *
   * @param author_user_id - The ID of the author user.
   * @param lastProcessedTimestamp - The timestamp of the last processed data.
   * @param newWeatherData - An array of new weather data.
   * @param session - The MongoDB session.
   * @returns The calculated points.
   */
  async calculatePoints(
    author_user_id: string,
    lastProcessedTimestamp: number,
    newWeatherData: CreateWeatherDatumDto[],
    session: mongoose.mongo.ClientSession,
  ) {
    let points = 0;

    const localPointTrackers = new Map<string, Set<number>>();

    const dates = newWeatherData.map((d) => {
      const date = new Date(d.timestamp);
      date.setUTCHours(0, 0, 0, 0);
      return date;
    });

    const uniqueDates = [...new Set(dates.map((date) => date.toISOString()))];

    // Get the existing point trackers from DB and populate local cache.
    const existingTrackers = await this.pointTrackerModel.find(
      {
        author_user_id,
        date: { $in: uniqueDates },
      },
      null,
      { session },
    );

    // Populate local cache
    existingTrackers.forEach((tracker) => {
      localPointTrackers.set(
        tracker.date.toISOString(),
        new Set(tracker.hours_processed),
      );
    });

    for (const weatherDatum of newWeatherData) {
      // Only consider future data.
      if (weatherDatum.timestamp > lastProcessedTimestamp) {
        const date = new Date(weatherDatum.timestamp); // UTC received.
        date.setUTCHours(0, 0, 0, 0);
        const dateISO = date.toISOString();
        const hourOnly = new Date(weatherDatum.timestamp).getUTCHours();

        const processedHours = localPointTrackers.get(dateISO) || new Set();
        const isNewDay = processedHours.size === 0;
        const isHourProcessed = processedHours.has(hourOnly);

        if (!isHourProcessed) {
          points += PointsConfigs.POINTS_PER_HOUR;
          processedHours.add(hourOnly);
          localPointTrackers.set(dateISO, processedHours);

          if (isNewDay) {
            // Check if the datapoint is uploaded within same day.
            // Check if server date.
            const serverDate = new Date();
            serverDate.setUTCHours(0, 0, 0, 0);
            const serverDateISO = serverDate.toISOString();

            if (dateISO === serverDateISO) {
              points += PointsConfigs.POINTS_PER_DAY;
            }
          }
        }
      }
    }

    for (const [date, hours] of localPointTrackers) {
      await this.commitPointTrackerUpdate(
        author_user_id,
        new Date(date),
        Array.from(hours),
        session,
      );
    }

    return points;
  }

  findAll(): Promise<Point[]> {
    return this.pointModel.find().exec();
  }

  findByUserId(author_user_id: string): Promise<Point> {
    return this.pointModel.findOne({ author_user_id }).exec();
  }
}
