import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
} from '@nestjs/common';
import { SessionService } from 'src/modules/users/session/session.service';

@Injectable()
export class ValidateGaveshaUserGuard implements CanActivate {
  constructor(private sessionService: SessionService) {}

  // This guard will be used to protect routes that require a Gavesha user to be logged in.
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      await this.sessionService.validateGaveshaUserApiKey(
        request.headers['gavesha-user-api-key'],
      );
      return true;
    } catch (error) {
      throw new HttpException(error, 401);
    }
  }
}
