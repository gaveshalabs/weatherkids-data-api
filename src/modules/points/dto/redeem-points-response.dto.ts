import { Point } from '../entities/point.entity';

export class RedeemPointsResponseDto {
  success: boolean;
  message: string;
  result?: Point;
}
