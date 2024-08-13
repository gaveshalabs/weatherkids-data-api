import { ICoordinates } from 'src/modules/common/interfaces/coordinates.interface';

export class GetKitePlayerDto {
  readonly _id: string;
  readonly name: string;
  readonly birthday:Date;
  readonly coordinates: ICoordinates;
  readonly city: string;
  readonly nearest_city: string;
  readonly nearest_district: string;
  readonly img_url: string;
}
