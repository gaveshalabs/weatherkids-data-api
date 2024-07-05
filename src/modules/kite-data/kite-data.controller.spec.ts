import { Test, TestingModule } from '@nestjs/testing';
import { KiteDataController } from './kite-data.controller';

describe('KiteDataController', () => {
  let controller: KiteDataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KiteDataController],
    }).compile();

    controller = module.get<KiteDataController>(KiteDataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
