import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProductEntity } from '../products/entities/product.entity';
import { WarehouseEntity } from '../warehouses/entities/warehouse.entity';
import { InventoryEntity } from '../inventory/entities/inventory.entity';
import { StockTransactionEntity } from '../stock-transactions/entities/stock-transaction.entity';
import { StockTransactionItemEntity } from '../stock-transactions/entities/stock-transaction-item.entity';
import { CategoryEntity } from '../categories/entities/category.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { DashboardQueryDto, DashboardPeriod } from './dto/dashboard-query.dto';
import { StockTransactionType } from '../stock-transactions/enums/stock-transaction-type.enum';

@Injectable()
export class DashboardService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    @InjectRepository(WarehouseEntity)
    private readonly warehouseRepo: Repository<WarehouseEntity>,
    @InjectRepository(InventoryEntity)
    private readonly inventoryRepo: Repository<InventoryEntity>,
    @InjectRepository(StockTransactionEntity)
    private readonly stockTransactionRepo: Repository<StockTransactionEntity>,
    @InjectRepository(StockTransactionItemEntity)
    private readonly stockTransactionItemRepo: Repository<StockTransactionItemEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepo: Repository<CategoryEntity>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private getStartDateFromPeriod(period?: DashboardPeriod): Date {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case '30d':
      default:
        startDate.setDate(now.getDate() - 30);
        break;
    }

    startDate.setHours(0, 0, 0, 0);
    return startDate;
  }

  async getStats(query: DashboardQueryDto) {
    const totalProducts = await this.productRepo.count({
      where: { deleted_at: undefined },
    });

    const totalWarehouses = await this.warehouseRepo.count({
      where: { is_active: true },
    });

    const inventoryQb = this.inventoryRepo
      .createQueryBuilder('inv')
      .innerJoin('inv.product', 'p')
      .where('p.deleted_at IS NULL');

    if (query.warehouse_id) {
      inventoryQb.andWhere('inv.warehouse_id = :wId', {
        wId: query.warehouse_id,
      });
    }

    const inventoryTotals = await inventoryQb
      .select('COALESCE(SUM(inv.quantity), 0)', 'total_quantity')
      .addSelect(
        'COALESCE(SUM(inv.quantity * p.cost_price), 0)',
        'total_value',
      )
      .getRawOne();

    const lowStockQb = this.productRepo
      .createQueryBuilder('p')
      .leftJoin(
        InventoryEntity,
        'inv',
        query.warehouse_id
          ? 'inv.product_id = p.id AND inv.warehouse_id = :wId'
          : 'inv.product_id = p.id',
        query.warehouse_id ? { wId: query.warehouse_id } : {},
      )
      .where('p.deleted_at IS NULL')
      .groupBy('p.id')
      .addGroupBy('p.low_stock_threshold')
      .select('p.id', 'id')
      .addSelect('p.low_stock_threshold', 'threshold')
      .addSelect('COALESCE(SUM(inv.quantity), 0)', 'current_stock');

    const productStocks = await lowStockQb.getRawMany();

    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const item of productStocks) {
      const stock = Number(item.current_stock);
      const threshold = Number(item.threshold);

      if (stock <= 0) {
        outOfStockCount++;
      } else if (stock <= threshold) {
        lowStockCount++;
      }
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const txTodayQb = this.stockTransactionRepo
      .createQueryBuilder('tx')
      .where('tx.created_at >= :todayStart', { todayStart });

    const txMonthQb = this.stockTransactionRepo
      .createQueryBuilder('tx')
      .where('tx.created_at >= :monthStart', { monthStart });

    if (query.warehouse_id) {
      const filter =
        '(tx.warehouse_id = :wId OR tx.target_warehouse_id = :wId)';
      txTodayQb.andWhere(filter, { wId: query.warehouse_id });
      txMonthQb.andWhere(filter, { wId: query.warehouse_id });
    }

    const [transactionsToday, transactionsThisMonth] = await Promise.all([
      txTodayQb.getCount(),
      txMonthQb.getCount(),
    ]);

    return {
      total_products: totalProducts,
      total_warehouses: totalWarehouses,
      total_inventory_quantity: Number(inventoryTotals?.total_quantity || 0),
      total_inventory_value: Number(inventoryTotals?.total_value || 0),
      low_stock_count: lowStockCount,
      out_of_stock_count: outOfStockCount,
      transactions_today: transactionsToday,
      transactions_this_month: transactionsThisMonth,
    };
  }

  async getStockMovement(query: DashboardQueryDto) {
    const startDate = this.getStartDateFromPeriod(query.period);

    const qb = this.stockTransactionRepo
      .createQueryBuilder('tx')
      .innerJoin('tx.items', 'item')
      .where('tx.created_at >= :startDate', { startDate });

    if (query.warehouse_id) {
      qb.andWhere(
        '(tx.warehouse_id = :wId OR tx.target_warehouse_id = :wId)',
        { wId: query.warehouse_id },
      );
    }

    qb.select("TO_CHAR(tx.created_at, 'YYYY-MM-DD')", 'date')
      .addSelect('tx.type', 'type')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'total_quantity')
      .groupBy("TO_CHAR(tx.created_at, 'YYYY-MM-DD')")
      .addGroupBy('tx.type')
      .orderBy('date', 'ASC');

    const rawResults = await qb.getRawMany();

    const dateMap = new Map<
      string,
      {
        date: string;
        import_qty: number;
        export_qty: number;
        transfer_qty: number;
        adjustment_qty: number;
      }
    >();

    const cursor = new Date(startDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    while (cursor <= today) {
      const key = cursor.toISOString().split('T')[0];
      dateMap.set(key, {
        date: key,
        import_qty: 0,
        export_qty: 0,
        transfer_qty: 0,
        adjustment_qty: 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    for (const row of rawResults) {
      const dateKey = row.date;
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          date: dateKey,
          import_qty: 0,
          export_qty: 0,
          transfer_qty: 0,
          adjustment_qty: 0,
        });
      }

      const entry = dateMap.get(dateKey)!;
      const qty = Number(row.total_quantity);

      switch (row.type) {
        case StockTransactionType.IMPORT:
          entry.import_qty += qty;
          break;
        case StockTransactionType.EXPORT:
          entry.export_qty += qty;
          break;
        case StockTransactionType.TRANSFER:
          entry.transfer_qty += qty;
          break;
        case StockTransactionType.ADJUSTMENT:
          entry.adjustment_qty += qty;
          break;
      }
    }

    return Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }

  async getInventoryByWarehouse() {
    const raw = await this.warehouseRepo
      .createQueryBuilder('w')
      .leftJoin(InventoryEntity, 'inv', 'inv.warehouse_id = w.id')
      .leftJoin(
        ProductEntity,
        'p',
        'p.id = inv.product_id AND p.deleted_at IS NULL',
      )
      .where('w.is_active = true')
      .groupBy('w.id')
      .addGroupBy('w.code')
      .addGroupBy('w.name')
      .select('w.id', 'warehouse_id')
      .addSelect('w.code', 'warehouse_code')
      .addSelect('w.name', 'warehouse_name')
      .addSelect('COALESCE(SUM(inv.quantity), 0)', 'total_quantity')
      .addSelect(
        'COALESCE(SUM(inv.quantity * p.cost_price), 0)',
        'total_value',
      )
      .addSelect(
        'COUNT(DISTINCT CASE WHEN inv.quantity > 0 THEN inv.product_id END)',
        'product_count',
      )
      .orderBy('total_quantity', 'DESC')
      .getRawMany();

    return raw.map((item) => ({
      warehouse_id: item.warehouse_id,
      warehouse_code: item.warehouse_code,
      warehouse_name: item.warehouse_name,
      total_quantity: Number(item.total_quantity),
      total_value: Number(item.total_value),
      product_count: Number(item.product_count),
    }));
  }

  async getInventoryByCategory() {
    const raw = await this.categoryRepo
      .createQueryBuilder('c')
      .leftJoin(ProductEntity, 'p', 'p.category_id = c.id AND p.deleted_at IS NULL')
      .leftJoin(InventoryEntity, 'inv', 'inv.product_id = p.id')
      .groupBy('c.id')
      .addGroupBy('c.name')
      .select('c.id', 'category_id')
      .addSelect('c.name', 'category_name')
      .addSelect('COUNT(DISTINCT p.id)', 'product_count')
      .addSelect('COALESCE(SUM(inv.quantity), 0)', 'total_quantity')
      .addSelect(
        'COALESCE(SUM(inv.quantity * p.cost_price), 0)',
        'total_value',
      )
      .orderBy('total_quantity', 'DESC')
      .getRawMany();

    const grandTotal = raw.reduce(
      (sum, item) => sum + Number(item.total_quantity),
      0,
    );

    return raw.map((item) => {
      const qty = Number(item.total_quantity);
      const percentage =
        grandTotal > 0 ? Math.round((qty / grandTotal) * 1000) / 10 : 0;

      return {
        category_id: item.category_id,
        category_name: item.category_name,
        product_count: Number(item.product_count),
        total_quantity: qty,
        total_value: Number(item.total_value),
        percentage,
      };
    });
  }

  async getTopProducts(query: DashboardQueryDto) {
    const limit = query.limit || 5;
    const startDate = this.getStartDateFromPeriod(query.period);

    const qb = this.stockTransactionRepo
      .createQueryBuilder('tx')
      .innerJoin('tx.items', 'item')
      .innerJoin('item.product', 'p')
      .leftJoin('p.category', 'c')
      .leftJoin('p.unit', 'u')
      .where('tx.type = :txType', { txType: StockTransactionType.EXPORT })
      .andWhere('tx.created_at >= :startDate', { startDate });

    if (query.warehouse_id) {
      qb.andWhere('tx.warehouse_id = :wId', { wId: query.warehouse_id });
    }

    qb.groupBy('p.id')
      .addGroupBy('p.sku')
      .addGroupBy('p.name')
      .addGroupBy('c.name')
      .addGroupBy('u.name')
      .select('p.id', 'product_id')
      .addSelect('p.sku', 'sku')
      .addSelect('p.name', 'name')
      .addSelect('c.name', 'category_name')
      .addSelect('u.name', 'unit_name')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'total_quantity')
      .addSelect('COALESCE(SUM(item.total_price), 0)', 'total_value')
      .orderBy('total_quantity', 'DESC')
      .limit(limit);

    const raw = await qb.getRawMany();

    return raw.map((item) => ({
      product_id: item.product_id,
      sku: item.sku,
      name: item.name,
      category_name: item.category_name || 'Chưa phân loại',
      unit_name: item.unit_name || '',
      total_quantity: Number(item.total_quantity),
      total_value: Number(item.total_value),
    }));
  }

  async getLowStockAlerts(query: DashboardQueryDto) {
    const limit = query.limit || 10;

    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoin('p.category', 'c')
      .leftJoin('p.unit', 'u')
      .leftJoin(
        InventoryEntity,
        'inv',
        query.warehouse_id
          ? 'inv.product_id = p.id AND inv.warehouse_id = :wId'
          : 'inv.product_id = p.id',
        query.warehouse_id ? { wId: query.warehouse_id } : {},
      )
      .where('p.deleted_at IS NULL')
      .groupBy('p.id')
      .addGroupBy('p.sku')
      .addGroupBy('p.name')
      .addGroupBy('p.low_stock_threshold')
      .addGroupBy('c.name')
      .addGroupBy('u.name')
      .select('p.id', 'product_id')
      .addSelect('p.sku', 'sku')
      .addSelect('p.name', 'name')
      .addSelect('c.name', 'category_name')
      .addSelect('u.name', 'unit_name')
      .addSelect('p.low_stock_threshold', 'low_stock_threshold')
      .addSelect('COALESCE(SUM(inv.quantity), 0)', 'current_stock')
      .having('COALESCE(SUM(inv.quantity), 0) <= p.low_stock_threshold')
      .orderBy('current_stock', 'ASC')
      .limit(limit);

    const raw = await qb.getRawMany();

    return raw.map((item) => {
      const currentStock = Number(item.current_stock);
      const threshold = Number(item.low_stock_threshold);

      return {
        product_id: item.product_id,
        sku: item.sku,
        name: item.name,
        category_name: item.category_name || 'Chưa phân loại',
        unit_name: item.unit_name || '',
        current_stock: currentStock,
        low_stock_threshold: threshold,
        status: currentStock <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
      };
    });
  }

  async getRecentTransactions(limit = 10) {
    return this.stockTransactionRepo.find({
      relations: {
        warehouse: true,
        target_warehouse: true,
        supplier: true,
        creator: true,
        items: true,
      },
      select: {
        id: true,
        reference_no: true,
        type: true,
        note: true,
        created_at: true,
        warehouse: {
          id: true,
          code: true,
          name: true,
        },
        target_warehouse: {
          id: true,
          code: true,
          name: true,
        },
        supplier: {
          id: true,
          name: true,
        },
        creator: {
          id: true,
          username: true,
          display_name: true,
        },
      },
      order: {
        created_at: 'DESC',
      },
      take: limit,
    });
  }

  async getRecentActivity(limit = 10) {
    return this.auditLogsService.getRecentActivity(limit);
  }
}
