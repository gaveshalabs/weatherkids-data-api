import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly oAuth2Client: OAuth2Client,
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
}
