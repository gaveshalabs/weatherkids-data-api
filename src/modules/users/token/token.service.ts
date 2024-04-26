import { IGenUserApiKey } from '../../common/interfaces/gen-user-api-key.interface';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users.service';
import { HttpException, Injectable } from '@nestjs/common';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

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

  public async validateGaveshaUserApiKey(key: string) {
    // Verify the sent key is a valid JWT.
    let result = null;
    try {
      result = await this.jwtService.verifyAsync(key);
    } catch (e) {
      // console.error('API Key validation failed, err 1001', e);
      throw new HttpException('API Key validation failed, err 1001', 401);
    }

    // Get the user from the database based on the email from the JWT.
    const user = await this.usersService.findUserByEmail(result.email);

    if (!user) {
      throw new HttpException('User not found. API Key validation failed', 404);
    }

    if (!user.is_active) {
      throw new HttpException('User disabled', 401);
    }

    // If the key is not the same as the one in the database,
    if (user.gavesha_user_api_key !== key) {
      throw new HttpException('API Key validation failed, err 1002', 401);
    }

    return user;
  }

  public validateMobileClientId(clientId: string) {
    return clientId === process.env.MOBILE_CLIENT_ID;
  }

  public validateComClientId(clientId: string) {
    return clientId === process.env.WEATHERCOM_CLIENT_ID;
  }
}
