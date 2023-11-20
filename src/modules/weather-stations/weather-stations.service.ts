import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateWeatherStationDto } from './dto/create-weather-station.dto';
import { UpdateWeatherStationDto } from './dto/update-weather-station.dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  WeatherStation,
  WeatherStationDocument,
} from './entities/weather-station.entity';
import { Connection, Model } from 'mongoose';
import { GetWeatherStationDto } from './dto/get-weather-station.dto';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from '../users/session/session.service';
import { UsersService } from '../users/users.service';
import { WeatherStationCreatedResponseDto } from './dto/weather-station-created-response.dto';

@Injectable()
export class WeatherStationsService {
  constructor(
    @InjectModel(WeatherStation.name)
    private readonly weatherStationModel: Model<WeatherStationDocument>,

    @InjectConnection() private readonly mongoConnection: Connection,

    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly usersService: UsersService,
  ) {}

  // Protected by guards.
  async create(
    createWeatherStationDto: CreateWeatherStationDto,
    gaveshaUserApiKey: string,
  ): Promise<WeatherStationCreatedResponseDto> {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();

    try {
      // Step 1: Save the new weather station
      const newWeatherStation = new this.weatherStationModel(
        createWeatherStationDto,
      );
      const savedWeatherStation = await newWeatherStation.save({ session });

      // Step 2: Update the user API key with the new weather station ID
      let result = null;
      try {
        result = await this.jwtService.verifyAsync(gaveshaUserApiKey);
      } catch (e) {
        throw new HttpException('API Key validation failed', 401);
      }

      const weatherStationIds = [
        ...(result.weatherStationIds || []),
        savedWeatherStation._id,
      ];

      const { _id, email, uid } = result;
      const updatedApiKey = await this.sessionService.generateGaveshaUserApiKey(
        { payload: { ...{ _id, email, uid }, weatherStationIds } },
      );

      // Step 3: Save the updated API key to the user.
      console.log(`result`, result);

      this.usersService.update(result._id, {
        gavesha_user_api_key: updatedApiKey,
      });

      // Step 4: Commit the transaction
      await session.commitTransaction();
      session.endSession();

      console.log('savedWeatherStation', savedWeatherStation);
      console.log('updatedApiKey', updatedApiKey);

      const response: WeatherStationCreatedResponseDto = {
        _id: savedWeatherStation._id,
        name: savedWeatherStation.name,
        coordinates: savedWeatherStation.coordinates,
        user_ids: savedWeatherStation.user_ids,
        gavesha_user_api_key: updatedApiKey,
      };

      return response;
    } catch (error) {
      // Handle any errors that occurred during the transaction
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

    // const newWeatherStation = new this.weatherStationModel(
    //   createWeatherStationDto,
    // );
    // return await newWeatherStation.save();
  }

  findAll(): Promise<GetWeatherStationDto[]> {
    return this.weatherStationModel.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} weatherStation`;
  }

  update(id: number, updateWeatherStationDto: UpdateWeatherStationDto) {
    console.log('updateWeatherStationDto', updateWeatherStationDto);

    return `This action updates a #${id} weatherStation`;
  }

  remove(id: number) {
    return `This action removes a #${id} weatherStation`;
  }

  async addUsersToWeatherStation(weatherStationId: string, user_ids: string[]) {
    // Check if weather station exists
    const weatherStation =
      await this.weatherStationModel.findById(weatherStationId);

    if (!weatherStation) {
      throw new NotFoundException('Weather station not found');
    }

    // Append user_ids to the existing user_ids and return the updated document
    const updatedWeatherStation =
      await this.weatherStationModel.findOneAndUpdate(
        { _id: weatherStationId },
        {
          $addToSet: {
            user_ids: { $each: user_ids },
          },
        },
        { new: true }, // This ensures the updated document is returned
      );

    return updatedWeatherStation;
  }
}
