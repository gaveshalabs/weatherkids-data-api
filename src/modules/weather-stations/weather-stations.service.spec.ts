import { Test, TestingModule } from '@nestjs/testing';
import { WeatherStationsService } from './weather-stations.service';

describe('WeatherStationsService', () => {
  let service: WeatherStationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WeatherStationsService],
    }).compile();

    service = module.get<WeatherStationsService>(WeatherStationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
