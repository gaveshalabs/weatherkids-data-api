import { HttpException, Injectable } from '@nestjs/common';
import { AuthService } from 'src/modules/auth/auth.service';
import { v4 as uuidv4 } from 'uuid';
import { WeatherStationsService } from '../../weather-stations/weather-stations.service';
import { CreateSessionDto } from '../dto/create-session.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../entities/user.entity';
import { TokenService } from '../token/token.service';
import { UsersService } from '../users.service';

@Injectable()
export class SessionService {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private tokenService: TokenService,
    private weatherStationsService: WeatherStationsService,
  ) {}

  private createUserResponse(
    user: User,
    newUser: boolean,
  ): User & { new_user: boolean } {
    return {
      _id: user._id,
      email: user.email,
      uid: user.uid,
      name: user.name,
      contact_no: user.contact_no,
      nearest_city: user.nearest_city,
      nearest_city_postalcode: user.nearest_city_postalcode,
      photo_url: user.photo_url,
      is_active: user.is_active,
      gavesha_user_api_key: user.gavesha_user_api_key,
      scopes: user.scopes,
      new_user: newUser,
    };
  }

  async create(
    createSessionDto: CreateSessionDto,
    idToken: string,
  ): Promise<User & { new_user: boolean }> {
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
      if (!user.is_active) {
        throw new HttpException('User is disabled', 401);
      }

      console.log('User exists. No need to re-create within Gavesha db.', user);

      // Try to validate the User API key in the database.
      try {
        await this.tokenService.validateGaveshaUserApiKey(
          user.gavesha_user_api_key,
        );

        console.log(`User API Key in database is valid`);
      } catch (error) {
        // If the User API key is invalid, then generate a new one and update the database.
        console.log(`User API Key is invalid. Generating a new one...`);

        // Extract payload from the existing User API key.
        // const payload = this.jwtService.decode(user.gavesha_user_api_key);

        const weatherStations = await this.weatherStationsService.findByUser(
          user._id,
        );

        // Generate a new User API key.
        const newApiKey = await this.tokenService.generateGaveshaUserApiKey({
          payload: {
            _id: user._id,
            uid: user.uid,
            email: user.email,
            weatherStationIds: weatherStations.map((doc) => doc._id),
            scopes: user.scopes,
          },
        });

        // Update the database with the new User API key.
        const updatedUser = await this.usersService.update(user._id, {
          gavesha_user_api_key: newApiKey,
        });

        return this.createUserResponse(updatedUser, false);
      }

      return this.createUserResponse(user, false);
    }

    // Create a new userId.
    const uuidV4Id = uuidv4();

    const gaveshaUserApiKey: string =
      await this.tokenService.generateGaveshaUserApiKey({
        payload: {
          _id: uuidV4Id,
          uid: createSessionDto.uid,
          email: createSessionDto.email,
          weatherStationIds: [], // Because initially the user will not have any weather stations.
          scopes: [],
        },
      });

    // Create new user dto.
    const createUserDto: CreateUserDto & { scopes: string[] } = {
      email: createSessionDto.email,
      uid: createSessionDto.uid,
      name: createSessionDto.name,
      contact_no: '',
      nearest_city: '',
      nearest_city_postalcode: '',
      photo_url: createSessionDto.photo_url,
      is_active: true,
      gavesha_user_api_key: gaveshaUserApiKey,
      scopes: [],
    };

    // Create user within the database.
    // When creating a user, the uuidv4 userId is passed as the _id.
    const result = await this.usersService.create(createUserDto, uuidV4Id);
    return this.createUserResponse(result, true);
  }
}
