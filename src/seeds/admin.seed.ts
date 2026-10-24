import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { UserEntity, UserRole } from '../modules/users/entities/user.entity';
import { PasswordUtil } from '../common/utils/password.util';
import { Logger } from '@nestjs/common';

async function runSeed() {
  const logger = new Logger('Seed');
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const dataSource = app.get(DataSource);
    const userRepository = dataSource.getRepository(UserEntity);

    // 1. Kiểm tra tài khoản admin
    const adminExists = await userRepository.findOne({
      where: { username: 'admin' },
    });

    if (!adminExists) {
      const hashedPassword = await PasswordUtil.hash('admin123');
      const admin = userRepository.create({
        username: 'admin',
        password: hashedPassword,
        display_name: 'Super Administrator',
        email: 'admin@ims.com',
        phone: '0900000000',
        role: UserRole.ADMIN,
        is_active: true,
        must_change_password: false,
      });

      await userRepository.save(admin);
      logger.log('Tạo tài khoản Super Admin thành công: username="admin" / password="admin123"');
    } else {
      adminExists.must_change_password = false;
      await userRepository.save(adminExists);
      logger.log('Tài khoản "admin" đã cập nhật must_change_password = false');
    }

    logger.log('Hoàn thành quá trình seed dữ liệu!');
  } catch (error) {
    logger.error('Lỗi khi chạy seed dữ liệu:', error);
  } finally {
    await app.close();
  }
}

runSeed();
