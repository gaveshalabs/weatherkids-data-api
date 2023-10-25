export class GetWeatherStationDto {
  readonly _id: string;
  readonly name: string;
  readonly coordinates: ICoordinates;
  readonly user_ids: string[];
}
