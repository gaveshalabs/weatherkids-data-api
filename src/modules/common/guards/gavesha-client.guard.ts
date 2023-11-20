import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
} from '@nestjs/common';
import { SessionService } from 'src/modules/users/session/session.service';

@Injectable()
export class ValidateGaveshaClientGuard implements CanActivate {
  constructor(private sessionService: SessionService) {}

  // This guard will protect the routes that require a Gavesha client such as the Gavesha mobile app.
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      // Assume we want to check the client id of the request source to be the Gavesha mobile app.
      await this.sessionService.validateMobileClientId(
        request.headers['client-id'],
      );
      return true;
    } catch (error) {
      throw new HttpException(error, 401);
    }
  }
}
