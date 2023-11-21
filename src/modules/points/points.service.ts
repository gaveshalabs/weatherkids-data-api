import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
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
import { PointsUtils } from './utils/points.utils';

@Injectable()
export class PointsService {
  constructor(
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

  @Cron(CronExpression.EVERY_DAY_AT_11PM)
  // @Cron('*/10 * * * * *') // Every 5 seconds
  async handleInspectPointReductionForTheDayCron() {
    console.log('Running cron');

    /**
     * Check if the user hasn't uploaded weather data for the day.
     * If so, then reduce points by a pre-defined amount.
     */
    // For testing the tomorrow day
    const date = new Date();
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
        user.author_user_id,
        PointsConfigs.POINTS_DAILY_PENALTY,
      );
    });
  }

  async deductPoints(author_user_id: string, reduceBy: number) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();

    try {
      // TODO: refactor.
      // Update the user's points.
      await this.pointModel.updateOne(
        {
          author_user_id,
        },
        {
          $inc: {
            amount: PointsConfigs.POINTS_DAILY_PENALTY, // Increment negative.
          },
          last_point_calculated_timestamp: Date.now(),
        },
        {
          upsert: true,
          session: session,
        },
      );

      // Create a new points transaction for user.
      const newPointTransaction = new this.pointTransactionModel({
        author_user_id,
        amount: reduceBy, // Negative value.
        transaction_type: PointTransactionTypes.DEDUCT,
      });
      await newPointTransaction.save({ session });

      // Commit.
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

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

  async calculatePoints(
    newWeatherData: CreateWeatherDatumDto[],
    session: mongoose.mongo.ClientSession,
  ) {
    // Get from db.
    let lastProcessedTimestamp = await this.getLastProcessedEntryTimestamp(
      newWeatherData[0].author_user_id,
      session,
    );

    const uniqueHourlyData = new Set();
    const uniqueDays = new Set();
    let points = 0;

    newWeatherData.forEach((weatherDatum) => {
      // Only consider future data.
      if (weatherDatum.timestamp > lastProcessedTimestamp) {
        const dayKey = PointsUtils.extractDayFromTimestamp(
          weatherDatum.timestamp,
        );

        // If unique day, add points.
        if (!uniqueDays.has(dayKey)) {
          uniqueDays.add(dayKey);
        }

        const hourKey = PointsUtils.extractHourFromTimestamp(
          weatherDatum.timestamp,
        );

        // If unique hourly data, add points.
        if (!uniqueHourlyData.has(hourKey)) {
          uniqueHourlyData.add(hourKey);
          lastProcessedTimestamp = weatherDatum.timestamp; // Update lastProcessedTimestamp to current datum's timestamp. (For db later.)
        }
      }
    });

    points += uniqueDays.size * PointsConfigs.POINTS_PER_DAY;
    points += uniqueHourlyData.size * PointsConfigs.POINTS_PER_HOUR;

    //------------------ Commit details ---------------------------------//
    // Save the newly calculated points to the user's points.
    // But if points is 0, then don't do anything.
    if (points !== 0) {
      // Create a new points transaction for user.
      const newPointTransaction = new this.pointTransactionModel({
        author_user_id: newWeatherData[0].author_user_id,
        amount: points,
        transaction_type: PointTransactionTypes.ADD,
      });
      await newPointTransaction.save({ session });

      // Update the user's points.
      await this.pointModel.updateOne(
        {
          author_user_id: newWeatherData[0].author_user_id, // Assume all weather data is from the same user.
        },
        {
          $inc: {
            amount: points,
          },
          last_point_calculated_timestamp: Date.now(),
          last_weatherdata_uploaded_timestamp: lastProcessedTimestamp, // TODO: check if this is needed.
        },
        {
          upsert: true,
          session: session,
        },
      );
    }

    // Clear.
    points = 0;
    uniqueDays.clear();
    uniqueHourlyData.clear();

    // Update last processed entry for user.
    // If not entry, create new otherwise update.
    return await this.lastProcessedEntryModel.updateOne(
      { author_user_id: newWeatherData[0].author_user_id },
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

  findAll(): Promise<Point[]> {
    return this.pointModel.find().exec();
  }
}
