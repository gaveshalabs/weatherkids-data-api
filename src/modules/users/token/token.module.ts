import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { UsersModule } from '../users.module';

@Module({
  imports: [UsersModule],
  controllers: [],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
