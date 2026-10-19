import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { PasswordUtil } from '../../common/utils/password.util';
import { UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { FilterUserDto } from './dto/filter-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const existingUser = await this.userRepository.findOne({
      where: { username: createUserDto.username },
    });
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await PasswordUtil.hash(createUserDto.password);

    const newUser = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return await this.userRepository.save(newUser);
  }

  async findAll(query: FilterUserDto) {
    const { page = 1, limit = 10, role, is_active, search } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (role) {
      whereClause.role = role;
    }

    if (is_active !== undefined) {
      whereClause.is_active = is_active;
    }

    if (search) {
      whereClause.username = ILike(`%${search}%`);
    }

    const [users, total] = await this.userRepository.findAndCount({
      where: whereClause,
      select: {
        id: true,
        username: true,
        display_name: true,
        phone: true,
        email: true,
        avatar: true,
        role: true,
        must_change_password: true,
        is_active: true,
        created_at: true,
      },
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async findOne(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.findOne(id);

    if (updateUserDto.password) {
      updateUserDto.password = await PasswordUtil.hash(updateUserDto.password);
    }

    const updatedUser = this.userRepository.merge(user, updateUserDto);
    return await this.userRepository.save(updatedUser);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.softRemove(user);
  }
}
