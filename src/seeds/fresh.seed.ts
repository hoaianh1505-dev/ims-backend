import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { runStandaloneSeed } from './seed.helper';
import { seedUsers } from './users.seed';
import { seedUnits } from './units.seed';
import { seedCategories } from './categories.seed';
import { seedSuppliers } from './suppliers.seed';
import { seedCustomers } from './customers.seed';
import { seedWarehouses } from './warehouses.seed';
import { seedProducts } from './products.seed';
import { seedInventory } from './inventory.seed';
import { seedStockTransactions } from './stock-transactions.seed';
import { seedPurchaseOrders } from './purchase-orders.seed';
import { seedStocktaking } from './stocktaking.seed';
import { seedAuditLogs } from './audit-logs.seed';
import { seedNotifications } from './notifications.seed';

export async function runFreshSeed(dataSource: DataSource, logger: Logger): Promise<void> {
  logger.log('================================================================');
  logger.log('   BẮT ĐẦU XÓA SẠCH VÀ TÁI TẠO TOÀN BỘ CƠ SỞ DỮ LIỆU IMS        ');
  logger.log('================================================================');

  logger.log('-> Đang dọn dẹp (TRUNCATE CASCADE) toàn bộ các bảng dữ liệu cũ...');
  await dataSource.query(`
    TRUNCATE TABLE 
      notifications,
      audit_logs,
      stocktaking_items,
      stocktaking_sessions,
      purchase_order_items,
      purchase_orders,
      stock_transaction_items,
      stock_transactions,
      inventory,
      product_images,
      products,
      warehouse_locations,
      warehouses,
      customers,
      suppliers,
      categories,
      units,
      users
    CASCADE;
  `);
  logger.log('-> Dọn dẹp hoàn tất 100%! Cơ sở dữ liệu đã trở về trạng thái sạch.');

  logger.log('-> Bước 1/13: Seed Người dùng & Quyền hạn (Admin, Manager, Staff)...');
  await seedUsers(dataSource, logger);

  logger.log('-> Bước 2/13: Seed Đơn vị tính (Cái, Chiếc, Bộ, Thùng...)...');
  await seedUnits(dataSource, logger);

  logger.log('-> Bước 3/13: Seed Danh mục ngành hàng (Categories)...');
  await seedCategories(dataSource, logger);

  logger.log('-> Bước 4/13: Seed Nhà cung cấp chiến lược (Suppliers)...');
  await seedSuppliers(dataSource, logger);

  logger.log('-> Bước 5/13: Seed Khách hàng & Đại lý phân phối (Customers)...');
  await seedCustomers(dataSource, logger);

  logger.log('-> Bước 6/13: Seed Hệ thống Kho hàng & Kệ vị trí (Warehouses & Locations)...');
  await seedWarehouses(dataSource, logger);

  logger.log('-> Bước 7/13: Seed Danh mục Sản phẩm & Mã vạch EAN-13 (Products)...');
  await seedProducts(dataSource, logger);

  logger.log('-> Bước 8/13: Seed Tồn kho phân bổ thực tế tại các kho (Inventory)...');
  await seedInventory(dataSource, logger);

  logger.log('-> Bước 9/13: Seed Phiếu Nhập / Xuất / Chuyển kho (Stock Transactions)...');
  await seedStockTransactions(dataSource, logger);

  logger.log('-> Bước 10/13: Seed Đơn mua hàng nhà cung cấp (Purchase Orders PO)...');
  await seedPurchaseOrders(dataSource, logger);

  logger.log('-> Bước 11/13: Seed Phiên kiểm kê kho đối soát (Stocktaking Sessions)...');
  await seedStocktaking(dataSource, logger);

  logger.log('-> Bước 12/13: Seed Nhật ký thao tác hệ thống 6 ngày (Audit Logs)...');
  await seedAuditLogs(dataSource, logger);

  logger.log('-> Bước 13/13: Seed Thông báo cảnh báo & thời gian thực (Notifications)...');
  await seedNotifications(dataSource, logger);

  logger.log('================================================================');
  logger.log('   🎉 HOÀN TẤT SEED TOÀN DIỆN 13 MODULES IMS THÀNH CÔNG RỰC RỠ!  ');
  logger.log('================================================================');
}

if (require.main === module) {
  runStandaloneSeed(runFreshSeed, 'IMS-FreshSeedRunner');
}

