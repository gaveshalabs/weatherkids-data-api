import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment';
import { Connection, Model } from 'mongoose';
import { PointsService } from '../points/points.service';
import { BulkCreateWeatherDataResponseDto } from './dto/bulk-create-weather-data-response.dto';
import { CreateBulkWeatherDataDto } from './dto/create-bulk-weather-data.dto';
import { GetWeatherDatumDto } from './dto/get-weather-datum.dto';
import { WeatherDataPoint } from './entities/weather-datapoint.entity';
import {
  WeatherDatum,
  WeatherDatumDocument,
} from './entities/weather-datum.entity';
import { WeatherDataMetadata } from './schema/weatherdata-metadata.schema';

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
    const { author_user_id, weather_station_id, coordinates, sensor_id, data } =
      createBulkWeatherData;

    for (let i = 0; i < data.length; i++) {
      const element = data[i];

      if (
        weather_station_id === 'dbfb6590-93c1-455b-aaf2-668560a73e4b' /* ||
        weather_station_id === '16c97b9b-f67f-4ab5-a6cb-730413ab4719' ||
        weather_station_id === '3337b81c-67d1-47c6-bdea-9f9b6c4d8977' */
      ) {
        element.timestamp = new Date().getTime();
      } else if (!element.timestamp) {
        if (!element.timestamp_iso) {
          throw new BadRequestException('timestamp required');
        }
        element.timestamp = new Date(element.timestamp_iso).getTime();
      }
    }

    let filteredDataPoints: WeatherDataPoint[] = [];

    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    let insertedData = [];
    let existingWeatherData = [];
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
        existingWeatherData = await this.weatherDatumModel
          .find({
            timestamp: {
              $in: data.map((datum) => datum.timestamp),
            },
            'metadata.author_user_id': author_user_id,
          })
          .exec();

        // Remove the existing weather data from the data to be inserted.
        // Also check timestamp of weather datapoint
        const currentUtcTimestamp = new Date().getTime(); // Get current UTC timestamp

        filteredDataPoints = data.filter((datum) => {
          const datumDate = new Date(datum.timestamp); // Convert timestamp to Date object
          return (
            datumDate.getTime() <= currentUtcTimestamp + 86400000 && // Check if the timestamp is not in the future
            !existingWeatherData.some(
              (existingDatum) =>
                existingDatum.timestamp.getTime() === datumDate.getTime(),
            )
          );
        });

        const populatedData = filteredDataPoints.map((dataPoint) => {
          return {
            ...dataPoint,
            metadata: {
              author_user_id: author_user_id,
              weather_station_id: weather_station_id,
              coordinates: coordinates,
              sensor_id: sensor_id || 'weathercomv3',
            } as WeatherDataMetadata,
          };
        });

        insertedData = await this.weatherDatumModel.insertMany(populatedData);

        // Hacky checks to check if the data was inserted.
        if (!insertedData || insertedData.length !== populatedData.length) {
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
    } catch (error) {
      // Abort the point calculation transaction if any error occurs during the above.
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    // Return the _id, timestamp, created_at fields.
    const responseData = [...insertedData, ...existingWeatherData];

    return responseData.map((datum) => {
      return {
        _id: datum._id,
        timestamp: datum.timestamp,
        timestamp_iso: moment(datum.timestamp).toISOString(true),
        created_at: datum.createdAt,
      } as BulkCreateWeatherDataResponseDto;
    }) as BulkCreateWeatherDataResponseDto[];
  }

  // TODO: Add types.
  /**
   * Transforms a weather datum object into a return format.
   * @param {any} datum - The weather datum object to be transformed.
   * @returns {any} - The transformed weather datum object.
   */
  transformWeatherDatum(datum): GetWeatherDatumDto {
    const transformed = {
      _id: datum._id,
      author_user_id: datum.metadata?.author_user_id,
      sensor_id: datum.metadata?.sensor_id,
      weather_station_id: datum.metadata?.weather_station_id,
      coordinates: datum.metadata?.coordinates,
      timestamp: datum.timestamp,
      temperature: datum.temperature,
      humidity: datum.humidity,
      pressure: datum.pressure,
      precipitation: datum.precipitation,
      solar_irradiance: datum.solar_irradiance,
      percentage_light_intensity: datum.percentage_light_intensity,
      tvoc: datum.tvoc,
    };

    // Following modifications are made to the datum because of the sensors overheating due to
    // ESP32, BMS and the presence of the VoC sensor. The goal is to reduce the marginal error
    // in the sensor readings. The error rates were determined through observation.
    if (transformed.tvoc) {
      if (transformed.percentage_light_intensity == 0) {
        transformed.temperature -= 5; // error was observed to be approx 5 degrees celsius
      } else if (transformed.percentage_light_intensity < 50) {
        transformed.temperature -= 8.5;
      } else {
        transformed.temperature -= 12;
      }
      // } else {
      //   if (transformed.percentage_light_intensity == 0) {
      //     transformed.temperature -= 3; // error is 5 degrees celsius
      //   } else if (transformed.percentage_light_intensity < 50) {
      //     transformed.temperature -= 6.5;
      //   } else {
      //     transformed.temperature -= 10;
      //   }
    }
    return transformed;
  }

  async findAll(): Promise<GetWeatherDatumDto[]> {
    const data = (await this.weatherDatumModel.find().exec()) as WeatherDatum[];

    return data.map((datum) => {
      return this.transformWeatherDatum(datum);
    });
  }

  async findAllWithUserDetails() {
    const data = await this.weatherDatumModel.find().populate({
      path: 'metadata.author_user_id',
      model: 'User',
    });

    return data.map((datum) => {
      return this.transformWeatherDatum(datum);
    });
  }

  /**
   * Retrieves weather data by weather station ID within a specified date range.
   * If no date range is provided, retrieves all weather data for the specified weather station.
   *
   * @param weatherStationId - The ID of the weather station.
   * @param dateFrom - Optional. The starting date of the date range (inclusive)
   * @param dateTo - Optional. The ending date of the date range (inclusive)
   * @returns A promise that resolves to an array of GetWeatherDatumDto objects representing the weather data.
   */
  async findAllByWeatherStationId(
    weatherStationId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<GetWeatherDatumDto[]> {
    // Convert date strings to actual Date objects, if they are defined
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;

    // Create the query object with the weather station ID
    const query: any = { 'metadata.weather_station_id': weatherStationId };

    // If both dates are defined, use the $gte (greater than or equal) and $lte (less than or equal) operators.
    // Inclusive ranges.
    if (fromDate && toDate) {
      query.timestamp = { $gte: fromDate, $lte: toDate };
    } else if (fromDate) {
      // If only the fromDate is defined, use $gte operator
      query.timestamp = { $gte: fromDate };
    } else if (toDate) {
      // If only the toDate is defined, use $lte operator
      query.timestamp = { $lte: toDate };
    }

    const data = (await this.weatherDatumModel
      .find(query)
      .exec()) as WeatherDatum[];

    // Transform and return the data
    return data.map((datum) => this.transformWeatherDatum(datum));
  }

  async findLatestByWeatherStationId(
    weatherStationId: string,
  ): Promise<GetWeatherDatumDto> {
    const datum = (await this.weatherDatumModel
      .findOne({ 'metadata.weather_station_id': weatherStationId })
      .sort({ timestamp: -1 })
      .exec()) as WeatherDatum;

    if (!datum) {
      return null;
    }

    return this.transformWeatherDatum(datum);
  }

  remove(id: number) {
    return `This action removes a #${id} weatherDatum`;
  }
}
