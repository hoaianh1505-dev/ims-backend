import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { NotificationEntity } from '../modules/notifications/entities/notification.entity';
import { NotificationType } from '../modules/notifications/enums/notification-type.enum';
import { NotificationSeverity } from '../modules/notifications/enums/notification-severity.enum';
import { UserEntity } from '../modules/users/entities/user.entity';
import { runStandaloneSeed } from './seed.helper';

export async function seedNotifications(dataSource: DataSource, logger: Logger): Promise<NotificationEntity[]> {
  const notifRepo = dataSource.getRepository(NotificationEntity);
  const userRepo = dataSource.getRepository(UserEntity);
  const users = await userRepo.find();

  if (!users.length) {
    logger.warn('Chưa có người dùng để seed Thông báo (Notifications)');
    return [];
  }

  const admin = users[0];
  const now = Date.now();
  const hourMs = 3600 * 1000;

  const sampleNotifications = [
    {
      user_id: admin.id,
      title: 'Cảnh báo tồn kho tối thiểu',
      message: 'Mặt hàng Chuột không dây Logitech MX Master 3S tại Kho Chi nhánh Cần Thơ đã chạm ngưỡng an toàn (còn 2 chiếc).',
      type: NotificationType.LOW_STOCK,
      severity: NotificationSeverity.WARNING,
      is_read: false,
      created_at: new Date(now - 1 * hourMs),
    },
    {
      user_id: admin.id,
      title: 'Phiếu nhập kho mới hoàn tất',
      message: 'Phiếu nhập kho mã #IN-2026-001 (50 đơn vị sản phẩm) từ Synnex FPT đã được cập nhật thành công vào hệ thống.',
      type: NotificationType.STOCK_TRANSACTION,
      severity: NotificationSeverity.SUCCESS,
      is_read: false,
      created_at: new Date(now - 5 * hourMs),
    },
    {
      user_id: admin.id,
      title: 'Đơn mua hàng PO-2026-002 đã được duyệt',
      message: 'Quản lý kho đã phê duyệt đơn mua hàng #PO-2026-002 (Nhà cung cấp DGW Digiworld). Dự kiến giao hàng trong 2 ngày tới.',
      type: NotificationType.STOCK_TRANSACTION,
      severity: NotificationSeverity.INFO,
      is_read: true,
      read_at: new Date(now - 2 * hourMs),
      created_at: new Date(now - 24 * hourMs),
    },
    {
      user_id: admin.id,
      title: 'Hoàn tất kiểm kê kho định kỳ',
      message: 'Phiên kiểm kê #ST-2026-001 tại Kho Tổng Hà Nội đã hoàn thành với tỷ lệ chính xác số liệu đạt 98.7%.',
      type: NotificationType.SYSTEM,
      severity: NotificationSeverity.SUCCESS,
      is_read: true,
      read_at: new Date(now - 10 * hourMs),
      created_at: new Date(now - 48 * hourMs),
    },
    {
      user_id: admin.id,
      title: 'Thông báo sao lưu cơ sở dữ liệu định kỳ',
      message: 'Sao lưu tự động cơ sở dữ liệu PostgreSQL lên đám mây AWS S3 đã được thực thi thành công vào lúc 00:00.',
      type: NotificationType.SYSTEM,
      severity: NotificationSeverity.INFO,
      is_read: true,
      read_at: new Date(now - 20 * hourMs),
      created_at: new Date(now - 72 * hourMs),
    },
  ];

  const savedNotifs: NotificationEntity[] = [];

  for (const nData of sampleNotifications) {
    const notif = notifRepo.create(nData as unknown as NotificationEntity);
    const saved: any = await notifRepo.save(notif);
    savedNotifs.push(saved);
  }

  logger.log(`-> Đã tạo ${savedNotifs.length} thông báo mẫu thời gian thực (Notifications).`);
  return savedNotifs;
}

if (require.main === module) {
  runStandaloneSeed(seedNotifications, 'NotificationsSeed');
}

