import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    private readonly usersService: UsersService,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    // Validate that user exists (throws 404 if not)
    await this.usersService.findOne(createTaskDto.userId);

    const task = this.tasksRepository.create(createTaskDto);
    return this.tasksRepository.save(task);
  }

  async findAll(
    filterDto: FilterTaskDto,
  ): Promise<{ data: Task[]; total: number; limit: number; offset: number }> {
    const { status, limit, offset } = filterDto;

    const qb = this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.user', 'user')
      .orderBy('task.createdAt', 'DESC')
      .take(limit)
      .skip(offset);

    if (status) {
      qb.where('task.status = :status', { status });
    }

    const [data, total] = await qb.getManyAndCount();

    return { data, total, limit, offset };
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID '${id}' not found`);
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);
    Object.assign(task, updateTaskDto);
    return this.tasksRepository.save(task);
  }

  async softDelete(id: string): Promise<{ message: string }> {
    const task = await this.findOne(id);
    await this.tasksRepository.softDelete(task.id);
    return { message: `Task '${id}' has been soft-deleted and can be restored` };
  }

  async restore(id: string): Promise<{ message: string }> {
    // Find including soft-deleted rows
    const task = await this.tasksRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!task) {
      throw new NotFoundException(`Task with ID '${id}' not found`);
    }

    if (!task.deletedAt) {
      throw new NotFoundException(`Task with ID '${id}' is not deleted`);
    }

    await this.tasksRepository.restore(id);
    return { message: `Task '${id}' has been restored successfully` };
  }
}
