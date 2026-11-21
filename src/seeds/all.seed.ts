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

export async function runAllSeeds(dataSource: DataSource, logger: Logger): Promise<void> {
  logger.log('====================================================');
  logger.log('   BẮT ĐẦU CHẠY TOÀN BỘ HỆ THỐNG SEED DỮ LIỆU IMS   ');
  logger.log('====================================================');

  logger.log('-> Bước 1/13: Seed Người dùng & Phân quyền...');
  await seedUsers(dataSource, logger);

  logger.log('-> Bước 2/13: Seed Đơn vị tính (Units)...');
  await seedUnits(dataSource, logger);

  logger.log('-> Bước 3/13: Seed Danh mục sản phẩm (Categories)...');
  await seedCategories(dataSource, logger);

  logger.log('-> Bước 4/13: Seed Nhà cung cấp (Suppliers)...');
  await seedSuppliers(dataSource, logger);

  logger.log('-> Bước 5/13: Seed Khách hàng & Đại lý (Customers)...');
  await seedCustomers(dataSource, logger);

  logger.log('-> Bước 6/13: Seed Kho hàng & Kệ vị trí (Warehouses & Locations)...');
  await seedWarehouses(dataSource, logger);

  logger.log('-> Bước 7/13: Seed Danh mục Hàng hóa & Mã vạch EAN-13 (Products)...');
  await seedProducts(dataSource, logger);

  logger.log('-> Bước 8/13: Seed Tồn kho phân bổ thực tế (Inventory)...');
  await seedInventory(dataSource, logger);

  logger.log('-> Bước 9/13: Seed Phiếu Nhập / Xuất / Điều chuyển (Stock Transactions)...');
  await seedStockTransactions(dataSource, logger);

  logger.log('-> Bước 10/13: Seed Đơn mua hàng (Purchase Orders PO)...');
  await seedPurchaseOrders(dataSource, logger);

  logger.log('-> Bước 11/13: Seed Phiên kiểm kê kho (Stocktaking Audits)...');
  await seedStocktaking(dataSource, logger);

  logger.log('-> Bước 12/13: Seed Nhật ký thao tác hệ thống (Audit Logs)...');
  await seedAuditLogs(dataSource, logger);

  logger.log('-> Bước 13/13: Seed Thông báo thời gian thực (Notifications)...');
  await seedNotifications(dataSource, logger);

  logger.log('====================================================');
  logger.log('   HOÀN TẤT SEED TOÀN BỘ DỮ LIỆU MẪU IMS THÀNH CÔNG! ');
  logger.log('====================================================');
}

if (require.main === module) {
  runStandaloneSeed(runAllSeeds, 'IMS-AllSeedsRunner');
}
