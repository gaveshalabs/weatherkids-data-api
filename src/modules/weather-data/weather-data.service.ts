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

@Injectable()
export class WeatherDataService {
  constructor(
    @InjectModel(WeatherDatum.name)
    private readonly weatherDatumModel: Model<WeatherDatumDocument>,

    private readonly pointsService: PointsService,

    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

  // Protected by guards.
  async bulkCommit(
    createWeatherData: CreateWeatherDatumDto[],
  ): Promise<WeatherDatum[]> {
    /**
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

    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    let insertedData = [];
    try {
      // Calculate the points.
      await this.pointsService.calculatePoints(createWeatherData, session); // Pass the transaction session.

      try {
        /**
         * The following weatherdata insertion is not part of the points calculation transaction.
         * Due to MongoDB limitation.
         * https://www.mongodb.com/docs/manual/core/timeseries/timeseries-limitations/#transactions
         */
        insertedData =
          await this.weatherDatumModel.insertMany(createWeatherData);

        // Hacky checks to check if the data was inserted.
        if (!insertedData || insertedData.length !== createWeatherData.length) {
          throw new Error('Error inserting weather data');
        }
      } catch (error) {
        // Handle any errors that occur during the insertion of time-series data.
        throw error;
      }

      // Commit the point calculation transaction if all goes well.
      await session.commitTransaction();

      return insertedData;
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

  update(id: number, updateWeatherDatumDto: UpdateWeatherDatumDto) {
    console.log('updateWeatherDatumDto', updateWeatherDatumDto);
    return `This action updates a #${id} weatherDatum`;
  }

  remove(id: number) {
    return `This action removes a #${id} weatherDatum`;
  }
}
