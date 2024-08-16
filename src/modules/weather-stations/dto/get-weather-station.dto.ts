import { ICoordinates } from 'src/modules/common/interfaces/coordinates.interface';

export class GetWeatherStationDto {
  readonly _id: string;
  readonly name: string;
  readonly coordinates: ICoordinates;
  readonly user_ids: string[];
  readonly hexagon_name: string;
}
