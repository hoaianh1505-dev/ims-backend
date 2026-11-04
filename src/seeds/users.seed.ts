import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { UserEntity, UserRole } from '../modules/users/entities/user.entity';
import { PasswordUtil } from '../common/utils/password.util';
import { runStandaloneSeed } from './seed.helper';

export async function seedUsers(dataSource: DataSource, logger: Logger): Promise<UserEntity[]> {
  const userRepo = dataSource.getRepository(UserEntity);

  const defaultPassword = await PasswordUtil.hash('admin123');

  const usersData: Array<Partial<UserEntity>> = [
    {
      username: 'admin',
      display_name: 'Super Administrator',
      email: 'admin@ims.com',
      phone: '0900000001',
      role: UserRole.ADMIN,
      is_active: true,
      must_change_password: false,
    },
    {
      username: 'manager_hn',
      display_name: 'Nguyễn Văn Quản Lý (Miền Bắc)',
      email: 'manager.hn@ims.com',
      phone: '0900000002',
      role: UserRole.MANAGER,
      is_active: true,
      must_change_password: false,
    },
    {
      username: 'manager_hcm',
      display_name: 'Trần Thị Giám Sát (Miền Nam)',
      email: 'manager.hcm@ims.com',
      phone: '0900000003',
      role: UserRole.MANAGER,
      is_active: true,
      must_change_password: false,
    },
    {
      username: 'staff_hn01',
      display_name: 'Lê Hoàng Nam (Thủ kho Long Biên)',
      email: 'nam.le@ims.com',
      phone: '0900000004',
      role: UserRole.STAFF,
      is_active: true,
      must_change_password: false,
    },
    {
      username: 'staff_hn02',
      display_name: 'Phạm Quốc Bảo (Kho Cầu Giấy)',
      email: 'bao.pham@ims.com',
      phone: '0900000005',
      role: UserRole.STAFF,
      is_active: true,
      must_change_password: false,
    },
    {
      username: 'staff_hcm01',
      display_name: 'Vũ Minh Tuấn (Thủ kho Tân Tạo)',
      email: 'tuan.vu@ims.com',
      phone: '0900000006',
      role: UserRole.STAFF,
      is_active: true,
      must_change_password: false,
    },
    {
      username: 'staff_dn01',
      display_name: 'Đặng Thu Thảo (Kho Đà Nẵng)',
      email: 'thao.dang@ims.com',
      phone: '0900000007',
      role: UserRole.STAFF,
      is_active: true,
      must_change_password: false,
    },
  ];

  const savedUsers: UserEntity[] = [];

  for (const u of usersData) {
    let existing = await userRepo.findOne({ where: { username: u.username } });
    if (!existing) {
      existing = userRepo.create({
        ...u,
        password: defaultPassword,
      });
      await userRepo.save(existing);
      logger.log(`+ Tạo người dùng: ${existing.username} (${existing.role})`);
    } else {
      existing.display_name = u.display_name || existing.display_name;
      existing.role = u.role || existing.role;
      existing.must_change_password = false;
      await userRepo.save(existing);
    }
    savedUsers.push(existing);
  }

  logger.log(`Tổng cộng: ${savedUsers.length} người dùng đã sẵn sàng.`);
  return savedUsers;
}

if (require.main === module) {
  runStandaloneSeed(seedUsers, 'UsersSeed');
}

