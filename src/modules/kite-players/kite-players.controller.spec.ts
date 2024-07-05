import { Test, TestingModule } from '@nestjs/testing';
import { KitePlayersController } from './kite-players.controller';

describe('KitePlayersController', () => {
  let controller: KitePlayersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KitePlayersController],
    }).compile();

    controller = module.get<KitePlayersController>(KitePlayersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
