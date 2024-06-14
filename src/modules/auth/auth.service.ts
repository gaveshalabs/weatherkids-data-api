import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { OAuth2Client } from 'google-auth-library';
import { ClientsService } from '../clients/clients.service';
import { TokenService } from '../users/token/token.service';
import { IGenClientKey } from '../common/interfaces/gen-client-key.interface';
import { WeatherStationsService } from '../weather-stations/weather-stations.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly oAuth2Client: OAuth2Client,
    private readonly clientService: ClientsService,
    private readonly tokenService: TokenService,
    private readonly weatherStationsService: WeatherStationsService,
  ) {}

  async authenticateWithGoogle(idToken: string) {
    try {
      const loginTicket = await this.oAuth2Client.verifyIdToken({
        idToken,
        audience: process.env.WEBAPP_CLIENT_ID,
      });

      const decodeUser = loginTicket.getPayload();

      if (!decodeUser) {
        throw new UnauthorizedException();
      }

      const email = decodeUser.email;

      const user = await this.userService.findUserByEmail(email); // Get user from db.

      if (!user) {
        return 'No user in Gavesha db.';
      }

      return user;
    } catch (e) {
      console.log('e', e);

      throw new UnauthorizedException();
    }
  }

  async authenticateClient(clientId: string, clientSecret: string) {
    if (!await this.clientService.validateClientCredentials(clientId, clientSecret)) {
        throw new UnauthorizedException('Invalid client credentials');
    }
    return this.issueClientAuthToken(clientId);
  }

  async refreshClientToken(refreshToken: string) {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);
    return this.issueClientAuthToken(payload?.sub);
  }

  private async issueClientAuthToken(clientId: string) {
    const payload: IGenClientKey['payload'] = {};
    try {
      const station = await this.weatherStationsService.findByClient(clientId);
      if (station) {
        payload.weather_station_id = station.id;
      }
    } catch (error) {
      ;
    }
    const accessToken = await this.tokenService.generateClientAccessToken({ payload, subject: clientId, expiresIn: '1y' });
    const refreshToken = await this.tokenService.generateRefreshToken({ payload, subject: clientId });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      refresh_token: refreshToken,
      expires_in: new Date(new Date().getTime() + 86400000),  // in 1 day
    };
  }
}
