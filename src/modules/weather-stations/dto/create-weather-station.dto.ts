export class CreateWeatherStationDto {
  readonly name: string;
  readonly coordinates: ICoordinates;
  readonly user_ids: string[];
}
