import { PartialType } from '@nestjs/mapped-types';
import { CreateKitePlayerDto } from './create-kite-player-dto';

export class UpdateKitePlayerDto extends PartialType(CreateKitePlayerDto) {}
