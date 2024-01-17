import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { PointsService } from './points.service';
import { ApiTags } from '@nestjs/swagger';
import { Point } from './entities/point.entity';
import { RedeemPointsInputDto } from './dto/redeem-points.dto';
import { RedeemPointsResponseDto } from './dto/redeem-points-response.dto';
import { ValidateGaveshaClientGuard } from '../common/guards/gavesha-client.guard';
import { ValidateGaveshaUserGuard } from '../common/guards/gavesha-user.guard';
import { RedeemMyPointsInputDto } from './dto/redeem-my-points.dto';

@Controller('points')
@ApiTags('points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  // Not used in prod. But useful for testing.
  @Get()
  findAll(): Promise<Point[]> {
    return this.pointsService.findAll();
  }

  @Post('/redeem')
  @UseGuards(ValidateGaveshaClientGuard, ValidateGaveshaUserGuard)
  async redeemPoints(
    @Body() redeemPointsInputDto: RedeemPointsInputDto,
  ): Promise<RedeemPointsResponseDto> {
    return await this.pointsService.redeemPoints(redeemPointsInputDto);
  }

  @Post('/my-redeem')
  @UseGuards(ValidateGaveshaClientGuard, ValidateGaveshaUserGuard)
  async myRedeemPoints(
    @Body() redeemMyPointsInputDto: RedeemMyPointsInputDto,
    @Headers('gavesha_user_api_key') gavesha_user_api_key: string,
  ): Promise<RedeemPointsResponseDto> {
    return await this.pointsService.myRedeemPoints(
      gavesha_user_api_key,
      redeemMyPointsInputDto,
    );
  }
}
