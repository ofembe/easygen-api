import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UsersRepository) {}

  async create(name: string, email: string, password): Promise<User> {
    return this.userRepository.create(name, email, password);
  }

  async findOne(email: string) : Promise<User> {
    return this.userRepository.findOne(email);
  }

  async findById(id?: string) : Promise<User> {
    if (!id) {
      throw new NotFoundException();
    }
    return this.userRepository.findById(id);
  }
}
