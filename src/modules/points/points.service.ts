import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { PointTransactionTypes } from '../common/enums/point-transaction-types.enum';
import { CreateWeatherDatumDto } from '../weather-data/dto/create-weather-datum.dto';
import { PointsConfigs } from './configs/points.config';
import {
  LastProcessedEntry,
  LastProcessedEntryDocument,
} from './entities/last-processed-entry.entity';
import {
  PointTransaction,
  PointTransactionDocument,
} from './entities/point-transaction.entity';
import { PointsUtils } from './utils/points.utils';
import { Point, PointDocument } from './entities/point.entity';

@Injectable()
export class PointsService {
  constructor(
    @InjectModel(PointTransaction.name)
    private pointTransactionModel: Model<PointTransactionDocument>,

    @InjectModel(LastProcessedEntry.name)
    private lastProcessedEntryModel: Model<LastProcessedEntryDocument>,

    @InjectModel(Point.name)
    private pointModel: Model<PointDocument>,
  ) {}

  async calculatePoints(
    newWeatherData: CreateWeatherDatumDto[],
    session: mongoose.mongo.ClientSession,
  ) {
    // Get last processed entry for user.
    const lastProcessedEntry = await this.lastProcessedEntryModel.findOne(
      {
        author_user_id: newWeatherData[0].author_user_id,
      },
      null,
      { session },
    );

    let lastProcessedTimestamp = 0;

    if (lastProcessedEntry) {
      // If found, get the last processed entry's timestamp.
      lastProcessedTimestamp = lastProcessedEntry.last_processed_timestamp;
    }

    const uniqueHourlyData = new Set();
    const uniqueDays = new Set();

    // Calculate points considering each hour.
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

      await this.pointModel.updateOne(
        {
          author_user_id: newWeatherData[0].author_user_id,
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

    // Reset.
    points = 0;
    uniqueDays.clear();
    uniqueHourlyData.clear();

    // Update last processed entry for user.
    // If not entry, create new otherwise update
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
