import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { CategoryEntity } from '../modules/categories/entities/category.entity';
import { UnitEntity } from '../modules/units/entities/unit.entity';
import { SupplierEntity } from '../modules/suppliers/entities/supplier.entity';
import { WarehouseEntity } from '../modules/warehouses/entities/warehouse.entity';
import { ProductEntity } from '../modules/products/entities/product.entity';
import { InventoryEntity } from '../modules/inventory/entities/inventory.entity';
import { StockTransactionEntity } from '../modules/stock-transactions/entities/stock-transaction.entity';
import { StockTransactionItemEntity } from '../modules/stock-transactions/entities/stock-transaction-item.entity';
import { StockTransactionType } from '../modules/stock-transactions/enums/stock-transaction-type.enum';
import { UserEntity } from '../modules/users/entities/user.entity';

async function runMockSeed() {
  const logger = new Logger('MockSeed');
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const dataSource = app.get(DataSource);
    const categoryRepo = dataSource.getRepository(CategoryEntity);
    const unitRepo = dataSource.getRepository(UnitEntity);
    const supplierRepo = dataSource.getRepository(SupplierEntity);
    const warehouseRepo = dataSource.getRepository(WarehouseEntity);
    const productRepo = dataSource.getRepository(ProductEntity);
    const inventoryRepo = dataSource.getRepository(InventoryEntity);
    const stockTransactionRepo = dataSource.getRepository(StockTransactionEntity);
    const stockItemRepo = dataSource.getRepository(StockTransactionItemEntity);
    const userRepo = dataSource.getRepository(UserEntity);

    const admin = await userRepo.findOne({ where: { username: 'admin' } });

    logger.log('--- Bắt đầu Seed Dữ liệu Mẫu IMS ---');

    // 1. Seed Units (Đơn vị tính)
    const unitNames = [
      { name: 'Cái', symbol: 'cái' },
      { name: 'Hộp', symbol: 'hộp' },
      { name: 'Thùng', symbol: 'thùng' },
      { name: 'Bộ', symbol: 'bộ' },
      { name: 'Mét', symbol: 'm' },
    ];
    const savedUnits: UnitEntity[] = [];
    for (const u of unitNames) {
      let unit = await unitRepo.findOne({ where: { name: u.name } });
      if (!unit) {
        unit = unitRepo.create(u);
        await unitRepo.save(unit);
      }
      savedUnits.push(unit);
    }
    logger.log(`Đã seed ${savedUnits.length} Đơn vị tính.`);

    // 2. Seed Categories (Danh mục)
    const categoryNames = [
      { name: 'Linh kiện máy tính', description: 'CPU, RAM, Mainboard, VGA, Nguồn' },
      { name: 'Thiết bị ngoại vi', description: 'Chuột, Bàn phím, Tai nghe, Webcam' },
      { name: 'Màn hình máy tính', description: 'Màn hình văn phòng, đồ họa và gaming' },
      { name: 'Thiết bị mạng', description: 'Router, Switch, Bộ phát Wi-Fi' },
      { name: 'Phụ kiện & Cáp kết nối', description: 'Cáp HDMI, Type-C, Hub chuyển đổi' },
      { name: 'Thiết bị lưu trữ', description: 'Ổ cứng SSD, HDD, Thẻ nhớ, USB' },
    ];
    const savedCategories: CategoryEntity[] = [];
    for (const c of categoryNames) {
      let cat = await categoryRepo.findOne({ where: { name: c.name } });
      if (!cat) {
        cat = categoryRepo.create(c);
        await categoryRepo.save(cat);
      }
      savedCategories.push(cat);
    }
    logger.log(`Đã seed ${savedCategories.length} Danh mục.`);

    // 3. Seed Suppliers (Nhà cung cấp)
    const suppliersData = [
      { name: 'Công ty TNHH Công nghệ FPT Synnex', code: 'SUP-FPT', contact_name: 'Nguyễn Văn Hùng', email: 'contact@synnexfpt.com.vn', phone: '02473000911', address: 'Tòa nhà FPT, Cầu Giấy, Hà Nội' },
      { name: 'Nhà phân phối Digiworld (DGW)', code: 'SUP-DGW', contact_name: 'Trần Thị Mai', email: 'sales@digiworld.com.vn', phone: '02839290059', address: '195 Cô Bắc, Quận 1, TP. HCM' },
      { name: 'Công ty Cổ phần Tin học Viết Sơn', code: 'SUP-VIETSON', contact_name: 'Lê Hoàng Nam', email: 'support@vietson.com', phone: '02838334455', address: '150 Nguyễn Thị Minh Khai, Q3, TP. HCM' },
      { name: 'Nhà phân phối Mai Hoàng', code: 'SUP-MAIHOANG', contact_name: 'Phạm Quốc Bảo', email: 'kinhdoanh@maihoang.com.vn', phone: '02435377109', address: '241 Phố Vọng, Hai Bà Trưng, Hà Nội' },
    ];
    const savedSuppliers: SupplierEntity[] = [];
    for (const s of suppliersData) {
      let sup = await supplierRepo.findOne({ where: { code: s.code } });
      if (!sup) {
        sup = supplierRepo.create(s);
        await supplierRepo.save(sup);
      }
      savedSuppliers.push(sup);
    }
    logger.log(`Đã seed ${savedSuppliers.length} Nhà cung cấp.`);

    // 4. Seed Warehouses (Kho hàng)
    const warehousesData = [
      { name: 'Kho Tổng Hà Nội', code: 'WH-HN-01', address: 'Lô 12 KCN Đài Tư, Long Biên, Hà Nội', manager_id: admin?.id || null },
      { name: 'Kho Chi nhánh Cầu Giấy', code: 'WH-HN-02', address: 'Số 88 Duy Tân, Dịch Vọng Hậu, Cầu Giấy, Hà Nội', manager_id: admin?.id || null },
      { name: 'Kho Tổng Hồ Chí Minh', code: 'WH-HCM-01', address: 'Đường số 7 KCN Tân Tạo, Bình Tân, TP. HCM', manager_id: admin?.id || null },
      { name: 'Kho Chi nhánh Quận 1', code: 'WH-HCM-02', address: '45 Lê Duẩn, Bến Nghé, Quận 1, TP. HCM', manager_id: admin?.id || null },
      { name: 'Kho Trung chuyển Đà Nẵng', code: 'WH-DN-01', address: 'KCN Hòa Khánh, Liên Chiểu, Đà Nẵng', manager_id: admin?.id || null },
    ];
    const savedWarehouses: WarehouseEntity[] = [];
    for (const w of warehousesData) {
      let wh = await warehouseRepo.findOne({ where: { code: w.code } });
      if (!wh) {
        wh = warehouseRepo.create(w);
        await warehouseRepo.save(wh);
      }
      savedWarehouses.push(wh);
    }
    logger.log(`Đã seed ${savedWarehouses.length} Kho hàng.`);

    // 5. Seed Products (Sản phẩm)
    const productsData = [
      { name: 'Chuột không dây Logitech MX Master 3S', sku: 'LOGI-MX3S', barcode: '893850123401', cost_price: 1800000, selling_price: 2490000, low_stock_threshold: 15, categoryIdx: 1, unitIdx: 0, supplierIdx: 0 },
      { name: 'Bàn phím cơ Keychron K2 Pro Wireless', sku: 'KEY-K2PRO', barcode: '893850123402', cost_price: 1650000, selling_price: 2190000, low_stock_threshold: 10, categoryIdx: 1, unitIdx: 0, supplierIdx: 1 },
      { name: 'Màn hình Dell UltraSharp U2723QE 4K', sku: 'DELL-U2723', barcode: '893850123403', cost_price: 10500000, selling_price: 13990000, low_stock_threshold: 8, categoryIdx: 2, unitIdx: 0, supplierIdx: 0 },
      { name: 'Màn hình LG 27GP850-B UltraGear 2K 165Hz', sku: 'LG-27GP850', barcode: '893850123404', cost_price: 6800000, selling_price: 8490000, low_stock_threshold: 10, categoryIdx: 2, unitIdx: 0, supplierIdx: 1 },
      { name: 'Tai nghe Sony WH-1000XM5 Chống ồn', sku: 'SONY-XM5', barcode: '893850123405', cost_price: 6200000, selling_price: 7990000, low_stock_threshold: 5, categoryIdx: 1, unitIdx: 0, supplierIdx: 2 },
      { name: 'RAM Corsair Vengeance RGB 32GB (2x16GB) DDR5', sku: 'COR-RAM32', barcode: '893850123406', cost_price: 2400000, selling_price: 3150000, low_stock_threshold: 12, categoryIdx: 0, unitIdx: 3, supplierIdx: 3 },
      { name: 'Ổ cứng SSD Samsung 990 PRO 1TB NVMe', sku: 'SAM-990P1T', barcode: '893850123407', cost_price: 2100000, selling_price: 2890000, low_stock_threshold: 15, categoryIdx: 5, unitIdx: 0, supplierIdx: 1 },
      { name: 'CPU Intel Core i7 14700K', sku: 'INTEL-147K', barcode: '893850123408', cost_price: 9200000, selling_price: 10890000, low_stock_threshold: 5, categoryIdx: 0, unitIdx: 1, supplierIdx: 0 },
      { name: 'Card màn hình ASUS ROG Strix RTX 4070 Ti Super', sku: 'ASUS-4070TI', barcode: '893850123409', cost_price: 23500000, selling_price: 27990000, low_stock_threshold: 3, categoryIdx: 0, unitIdx: 1, supplierIdx: 2 },
      { name: 'Nguồn Seasonic Focus GX-850 850W Gold', sku: 'SEA-850W', barcode: '893850123410', cost_price: 2800000, selling_price: 3550000, low_stock_threshold: 10, categoryIdx: 0, unitIdx: 0, supplierIdx: 3 },
      { name: 'Router Wi-Fi 6 ASUS RT-AX58U', sku: 'ASUS-AX58U', barcode: '893850123411', cost_price: 1900000, selling_price: 2590000, low_stock_threshold: 10, categoryIdx: 3, unitIdx: 0, supplierIdx: 0 },
      { name: 'Webcam Logitech Brio 4K Ultra HD', sku: 'LOGI-BRIO', barcode: '893850123412', cost_price: 3100000, selling_price: 4190000, low_stock_threshold: 6, categoryIdx: 1, unitIdx: 0, supplierIdx: 1 },
      { name: 'Cáp Ugreen Type-C to HDMI 4K 60Hz 2m', sku: 'UGR-CH4K', barcode: '893850123413', cost_price: 180000, selling_price: 290000, low_stock_threshold: 25, categoryIdx: 4, unitIdx: 0, supplierIdx: 2 },
      { name: 'Hub chuyển đổi Belkin 7-in-1 Multiport', sku: 'BEL-HUB7', barcode: '893850123414', cost_price: 950000, selling_price: 1450000, low_stock_threshold: 8, categoryIdx: 4, unitIdx: 0, supplierIdx: 0 },
      { name: 'Ổ cứng di động WD My Passport 2TB USB 3.2', sku: 'WD-PASSP2T', barcode: '893850123415', cost_price: 1650000, selling_price: 2250000, low_stock_threshold: 10, categoryIdx: 5, unitIdx: 0, supplierIdx: 1 },
    ];

    const savedProducts: ProductEntity[] = [];
    for (const p of productsData) {
      let prod = await productRepo.findOne({ where: { sku: p.sku } });
      if (!prod) {
        prod = productRepo.create({
          name: p.name,
          sku: p.sku,
          barcode: p.barcode,
          cost_price: p.cost_price,
          selling_price: p.selling_price,
          low_stock_threshold: p.low_stock_threshold,
          category_id: savedCategories[p.categoryIdx].id,
          unit_id: savedUnits[p.unitIdx].id,
          supplier_id: savedSuppliers[p.supplierIdx].id,
          description: `Sản phẩm chính hãng ${p.name}, bảo hành 24 tháng.`,
        });
        await productRepo.save(prod);
      }
      savedProducts.push(prod);
    }
    logger.log(`Đã seed ${savedProducts.length} Sản phẩm.`);

    // 6. Seed Inventory (Tồn kho thực tế)
    const mainWarehouse = savedWarehouses[0];
    const branchWarehouse = savedWarehouses[1];

    let invCount = 0;
    for (let i = 0; i < savedProducts.length; i++) {
      const prod = savedProducts[i];

      // Tồn ở Kho Tổng (số lượng dồi dào hoặc cảnh báo hết hàng)
      const qtyMain = i === 2 || i === 8 ? 2 : Math.floor(Math.random() * 80) + 20;
      let inv1 = await inventoryRepo.findOne({ where: { warehouse_id: mainWarehouse.id, product_id: prod.id } });
      if (!inv1) {
        inv1 = inventoryRepo.create({
          warehouse_id: mainWarehouse.id,
          product_id: prod.id,
          quantity: qtyMain,
        });
        await inventoryRepo.save(inv1);
        invCount++;
      }

      // Tồn ở Kho Chi Nhánh
      const qtyBranch = Math.floor(Math.random() * 30) + 5;
      let inv2 = await inventoryRepo.findOne({ where: { warehouse_id: branchWarehouse.id, product_id: prod.id } });
      if (!inv2) {
        inv2 = inventoryRepo.create({
          warehouse_id: branchWarehouse.id,
          product_id: prod.id,
          quantity: qtyBranch,
        });
        await inventoryRepo.save(inv2);
        invCount++;
      }
    }
    logger.log(`Đã seed tồn kho cho ${invCount} mục hàng.`);

    // 7. Seed Stock Transactions (Phiếu Nhập/Xuất kho)
    const existingTx = await stockTransactionRepo.count();
    if (existingTx === 0 && admin) {
      // Phiếu nhập 1
      const tx1 = stockTransactionRepo.create({
        type: StockTransactionType.IMPORT,
        reference_no: 'PNK-2026-001',
        warehouse_id: mainWarehouse.id,
        supplier_id: savedSuppliers[0].id,
        created_by_user_id: admin.id,
        note: 'Nhập lô hàng linh kiện máy tính tháng 11',
      });
      await stockTransactionRepo.save(tx1);

      await stockItemRepo.save([
        stockItemRepo.create({
          transaction_id: tx1.id,
          product_id: savedProducts[0].id,
          quantity: 50,
          unit_price: savedProducts[0].cost_price,
          total_price: savedProducts[0].cost_price * 50,
        }),
        stockItemRepo.create({
          transaction_id: tx1.id,
          product_id: savedProducts[1].id,
          quantity: 40,
          unit_price: savedProducts[1].cost_price,
          total_price: savedProducts[1].cost_price * 40,
        }),
      ]);

      // Phiếu xuất 1
      const tx2 = stockTransactionRepo.create({
        type: StockTransactionType.EXPORT,
        reference_no: 'PXK-2026-001',
        warehouse_id: mainWarehouse.id,
        created_by_user_id: admin.id,
        note: 'Xuất hàng phân phối cho showroom Cầu Giấy',
      });
      await stockTransactionRepo.save(tx2);

      await stockItemRepo.save([
        stockItemRepo.create({
          transaction_id: tx2.id,
          product_id: savedProducts[0].id,
          quantity: 15,
          unit_price: savedProducts[0].selling_price,
          total_price: savedProducts[0].selling_price * 15,
        }),
        stockItemRepo.create({
          transaction_id: tx2.id,
          product_id: savedProducts[2].id,
          quantity: 5,
          unit_price: savedProducts[2].selling_price,
          total_price: savedProducts[2].selling_price * 5,
        }),
      ]);

      // Phiếu điều chuyển
      const tx3 = stockTransactionRepo.create({
        type: StockTransactionType.TRANSFER,
        reference_no: 'PDC-2026-001',
        warehouse_id: mainWarehouse.id,
        target_warehouse_id: branchWarehouse.id,
        created_by_user_id: admin.id,
        note: 'Điều chuyển cân đối kho Hà Nội và Cầu Giấy',
      });
      await stockTransactionRepo.save(tx3);

      await stockItemRepo.save([
        stockItemRepo.create({
          transaction_id: tx3.id,
          product_id: savedProducts[4].id,
          quantity: 10,
          unit_price: savedProducts[4].cost_price,
          total_price: savedProducts[4].cost_price * 10,
        }),
      ]);

      logger.log('Đã seed 3 Phiếu giao dịch xuất/nhập/điều chuyển kho.');
    }

    logger.log('=== HOÀN THÀNH SEED DỮ LIỆU MẪU IMS THÀNH CÔNG! ===');
  } catch (error) {
    logger.error('Lỗi khi seed dữ liệu mẫu:', error);
  } finally {
    await app.close();
  }
}

runMockSeed();
