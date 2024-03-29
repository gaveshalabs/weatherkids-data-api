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
import { UsersService } from '../users/users.service';
import { WeatherStationCreatedResponseDto } from './dto/weather-station-created-response.dto';
import { TokenService } from '../users/token/token.service';

@Injectable()
export class WeatherStationsService {
  constructor(
    @InjectModel(WeatherStation.name)
    private readonly weatherStationModel: Model<WeatherStationDocument>,

    @InjectConnection() private readonly mongoConnection: Connection,

    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
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
      let scopes = result.scopes;
      if (!scopes) {
        scopes = ['weather_data:commit'];
      }
      if (scopes.indexOf('weather_data:commit') < 0) {
        scopes.push('weather_data:commit');
      }
      const updatedApiKey = await this.tokenService.generateGaveshaUserApiKey({
        payload: { ...{ _id, email, uid }, weatherStationIds, scopes },
      });

      // Step 3: Save the updated API key to the user.
      console.log(`result`, result);

      this.usersService.update(result._id, {
        gavesha_user_api_key: updatedApiKey,
        scopes,
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
    return this.weatherStationModel.find({ is_hidden: { $ne: true } });
  }

  findOne(id: string) {
    return this.weatherStationModel.findOne({
      _id: id,
      is_hidden: { $ne: true },
    });
  }

  findByUser(user_id: string): Promise<WeatherStationDocument[]> {
    return this.weatherStationModel.find({
      user_ids: user_id,
      is_hidden: { $ne: true },
    });
  }

  async update(_id: string, updateWeatherStationDto: UpdateWeatherStationDto) {
    const updatedWeatherStation =
      await this.weatherStationModel.findByIdAndUpdate(
        _id,
        updateWeatherStationDto,
        { new: true }, // Return the updated document instead of the original
      );

    if (!updatedWeatherStation) {
      throw new NotFoundException(`Weather Station with ID '${_id}' not found`);
    }

    return updatedWeatherStation;
  }

  remove(id: number) {
    return `This action removes a #${id} weatherStation`;
  }

  async addUsersToWeatherStation(weatherStationId: string, userIds: string[]) {
    // Check if weather station exists
    const weatherStation =
      await this.weatherStationModel.findById(weatherStationId);

    if (!weatherStation) {
      throw new NotFoundException('Weather station not found');
    }

    const userIdsAsMap = {};
    for (let i = 0; i < weatherStation.user_ids.length; i++) {
      const _uid = weatherStation.user_ids[i];
      userIdsAsMap[_uid] = true;
    }

    const validUserIds = (await this.usersService.findAll(userIds, true)).map(
      (u) => u._id,
    );
    const userIdsToBeUpdated = [];
    for (let i = 0; i < userIds.length; i++) {
      const _uid = userIds[i];
      if (validUserIds.indexOf(_uid) >= 0 && !userIdsAsMap[_uid]) {
        userIdsToBeUpdated.push(_uid);
        userIdsAsMap[_uid] = true;
      }
    }

    if (userIdsToBeUpdated.length != userIds.length) {
      throw new HttpException('Invalid users provided', 400);
    }

    // Append user_ids to the existing user_ids and return the updated document
    const updatedWeatherStation =
      await this.weatherStationModel.findOneAndUpdate(
        { _id: weatherStationId },
        {
          $addToSet: {
            user_ids: { $each: userIdsToBeUpdated },
          },
        },
        { new: true }, // This ensures the updated document is returned
      );

    return updatedWeatherStation;
  }
}
