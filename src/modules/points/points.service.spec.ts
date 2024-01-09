import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Connection, Model, connect } from 'mongoose';
import {
  WeatherDatum,
  WeatherDatumSchema,
} from '../weather-data/entities/weather-datum.entity';
import {
  LastProcessedEntry,
  LastProcessedEntrySchema,
} from './entities/last-processed-entry.entity';
import {
  PointTracker,
  PointTrackerSchema,
} from './entities/point-tracker.entity';
import {
  PointTransaction,
  PointTransactionSchema,
} from './entities/point-transaction.entity';
import { Point, PointSchema } from './entities/point.entity';
import { PointsController } from './points.controller';
import { PointsService } from './points.service';
import { PointsConfigs } from './configs/points.config';
import { SessionService } from '../users/session/session.service';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { OAuth2Client } from 'google-auth-library';
import { User, UserSchema } from '../users/entities/user.entity';
import { WeatherDataPoint } from '../weather-data/entities/weather-datapoint.entity';
import { set, reset } from 'mockdate';

describe('PointsService', () => {
  let pointsService: PointsService;

  let mockUserModel = Model<User>;
  let mockPointTrackerModel = Model<PointTracker>;
  let mockPointTransactionModel = Model<PointTransaction>;
  let mockLastProcessedEntryModel = Model<LastProcessedEntry>;
  let mockPointModel = Model<Point>;
  let mockWeatherDatumModel = Model<WeatherDatum>;
  let mockMongoConnection: Connection;

  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mockMongoConnection = (await connect(uri)).connection;

    mockUserModel = mockMongoConnection.model(User.name, UserSchema);
    mockPointTrackerModel = mockMongoConnection.model(
      PointTracker.name,
      PointTrackerSchema,
    );
    mockPointTransactionModel = mockMongoConnection.model(
      PointTransaction.name,
      PointTransactionSchema,
    );
    mockLastProcessedEntryModel = mockMongoConnection.model(
      LastProcessedEntry.name,
      LastProcessedEntrySchema,
    );
    mockPointModel = mockMongoConnection.model(Point.name, PointSchema);
    mockWeatherDatumModel = mockMongoConnection.model(
      WeatherDatum.name,
      WeatherDatumSchema,
    );

    const app: TestingModule = await Test.createTestingModule({
      controllers: [PointsController],
      providers: [
        PointsService,
        SessionService,
        AuthService,
        JwtService,
        UsersService,
        OAuth2Client,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(PointTracker.name),
          useValue: mockPointTrackerModel,
        },
        {
          provide: getModelToken(PointTransaction.name),
          useValue: mockPointTransactionModel,
        },
        {
          provide: getModelToken(LastProcessedEntry.name),
          useValue: mockLastProcessedEntryModel,
        },
        {
          provide: getModelToken(Point.name),
          useValue: mockPointModel,
        },
        {
          provide: getModelToken(WeatherDatum.name),
          useValue: mockWeatherDatumModel,
        },
        {
          provide: getConnectionToken('DatabaseConnection'),
          useValue: mockMongoConnection,
        },
      ],
    }).compile();
    pointsService = app.get<PointsService>(PointsService);
  });

  afterAll(async () => {
    await mockMongoConnection.dropDatabase();
    await mockMongoConnection.close();
    await mongod.stop();
  });

  beforeEach(async () => {});

  afterEach(async () => {
    const collections = mockMongoConnection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  describe('calculatePoints', () => {
    const author_user_id = 'author_user_id';
    let session: mongoose.mongo.ClientSession;
    beforeAll(() => {
      session = null;
    });

    it('should return 0 if no new weather data is provided', async () => {
      const result = await pointsService.calculatePoints(
        author_user_id,
        123456789,
        [] as WeatherDataPoint[],
        session,
      );

      expect(result).toBe(0);
    });

    it('should return 0 if the new weather data is in the past', async () => {
      const result = await pointsService.calculatePoints(
        author_user_id,
        123456789,
        [{ timestamp: 123456788 }] as WeatherDataPoint[],
        session,
      );

      expect(result).toBe(0);
    });

    it('should return the correct points for a single future weather data point for a today', async () => {
      const result = await pointsService.calculatePoints(
        author_user_id,
        123456789000,
        [{ timestamp: new Date().getTime() }] as WeatherDataPoint[],
        session,
      );

      expect(result).toBe(
        PointsConfigs.POINTS_PER_HOUR + PointsConfigs.POINTS_PER_DAY,
      );
    });

    it('should add bonus points if the user has uploaded data on the same date they were collected in sri lanka timezone', async () => {
      set('2024-01-05T10:00:00Z'); // 5:30 PM in SL time
      const result = await pointsService.calculatePoints(
        author_user_id,
        123456789000,
        [
          { timestamp: new Date('2024-01-04T23:00:00Z').getTime() }, // 4:30 AM in SL time
        ] as CreateWeatherDatumDto[],
        session,
      );

      expect(result).toBe(
        PointsConfigs.POINTS_PER_HOUR + PointsConfigs.POINTS_PER_DAY,
      );
      reset();
    });

    it('should not add bonus points if the user has uploaded data on a different date than they were collected in sri lanka timezone', async () => {
      set('2024-01-05T10:00:00Z'); // 5:30 PM in SL time
      const result = await pointsService.calculatePoints(
        author_user_id,
        123456789000,
        [
          { timestamp: new Date('2024-01-05T23:00:00Z').getTime() }, // next day 4:30 AM in SL time
        ] as CreateWeatherDatumDto[],
        session,
      );

      expect(result).toBe(PointsConfigs.POINTS_PER_HOUR);
      reset();
    });
  });
});
