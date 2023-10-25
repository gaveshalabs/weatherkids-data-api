import { Injectable } from '@nestjs/common';
import { CreateWeatherStationDto } from './dto/create-weather-station.dto';
import { UpdateWeatherStationDto } from './dto/update-weather-station.dto';

@Injectable()
export class WeatherStationsService {
  create(createWeatherStationDto: CreateWeatherStationDto) {
    return 'This action adds a new weatherStation';
  }

  findAll() {
    return `This action returns all weatherStations`;
  }

  findOne(id: number) {
    return `This action returns a #${id} weatherStation`;
  }

  update(id: number, updateWeatherStationDto: UpdateWeatherStationDto) {
    return `This action updates a #${id} weatherStation`;
  }

  remove(id: number) {
    return `This action removes a #${id} weatherStation`;
  }
}
