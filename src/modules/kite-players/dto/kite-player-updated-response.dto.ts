import { PartialType } from "@nestjs/mapped-types";
import { KitePlayerCreatedResponseDto } from "./kite-player-created-response.dto";

export class KitePlayerUpdatedResponseDto extends PartialType(
    KitePlayerCreatedResponseDto,
  ) {}
  