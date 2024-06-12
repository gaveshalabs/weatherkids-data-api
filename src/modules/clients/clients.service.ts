import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Client, ClientDocument } from './entities/client.entity';
import { Model } from 'mongoose';
import { CreateClientDto } from './dto/create-client.dto';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ClientsService {
    constructor(
        @InjectModel(Client.name)
        private readonly clientModel: Model<ClientDocument>,
    ) {}

    async create(dto: CreateClientDto) {
        const secret = await bcrypt.hash(dto.client_secret, 10);
        const newClient = new this.clientModel({ 
            ...dto, 
            _id: uuidv4(), 
            is_active: true,
            client_secret: secret,
         });
        await newClient.save();
        return true;
    }

    async validateClientCredentials(clientId: string, clientSecret: string) {
        const client = await this.clientModel.findById(clientId);
        if (!client) {
            return false;
        }
        return bcrypt.compare(clientSecret, client.client_secret);
    }
}
