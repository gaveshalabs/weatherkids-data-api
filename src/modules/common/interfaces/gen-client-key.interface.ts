export interface IGenClientKey {
  payload: {
    // client_id: string;
    type?: string;
    weather_station_id?: string;
  };
  expiresIn?: string;
  subject: string;
}
