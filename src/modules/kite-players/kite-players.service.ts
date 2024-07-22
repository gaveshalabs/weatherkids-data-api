import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { CreateKitePlayerDto } from './dto/create-kite-player-dto';
import { GetKitePlayerDto } from './dto/get-kite-player-dto';
import { KitePlayerCreatedResponseDto } from './dto/kite-player-created-response.dto';
import { UpdateKitePlayerDto } from './dto/update-kite-player-dto';
import { KitePlayer, KitePlayerDocument } from './entities/kite-player.entity';

@Injectable()
export class KitePlayersService {
  avatarUrls: any;
  constructor(
    @InjectModel(KitePlayer.name)
    private readonly kitePlayerModel: Model<KitePlayerDocument>,
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
        
        const randomAvatarUrl = this.getRandomAvatarUrl();
        const newKitePlayer = new this.kitePlayerModel({
          ...createKitePlayerDto,
          user_id: result._id,
          img_url: randomAvatarUrl,
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
}
