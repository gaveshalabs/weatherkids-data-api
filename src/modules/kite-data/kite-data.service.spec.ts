import { Test, TestingModule } from '@nestjs/testing';
import { KiteDataService } from './kite-data.service';

describe('KiteDataService', () => {
  let service: KiteDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KiteDataService],
    }).compile();

    service = module.get<KiteDataService>(KiteDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
