import { Test, TestingModule } from '@nestjs/testing';
import { WeatherDataController } from './weather-data.controller';
import { WeatherDataService } from './weather-data.service';

describe('WeatherDataController', () => {
  let controller: WeatherDataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WeatherDataController],
      providers: [WeatherDataService],
    }).compile();

    controller = module.get<WeatherDataController>(WeatherDataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
