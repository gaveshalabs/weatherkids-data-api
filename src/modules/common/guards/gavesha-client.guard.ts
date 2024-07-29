import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { TokenService } from '../../users/token/token.service';

@Injectable()
export class ValidateGaveshaClientGuard implements CanActivate {
  constructor(private tokenService: TokenService) {}

  // This guard will protect the routes that require a Gavesha client such as the Gavesha mobile app.
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers['authorization'];
    if (authHeader) {
      const jwtpaylod =
        await this.tokenService.validateClientAccessToken(authHeader);
      if (!jwtpaylod.iss.endsWith('access')) {
        return false;
      }
      request.clientId = jwtpaylod.sub;
      request.weatherStationId = jwtpaylod.weather_station_id;
      return true;
    }

    const header = request.headers['client-id'];
    if (header) {
      if (this.tokenService.validateMobileClientId(header)) {
        return true;
      } else if (this.tokenService.validateComClientId(header)) {
        return true;
      } else {
        console.error('Error validating client-id header: ', header);
        throw new HttpException('Invalid header Client Id', 401);
      }
    } else if (request.body?.client_id) {
      const param = request.body.client_id;
      if (this.tokenService.validateMobileClientId(param)) {
        return true;
      } else if (this.tokenService.validateComClientId(param)) {
        return true;
      } else {
        console.error('Error validating client-id param: ', param);
        throw new HttpException('Invalid body Client Id', 401);
      }
    } else {
      console.error('Error validating client: ', header);
      throw new HttpException('Invalid Client Id', 401);
    }
  }
}
