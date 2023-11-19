import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { OAuth2Client } from 'google-auth-library';
import { CreateUserDto } from '../users/dto/create-user.dto';

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

      const sub = decodeUser.sub;

      let user = await this.userService.getUserBySubId(sub); // Get user from db.

      if (!user) {
        // User does not exist, so create a new one.
        const createUserDto: CreateUserDto = {
          sub_id: sub,
          name: decodeUser.name,
          email: decodeUser.email,
          contact_no: '',
          nearest_city: '',
          nearest_city_postalcode: '',
          photo_url: decodeUser.picture,
          is_active: true,
          idToken: idToken,
        };
        const result: any = await this.userService.create(createUserDto);

        user = result._doc;
      }

      return user;
    } catch (e) {
      console.log('e', e);

      throw new UnauthorizedException();
    }
  }
}
