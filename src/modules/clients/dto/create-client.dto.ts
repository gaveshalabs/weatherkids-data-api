export class CreateClientDto {
  readonly client_secret: string;
  readonly type: string;
  readonly scopes: string[];
}
