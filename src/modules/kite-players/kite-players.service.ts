import { HttpException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { User, UserDocument } from '../users/entities/user.entity';
import { TokenService } from '../users/token/token.service';
import { CreateKitePlayerDto } from './dto/create-kite-player-dto';
import { KitePlayerCreatedResponseDto } from './dto/kite-player-created-response.dto';
import { KitePlayer, KitePlayerDocument } from './entities/kite-player.entity';

@Injectable()
export class KitePlayersService {
  constructor(
    @InjectModel(KitePlayer.name)
    private readonly kitePlayerModel: Model<KitePlayerDocument>,
     @InjectModel(User.name)
     private readonly userModel: Model<UserDocument>,

    @InjectConnection() private readonly mongoConnection: Connection,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,

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
  
      
      // let scopes = result.scopes;
      // if (!scopes) {
      //   scopes = ['kite_data:commit'];
      // }
      // if (scopes.indexOf('kite_data:commit') < 0) {
      //   scopes.push('kite_data:commit');
      // }
      // const updatedApiKey = await this.tokenService.generateGaveshaUserApiKey({
      //   payload: { _id, email, scopes, uid: '' },
      // });
  
      // const user = await this.userModel.findById(_id).exec();
      // if (!user) {
      //   throw new HttpException('User not found', 404);
      // }
      const existingKitePlayer = await this.kitePlayerModel.findOne({
        user_id: result._id,
      }).exec();

      if (!existingKitePlayer) {
        const newKitePlayer = new this.kitePlayerModel({
          ...createKitePlayerDto,
          user_id: result._id,
        });

        const savedKitePlayer = await newKitePlayer.save();

        const response: KitePlayerCreatedResponseDto = {
          _id: savedKitePlayer._id,
          name: savedKitePlayer.name,
          birthday: savedKitePlayer.birthday,
          coordinates: savedKitePlayer.coordinates,
        };

        return response;
      }
    } catch (error) {
      throw error;
    }
  }
}