import { IsOptional } from 'class-validator';
import { ICoordinates } from 'src/modules/common/interfaces/coordinates.interface';

export class CreateKitePlayerDto {
  readonly name: string;
  readonly coordinates: ICoordinates;
  readonly birthday: Date;
  readonly city: string;
  readonly img_url: string;

  @IsOptional()
  readonly isBot?: boolean;
}
