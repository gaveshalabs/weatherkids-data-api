import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { ClientsService } from './clients.service';
import { ValidateAdminUserGuard } from '../common/guards/admin-user.guard';

@Controller('clients')
export class ClientsController {
    constructor(private readonly clientService: ClientsService) {}

    @UseGuards(ValidateAdminUserGuard)
    @Post()
    create(@Body() createClientDto: CreateClientDto) {
        return this.clientService.create(createClientDto);
    }
}
