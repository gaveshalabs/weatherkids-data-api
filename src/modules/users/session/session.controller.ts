import { Body, Controller, Post, Headers } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateSessionDto } from '../dto/create-session.dto';
import { SessionService } from './session.service';

@Controller('session')
@ApiTags('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  create(
    @Headers('id-token') idToken: string,
    @Body() creationSessionDto: CreateSessionDto,
  ) {
    return this.sessionService.create(creationSessionDto, idToken);
  }

  // Not directly called in prod, but useful for testing.
  @Post('gavesha-user-api-key')
  async checkApiKey(@Body() body: string) {
    return await this.sessionService.validateGaveshaUserApiKey(
      body['gavesha_user_api_key'],
    );
  }
}
