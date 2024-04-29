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
    let apikey;
    if (request.headers['gavesha-user-api-key']) {
      apikey = request.headers['gavesha-user-api-key'];
    } else if (request.body.gavesha_user_api_key) {
      apikey = request.body.gavesha_user_api_key;
    } else {
      console.error('Error validating gavesha user');
      throw new HttpException('Invalid user', 401);
    }
    try {
      await this.tokenService.validateGaveshaUserApiKey(apikey);
      return true;
    } catch (error) {
      console.error('Error validating admin user', error);
      throw new HttpException(error, 401);
    }
  }
}
