import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PurchaseOrderEntity } from './entities/purchase-order.entity';
import { PurchaseOrderItemEntity } from './entities/purchase-order-item.entity';
import { PurchaseOrderStatus } from './enums/purchase-order-status.enum';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { FilterPurchaseOrderDto } from './dto/filter-purchase-order.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';
import { SupplierEntity } from '../suppliers/entities/supplier.entity';
import { WarehouseEntity } from '../warehouses/entities/warehouse.entity';
import { ProductEntity } from '../products/entities/product.entity';
import { StockTransactionsService } from '../stock-transactions/stock-transactions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { generateReferenceCode } from '../../common/utils/code-generator.util';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrderEntity)
    private readonly orderRepo: Repository<PurchaseOrderEntity>,
    @InjectRepository(PurchaseOrderItemEntity)
    private readonly itemRepo: Repository<PurchaseOrderItemEntity>,
    @InjectRepository(SupplierEntity)
    private readonly supplierRepo: Repository<SupplierEntity>,
    @InjectRepository(WarehouseEntity)
    private readonly warehouseRepo: Repository<WarehouseEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    private readonly stockTransactionsService: StockTransactionsService,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreatePurchaseOrderDto, userId: string): Promise<PurchaseOrderEntity> {
    const supplier = await this.supplierRepo.findOne({ where: { id: dto.supplier_id } });
    if (!supplier) {
      throw new NotFoundException('Nhà cung cấp không tồn tại');
    }

    const warehouse = await this.warehouseRepo.findOne({ where: { id: dto.warehouse_id } });
    if (!warehouse) {
      throw new NotFoundException('Kho hàng không tồn tại');
    }

    let code = dto.code ? dto.code.trim().toUpperCase() : '';
    if (code) {
      const existing = await this.orderRepo.findOne({ where: { code } });
      if (existing) {
        throw new ConflictException(`Mã đơn đặt hàng "${code}" đã tồn tại`);
      }
    } else {
      let attempts = 0;
      while (attempts < 5) {
        const candidate = generateReferenceCode('PO');
        const exists = await this.orderRepo.findOne({ where: { code: candidate } });
        if (!exists) {
          code = candidate;
          break;
        }
        attempts++;
      }
      if (!code) {
        code = `PO-${Date.now()}`;
      }
    }

    return this.dataSource.transaction(async (manager) => {
      let totalAmount = 0;
      const preparedItems: PurchaseOrderItemEntity[] = [];

      for (const itemDto of dto.items) {
        const product = await manager.findOne(ProductEntity, {
          where: { id: itemDto.product_id },
        });
        if (!product) {
          throw new NotFoundException(`Sản phẩm với ID "${itemDto.product_id}" không tồn tại`);
        }

        const unitPrice =
          itemDto.unit_price !== undefined ? itemDto.unit_price : product.cost_price;
        const lineTotal = itemDto.quantity * unitPrice;
        totalAmount += lineTotal;

        const orderItem = manager.create(PurchaseOrderItemEntity, {
          product_id: itemDto.product_id,
          quantity: itemDto.quantity,
          unit_price: unitPrice,
          total_price: lineTotal,
          note: itemDto.note?.trim() || null,
        });
        preparedItems.push(orderItem);
      }

      const order = manager.create(PurchaseOrderEntity, {
        code,
        supplier_id: dto.supplier_id,
        warehouse_id: dto.warehouse_id,
        status: PurchaseOrderStatus.DRAFT,
        created_by_user_id: userId,
        expected_delivery_date: dto.expected_delivery_date
          ? new Date(dto.expected_delivery_date)
          : null,
        total_amount: totalAmount,
        note: dto.note?.trim() || null,
        items: preparedItems,
      });

      return await manager.save(PurchaseOrderEntity, order);
    });
  }

  async findAll(query: FilterPurchaseOrderDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;

    const qb = this.orderRepo
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.supplier', 'supplier')
      .leftJoinAndSelect('po.warehouse', 'warehouse')
      .leftJoinAndSelect('po.creator', 'creator')
      .leftJoinAndSelect('po.approver', 'approver')
      .leftJoinAndSelect('po.items', 'items')
      .leftJoinAndSelect('items.product', 'product');

    if (query.status) {
      qb.andWhere('po.status = :status', { status: query.status });
    }

    if (query.supplier_id) {
      qb.andWhere('po.supplier_id = :supplierId', { supplierId: query.supplier_id });
    }

    if (query.warehouse_id) {
      qb.andWhere('po.warehouse_id = :warehouseId', { warehouseId: query.warehouse_id });
    }

    if (query.from_date) {
      qb.andWhere('po.created_at >= :fromDate', { fromDate: new Date(query.from_date) });
    }

    if (query.to_date) {
      const toDate = new Date(query.to_date);
      toDate.setHours(23, 59, 59, 999);
      qb.andWhere('po.created_at <= :toDate', { toDate });
    }

    if (query.search) {
      qb.andWhere(
        '(po.code ILIKE :search OR po.note ILIKE :search OR supplier.name ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('po.created_at', 'DESC')
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

  async findOne(id: string): Promise<PurchaseOrderEntity> {
    const order = await this.orderRepo
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.supplier', 'supplier')
      .leftJoinAndSelect('po.warehouse', 'warehouse')
      .leftJoinAndSelect('po.creator', 'creator')
      .leftJoinAndSelect('po.approver', 'approver')
      .leftJoinAndSelect('po.import_transaction', 'import_transaction')
      .leftJoinAndSelect('po.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('product.unit', 'unit')
      .leftJoinAndSelect('product.category', 'category')
      .where('po.id = :id', { id })
      .getOne();

    if (!order) {
      throw new NotFoundException(`Đơn đặt hàng với ID "${id}" không tồn tại`);
    }

    return order;
  }

  async update(id: string, dto: UpdatePurchaseOrderDto): Promise<PurchaseOrderEntity> {
    const order = await this.findOne(id);

    if (
      order.status !== PurchaseOrderStatus.DRAFT &&
      order.status !== PurchaseOrderStatus.PENDING_APPROVAL
    ) {
      throw new BadRequestException(
        `Không thể sửa đơn đặt hàng ở trạng thái "${order.status}". Chỉ cho phép sửa khi là Bản nháp hoặc Chờ duyệt.`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      if (dto.supplier_id && dto.supplier_id !== order.supplier_id) {
        const sup = await manager.findOne(SupplierEntity, { where: { id: dto.supplier_id } });
        if (!sup) throw new NotFoundException('Nhà cung cấp không tồn tại');
        order.supplier_id = dto.supplier_id;
      }

      if (dto.warehouse_id && dto.warehouse_id !== order.warehouse_id) {
        const wh = await manager.findOne(WarehouseEntity, { where: { id: dto.warehouse_id } });
        if (!wh) throw new NotFoundException('Kho hàng không tồn tại');
        order.warehouse_id = dto.warehouse_id;
      }

      if (dto.code && dto.code.trim().toUpperCase() !== order.code) {
        const newCode = dto.code.trim().toUpperCase();
        const existing = await manager.findOne(PurchaseOrderEntity, { where: { code: newCode } });
        if (existing && existing.id !== id) {
          throw new ConflictException(`Mã đơn đặt hàng "${newCode}" đã tồn tại`);
        }
        order.code = newCode;
      }

      if (dto.expected_delivery_date !== undefined) {
        order.expected_delivery_date = dto.expected_delivery_date
          ? new Date(dto.expected_delivery_date)
          : null;
      }

      if (dto.note !== undefined) {
        order.note = dto.note ? dto.note.trim() : null;
      }

      if (dto.items && dto.items.length > 0) {
        // Xóa các dòng item cũ
        await manager.delete(PurchaseOrderItemEntity, { purchase_order_id: id });

        let totalAmount = 0;
        const newItems: PurchaseOrderItemEntity[] = [];

        for (const itemDto of dto.items) {
          const product = await manager.findOne(ProductEntity, {
            where: { id: itemDto.product_id },
          });
          if (!product) {
            throw new NotFoundException(`Sản phẩm với ID "${itemDto.product_id}" không tồn tại`);
          }

          const unitPrice =
            itemDto.unit_price !== undefined ? itemDto.unit_price : product.cost_price;
          const lineTotal = itemDto.quantity * unitPrice;
          totalAmount += lineTotal;

          const orderItem = manager.create(PurchaseOrderItemEntity, {
            purchase_order_id: id,
            product_id: itemDto.product_id,
            quantity: itemDto.quantity,
            unit_price: unitPrice,
            total_price: lineTotal,
            note: itemDto.note?.trim() || null,
          });
          newItems.push(orderItem);
        }

        await manager.save(PurchaseOrderItemEntity, newItems);
        order.total_amount = totalAmount;
      }

      await manager.save(PurchaseOrderEntity, order);
      return this.findOne(id);
    });
  }

  async submitForApproval(id: string): Promise<PurchaseOrderEntity> {
    const order = await this.findOne(id);

    if (order.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException('Chỉ có thể gửi phê duyệt các đơn hàng ở trạng thái Bản nháp (DRAFT)');
    }

    order.status = PurchaseOrderStatus.PENDING_APPROVAL;
    const saved = await this.orderRepo.save(order);

    // Bắn thông báo cho cấp quản lý
    this.notificationsService.create({
      title: `Đơn đặt hàng chờ duyệt: ${order.code}`,
      message: `${order.creator?.display_name || 'Nhân viên'} vừa gửi đơn đặt hàng "${order.code}" (Trị giá: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount)}) chờ phê duyệt.`,
      type: undefined,
      severity: undefined,
      reference_id: order.id,
      reference_type: 'PURCHASE_ORDER',
    });

    return saved;
  }

  async approve(id: string, userId: string): Promise<PurchaseOrderEntity> {
    const order = await this.findOne(id);

    if (order.status !== PurchaseOrderStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Chỉ có thể phê duyệt các đơn hàng đang ở trạng thái Chờ duyệt (PENDING_APPROVAL)');
    }

    order.status = PurchaseOrderStatus.APPROVED;
    order.approved_by_user_id = userId;
    order.approved_at = new Date();
    const saved = await this.orderRepo.save(order);

    // Bắn thông báo realtime cho người tạo đơn
    this.notificationsService.create({
      user_id: order.created_by_user_id,
      title: `Đơn đặt hàng đã được duyệt: ${order.code}`,
      message: `Đơn đặt hàng "${order.code}" của bạn đã được phê duyệt thành công. Sẵn sàng gửi NCC!`,
      reference_id: order.id,
      reference_type: 'PURCHASE_ORDER',
    });

    return saved;
  }

  async markAsOrdered(id: string): Promise<PurchaseOrderEntity> {
    const order = await this.findOne(id);

    if (order.status !== PurchaseOrderStatus.APPROVED) {
      throw new BadRequestException('Chỉ có thể chuyển sang trạng thái Đã đặt hàng (ORDERED) khi đơn đã được Phê duyệt');
    }

    order.status = PurchaseOrderStatus.ORDERED;
    return await this.orderRepo.save(order);
  }

  async receive(id: string, dto: ReceivePurchaseOrderDto, userId: string): Promise<PurchaseOrderEntity> {
    const order = await this.findOne(id);

    if (
      order.status !== PurchaseOrderStatus.ORDERED &&
      order.status !== PurchaseOrderStatus.APPROVED
    ) {
      throw new BadRequestException(
        `Không thể nhận hàng với đơn ở trạng thái "${order.status}". Đơn hàng phải ở trạng thái ĐÃ DUYỆT hoặc ĐÃ ĐẶT HÀNG.`,
      );
    }

    // Tự động tạo phiếu nhập kho (IMPORT)
    const importTx = await this.stockTransactionsService.importStock(
      {
        warehouse_id: order.warehouse_id,
        supplier_id: order.supplier_id,
        reference_no: undefined, // Tự động sinh mã IMP-YYYYMMDD-XXXX
        note: dto.note || `Nhập kho tự động theo đơn đặt hàng ${order.code}`,
        items: order.items.map((i) => ({
          product_id: i.product_id,
          location_id: dto.location_id || undefined,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
      },
      userId,
    );

    // Cập nhật trạng thái đơn đặt hàng thành RECEIVED
    order.status = PurchaseOrderStatus.RECEIVED;
    order.import_transaction_id = importTx.id;
    await this.orderRepo.save(order);

    // Bắn thông báo realtime
    this.notificationsService.create({
      title: `Đã nhập kho đơn hàng: ${order.code}`,
      message: `Đơn đặt hàng "${order.code}" từ NCC "${order.supplier?.name}" đã hoàn tất nhận hàng và cộng tồn kho qua phiếu "${importTx.reference_no}".`,
      reference_id: order.id,
      reference_type: 'PURCHASE_ORDER',
    });

    return this.findOne(id);
  }

  async cancel(id: string, reason?: string): Promise<PurchaseOrderEntity> {
    const order = await this.findOne(id);

    if (order.status === PurchaseOrderStatus.RECEIVED) {
      throw new BadRequestException('Không thể hủy đơn hàng đã Nhận hàng và Nhập kho');
    }

    if (order.status === PurchaseOrderStatus.CANCELLED) {
      throw new BadRequestException('Đơn đặt hàng này đã bị hủy trước đó');
    }

    order.status = PurchaseOrderStatus.CANCELLED;
    if (reason) {
      order.note = order.note ? `${order.note} | Lý do hủy: ${reason}` : `Lý do hủy: ${reason}`;
    }

    return await this.orderRepo.save(order);
  }

  async delete(id: string): Promise<void> {
    const order = await this.findOne(id);

    if (
      order.status !== PurchaseOrderStatus.DRAFT &&
      order.status !== PurchaseOrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Chỉ có thể xóa đơn hàng ở trạng thái Bản nháp (DRAFT) hoặc Đã hủy (CANCELLED). Hiện tại là "${order.status}".`,
      );
    }

    await this.orderRepo.remove(order);
  }
}
