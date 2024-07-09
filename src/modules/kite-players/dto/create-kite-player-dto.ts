import { ICoordinates } from "src/modules/common/interfaces/coordinates.interface";

export class CreateKitePlayerDto {
    readonly name: string;
    readonly coordinates: ICoordinates;
    readonly birthday: Date;
}