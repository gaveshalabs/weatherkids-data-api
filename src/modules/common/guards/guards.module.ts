import { Module } from '@nestjs/common';
import { ValidateGaveshaClientGuard } from './gavesha-client.guard';
import { ValidateGaveshaUserGuard } from './gavesha-user.guard';
import { TokenModule } from '../../users/token/token.module';

@Module({
  imports: [TokenModule],
  providers: [ValidateGaveshaUserGuard, ValidateGaveshaClientGuard],
  exports: [ValidateGaveshaUserGuard, ValidateGaveshaClientGuard],
})
export class GuardsModule {}
