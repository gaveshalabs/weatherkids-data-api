import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateWeatherStationDto } from './dto/create-weather-station.dto';
import { UpdateWeatherStationDto } from './dto/update-weather-station.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  WeatherStation,
  WeatherStationDocument,
} from './entities/weather-station.entity';
import { Model } from 'mongoose';
import { GetWeatherStationDto } from './dto/get-weather-station.dto';

@Injectable()
export class WeatherStationsService {
  constructor(
    @InjectModel(WeatherStation.name)
    private readonly weatherStationModel: Model<WeatherStationDocument>,
  ) {}

  // Protected by guards.
  async create(
    createWeatherStationDto: CreateWeatherStationDto,
  ): Promise<WeatherStation> {
    const newWeatherStation = new this.weatherStationModel(
      createWeatherStationDto,
    );
    return await newWeatherStation.save();
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
