import { ICoordinates } from 'src/modules/common/interfaces/coordinates.interface';

export class CreateWeatherStationDto {
  readonly name: string;
  readonly coordinates: ICoordinates;
  readonly user_ids: string[];
}
