import { ApiProperty } from '@nestjs/swagger';

export class RedeemMyPointsInputDto {
  @ApiProperty()
  readonly num_points: number;
}
