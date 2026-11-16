import { Injectable, NotFoundException, Logger, MessageEvent } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { NotificationEntity } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { FilterNotificationDto } from './dto/filter-notification.dto';
import { NotificationType } from './enums/notification-type.enum';
import { NotificationSeverity } from './enums/notification-severity.enum';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly notificationSubject = new Subject<{
    userId?: string | null;
    notification: NotificationEntity;
  }>();

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
  ) {}

  getStream(userId: string): Observable<MessageEvent> {
    return this.notificationSubject.asObservable().pipe(
      filter((event) => !event.userId || event.userId === userId),
      map(
        (event) =>
          ({
            data: event.notification,
            type: 'notification',
          }) as MessageEvent,
      ),
    );
  }

  async create(dto: CreateNotificationDto): Promise<NotificationEntity> {
    const notification = this.notificationRepo.create({
      user_id: dto.user_id || null,
      title: dto.title.trim(),
      message: dto.message.trim(),
      type: dto.type || NotificationType.SYSTEM,
      severity: dto.severity || NotificationSeverity.INFO,
      reference_id: dto.reference_id || null,
      reference_type: dto.reference_type || null,
      is_read: false,
    });
    const saved = await this.notificationRepo.save(notification);

    // Bắn realtime qua SSE stream
    try {
      this.notificationSubject.next({
        userId: saved.user_id,
        notification: saved,
      });
    } catch (err) {
      this.logger.error('Không thể emit realtime event qua SSE:', err);
    }

    return saved;
  }

  async findAll(userId: string, query: FilterNotificationDto) {
    const page = query.page || 1;
    const limit = query.limit || 15;

    const qb = this.notificationRepo
      .createQueryBuilder('n')
      .where('(n.user_id = :userId OR n.user_id IS NULL)', { userId });

    if (query.is_read !== undefined) {
      qb.andWhere('n.is_read = :isRead', { isRead: query.is_read });
    }

    if (query.type) {
      qb.andWhere('n.type = :type', { type: query.type });
    }

    if (query.severity) {
      qb.andWhere('n.severity = :severity', { severity: query.severity });
    }

    if (query.search) {
      qb.andWhere('(n.title ILIKE :search OR n.message ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    qb.orderBy('n.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadCount(userId: string): Promise<{ unread_count: number }> {
    const count = await this.notificationRepo
      .createQueryBuilder('n')
      .where('(n.user_id = :userId OR n.user_id IS NULL)', { userId })
      .andWhere('n.is_read = false')
      .getCount();

    return { unread_count: count };
  }

  async markAsRead(id: string, userId: string): Promise<NotificationEntity> {
    const notification = await this.notificationRepo
      .createQueryBuilder('n')
      .where('n.id = :id', { id })
      .andWhere('(n.user_id = :userId OR n.user_id IS NULL)', { userId })
      .getOne();

    if (!notification) {
      throw new NotFoundException('Thông báo không tồn tại');
    }

    notification.is_read = true;
    notification.read_at = new Date();
    return await this.notificationRepo.save(notification);
  }

  async markAllAsRead(userId: string): Promise<{ success: boolean; updated_count: number }> {
    const result = await this.notificationRepo
      .createQueryBuilder()
      .update(NotificationEntity)
      .set({ is_read: true, read_at: new Date() })
      .where('(user_id = :userId OR user_id IS NULL)', { userId })
      .andWhere('is_read = false')
      .execute();

    return {
      success: true,
      updated_count: result.affected || 0,
    };
  }

  async delete(id: string, userId: string): Promise<void> {
    const notification = await this.notificationRepo
      .createQueryBuilder('n')
      .where('n.id = :id', { id })
      .andWhere('(n.user_id = :userId OR n.user_id IS NULL)', { userId })
      .getOne();

    if (!notification) {
      throw new NotFoundException('Thông báo không tồn tại');
    }

    await this.notificationRepo.remove(notification);
  }

  // Helper method: Tạo cảnh báo tồn kho thấp hoặc hết hàng
  async notifyLowStock(params: {
    productId: string;
    productName: string;
    productSku: string;
    warehouseName: string;
    currentQuantity: number;
    threshold: number;
  }) {
    try {
      const isOutOfStock = params.currentQuantity <= 0;
      await this.create({
        title: isOutOfStock
          ? `Hết hàng: [${params.productSku}] ${params.productName}`
          : `Cảnh báo tồn kho thấp: [${params.productSku}] ${params.productName}`,
        message: isOutOfStock
          ? `Sản phẩm "${params.productName}" đã hết sạch tồn kho tại "${params.warehouseName}". Vui lòng lên kế hoạch nhập hàng khẩn cấp!`
          : `Sản phẩm "${params.productName}" tại "${params.warehouseName}" hiện chỉ còn ${params.currentQuantity} cái (dưới ngưỡng an toàn ${params.threshold}).`,
        type: isOutOfStock ? NotificationType.OUT_OF_STOCK : NotificationType.LOW_STOCK,
        severity: isOutOfStock ? NotificationSeverity.DANGER : NotificationSeverity.WARNING,
        reference_id: params.productId,
        reference_type: 'PRODUCT',
      });
    } catch (err) {
      this.logger.error('Lỗi khi tạo thông báo tồn kho thấp:', err);
    }
  }

  // Helper method: Tạo thông báo khi có phiếu giao dịch kho mới
  async notifyStockTransaction(params: {
    transactionId: string;
    referenceNo: string;
    type: string;
    warehouseName: string;
    creatorName: string;
    itemsCount: number;
  }) {
    try {
      const typeLabels: Record<string, string> = {
        IMPORT: 'Nhập kho',
        EXPORT: 'Xuất kho',
        TRANSFER: 'Chuyển kho',
        ADJUSTMENT: 'Kiểm kê điều chỉnh',
      };
      const label = typeLabels[params.type] || 'Giao dịch';

      await this.create({
        title: `Phiếu ${label} mới: ${params.referenceNo}`,
        message: `${params.creatorName} vừa lập phiếu ${label} "${params.referenceNo}" tại ${params.warehouseName} gồm ${params.itemsCount} mặt hàng.`,
        type: NotificationType.STOCK_TRANSACTION,
        severity: params.type === 'EXPORT' ? NotificationSeverity.INFO : NotificationSeverity.SUCCESS,
        reference_id: params.transactionId,
        reference_type: 'STOCK_TRANSACTION',
      });
    } catch (err) {
      this.logger.error('Lỗi khi tạo thông báo giao dịch kho:', err);
    }
  }
}

