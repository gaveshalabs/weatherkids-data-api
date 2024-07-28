import { ICoordinates } from 'src/modules/common/interfaces/coordinates.interface';

export class GetKitePlayerDto {
  readonly _id: string;
  readonly name: string;
  readonly birthday:Date;
  readonly coordinates: ICoordinates;
  readonly city: string;
  readonly img_url: string;
}
