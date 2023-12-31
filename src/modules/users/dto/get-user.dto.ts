export class GetUserDto {
  readonly _id: string;
  readonly uid: string;
  readonly name: string;
  readonly email: string;
  readonly contact_no: string;
  readonly nearest_city: string;
  readonly nearest_city_postalcode: string;
  readonly photo_url: string;
  readonly is_active: boolean;
}
