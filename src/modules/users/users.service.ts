import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { PasswordUtil } from '../../common/utils/password.util';
import { UserEntity, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { FilterUserDto } from './dto/filter-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly mailService: MailService,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const existingUser = await this.userRepository.findOne({
      where: { username: createUserDto.username },
    });
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const rawPassword = createUserDto.password;
    const hashedPassword = await PasswordUtil.hash(rawPassword);

    const newUser = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(newUser);

    // Gửi email thông báo tài khoản & mật khẩu cho nhân viên nếu có email
    if (savedUser.email) {
      this.mailService
        .sendUserCredentials({
          to: savedUser.email,
          username: savedUser.username,
          password: rawPassword,
          displayName: savedUser.display_name,
          role: savedUser.role,
        })
        .catch(() => {});
    }

    return savedUser;
  }

  async findAll(query: FilterUserDto) {
    const { page = 1, limit = 10, role, is_active, search } = query;
    const skip = (page - 1) * limit;

    const baseFilter: any = {};
    if (role) {
      baseFilter.role = role;
    }
    if (is_active !== undefined) {
      baseFilter.is_active = is_active;
    }

    let whereClause: any = baseFilter;

    if (search?.trim()) {
      const keyword = `%${search.trim()}%`;
      whereClause = [
        { ...baseFilter, username: ILike(keyword) },
        { ...baseFilter, display_name: ILike(keyword) },
        { ...baseFilter, email: ILike(keyword) },
        { ...baseFilter, phone: ILike(keyword) },
      ];
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

  async findByUsername(usernameOrEmail: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    });
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

  getRoles() {
    return [
      {
        role: UserRole.ADMIN,
        name: 'Quản trị viên (Admin)',
        description: 'Toàn quyền quản trị hệ thống, quản lý người dùng và cấu hình',
      },
      {
        role: UserRole.MANAGER,
        name: 'Quản lý kho (Manager)',
        description: 'Quản lý kho hàng, duyệt phiếu xuất nhập, theo dõi báo cáo và kiểm kê',
      },
      {
        role: UserRole.STAFF,
        name: 'Nhân viên kho (Staff)',
        description: 'Thực hiện thao tác nhập kho, xuất kho và kiểm đếm thực tế',
      },
    ];
  }

  async resetPassword(id: string, dto?: ResetPasswordDto) {
    const user = await this.findOne(id);

    const tempPassword = dto?.new_password || `IMS@${Math.random().toString(36).slice(-6)}!`;
    const hashedPassword = await PasswordUtil.hash(tempPassword);

    user.password = hashedPassword;
    user.must_change_password = true;
    await this.userRepository.save(user);

    if (user.email) {
      this.mailService
        .sendPasswordReset({
          to: user.email,
          username: user.username,
          tempPassword,
          displayName: user.display_name,
        })
        .catch(() => {});
    }

    return {
      message: 'Đặt lại mật khẩu thành công',
      user_id: user.id,
      username: user.username,
      temp_password: tempPassword,
    };
  }
}
