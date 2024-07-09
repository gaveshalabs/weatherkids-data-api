import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@Controller('kite-data')
@ApiTags('kite-data')
export class KiteDataController {
    // constructor(
    //     private readonly kiteDataService: KiteDataService,
    //     private readonly kitePlayerService: KitePlayersService,
    //   ) {}

    //   @UseGuards(ValidateGaveshaClientGuard, ValidateGaveshaUserGuard)
    //   @Post('bulk')
    //   @UsePipes(
    //   new ValidationPipe({
    //     transform: true,
    //     whitelist: true,
    //     forbidNonWhitelisted: true,
    //     exceptionFactory: (errors) => new BadRequestException(errors),
    //   }),
    // )

    // async bulkCommit(
    //     @Body() createBulkKiteData: CreateBulkKiteDataDto,
    //   ): Promise<BulkCreateKiteDataResponseDto[]> {
    //     const res = await this.kiteDataService.bulkCommit(createBulkKiteData);
    //     console.info(res.length, 'data committed to player', createBulkKiteData.kite_player_id);
    //     return res;
    //   }

    //   @Get('all')
    //   findAll() {
    //     return this.kiteDataService.findAll();
    //   }

    //   @Get()
    //   async findAllByKitePlayerId(
    //     @Query('kite_player_id', new ParseUUIDPipe({ version: '4' }))
    //     kitePlayerId: string,
    //     @Query('from_date') dateFrom?: string, // Optional parameter
    //     @Query('to_date') dateTo?: string, // Optional parameter
    //   ): Promise<GetKiteDatumDto[]> {
    //     return await this.kiteDataService.findAllByKitePlayerId(
    //       kitePlayerId,
    //       dateFrom,
    //       dateTo,
    //     );
    //   }
    
    //   @Delete(':id')
    //   remove(@Param('id') id: string) {
    //     return this.kiteDataService.remove(+id);
    //   }
}
