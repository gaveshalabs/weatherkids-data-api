export interface IGenUserApiKey {
  payload: { userId: string; email: string };
  expiresIn?: string;
}
