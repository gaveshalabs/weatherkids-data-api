import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
} from '@nestjs/common';
import { TokenService } from '../../users/token/token.service';

@Injectable()
export class ValidateGaveshaUserGuard implements CanActivate {
  constructor(private tokenService: TokenService) {}

  // This guard will be used to protect routes that require a Gavesha user to be logged in.
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      await this.tokenService.validateGaveshaUserApiKey(
        request.headers['gavesha-user-api-key'],
      );
      return true;
    } catch (error) {
      console.error('Error validating admin user', error);
      throw new HttpException(error, 401);
    }
  }
}
