import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryEntity } from './entities/inventory.entity';
import { ProductEntity } from '../products/entities/product.entity';
import { WarehouseEntity } from '../warehouses/entities/warehouse.entity';
import { FilterInventoryDto } from './dto/filter-inventory.dto';
import { FilterLowStockDto } from './dto/filter-low-stock.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryEntity)
    private readonly inventoryRepository: Repository<InventoryEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(WarehouseEntity)
    private readonly warehouseRepository: Repository<WarehouseEntity>,
  ) {}

  async findAll(query: FilterInventoryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const qb = this.inventoryRepository
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.warehouse', 'warehouse')
      .leftJoinAndSelect('inv.location', 'location')
      .leftJoinAndSelect('inv.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.unit', 'unit')
      .leftJoinAndSelect('product.images', 'images');

    if (query.warehouse_id) {
      qb.andWhere('inv.warehouse_id = :warehouseId', { warehouseId: query.warehouse_id });
    }

    if (query.location_id) {
      qb.andWhere('inv.location_id = :locationId', { locationId: query.location_id });
    }

    if (query.product_id) {
      qb.andWhere('inv.product_id = :productId', { productId: query.product_id });
    }

    if (query.search) {
      qb.andWhere(
        '(product.name ILIKE :search OR product.sku ILIKE :search OR product.barcode ILIKE :search OR warehouse.name ILIKE :search OR warehouse.code ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('inv.updated_at', 'DESC')
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

  async getLowStock(query: FilterLowStockDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.category', 'category')
      .leftJoin('product.unit', 'unit')
      .leftJoin(
        InventoryEntity,
        'inv',
        query.warehouse_id
          ? 'inv.product_id = product.id AND inv.warehouse_id = :warehouseId'
          : 'inv.product_id = product.id',
        query.warehouse_id ? { warehouseId: query.warehouse_id } : {},
      )
      .where('product.deleted_at IS NULL');

    if (query.category_id) {
      qb.andWhere('product.category_id = :categoryId', { categoryId: query.category_id });
    }

    if (query.search) {
      qb.andWhere('(product.name ILIKE :search OR product.sku ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    qb.groupBy('product.id')
      .addGroupBy('category.id')
      .addGroupBy('unit.id')
      .having('COALESCE(SUM(inv.quantity), 0) <= product.low_stock_threshold')
      .select([
        'product.id AS id',
        'product.name AS name',
        'product.sku AS sku',
        'product.barcode AS barcode',
        'product.cost_price AS cost_price',
        'product.selling_price AS selling_price',
        'product.low_stock_threshold AS low_stock_threshold',
        'category.id AS category_id',
        'category.name AS category_name',
        'unit.id AS unit_id',
        'unit.name AS unit_name',
        'COALESCE(SUM(inv.quantity), 0)::int AS current_stock',
      ])
      .orderBy('current_stock', 'ASC');

    const allLowStock = await qb.getRawMany();
    const total = allLowStock.length;
    const pagedItems = allLowStock.slice((page - 1) * limit, page * limit);

    return {
      data: pagedItems,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getByProduct(productId: string) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: {
        category: true,
        unit: true,
        images: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    const inventoryRecords = await this.inventoryRepository.find({
      where: { product_id: productId },
      relations: {
        warehouse: true,
        location: true,
      },
      order: { updated_at: 'DESC' },
    });

    const totalQuantity = inventoryRecords.reduce((sum, item) => sum + item.quantity, 0);

    const warehouseMap = new Map<string, {
      warehouse: { id: string; name: string; code: string };
      total_in_warehouse: number;
      locations: Array<{
        location: { id: string; name: string; code: string } | null;
        quantity: number;
        updated_at: Date;
      }>;
    }>();

    for (const record of inventoryRecords) {
      const warehouseId = record.warehouse.id;
      if (!warehouseMap.has(warehouseId)) {
        warehouseMap.set(warehouseId, {
          warehouse: {
            id: record.warehouse.id,
            name: record.warehouse.name,
            code: record.warehouse.code,
          },
          total_in_warehouse: 0,
          locations: [],
        });
      }

      const whGroup = warehouseMap.get(warehouseId)!;
      whGroup.total_in_warehouse += record.quantity;
      whGroup.locations.push({
        location: record.location
          ? {
              id: record.location.id,
              name: record.location.name,
              code: record.location.code,
            }
          : null,
        quantity: record.quantity,
        updated_at: record.updated_at,
      });
    }

    return {
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        low_stock_threshold: product.low_stock_threshold,
        category: product.category,
        unit: product.unit,
        images: product.images,
      },
      total_quantity: totalQuantity,
      warehouses: Array.from(warehouseMap.values()),
    };
  }

  async getByWarehouse(warehouseId: string) {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id: warehouseId },
    });

    if (!warehouse) {
      throw new NotFoundException('Kho hàng không tồn tại');
    }

    const inventoryRecords = await this.inventoryRepository.find({
      where: { warehouse_id: warehouseId },
      relations: {
        location: true,
        product: {
          category: true,
          unit: true,
        },
      },
      order: { updated_at: 'DESC' },
    });

    const totalQuantity = inventoryRecords.reduce((sum, item) => sum + item.quantity, 0);

    return {
      warehouse: {
        id: warehouse.id,
        name: warehouse.name,
        code: warehouse.code,
      },
      total_quantity: totalQuantity,
      items: inventoryRecords,
    };
  }
}
