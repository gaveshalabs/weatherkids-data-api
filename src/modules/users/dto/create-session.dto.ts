import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class CreateSessionDto extends PartialType(CreateUserDto) {
  readonly userId: string;
  readonly email: string;
  readonly name: string;
  readonly photo_url: string;
  readonly idToken: string;
}
