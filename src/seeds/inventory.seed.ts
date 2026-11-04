import { DataSource, IsNull } from 'typeorm';
import { Logger } from '@nestjs/common';
import { InventoryEntity } from '../modules/inventory/entities/inventory.entity';
import { ProductEntity } from '../modules/products/entities/product.entity';
import { WarehouseEntity } from '../modules/warehouses/entities/warehouse.entity';
import { WarehouseLocationEntity } from '../modules/warehouses/entities/warehouse-location.entity';
import { runStandaloneSeed } from './seed.helper';

export async function seedInventory(
  dataSource: DataSource,
  logger: Logger,
): Promise<InventoryEntity[]> {
  const inventoryRepo = dataSource.getRepository(InventoryEntity);
  const productRepo = dataSource.getRepository(ProductEntity);
  const warehouseRepo = dataSource.getRepository(WarehouseEntity);
  const locationRepo = dataSource.getRepository(WarehouseLocationEntity);

  const products = await productRepo.find();
  const warehouses = await warehouseRepo.find();
  const locations = await locationRepo.find();

  if (products.length === 0 || warehouses.length === 0) {
    logger.warn('Chưa có dữ liệu sản phẩm hoặc kho hàng để seed tồn kho.');
    return [];
  }

  const hnMainWh = warehouses.find((w) => w.code === 'WH-HN-01') || warehouses[0];
  const hnBranchWh = warehouses.find((w) => w.code === 'WH-HN-02') || warehouses[1];
  const hcmMainWh = warehouses.find((w) => w.code === 'WH-HCM-01') || warehouses[2];
  const hcmBranchWh = warehouses.find((w) => w.code === 'WH-HCM-02') || warehouses[3];
  const dnWh = warehouses.find((w) => w.code === 'WH-DN-01') || warehouses[4];

  // Lấy các vị trí kệ thuộc Kho Tổng HN & HCM
  const hnLocations = locations.filter((l) => l.warehouse_id === hnMainWh.id);
  const hcmLocations = locations.filter((l) => l.warehouse_id === hcmMainWh.id);

  const savedInventory: InventoryEntity[] = [];

  for (let i = 0; i < products.length; i++) {
    const prod = products[i];

    // Xác định kịch bản tồn kho để UI có đủ 3 trạng thái: Đủ hàng, Sắp hết, Hết hàng
    // - Mặt hàng index 0, 1: Hết hàng hoàn toàn (0 tồn kho ở tất cả các kho)
    // - Mặt hàng index 2, 3, 4: Sắp hết (tồn kho dưới ngưỡng low_stock_threshold)
    // - Các mặt hàng còn lại: Đủ hàng dồi dào
    const isOutOfStockScenario = i === 0 || i === 1;
    const isLowStockScenario = i >= 2 && i <= 4;

    const locHn = hnLocations.length > 0 ? hnLocations[i % hnLocations.length].id : null;
    const locHcm = hcmLocations.length > 0 ? hcmLocations[i % hcmLocations.length].id : null;

    let qtyHnMain = 0;
    let qtyHnBranch = 0;
    let qtyHcmMain = 0;
    let qtyHcmBranch = 0;
    let qtyDn = 0;

    if (isOutOfStockScenario) {
      qtyHnMain = 0;
      qtyHnBranch = 0;
      qtyHcmMain = 0;
      qtyHcmBranch = 0;
      qtyDn = 0;
    } else if (isLowStockScenario) {
      // Tổng tồn kho chỉ 2-3 chiếc (nhỏ hơn threshold 4-10)
      qtyHnMain = 2;
      qtyHnBranch = 0;
      qtyHcmMain = 1;
      qtyHcmBranch = 0;
      qtyDn = 0;
    } else {
      // Đủ hàng dồi dào
      qtyHnMain = 30 + (i * 7) % 65;
      qtyHnBranch = 5 + (i * 3) % 20;
      qtyHcmMain = 25 + (i * 5) % 55;
      qtyHcmBranch = 4 + (i * 2) % 15;
      qtyDn = 6 + (i * 2) % 18;
    }

    const configs = [
      { wh: hnMainWh, loc: locHn, qty: qtyHnMain },
      { wh: hnBranchWh, loc: null, qty: qtyHnBranch },
      { wh: hcmMainWh, loc: locHcm, qty: qtyHcmMain },
      { wh: hcmBranchWh, loc: null, qty: qtyHcmBranch },
      { wh: dnWh, loc: null, qty: qtyDn },
    ];

    for (const cfg of configs) {
      if (!cfg.wh) continue;
      let inv = await inventoryRepo.findOne({
        where: {
          warehouse_id: cfg.wh.id,
          location_id: cfg.loc ? cfg.loc : IsNull(),
          product_id: prod.id,
        },
      });

      if (!inv) {
        inv = inventoryRepo.create({
          warehouse_id: cfg.wh.id,
          location_id: cfg.loc,
          product_id: prod.id,
          quantity: cfg.qty,
        });
      } else {
        inv.quantity = cfg.qty;
      }
      await inventoryRepo.save(inv);
      savedInventory.push(inv);
    }
  }

  logger.log(
    `Tổng cộng: ${savedInventory.length} bản ghi tồn kho được phân bổ chi tiết qua các kho hàng.`,
  );
  return savedInventory;
}

if (require.main === module) {
  runStandaloneSeed(seedInventory, 'InventorySeed');
}
