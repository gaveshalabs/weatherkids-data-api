export class CreateUserDto {
  readonly uid: string;
  readonly gavesha_user_api_key: string;
  readonly name: string;
  readonly email: string;
  readonly contact_no: string;
  readonly nearest_city: string;
  readonly nearest_city_postalcode: string;
  readonly photo_url: string;
  readonly is_active: boolean;
}
