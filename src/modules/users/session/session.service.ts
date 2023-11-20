import { CreateSessionDto } from '../dto/create-session.dto';
import { IGenUserApiKey } from '../../common/interfaces/gen-user-api-key.interface';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../entities/user.entity';
import { HttpException, Injectable } from '@nestjs/common';
import { AuthService } from 'src/modules/auth/auth.service';

@Injectable()
export class SessionService {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  private async generateGaveshaUserApiKey(
    data: IGenUserApiKey,
  ): Promise<string> {
    try {
      const apiKey = await this.jwtService.signAsync(data.payload, {
        expiresIn: data.expiresIn,
      });
      return apiKey;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async create(createSessionDto: CreateSessionDto): Promise<User> {
    // Check auth.
    try {
      this.authService.authenticateWithGoogle(createSessionDto.idToken);
    } catch (e) {
      console.error(e);
      throw new HttpException(e, 401);
    }

    const user = await this.usersService.findUserByEmail(
      createSessionDto.email,
    );

    // If user exist with the email,
    if (user) {
      console.log('User exists. No need to re-create within Gavesha db.');

      return user;
    }

    const gaveshaUserApiKey: string = await this.generateGaveshaUserApiKey({
      payload: {
        email: createSessionDto.email,
        userId: createSessionDto.userId,
      },
      expiresIn: '7300d', // 20 years
    });

    console.log(`gaveshaUserApiKey: ${gaveshaUserApiKey}`);

    // Create new user dto.
    const createUserDto: CreateUserDto = {
      email: createSessionDto.email,
      uid: createSessionDto.userId,
      name: createSessionDto.name,
      contact_no: '',
      nearest_city: '',
      nearest_city_postalcode: '',
      photo_url: createSessionDto.photo_url,
      is_active: true,
      gavesha_user_api_key: gaveshaUserApiKey,
    };

    console.log(`createUserDto: ${JSON.stringify(createUserDto)}`);

    // Create user within the database.
    return await this.usersService.create(createUserDto);
  }
}
