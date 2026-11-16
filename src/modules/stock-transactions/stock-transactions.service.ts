import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { StockTransactionEntity } from './entities/stock-transaction.entity';
import { StockTransactionItemEntity } from './entities/stock-transaction-item.entity';
import { StockTransactionType } from './enums/stock-transaction-type.enum';
import { SupplierEntity } from '../suppliers/entities/supplier.entity';
import { CustomerEntity } from '../customers/entities/customer.entity';
import { ImportStockDto } from './dto/import-stock.dto';
import { ExportStockDto } from './dto/export-stock.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { FilterStockTransactionDto } from './dto/filter-stock-transaction.dto';
import { NotificationsService } from '../notifications/notifications.service';
import {
  resolveReferenceNo,
  getWarehouseOrThrow,
  getProductOrThrow,
  validateLocation,
  changeStock,
  setStock,
} from './utils/stock-transaction.util';

@Injectable()
export class StockTransactionsService {
  constructor(
    @InjectRepository(StockTransactionEntity)
    private readonly transactionRepo: Repository<StockTransactionEntity>,
    @InjectRepository(StockTransactionItemEntity)
    private readonly itemRepo: Repository<StockTransactionItemEntity>,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
  ) {}

  async importStock(dto: ImportStockDto, userId: string) {
    return this.dataSource.transaction(async (manager) => {
      const warehouse = await getWarehouseOrThrow(dto.warehouse_id, manager);

      if (dto.supplier_id) {
        const supplier = await manager.findOne(SupplierEntity, {
          where: { id: dto.supplier_id },
        });
        if (!supplier) {
          throw new NotFoundException('Nhà cung cấp không tồn tại');
        }
      }

      const referenceNo = await resolveReferenceNo('IMP', dto.reference_no, manager);

      const transaction = manager.create(StockTransactionEntity, {
        type: StockTransactionType.IMPORT,
        reference_no: referenceNo,
        warehouse_id: dto.warehouse_id,
        supplier_id: dto.supplier_id || null,
        created_by_user_id: userId,
        note: dto.note || null,
      });
      const savedTx = await manager.save(StockTransactionEntity, transaction);

      for (const item of dto.items) {
        const product = await getProductOrThrow(item.product_id, manager);
        await validateLocation(item.location_id, dto.warehouse_id, warehouse.name, manager);

        const unitPrice =
          item.unit_price !== undefined ? item.unit_price : product.cost_price;
        const totalPrice = item.quantity * unitPrice;

        const txItem = manager.create(StockTransactionItemEntity, {
          transaction_id: savedTx.id,
          product_id: item.product_id,
          location_id: item.location_id || null,
          quantity: item.quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
        });
        await manager.save(StockTransactionItemEntity, txItem);

        await changeStock(
          dto.warehouse_id,
          item.location_id,
          item.product_id,
          item.quantity,
          product.name,
          manager,
        );
      }

      const txResult = await this.findOne(savedTx.id, manager);

      // Async notification trigger
      this.notificationsService.notifyStockTransaction({
        transactionId: txResult.id,
        referenceNo: txResult.reference_no,
        type: txResult.type,
        warehouseName: warehouse.name,
        creatorName: txResult.creator?.display_name || txResult.creator?.username || 'Nhân viên',
        itemsCount: dto.items.length,
      });

      return txResult;
    });
  }

  async exportStock(dto: ExportStockDto, userId: string) {
    return this.dataSource.transaction(async (manager) => {
      const warehouse = await getWarehouseOrThrow(dto.warehouse_id, manager);

      if (dto.customer_id) {
        const customer = await manager.findOne(CustomerEntity, {
          where: { id: dto.customer_id },
        });
        if (!customer) {
          throw new NotFoundException('Khách hàng không tồn tại');
        }
      }

      const referenceNo = await resolveReferenceNo('EXP', dto.reference_no, manager);

      const transaction = manager.create(StockTransactionEntity, {
        type: StockTransactionType.EXPORT,
        reference_no: referenceNo,
        warehouse_id: dto.warehouse_id,
        customer_id: dto.customer_id || null,
        created_by_user_id: userId,
        note: dto.note || null,
      });
      const savedTx = await manager.save(StockTransactionEntity, transaction);

      for (const item of dto.items) {
        const product = await getProductOrThrow(item.product_id, manager);
        await validateLocation(item.location_id, dto.warehouse_id, warehouse.name, manager);

        const { newQty } = await changeStock(
          dto.warehouse_id,
          item.location_id,
          item.product_id,
          -item.quantity,
          product.name,
          manager,
        );

        if (newQty <= product.low_stock_threshold) {
          this.notificationsService.notifyLowStock({
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            warehouseName: warehouse.name,
            currentQuantity: newQty,
            threshold: product.low_stock_threshold,
          });
        }

        const unitPrice =
          item.unit_price !== undefined ? item.unit_price : product.selling_price;
        const totalPrice = item.quantity * unitPrice;

        const txItem = manager.create(StockTransactionItemEntity, {
          transaction_id: savedTx.id,
          product_id: item.product_id,
          location_id: item.location_id || null,
          quantity: item.quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
        });
        await manager.save(StockTransactionItemEntity, txItem);
      }

      const txResult = await this.findOne(savedTx.id, manager);

      // Async notification trigger
      this.notificationsService.notifyStockTransaction({
        transactionId: txResult.id,
        referenceNo: txResult.reference_no,
        type: txResult.type,
        warehouseName: warehouse.name,
        creatorName: txResult.creator?.display_name || txResult.creator?.username || 'Nhân viên',
        itemsCount: dto.items.length,
      });

      return txResult;
    });
  }

  async transferStock(dto: TransferStockDto, userId: string) {
    if (dto.warehouse_id === dto.target_warehouse_id) {
      throw new BadRequestException('Kho xuất và kho nhập không được trùng nhau');
    }

    return this.dataSource.transaction(async (manager) => {
      const sourceWarehouse = await getWarehouseOrThrow(
        dto.warehouse_id,
        manager,
        'Kho xuất hàng',
      );
      const targetWarehouse = await getWarehouseOrThrow(
        dto.target_warehouse_id,
        manager,
        'Kho nhập hàng',
      );
      const referenceNo = await resolveReferenceNo('TRF', dto.reference_no, manager);

      const transaction = manager.create(StockTransactionEntity, {
        type: StockTransactionType.TRANSFER,
        reference_no: referenceNo,
        warehouse_id: dto.warehouse_id,
        target_warehouse_id: dto.target_warehouse_id,
        created_by_user_id: userId,
        note: dto.note || null,
      });
      const savedTx = await manager.save(StockTransactionEntity, transaction);

      for (const item of dto.items) {
        const product = await getProductOrThrow(item.product_id, manager);
        await validateLocation(
          item.location_id,
          dto.warehouse_id,
          sourceWarehouse.name,
          manager,
          'Vị trí xuất',
        );
        await validateLocation(
          item.target_location_id,
          dto.target_warehouse_id,
          targetWarehouse.name,
          manager,
          'Vị trí nhập',
        );

        const { newQty } = await changeStock(
          dto.warehouse_id,
          item.location_id,
          item.product_id,
          -item.quantity,
          product.name,
          manager,
        );

        if (newQty <= product.low_stock_threshold) {
          this.notificationsService.notifyLowStock({
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            warehouseName: sourceWarehouse.name,
            currentQuantity: newQty,
            threshold: product.low_stock_threshold,
          });
        }

        await changeStock(
          dto.target_warehouse_id,
          item.target_location_id,
          item.product_id,
          item.quantity,
          product.name,
          manager,
        );

        const unitPrice = product.cost_price;
        const totalPrice = item.quantity * unitPrice;

        const txItem = manager.create(StockTransactionItemEntity, {
          transaction_id: savedTx.id,
          product_id: item.product_id,
          location_id: item.location_id || null,
          target_location_id: item.target_location_id || null,
          quantity: item.quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
        });
        await manager.save(StockTransactionItemEntity, txItem);
      }

      const txResult = await this.findOne(savedTx.id, manager);

      // Async notification trigger
      this.notificationsService.notifyStockTransaction({
        transactionId: txResult.id,
        referenceNo: txResult.reference_no,
        type: txResult.type,
        warehouseName: `${sourceWarehouse.name} ➔ ${targetWarehouse.name}`,
        creatorName: txResult.creator?.display_name || txResult.creator?.username || 'Nhân viên',
        itemsCount: dto.items.length,
      });

      return txResult;
    });
  }

  async adjustStock(dto: AdjustStockDto, userId: string) {
    return this.dataSource.transaction(async (manager) => {
      const warehouse = await getWarehouseOrThrow(dto.warehouse_id, manager);
      const referenceNo = await resolveReferenceNo('ADJ', dto.reference_no, manager);

      const transaction = manager.create(StockTransactionEntity, {
        type: StockTransactionType.ADJUSTMENT,
        reference_no: referenceNo,
        warehouse_id: dto.warehouse_id,
        created_by_user_id: userId,
        note: dto.note || null,
      });
      const savedTx = await manager.save(StockTransactionEntity, transaction);

      for (const item of dto.items) {
        const product = await getProductOrThrow(item.product_id, manager);
        await validateLocation(item.location_id, dto.warehouse_id, warehouse.name, manager);

        const { diffQuantity } = await setStock(
          dto.warehouse_id,
          item.location_id,
          item.product_id,
          item.counted_quantity,
          manager,
        );

        if (item.counted_quantity <= product.low_stock_threshold) {
          this.notificationsService.notifyLowStock({
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            warehouseName: warehouse.name,
            currentQuantity: item.counted_quantity,
            threshold: product.low_stock_threshold,
          });
        }

        const unitPrice = product.cost_price;
        const totalPrice = Math.abs(diffQuantity) * unitPrice;

        const txItem = manager.create(StockTransactionItemEntity, {
          transaction_id: savedTx.id,
          product_id: item.product_id,
          location_id: item.location_id || null,
          quantity: diffQuantity,
          counted_quantity: item.counted_quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
        });
        await manager.save(StockTransactionItemEntity, txItem);
      }

      const txResult = await this.findOne(savedTx.id, manager);

      // Async notification trigger
      this.notificationsService.notifyStockTransaction({
        transactionId: txResult.id,
        referenceNo: txResult.reference_no,
        type: txResult.type,
        warehouseName: warehouse.name,
        creatorName: txResult.creator?.display_name || txResult.creator?.username || 'Nhân viên',
        itemsCount: dto.items.length,
      });

      return txResult;
    });
  }

  async findAll(query: FilterStockTransactionDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;

    const qb = this.transactionRepo
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.warehouse', 'warehouse')
      .leftJoinAndSelect('tx.target_warehouse', 'target_warehouse')
      .leftJoinAndSelect('tx.supplier', 'supplier')
      .leftJoinAndSelect('tx.customer', 'customer')
      .leftJoinAndSelect('tx.creator', 'creator')
      .leftJoinAndSelect('tx.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('items.location', 'location')
      .leftJoinAndSelect('items.target_location', 'target_location');

    if (query.type) {
      qb.andWhere('tx.type = :type', { type: query.type });
    }

    if (query.warehouse_id) {
      qb.andWhere(
        '(tx.warehouse_id = :warehouseId OR tx.target_warehouse_id = :warehouseId)',
        { warehouseId: query.warehouse_id },
      );
    }

    if (query.from_date) {
      qb.andWhere('tx.created_at >= :fromDate', {
        fromDate: new Date(query.from_date),
      });
    }

    if (query.to_date) {
      const toDate = new Date(query.to_date);
      toDate.setHours(23, 59, 59, 999);
      qb.andWhere('tx.created_at <= :toDate', { toDate });
    }

    if (query.search) {
      qb.andWhere(
        '(tx.reference_no ILIKE :search OR tx.note ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('tx.created_at', 'DESC')
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

  async findOne(id: string, customManager?: EntityManager) {
    const repo = customManager
      ? customManager.getRepository(StockTransactionEntity)
      : this.transactionRepo;

    const transaction = await repo
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.warehouse', 'warehouse')
      .leftJoinAndSelect('tx.target_warehouse', 'target_warehouse')
      .leftJoinAndSelect('tx.supplier', 'supplier')
      .leftJoinAndSelect('tx.customer', 'customer')
      .leftJoinAndSelect('tx.creator', 'creator')
      .leftJoinAndSelect('tx.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('product.unit', 'unit')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('items.location', 'location')
      .leftJoinAndSelect('items.target_location', 'target_location')
      .where('tx.id = :id', { id })
      .getOne();

    if (!transaction) {
      throw new NotFoundException('Phiếu giao dịch kho không tồn tại');
    }

    return transaction;
  }
}
