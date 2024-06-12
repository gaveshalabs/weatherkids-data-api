import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Client, ClientSchema } from './entities/client.entity';
import { ClientsController } from './clients.controller';
import { TokenModule } from '../users/token/token.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Client.name, schema: ClientSchema }]),
    TokenModule,    // for api guards
  ],
  providers: [ClientsService],
  exports: [ClientsService],
  controllers: [ClientsController]
})
export class ClientsModule {}
