import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateSessionDto } from '../dto/create-session.dto';
import { SessionService } from './session.service';

@Controller('session')
@ApiTags('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  create(@Body() creationSessionDto: CreateSessionDto) {
    return this.sessionService.create(creationSessionDto);
  }
}
