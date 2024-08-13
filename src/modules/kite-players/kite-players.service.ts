import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { CreateKitePlayerDto } from './dto/create-kite-player-dto';
import { GetKitePlayerDto } from './dto/get-kite-player-dto';
import { KitePlayerCreatedResponseDto } from './dto/kite-player-created-response.dto';
import { UpdateKitePlayerDto } from './dto/update-kite-player-dto';
import { CityDataDocument } from './entities/cities.schema';
import { KitePlayer, KitePlayerDocument } from './entities/kite-player.entity';

@Injectable()
export class KitePlayersService {
  avatarUrls: any;
  constructor(
    @InjectModel(KitePlayer.name)
    private readonly kitePlayerModel: Model<KitePlayerDocument>,
    @InjectModel('CityData')
    private readonly CityDataModel: Model<CityDataDocument>,
    @InjectConnection() private readonly mongoConnection: Connection,
    private readonly jwtService: JwtService,
  ) {}

  private readonly avatarFilenames = [
    'avataaars (1).svg',
    'avataaars (2).svg',
    'avataaars (3).svg',
    'avataaars (4).svg',
    'avataaars (5).svg',
    'avataaars (6).svg',
    'avataaars (7).svg',
    'avataaars (8).svg',
    'avataaars (9).svg',
    'avataaars (10).svg',
    'avataaars (11).svg',
    'avataaars (12).svg',
    'avataaars (13).svg',
    'avataaars (14).svg',
    'avataaars (15).svg',
    'avataaars (16).svg',
    'avataaars (17).svg',
    'avataaars (18).svg',
    'avataaars (19).svg',
    'avataaars (20).svg',
    'avataaars (21).svg',
    'avataaars (22).svg',
    'avataaars (23).svg',
    'avataaars (24).svg',
    'avataaars (25).svg',
    'avataaars (26).svg',
    'avataaars (27).svg',
    'avataaars (28).svg',
    'avataaars (29).svg',
  ];

  private getRandomAvatarUrl(): string {
    const randomFilename = this.avatarFilenames[Math.floor(Math.random() * this.avatarFilenames.length)];
    return `assets/avatars/Avatar_Icons/${randomFilename}`;
  }

  // Protected by guards.
  async create(
    createKitePlayerDto: CreateKitePlayerDto,
    gaveshaUserApiKey: string,
  ): Promise<KitePlayerCreatedResponseDto> {
    try {
      // Step 1: Validate the API key
      let result = null;
      try {
        result = await this.jwtService.verifyAsync(gaveshaUserApiKey);
      } catch (e) {
        throw new HttpException('API Key validation failed', 401);
      }
      // Step 2: Create Kite Player
      const existingKitePlayer = await this.kitePlayerModel
        .findOne({
          user_id: result._id,
        })
        .exec();

      let kitePlayer: typeof existingKitePlayer;

      if (existingKitePlayer) {
        kitePlayer = existingKitePlayer;
      } else {
        const coordinatesArray: [number, number] = [
          createKitePlayerDto.coordinates.longitude,
          createKitePlayerDto.coordinates.latitude,
        ];
        
        const nearestCity = await this.findNearestCity(coordinatesArray);
        const randomAvatarUrl = this.getRandomAvatarUrl();
        const newKitePlayer = new this.kitePlayerModel({
          ...createKitePlayerDto,
          user_id: result._id,
          img_url: randomAvatarUrl,
          nearest_city: nearestCity.city_name_en,
          nearest_district: nearestCity.district_name_en,
        });
        kitePlayer = await newKitePlayer.save();
      }
      const response: KitePlayerCreatedResponseDto = {
        _id: kitePlayer._id,
        name: kitePlayer.name,
        birthday: kitePlayer.birthday,
        coordinates: kitePlayer.coordinates,
        city: kitePlayer.city,
        img_url: kitePlayer.img_url,
        nearest_city: kitePlayer.nearest_city,
        nearest_district: kitePlayer.nearest_district,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  findAll(): Promise<GetKitePlayerDto[]> {
    return this.kitePlayerModel.find();
  }

  findOne(id: string) {
    return this.kitePlayerModel.findOne({
      _id: id,
    });
  }

  async update(_id: string, kitePlayerDto: UpdateKitePlayerDto) {
    const updatedKitePlayer = await this.kitePlayerModel
      .findByIdAndUpdate(
        _id,
        kitePlayerDto,
        { new: true }, // Return the updated document instead of the original
      )
      .exec();
    if (!updatedKitePlayer) {
      throw new NotFoundException(`Kite Player with ID '${_id}' not found`);
    }
    return updatedKitePlayer;
  }
  remove(id: number) {
    return `This action removes a #${id} weatherStation`;
  }

  async findKitePlayerByUserId(_id: string): Promise<KitePlayer> {
    const kitePlayer = await this.kitePlayerModel.findOne({ user_id: _id }).exec();
    if (!kitePlayer) {
      throw new NotFoundException(`Kite player with user_id ${_id} not found`);
    }
    return kitePlayer;
  }
  
  async findNearestCity(coordinates: [number, number]) {
    const nearestCity = await this.CityDataModel.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: coordinates,
          },
          distanceField: 'distance',
          spherical: true,
        },
      },
      {
        $lookup: {
          from: 'districts',
          localField: 'district_id',
          foreignField: 'id',
          as: 'district',
        },
      },
      {
        $unwind: '$district',
      },
      {
        $project: {
          city_name_en: '$name_en',
          district_name_en: '$district.name_en',
          _id: 0,
        },
      },
      {
        $limit: 1, 
      },
    ]).exec();
  
    if (!nearestCity || nearestCity.length === 0) {
      throw new Error('No city found near these coordinates');
    }
    return nearestCity[0]; 
  }
  
  async getKitePlayersCountByNearestDistrict() {
    return this.kitePlayerModel.aggregate([
      {
        $group: {
          _id: "$nearest_district", 
          kite_player_ids: { $addToSet: "$_id" }, 
          total_players: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "kite_data", 
          localField: "kite_player_ids", 
          foreignField: "metadata.kite_player_id", 
          as: "kite_data" 
        }
      },
      {
        $unwind: {
          path: "$kite_data",
          preserveNullAndEmptyArrays: false 
        }
      },
      {
        $group: {
          _id: "$_id", 
          total_players: { $first: "$total_players" }, 
          unique_attempt_timestamps: { $addToSet: "$kite_data.metadata.attempt_timestamp" } 
        }
      },
      {
        $project: {
          _id: 0, 
          nearest_district: "$_id", 
          total_players: 1, 
          total_attempts: { $size: "$unique_attempt_timestamps" } 
        }
      }
    ]);
  }

  async getKitePlayerStatsByAgeRange(): Promise<any> {
    const ageGroups = [
      { minAge: 0, maxAge: 5 },
      { minAge: 6, maxAge: 10 },
      { minAge: 11, maxAge: 15 },
      { minAge: 16, maxAge: 20 },
      { minAge: 21, maxAge: 25 },
      { minAge: 26, maxAge: 30 },
      { minAge: 31, maxAge: 35 },
      { minAge: 36, maxAge: 40 },
      { minAge: 41, maxAge: 45 },
      { minAge: 46, maxAge: 50 },
      { minAge: 51, maxAge: 55 },
      { minAge: 56, maxAge: 60 },
    ];
    const pipelines = ageGroups.map(group => [
      {
        $addFields: {
          age: {
            $floor: {
              $divide: [
                {
                  $subtract: [
                    "$$NOW", 
                    "$birthday"
                  ]
                },
                1000 * 60 * 60 * 24 * 365.25 
              ]
            }
          }
        }
      },
      {
        $match: {
          age: { $gte: group.minAge, $lte: group.maxAge } 
        }
      },
      {
        $lookup: {
          from: "kite_data", 
          localField: "_id", 
          foreignField: "metadata.kite_player_id", 
          as: "kite_data" 
        }
      },
      {
        $unwind: {
          path: "$kite_data",
          preserveNullAndEmptyArrays: true 
        }
      },
      {
        $group: {
          _id: "$_id", 
          unique_attempt_timestamps: { $addToSet: "$kite_data.metadata.attempt_timestamp" },
          attempts: { $sum: 1 } 
        }
      },
      {
        $group: {
          _id: null, 
          total_kite_players: { $sum: 1 },
          total_attempts: { $sum: { $size: "$unique_attempt_timestamps" } } 
        }
      },
      {
        $project: {
          _id: 0,
          total_kite_players: 1,
          total_attempts: 1
        }
      },
      {
        $addFields: {
          age_group: `${group.minAge}-${group.maxAge}`
        }
      }
    ]);
    const results = await Promise.all(pipelines.map(pipeline =>
      this.kitePlayerModel.aggregate(pipeline).exec()
    ));
    const aggregatedResults = results.flat();
    return aggregatedResults;
  }
}
