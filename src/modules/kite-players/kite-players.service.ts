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
  constructor(
    @InjectModel(KitePlayer.name)
    private readonly kitePlayerModel: Model<KitePlayerDocument>,
    @InjectConnection() private readonly mongoConnection: Connection,
    private readonly jwtService: JwtService,
  ) { }

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
      const existingKitePlayer = await this.kitePlayerModel.findOne({
        user_id: result._id,
      }).exec();
      
      let kitePlayer: typeof existingKitePlayer;
      
      if (existingKitePlayer) {
        kitePlayer = existingKitePlayer;
      } else {
        
        const newKitePlayer = new this.kitePlayerModel({
          ...createKitePlayerDto,
          user_id: result._id,
        });
      
        kitePlayer = await newKitePlayer.save();
      }
      const response: KitePlayerCreatedResponseDto = {
        _id: kitePlayer._id,
        name: kitePlayer.name,
        birthday: kitePlayer.birthday,
        coordinates: kitePlayer.coordinates,
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
    const updatedKitePlayer = await this.kitePlayerModel.findByIdAndUpdate(
      _id,
      kitePlayerDto, 
      { new: true }, // Return the updated document instead of the original
    ).exec();

    if (!updatedKitePlayer) {
      throw new NotFoundException(`Kite Player with ID '${_id}' not found`);
    }

    return updatedKitePlayer;
  }

  remove(id: number) {
    return `This action removes a #${id} weatherStation`;
  }
}
