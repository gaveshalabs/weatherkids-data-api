export interface IGenUserApiKey {
  payload: {
    _id: string;
    uid: string;
    email: string;
    weatherStationIds?: string[];
    scopes?: string[];
  };
  expiresIn?: string;
}
