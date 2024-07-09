import { Test, TestingModule } from '@nestjs/testing';
import { KitePlayersService } from './kite-players.service';

describe('KitePlayersService', () => {
  let service: KitePlayersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KitePlayersService],
    }).compile();

    service = module.get<KitePlayersService>(KitePlayersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
