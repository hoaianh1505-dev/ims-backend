import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../products/entities/product.entity';
import { WarehouseEntity } from '../warehouses/entities/warehouse.entity';
import { InventoryEntity } from '../inventory/entities/inventory.entity';
import { StockTransactionEntity } from '../stock-transactions/entities/stock-transaction.entity';
import { StockTransactionType } from '../stock-transactions/enums/stock-transaction-type.enum';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class AssistantToolsService {
  private readonly logger = new Logger(AssistantToolsService.name);

  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    @InjectRepository(WarehouseEntity)
    private readonly warehouseRepo: Repository<WarehouseEntity>,
    @InjectRepository(InventoryEntity)
    private readonly inventoryRepo: Repository<InventoryEntity>,
    @InjectRepository(StockTransactionEntity)
    private readonly stockTransactionRepo: Repository<StockTransactionEntity>,
  ) {}

  async searchProducts(args: { query: string }, user?: any) {
    try {
      const q = `%${args.query.trim()}%`;
      const products = await this.productRepo
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.category', 'c')
        .leftJoinAndSelect('p.unit', 'u')
        .where('p.deleted_at IS NULL')
        .andWhere(
          '(p.name ILIKE :q OR p.sku ILIKE :q OR p.barcode ILIKE :q)',
          { q },
        )
        .take(5)
        .getMany();

      const isStaff = user?.role === UserRole.STAFF;

      return products.map((p) => {
        const item: Record<string, any> = {
          id: p.id,
          name: p.name,
          sku: p.sku,
          barcode: p.barcode,
          selling_price: Number(p.selling_price),
          low_stock_threshold: p.low_stock_threshold,
          category: p.category?.name || 'Chưa phân loại',
          unit: p.unit?.name || '',
        };

        // Chỉ hiển thị giá vốn cho Quản trị viên và Quản lý kho
        if (!isStaff) {
          item.cost_price = Number(p.cost_price);
        }

        return item;
      });
    } catch (error) {
      this.logger.error('Lỗi khi tìm sản phẩm cho AI:', error);
      return { error: 'Không thể tìm kiếm sản phẩm' };
    }
  }

  async getProductInventory(args: { product_name_or_sku: string }, user?: any) {
    try {
      const q = `%${args.product_name_or_sku.trim()}%`;
      const product = await this.productRepo
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.unit', 'u')
        .where('p.deleted_at IS NULL')
        .andWhere('(p.sku ILIKE :q OR p.name ILIKE :q)', { q })
        .getOne();

      if (!product) {
        return {
          message: `Không tìm thấy sản phẩm khớp với từ khóa "${args.product_name_or_sku}".`,
        };
      }

      const invList = await this.inventoryRepo
        .createQueryBuilder('inv')
        .innerJoinAndSelect('inv.warehouse', 'w')
        .leftJoinAndSelect('inv.location', 'loc')
        .where('inv.product_id = :pId', { pId: product.id })
        .getMany();

      const totalQuantity = invList.reduce((sum, item) => sum + item.quantity, 0);

      const userWarehouseId = user?.warehouse_id;

      const byWarehouse = invList.map((item) => ({
        warehouse_id: item.warehouse.id,
        warehouse_name: item.warehouse.name,
        warehouse_code: item.warehouse.code,
        location_code: item.location?.code || 'Chưa xếp vị trí',
        quantity: item.quantity,
        is_user_assigned_warehouse: userWarehouseId === item.warehouse.id,
      }));

      const isStaff = user?.role === UserRole.STAFF;

      const productInfo: Record<string, any> = {
        id: product.id,
        sku: product.sku,
        name: product.name,
        unit: product.unit?.name || '',
        selling_price: Number(product.selling_price),
        low_stock_threshold: product.low_stock_threshold,
      };

      if (!isStaff) {
        productInfo.cost_price = Number(product.cost_price);
      }

      return {
        product: productInfo,
        total_quantity: totalQuantity,
        is_low_stock: totalQuantity <= product.low_stock_threshold,
        warehouses: byWarehouse,
      };
    } catch (error) {
      this.logger.error('Lỗi khi tra cứu tồn kho cho AI:', error);
      return { error: 'Không thể tra cứu tồn kho' };
    }
  }

  async getLowStockProducts(args: { limit?: number }) {
    try {
      const limit = args.limit ? Math.min(args.limit, 20) : 10;

      const qb = this.productRepo
        .createQueryBuilder('p')
        .leftJoin('p.category', 'c')
        .leftJoin('p.unit', 'u')
        .leftJoin(InventoryEntity, 'inv', 'inv.product_id = p.id')
        .where('p.deleted_at IS NULL')
        .groupBy('p.id')
        .addGroupBy('p.sku')
        .addGroupBy('p.name')
        .addGroupBy('p.low_stock_threshold')
        .addGroupBy('c.name')
        .addGroupBy('u.name')
        .select('p.id', 'id')
        .addSelect('p.sku', 'sku')
        .addSelect('p.name', 'name')
        .addSelect('c.name', 'category')
        .addSelect('u.name', 'unit')
        .addSelect('p.low_stock_threshold', 'threshold')
        .addSelect('COALESCE(SUM(inv.quantity), 0)', 'current_stock')
        .having('COALESCE(SUM(inv.quantity), 0) <= p.low_stock_threshold')
        .orderBy('current_stock', 'ASC')
        .limit(limit);

      const raw = await qb.getRawMany();

      return raw.map((item) => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        category: item.category || 'Chưa phân loại',
        unit: item.unit || '',
        current_stock: Number(item.current_stock),
        low_stock_threshold: Number(item.threshold),
        status: Number(item.current_stock) <= 0 ? 'Hết hàng' : 'Sắp hết hàng',
      }));
    } catch (error) {
      this.logger.error('Lỗi khi lấy cảnh báo tồn kho cho AI:', error);
      return { error: 'Không thể lấy danh sách cảnh báo tồn kho' };
    }
  }

  async getWarehouseList() {
    try {
      const warehouses = await this.warehouseRepo.find({
        where: { is_active: true },
        select: {
          id: true,
          code: true,
          name: true,
          address: true,
        },
      });

      return warehouses;
    } catch (error) {
      this.logger.error('Lỗi khi lấy danh sách kho cho AI:', error);
      return { error: 'Không thể lấy danh sách kho hàng' };
    }
  }

  async getRecentStockTransactions(args: {
    limit?: number;
    type?: StockTransactionType;
  }) {
    try {
      const limit = args.limit ? Math.min(args.limit, 10) : 5;
      const qb = this.stockTransactionRepo
        .createQueryBuilder('tx')
        .leftJoinAndSelect('tx.warehouse', 'w')
        .leftJoinAndSelect('tx.target_warehouse', 'tw')
        .leftJoinAndSelect('tx.creator', 'u')
        .orderBy('tx.created_at', 'DESC')
        .take(limit);

      if (args.type) {
        qb.andWhere('tx.type = :type', { type: args.type });
      }

      const transactions = await qb.getMany();

      return transactions.map((t) => ({
        reference_no: t.reference_no,
        type: t.type,
        created_at: t.created_at,
        warehouse: t.warehouse?.name,
        target_warehouse: t.target_warehouse?.name || null,
        creator: t.creator?.display_name || t.creator?.username,
        note: t.note,
      }));
    } catch (error) {
      this.logger.error('Lỗi khi lấy giao dịch kho cho AI:', error);
      return { error: 'Không thể lấy giao dịch kho gần đây' };
    }
  }

  async executeTool(name: string, args: Record<string, any>, user?: any) {
    switch (name) {
      case 'search_products':
        return await this.searchProducts(args as { query: string }, user);
      case 'get_product_inventory':
        return await this.getProductInventory(
          args as { product_name_or_sku: string },
          user,
        );
      case 'get_low_stock_products':
        return await this.getLowStockProducts(args as { limit?: number });
      case 'get_warehouse_list':
        return await this.getWarehouseList();
      case 'get_recent_stock_transactions':
        return await this.getRecentStockTransactions(
          args as { limit?: number; type?: StockTransactionType },
        );
      default:
        return { error: `Công cụ ${name} không tồn tại` };
    }
  }
}
