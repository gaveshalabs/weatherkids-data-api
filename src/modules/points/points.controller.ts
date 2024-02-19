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
import { FreezePointsInputDto } from './dto/freeze-points.dto ';
import { ValidateAdminUserGuard } from '../common/guards/admin-user.guard';

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
    @Headers('gavesha-user-api-key') gavesha_user_api_key: string,
    @Body() redeemMyPointsInputDto: RedeemMyPointsInputDto,
  ): Promise<RedeemPointsResponseDto> {
    return await this.pointsService.myRedeemPoints(
      gavesha_user_api_key,
      redeemMyPointsInputDto,
    );
  }

  @Post('/freeze')
  @UseGuards(ValidateGaveshaClientGuard, ValidateAdminUserGuard)
  async freezePoints(
    @Body() freezePointsInputDto: FreezePointsInputDto,
  ): Promise<RedeemPointsResponseDto> {
    return await this.pointsService.freezePoints(freezePointsInputDto);
  }
}
