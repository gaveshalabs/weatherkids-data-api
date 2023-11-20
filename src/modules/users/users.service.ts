import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './entities/user.entity';
import { GetUserDto } from './dto/get-user.dto';
import { log } from 'console';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto, userId: string): Promise<User> {
    const newUser = new this.userModel({ ...createUserDto, _id: userId });
    return await newUser.save();
  }

  findAll(): Promise<GetUserDto[]> {
    return this.userModel.find().exec();
  }

  async findUserByEmail(email: string) {
    const user = await this.userModel.findOne({ email: email });
    return user;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async update(_id: string, updateUserDto: UpdateUserDto) {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      _id,
      updateUserDto,
      { new: true }, // Return the updated document instead of the original
    );

    if (!updatedUser) {
      throw new NotFoundException(`User with ID '${_id}' not found`);
    }

    return updatedUser;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  // async getUserBySubId(sub: string) {
  //   const user = await this.userModel.findOne({ sub_id: sub });
  //   return user;
  // }
}
