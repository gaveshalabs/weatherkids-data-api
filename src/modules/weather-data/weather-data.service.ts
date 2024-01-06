import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { PointsService } from '../points/points.service';
import { CreateWeatherDatumDto } from './dto/create-weather-datum.dto';
import { GetWeatherDatumDto } from './dto/get-weather-datum.dto';
import { UpdateWeatherDatumDto } from './dto/update-weather-datum.dto';
import {
  WeatherDatum,
  WeatherDatumDocument,
} from './entities/weather-datum.entity';
import {
  CreateBulkWeatherDataDto,
  CreateWeatherDataPointDto,
} from './dto/create-bulk-weather-data.dto';
import { BulkCreateWeatherDataResponseDto } from './dto/bulk-create-weather-data-response.dto';

@Injectable()
export class WeatherDataService {
  constructor(
    @InjectModel(WeatherDatum.name)
    private readonly weatherDatumModel: Model<WeatherDatumDocument>,

    private readonly pointsService: PointsService,

    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

  /**
   * Protected by guards.
   * This commit has to be a db transaction to ensure that all or none of the data is committed.
   * In the transaction, we need to also calculate the points.
   * 1) Get the weather data uploaded by this user.
   * 2) Calculate the points considering only a single representative weather datum for each hour.
   * Multiple weather data points for the same hour should be only once.
   * For each hour (if have atleast one weather data point for that hour):
   * points += #hours_covered * 0.5
   * 3) If there are atleast one weather data point for a day, then the user gets 8 points for that day.
   *
   */
  async bulkCommit(
    createBulkWeatherData: CreateBulkWeatherDataDto,
  ): Promise<BulkCreateWeatherDataResponseDto[]> {
    // Restructure the data to include the author_user_id, weather_station_id, metadata, coordinates.
    const { author_user_id, weather_station_id, metadata, coordinates } =
      createBulkWeatherData;

    let data = createBulkWeatherData.data.map(
      (datum: CreateWeatherDataPointDto) => {
        return {
          ...datum,
          author_user_id,
          weather_station_id,
          metadata,
          coordinates,
        };
      },
    ) as CreateWeatherDatumDto[];

    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    let insertedData = [];
    try {
      // (1) Commit weather data into the database.
      try {
        /**
         * The following weatherdata insertion is not part of the points calculation transaction.
         * Due to MongoDB limitation.
         * https://www.mongodb.com/docs/manual/core/timeseries/timeseries-limitations/#transactions
         */

        // Filter out the weather data that already exists within the database with same timestamps.
        // This is to prevent duplicate weather data.
        const existingWeatherData = await this.weatherDatumModel
          .find({
            timestamp: {
              $in: data.map((datum) => datum.timestamp),
            },
          })
          .exec();

        // Remove the existing weather data from the data to be inserted.
        // Also check timestamp of weather datapoint
        const currentUtcTimestamp = new Date().getTime(); // Get current UTC timestamp

        data = data.filter((datum) => {
          const datumDate = new Date(datum.timestamp); // Convert timestamp to Date object
          return (
            datumDate.getTime() <= currentUtcTimestamp && // Check if the timestamp is not in the future
            !existingWeatherData.some(
              (existingDatum) =>
                existingDatum.timestamp.getTime() === datumDate.getTime(),
            )
          );
        });

        insertedData = await this.weatherDatumModel.insertMany(data);

        // Hacky checks to check if the data was inserted.
        if (!insertedData || insertedData.length !== data.length) {
          throw new Error('Error inserting weather data');
        }
      } catch (error) {
        // Handle any errors that occur during the insertion of time-series data.
        throw error;
      }

      // (2) Points calculations.
      const lastProcessedTimestamp =
        await this.pointsService.getLastProcessedEntryTimestamp(
          author_user_id,
          session,
        );

      // Calculate the points.
      const pointsForBulk = await this.pointsService.calculatePoints(
        author_user_id,
        lastProcessedTimestamp,
        data,
        session,
      ); // Pass the transaction session.

      console.debug('pointsForBulk', pointsForBulk);

      // Commit the points for the user to db.
      await this.pointsService.commitPointsToDatabase(
        author_user_id,
        pointsForBulk,
        session,
      );

      // Commit the last processed timestamp for user to db.
      await this.pointsService.commitLastProcessedTimestampForUser(
        author_user_id,
        lastProcessedTimestamp,
        session,
      );

      // Commit the point calculation transaction if all goes well.
      await session.commitTransaction();

      // Return the _id, timestamp, created_at fields.
      return insertedData.map((datum) => {
        return {
          _id: datum._id,
          timestamp: datum.timestamp,
          created_at: datum.createdAt,
        } as BulkCreateWeatherDataResponseDto;
      }) as BulkCreateWeatherDataResponseDto[];
    } catch (error) {
      // Abort the point calculation transaction if any error occurs during the above.
      await session.abortTransaction();

      throw error;
    } finally {
      session.endSession();
    }
  }

  // Protected by guards.
  async create(
    createWeatherDatumDto: CreateWeatherDatumDto,
  ): Promise<WeatherDatum> {
    const newWeatherDatum = new this.weatherDatumModel(createWeatherDatumDto);
    return await newWeatherDatum.save();
  }

  async findAll(): Promise<GetWeatherDatumDto[]> {
    return this.weatherDatumModel.find();
  }

  async findAllWithUserDetails() {
    const weatherData = await this.weatherDatumModel
      .find()
      .populate('author_user_id');

    return weatherData;
  }

  findOne(id: number) {
    return `This action returns a #${id} weatherDatum`;
  }

  async findAllByWeatherStationId(
    weatherStationId: string,
  ): Promise<GetWeatherDatumDto[]> {
    return this.weatherDatumModel
      .find({ weather_station_id: weatherStationId })
      .exec();
  }

  async findLatestByWeatherStationId(
    weatherStationId: string,
  ): Promise<GetWeatherDatumDto> {
    return this.weatherDatumModel
      .findOne({ weather_station_id: weatherStationId }) // Use findOne if you need just the latest document
      .sort({ timestamp: -1 })
      .exec();
  }

  update(id: number, updateWeatherDatumDto: UpdateWeatherDatumDto) {
    console.log('updateWeatherDatumDto', updateWeatherDatumDto);
    return `This action updates a #${id} weatherDatum`;
  }

  remove(id: number) {
    return `This action removes a #${id} weatherDatum`;
  }
}
