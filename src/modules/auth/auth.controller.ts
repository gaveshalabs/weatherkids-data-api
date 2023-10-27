import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('id-token')
  async authenticate(@Body('idToken') idToken: string) {
    try {
      const user = await this.authService.authenticateWithGoogle(idToken);
      return { user };
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
}
