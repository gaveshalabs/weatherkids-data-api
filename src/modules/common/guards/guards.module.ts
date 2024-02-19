import { Module } from '@nestjs/common';
import { ValidateGaveshaClientGuard } from './gavesha-client.guard';
import { ValidateGaveshaUserGuard } from './gavesha-user.guard';
import { TokenModule } from '../../users/token/token.module';
import { ValidateAdminUserGuard } from './admin-user.guard';

@Module({
  imports: [TokenModule],
  providers: [
    ValidateGaveshaUserGuard,
    ValidateGaveshaClientGuard,
    ValidateAdminUserGuard,
  ],
  exports: [
    ValidateGaveshaUserGuard,
    ValidateGaveshaClientGuard,
    ValidateAdminUserGuard,
  ],
})
export class GuardsModule {}
