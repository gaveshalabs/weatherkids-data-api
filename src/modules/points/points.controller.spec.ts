import { Test, TestingModule } from '@nestjs/testing';
import { PointsController } from './points.controller';
import { PointsService } from './points.service';
import { ValidateGaveshaClientGuard } from '../common/guards/gavesha-client.guard';
import { ValidateGaveshaUserGuard } from '../common/guards/gavesha-user.guard';
import { TokenService } from '../users/token/token.service';

describe('PointsController', () => {
  let controller: PointsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointsController],
      providers: [
        {
          provide: PointsService,
          useValue: () => {},
        },
        {
          provide: TokenService,
          useValue: () => {},
        },
        {
          provide: ValidateGaveshaClientGuard,
          useValue: () => {},
        },
        {
          provide: ValidateGaveshaUserGuard,
          useValue: () => {},
        },
      ],
    }).compile();

    controller = module.get<PointsController>(PointsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
