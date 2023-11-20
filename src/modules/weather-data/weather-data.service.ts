import { HttpException, Injectable } from '@nestjs/common';
import { CreateWeatherDatumDto } from './dto/create-weather-datum.dto';
import { UpdateWeatherDatumDto } from './dto/update-weather-datum.dto';
import {
  WeatherDatum,
  WeatherDatumDocument,
} from './entities/weather-datum.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GetWeatherDatumDto } from './dto/get-weather-datum.dto';
import { SessionService } from '../users/session/session.service';

@Injectable()
export class WeatherDataService {
  constructor(
    @InjectModel(WeatherDatum.name)
    private readonly weatherDatumModel: Model<WeatherDatumDocument>,
    private readonly sessionService: SessionService,
  ) {}

  async create(
    createWeatherDatumDto: CreateWeatherDatumDto,
    apiKey: string,
    clientId: string,
  ): Promise<WeatherDatum> {
    // Validate client id of request source.
    try {
      // Because the data can only be added from the mobile app,
      await this.sessionService.validateMobileClientId(clientId);
    } catch (error) {
      throw new HttpException(error, 401);
    }

    // Validate user api key.
    try {
      await this.sessionService.validateGaveshaUserApiKey(apiKey);
    } catch (error) {
      throw new HttpException(error, 401);
    }

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
