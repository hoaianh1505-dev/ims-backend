import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { StocktakingSessionEntity } from './entities/stocktaking-session.entity';
import { StocktakingItemEntity } from './entities/stocktaking-item.entity';
import { StocktakingStatus } from './enums/stocktaking-status.enum';
import { CreateStocktakingDto } from './dto/create-stocktaking.dto';
import { UpdateStocktakingCountsDto } from './dto/update-stocktaking-counts.dto';
import { FilterStocktakingDto } from './dto/filter-stocktaking.dto';
import { WarehouseEntity } from '../warehouses/entities/warehouse.entity';
import { InventoryEntity } from '../inventory/entities/inventory.entity';
import { ProductEntity } from '../products/entities/product.entity';
import { StockTransactionsService } from '../stock-transactions/stock-transactions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { generateReferenceCode } from '../../common/utils/code-generator.util';

@Injectable()
export class StocktakingService {
  constructor(
    @InjectRepository(StocktakingSessionEntity)
    private readonly sessionRepo: Repository<StocktakingSessionEntity>,
    @InjectRepository(StocktakingItemEntity)
    private readonly itemRepo: Repository<StocktakingItemEntity>,
    @InjectRepository(WarehouseEntity)
    private readonly warehouseRepo: Repository<WarehouseEntity>,
    @InjectRepository(InventoryEntity)
    private readonly inventoryRepo: Repository<InventoryEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    private readonly stockTransactionsService: StockTransactionsService,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateStocktakingDto, userId: string): Promise<StocktakingSessionEntity> {
    const warehouse = await this.warehouseRepo.findOne({ where: { id: dto.warehouse_id } });
    if (!warehouse) {
      throw new NotFoundException('Kho hàng không tồn tại');
    }

    let code = dto.code ? dto.code.trim().toUpperCase() : '';
    if (code) {
      const existing = await this.sessionRepo.findOne({ where: { code } });
      if (existing) {
        throw new ConflictException(`Mã đợt kiểm kê "${code}" đã tồn tại`);
      }
    } else {
      let attempts = 0;
      while (attempts < 5) {
        const candidate = generateReferenceCode('KK');
        const exists = await this.sessionRepo.findOne({ where: { code: candidate } });
        if (!exists) {
          code = candidate;
          break;
        }
        attempts++;
      }
      if (!code) {
        code = `KK-${Date.now()}`;
      }
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Lấy snapshot tồn kho hiện tại của kho hàng
      const invQb = manager
        .createQueryBuilder(InventoryEntity, 'inv')
        .leftJoinAndSelect('inv.product', 'product')
        .where('inv.warehouse_id = :warehouseId', { warehouseId: dto.warehouse_id })
        .andWhere('product.deleted_at IS NULL');

      if (dto.product_ids && dto.product_ids.length > 0) {
        invQb.andWhere('inv.product_id IN (:...productIds)', { productIds: dto.product_ids });
      }

      const invRecords = await invQb.getMany();

      // Nếu không có tồn kho nào trong kho nhưng có truyền product_ids cụ thể
      let productsList: ProductEntity[] = [];
      if (invRecords.length === 0) {
        if (dto.product_ids && dto.product_ids.length > 0) {
          productsList = await manager.find(ProductEntity, {
            where: { id: In(dto.product_ids) },
          });
        } else {
          // Lấy toàn bộ sản phẩm đang hoạt động để kiểm kê
          productsList = await manager.find(ProductEntity, { take: 100 });
        }
      }

      const itemsToCreate: StocktakingItemEntity[] = [];
      let totalSystemQty = 0;

      if (invRecords.length > 0) {
        for (const record of invRecords) {
          const unitCost = Number(record.product?.cost_price || 0);
          const sysQty = Number(record.quantity || 0);
          totalSystemQty += sysQty;

          const item = manager.create(StocktakingItemEntity, {
            product_id: record.product_id,
            location_id: record.location_id || null,
            system_quantity: sysQty,
            counted_quantity: sysQty, // Mặc định ban đầu bằng số hệ thống, thủ kho chỉ cần sửa dòng lệch
            diff_quantity: 0,
            unit_cost: unitCost,
            diff_amount: 0,
            note: null,
          });
          itemsToCreate.push(item);
        }
      } else {
        for (const p of productsList) {
          const unitCost = Number(p.cost_price || 0);
          const item = manager.create(StocktakingItemEntity, {
            product_id: p.id,
            location_id: null,
            system_quantity: 0,
            counted_quantity: 0,
            diff_quantity: 0,
            unit_cost: unitCost,
            diff_amount: 0,
            note: null,
          });
          itemsToCreate.push(item);
        }
      }

      const session = manager.create(StocktakingSessionEntity, {
        code,
        title: dto.title.trim(),
        warehouse_id: dto.warehouse_id,
        status: StocktakingStatus.IN_PROGRESS,
        created_by_user_id: userId,
        total_system_quantity: totalSystemQty,
        total_counted_quantity: totalSystemQty,
        total_diff_quantity: 0,
        total_diff_amount: 0,
        note: dto.note?.trim() || null,
        items: itemsToCreate,
      });

      const saved = await manager.save(StocktakingSessionEntity, session);

      // Bắn thông báo realtime
      this.notificationsService.create({
        title: `Mở đợt kiểm kê kho: ${saved.code}`,
        message: `Đợt kiểm kê "${saved.title}" tại ${warehouse.name} đã được khởi tạo gồm ${itemsToCreate.length} mặt hàng.`,
        reference_id: saved.id,
        reference_type: 'STOCKTAKING',
      });

      return saved;
    });
  }

  async findAll(query: FilterStocktakingDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;

    const qb = this.sessionRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.warehouse', 'warehouse')
      .leftJoinAndSelect('s.creator', 'creator')
      .leftJoinAndSelect('s.completer', 'completer')
      .leftJoinAndSelect('s.adjustment_transaction', 'adjustment_transaction');

    if (query.status) {
      qb.andWhere('s.status = :status', { status: query.status });
    }

    if (query.warehouse_id) {
      qb.andWhere('s.warehouse_id = :warehouseId', { warehouseId: query.warehouse_id });
    }

    if (query.from_date) {
      qb.andWhere('s.created_at >= :fromDate', { fromDate: new Date(query.from_date) });
    }

    if (query.to_date) {
      const toDate = new Date(query.to_date);
      toDate.setHours(23, 59, 59, 999);
      qb.andWhere('s.created_at <= :toDate', { toDate });
    }

    if (query.search) {
      qb.andWhere(
        '(s.code ILIKE :search OR s.title ILIKE :search OR s.note ILIKE :search OR warehouse.name ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('s.created_at', 'DESC')
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

  async findOne(id: string): Promise<StocktakingSessionEntity> {
    const session = await this.sessionRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.warehouse', 'warehouse')
      .leftJoinAndSelect('s.creator', 'creator')
      .leftJoinAndSelect('s.completer', 'completer')
      .leftJoinAndSelect('s.adjustment_transaction', 'adjustment_transaction')
      .leftJoinAndSelect('s.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('product.unit', 'unit')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('items.location', 'location')
      .where('s.id = :id', { id })
      .getOne();

    if (!session) {
      throw new NotFoundException(`Đợt kiểm kê với ID "${id}" không tồn tại`);
    }

    return session;
  }

  async updateCounts(id: string, dto: UpdateStocktakingCountsDto): Promise<StocktakingSessionEntity> {
    const session = await this.findOne(id);

    if (session.status !== StocktakingStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Không thể cập nhật số lượng kiểm đếm cho đợt kiểm kê ở trạng thái "${session.status}". Chỉ cho phép khi ĐANG TIẾN HÀNH.`,
      );
    }

    const itemMap = new Map(session.items.map((i) => [i.id, i]));

    for (const countItem of dto.items) {
      const target = itemMap.get(countItem.item_id);
      if (!target) {
        throw new NotFoundException(`Dòng kiểm kê "${countItem.item_id}" không thuộc phiên này`);
      }

      target.counted_quantity = countItem.counted_quantity;
      target.diff_quantity = target.counted_quantity - target.system_quantity;
      target.diff_amount = target.diff_quantity * target.unit_cost;
      if (countItem.note !== undefined) {
        target.note = countItem.note ? countItem.note.trim() : null;
      }
      await this.itemRepo.save(target);
    }

    // Cập nhật lại tổng số trên session
    const refreshedItems = await this.itemRepo.find({ where: { session_id: id } });
    session.total_counted_quantity = refreshedItems.reduce(
      (sum, i) => sum + Number(i.counted_quantity || 0),
      0,
    );
    session.total_diff_quantity = refreshedItems.reduce(
      (sum, i) => sum + Number(i.diff_quantity || 0),
      0,
    );
    session.total_diff_amount = refreshedItems.reduce(
      (sum, i) => sum + Number(i.diff_amount || 0),
      0,
    );

    await this.sessionRepo.save(session);
    return this.findOne(id);
  }

  async complete(id: string, userId: string): Promise<StocktakingSessionEntity> {
    const session = await this.findOne(id);

    if (session.status !== StocktakingStatus.IN_PROGRESS) {
      throw new BadRequestException('Chỉ có thể chốt kiểm kê với phiên đang tiến hành (IN_PROGRESS)');
    }

    // Lọc các mặt hàng có chênh lệch giữa thực đếm và hệ thống
    const discrepantItems = session.items.filter((i) => Number(i.diff_quantity) !== 0);

    let adjustmentTxId: string | null = null;

    if (discrepantItems.length > 0) {
      // Tự động sinh phiếu ADJUSTMENT để cân bằng tồn kho
      const adjTx = await this.stockTransactionsService.adjustStock(
        {
          warehouse_id: session.warehouse_id,
          reference_no: undefined, // Tự động sinh ADJ-YYYYMMDD-XXXX
          note: `Cân bằng tồn kho tự động theo đợt kiểm kê ${session.code}: ${session.title}`,
          items: discrepantItems.map((i) => ({
            product_id: i.product_id,
            location_id: i.location_id || undefined,
            counted_quantity: Number(i.counted_quantity || 0),
          })),
        },
        userId,
      );
      adjustmentTxId = adjTx.id;
    }

    session.status = StocktakingStatus.COMPLETED;
    session.completed_by_user_id = userId;
    session.completed_at = new Date();
    session.adjustment_transaction_id = adjustmentTxId;

    const saved = await this.sessionRepo.save(session);

    // Bắn thông báo realtime
    this.notificationsService.create({
      title: `Chốt kiểm kê thành công: ${saved.code}`,
      message: `Đợt kiểm kê "${saved.title}" đã hoàn tất. Có ${discrepantItems.length} mặt hàng chênh lệch (Tổng lệch: ${saved.total_diff_quantity > 0 ? `+${saved.total_diff_quantity}` : saved.total_diff_quantity}) đã được đồng bộ tồn kho.`,
      reference_id: saved.id,
      reference_type: 'STOCKTAKING',
    });

    return this.findOne(id);
  }

  async cancel(id: string): Promise<StocktakingSessionEntity> {
    const session = await this.findOne(id);

    if (session.status !== StocktakingStatus.IN_PROGRESS) {
      throw new BadRequestException('Chỉ có thể hủy đợt kiểm kê đang tiến hành');
    }

    session.status = StocktakingStatus.CANCELLED;
    return await this.sessionRepo.save(session);
  }

  async delete(id: string): Promise<void> {
    const session = await this.findOne(id);

    if (session.status === StocktakingStatus.COMPLETED) {
      throw new BadRequestException('Không thể xóa đợt kiểm kê đã chốt và cân bằng kho');
    }

    await this.sessionRepo.remove(session);
  }
}

