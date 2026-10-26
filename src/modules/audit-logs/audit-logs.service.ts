import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from './entities/audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { FilterAuditLogDto } from './dto/filter-audit-log.dto';

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepo: Repository<AuditLogEntity>,
  ) {}

  async recordLog(dto: CreateAuditLogDto): Promise<AuditLogEntity | null> {
    try {
      const log = this.auditLogRepo.create({
        user_id: dto.user_id || null,
        action: dto.action,
        entity_name: dto.entity_name,
        entity_id: dto.entity_id || null,
        details: dto.details || null,
        ip_address: dto.ip_address || null,
      });
      return await this.auditLogRepo.save(log);
    } catch (error) {
      this.logger.error('Không thể lưu audit log:', error instanceof Error ? error.stack : error);
      return null;
    }
  }

  async findAll(query: FilterAuditLogDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const qb = this.auditLogRepo
      .createQueryBuilder('log')
      .leftJoin('log.user', 'user')
      .addSelect([
        'user.id',
        'user.username',
        'user.display_name',
        'user.role',
        'user.avatar',
      ]);

    if (query.user_id) {
      qb.andWhere('log.user_id = :userId', { userId: query.user_id });
    }

    if (query.action) {
      qb.andWhere('log.action ILIKE :action', { action: `%${query.action}%` });
    }

    if (query.entity_name) {
      qb.andWhere('log.entity_name ILIKE :entityName', {
        entityName: `%${query.entity_name}%`,
      });
    }

    if (query.entity_id) {
      qb.andWhere('log.entity_id = :entityId', { entityId: query.entity_id });
    }

    if (query.from_date) {
      qb.andWhere('log.created_at >= :fromDate', {
        fromDate: new Date(query.from_date),
      });
    }

    if (query.to_date) {
      const toDate = new Date(query.to_date);
      toDate.setHours(23, 59, 59, 999);
      qb.andWhere('log.created_at <= :toDate', { toDate });
    }

    if (query.search) {
      qb.andWhere(
        '(log.action ILIKE :search OR log.entity_name ILIKE :search OR log.entity_id ILIKE :search OR log.ip_address ILIKE :search OR user.username ILIKE :search OR user.display_name ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('log.created_at', 'DESC')
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

  async findOne(id: string): Promise<AuditLogEntity> {
    const log = await this.auditLogRepo
      .createQueryBuilder('log')
      .leftJoin('log.user', 'user')
      .addSelect([
        'user.id',
        'user.username',
        'user.display_name',
        'user.role',
        'user.avatar',
      ])
      .where('log.id = :id', { id })
      .getOne();

    if (!log) {
      throw new NotFoundException('Nhật ký thao tác không tồn tại');
    }

    return log;
  }

  async getRecentActivity(limit = 10): Promise<AuditLogEntity[]> {
    return this.auditLogRepo
      .createQueryBuilder('log')
      .leftJoin('log.user', 'user')
      .addSelect([
        'user.id',
        'user.username',
        'user.display_name',
        'user.role',
        'user.avatar',
      ])
      .orderBy('log.created_at', 'DESC')
      .take(limit)
      .getMany();
  }
}
