import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if email already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException(
        `User with email '${createUserDto.email}' already exists`,
      );
    }

    const user = this.usersRepository.create(createUserDto);

    // Hash password if provided
    if (createUserDto.password) {
      user.password = await bcrypt.hash(createUserDto.password, 10);
    }

    return this.usersRepository.save(user);
  }

  async findAll(pagination: PaginationDto): Promise<{ data: User[]; total: number; limit: number; offset: number }> {
    const { limit, offset } = pagination;

    const [data, total] = await this.usersRepository.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { data, total, limit, offset };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async getUserTasks(id: string, pagination: PaginationDto) {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    const { limit, offset } = pagination;

    const result = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.tasks', 'task')
      .where('user.id = :id', { id })
      .andWhere('task.deletedAt IS NULL')
      .orderBy('task.createdAt', 'DESC')
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    return {
      user: { id: result[0][0]?.id, name: result[0][0]?.name, email: result[0][0]?.email },
      tasks: result[0][0]?.tasks || [],
      total: result[1],
      limit,
      offset,
    };
  }
}
