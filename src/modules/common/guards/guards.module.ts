import { Module } from '@nestjs/common';
import { ValidateGaveshaClientGuard } from './gavesha-client.guard';
import { ValidateGaveshaUserGuard } from './gavesha-user.guard';
import { SessionModule } from 'src/modules/users/session/session.module';

@Module({
  imports: [SessionModule],
  providers: [ValidateGaveshaUserGuard, ValidateGaveshaClientGuard],
  exports: [ValidateGaveshaUserGuard, ValidateGaveshaClientGuard],
})
export class GuardsModule {}
