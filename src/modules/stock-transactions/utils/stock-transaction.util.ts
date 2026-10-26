import { EntityManager, IsNull } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { StockTransactionEntity } from '../entities/stock-transaction.entity';
import { WarehouseEntity } from '../../warehouses/entities/warehouse.entity';
import { WarehouseLocationEntity } from '../../warehouses/entities/warehouse-location.entity';
import { ProductEntity } from '../../products/entities/product.entity';
import { InventoryEntity } from '../../inventory/entities/inventory.entity';
import { generateReferenceCode } from '../../../common/utils/code-generator.util';

export async function resolveReferenceNo(
  prefix: string,
  providedNo: string | undefined,
  manager: EntityManager,
): Promise<string> {
  if (providedNo) {
    const existing = await manager.findOne(StockTransactionEntity, {
      where: { reference_no: providedNo },
    });
    if (existing) {
      throw new BadRequestException(
        `Mã phiếu giao dịch "${providedNo}" đã tồn tại trên hệ thống`,
      );
    }
    return providedNo;
  }

  let attempts = 0;
  while (attempts < 5) {
    const code = generateReferenceCode(prefix);
    const exists = await manager.findOne(StockTransactionEntity, {
      where: { reference_no: code },
    });
    if (!exists) {
      return code;
    }
    attempts++;
  }

  return `${prefix}-${Date.now()}`;
}

export async function getWarehouseOrThrow(
  id: string,
  manager: EntityManager,
  label = 'Kho hàng',
): Promise<WarehouseEntity> {
  const warehouse = await manager.findOne(WarehouseEntity, { where: { id } });
  if (!warehouse) {
    throw new NotFoundException(`${label} không tồn tại`);
  }
  return warehouse;
}

export async function getProductOrThrow(
  id: string,
  manager: EntityManager,
): Promise<ProductEntity> {
  const product = await manager.findOne(ProductEntity, { where: { id } });
  if (!product) {
    throw new NotFoundException(`Sản phẩm với ID ${id} không tồn tại`);
  }
  return product;
}

export async function validateLocation(
  locationId: string | undefined,
  warehouseId: string,
  warehouseName: string,
  manager: EntityManager,
  label = 'Vị trí',
): Promise<void> {
  if (!locationId) return;
  const loc = await manager.findOne(WarehouseLocationEntity, {
    where: { id: locationId, warehouse_id: warehouseId },
  });
  if (!loc) {
    throw new BadRequestException(
      `${label} ${locationId} không thuộc kho ${warehouseName}`,
    );
  }
}

export async function changeStock(
  warehouseId: string,
  locationId: string | null | undefined,
  productId: string,
  delta: number,
  productName: string,
  manager: EntityManager,
): Promise<void> {
  const locId = locationId || null;
  let inv = await manager.findOne(InventoryEntity, {
    where: {
      warehouse_id: warehouseId,
      product_id: productId,
      location_id: locId ? locId : IsNull(),
    },
  });

  const currentQty = inv ? inv.quantity : 0;
  const newQty = currentQty + delta;

  if (newQty < 0) {
    throw new BadRequestException(
      `Sản phẩm "${productName}" không đủ số lượng tồn kho. Hiện có: ${currentQty}, Yêu cầu xuất/chuyển: ${Math.abs(delta)}`,
    );
  }

  if (inv) {
    inv.quantity = newQty;
    await manager.save(InventoryEntity, inv);
  } else {
    inv = manager.create(InventoryEntity, {
      warehouse_id: warehouseId,
      location_id: locId,
      product_id: productId,
      quantity: newQty,
    });
    await manager.save(InventoryEntity, inv);
  }
}

export async function setStock(
  warehouseId: string,
  locationId: string | null | undefined,
  productId: string,
  exactQty: number,
  manager: EntityManager,
): Promise<{ diffQuantity: number }> {
  const locId = locationId || null;
  let inv = await manager.findOne(InventoryEntity, {
    where: {
      warehouse_id: warehouseId,
      product_id: productId,
      location_id: locId ? locId : IsNull(),
    },
  });

  const currentQty = inv ? inv.quantity : 0;
  const diffQuantity = exactQty - currentQty;

  if (inv) {
    inv.quantity = exactQty;
    await manager.save(InventoryEntity, inv);
  } else {
    inv = manager.create(InventoryEntity, {
      warehouse_id: warehouseId,
      location_id: locId,
      product_id: productId,
      quantity: exactQty,
    });
    await manager.save(InventoryEntity, inv);
  }

  return { diffQuantity };
}
