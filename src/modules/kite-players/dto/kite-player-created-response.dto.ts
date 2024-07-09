import { PartialType } from "@nestjs/mapped-types";
import { CreateKitePlayerDto } from "./create-kite-player-dto";

export class KitePlayerCreatedResponseDto extends PartialType(
    CreateKitePlayerDto,
  ) {
   
    readonly _id: string;
  }