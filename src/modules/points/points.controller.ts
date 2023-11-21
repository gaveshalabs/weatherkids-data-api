import { Controller, Get } from '@nestjs/common';
import { PointsService } from './points.service';
import { ApiTags } from '@nestjs/swagger';
import { Point } from './entities/point.entity';

@Controller('points')
@ApiTags('points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  // Not used in prod. But useful for testing.
  @Get()
  findAll(): Promise<Point[]> {
    return this.pointsService.findAll();
  }
}
