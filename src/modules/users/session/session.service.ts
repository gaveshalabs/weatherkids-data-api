import { CreateSessionDto } from '../dto/create-session.dto';
import { IGenUserApiKey } from '../../common/interfaces/gen-user-api-key.interface';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../entities/user.entity';
import { HttpException, Injectable } from '@nestjs/common';
import { AuthService } from 'src/modules/auth/auth.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SessionService {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  public async validateMobileClientId(clientId: string) {
    if (clientId !== process.env.MOBILE_CLIENT_ID) {
      throw new HttpException('Invalid Mobile Client Id', 401);
    }
  }

  public async validateGaveshaUserApiKey(key: string) {
    // Verify the sent key is a valid JWT.
    let result = null;
    try {
      result = await this.jwtService.verifyAsync(key);
    } catch (e) {
      throw new HttpException('API Key validation failed', 401);
    }

    // Get the user from the database based on the email from the JWT.
    const user = await this.usersService.findUserByEmail(result.email);

    if (!user) {
      throw new HttpException('User not found. API Key validation failed', 404);
    }

    // If the key is not the same as the one in the database,
    if (user.gavesha_user_api_key !== key) {
      throw new HttpException('API Key validation failed', 401);
    }

    return user;
  }

  public async generateGaveshaUserApiKey(
    data: IGenUserApiKey,
  ): Promise<string> {
    const expiresIn: string = data.expiresIn || '7300d'; // 20 years

    try {
      const apiKey = await this.jwtService.signAsync(data.payload, {
        expiresIn: expiresIn,
      });
      return apiKey;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async create(
    createSessionDto: CreateSessionDto,
    idToken: string,
  ): Promise<User> {
    // Check auth.
    try {
      await this.authService.authenticateWithGoogle(idToken);
    } catch (e) {
      console.error(e);
      throw new HttpException(e, 401);
    }

    const user = (await this.usersService.findUserByEmail(
      createSessionDto.email,
    )) as User;

    // If user exist with the email,
    if (user) {
      console.log('User exists. No need to re-create within Gavesha db.');
      console.log(`user`, user);

      // Try to validate the User API key in the database.
      try {
        await this.validateGaveshaUserApiKey(user.gavesha_user_api_key);

        console.log(`User API Key in database is valid`);
      } catch (error) {
        // If the User API key is invalid, then generate a new one and update the database.
        console.log(`User API Key is invalid. Generating a new one...`);

        // Extract payload from the existing User API key.
        const payload = this.jwtService.decode(user.gavesha_user_api_key);

        // Generate a new User API key.
        const newApiKey = await this.generateGaveshaUserApiKey({
          payload: {
            _id: payload._id,
            uid: payload.uid,
            email: payload.email,
            weatherStationIds: payload.weatherStationIds,
          },
        });

        // Update the database with the new User API key.
        const updatedUser = await this.usersService.update(user._id, {
          gavesha_user_api_key: newApiKey,
        });

        return updatedUser;
      }

      return user;
    }

    // Create a new userId.
    const uuidV4Id = uuidv4();

    const gaveshaUserApiKey: string = await this.generateGaveshaUserApiKey({
      payload: {
        _id: uuidV4Id,
        uid: createSessionDto.uid,
        email: createSessionDto.email,
        weatherStationIds: [], // Because initially the user will not have any weather stations.
      },
    });

    // Create new user dto.
    const createUserDto: CreateUserDto = {
      email: createSessionDto.email,
      uid: createSessionDto.uid,
      name: createSessionDto.name,
      contact_no: '',
      nearest_city: '',
      nearest_city_postalcode: '',
      photo_url: createSessionDto.photo_url,
      is_active: true,
      gavesha_user_api_key: gaveshaUserApiKey,
    };

    // Create user within the database.
    // When crea ting a user, the uuidv4 userId is passed as the _id.
    return await this.usersService.create(createUserDto, uuidV4Id);
  }
}
