import { Test, TestingModule } from '@nestjs/testing';
import { WeatherStationsController } from './weather-stations.controller';
import { WeatherStationsService } from './weather-stations.service';

describe('WeatherStationsController', () => {
  let controller: WeatherStationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WeatherStationsController],
      providers: [WeatherStationsService],
    }).compile();

    controller = module.get<WeatherStationsController>(WeatherStationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
