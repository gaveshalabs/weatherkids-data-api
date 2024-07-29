import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Not directly called in prod, but useful for testing
  @Post('id-token')
  async authenticate(@Body('idToken') idToken: string) {
    try {
      const user = await this.authService.authenticateWithGoogle(idToken);
      return { user };
    } catch (e) {
      throw new UnauthorizedException();
    }
  }

  @Post('token')
  async getAuthToken(
    @Body()
    body: {
      grant_type: string;
      client_id: string;
      client_secret: string;
    },
  ) {
    const { grant_type, client_id, client_secret } = body;

    if (grant_type !== 'client_credentials') {
      throw new BadRequestException('Unsupported grant type');
    }

    return this.authService.authenticateClient(client_id, client_secret);
  }

  @Post('refresh-token')
  async reissueAuthToken(@Headers('authorization') refreshToken: string) {
    try {
      return this.authService.refreshClientToken(refreshToken);
    } catch (error) {
      console.error('reissueAuthToken', error);
    }
  }
}
