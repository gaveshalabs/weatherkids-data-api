import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { User } from '../users/entities/user.entity';
import { WeatherDatum } from '../weather-data/entities/weather-datum.entity';
import { PointsConfigs } from './configs/points.config';
import { LastProcessedEntry } from './entities/last-processed-entry.entity';
import { PointTransaction } from './entities/point-transaction.entity';
import { Point } from './entities/point.entity';
import { PointsService } from './points.service';
import { PointsUtils } from './utils/points.utils';

describe('PointsService', () => {
  let service: PointsService;
  let mockPointTransactionModel: Model<PointTransaction>;
  let mockLastProcessedEntryModel: Model<LastProcessedEntry>;
  let mockPointModel: Model<Point>;
  let mockWeatherDatumModel: Model<WeatherDatum>;
  let mockUserModel: Model<User>;
  const mockMongoConnection = {
    startSession: jest.fn(),
  };

  beforeEach(async () => {
    mockPointModel = {
      updateOne: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointsService,
        PointsConfigs,
        PointsUtils,
        // Provide your mock models here
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(PointTransaction.name),
          useValue: mockPointTransactionModel,
        },
        {
          provide: getModelToken(LastProcessedEntry.name),
          useValue: mockLastProcessedEntryModel,
        },
        { provide: getModelToken(Point.name), useValue: mockPointModel },
        {
          provide: getModelToken(WeatherDatum.name),
          useValue: mockWeatherDatumModel,
        },
        {
          provide: getConnectionToken(),
          useValue: mockMongoConnection,
        },
        // Add any other dependencies your service might have
      ],
    }).compile();

    service = module.get<PointsService>(PointsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should correctly deduct points from a user', async () => {
    const author_user_id = 'user123';
    const reduceBy = 10;

    jest.spyOn(service['mongoConnection'], 'startSession').mockImplementation(
      () =>
        ({
          startTransaction: jest.fn(),
          commitTransaction: jest.fn(),
          abortTransaction: jest.fn(),
          endSession: jest.fn(),
        }) as any,
    ); // Mock the session

    const mockUsers = [
      { author_user_id: 'user1' },
      { author_user_id: 'user2' },
    ];

    mockPointModel.updateOne.mockResolvedValue(mockUsers);
    mockPointTransactionModel.prototype.save = jest
      .fn()
      .mockResolvedValue(null);

    await service.deductPoints(author_user_id, reduceBy);

    expect(mockPointModel.updateOne).toHaveBeenCalledWith(
      { author_user_id },
      expect.any(Object),
      expect.any(Object),
    );
    expect(mockPointTransactionModel.prototype.save).toHaveBeenCalled();
  });
});
