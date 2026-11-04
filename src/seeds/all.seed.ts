import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { runStandaloneSeed } from './seed.helper';
import { seedUsers } from './users.seed';
import { seedUnits } from './units.seed';
import { seedCategories } from './categories.seed';
import { seedSuppliers } from './suppliers.seed';
import { seedWarehouses } from './warehouses.seed';
import { seedProducts } from './products.seed';
import { seedInventory } from './inventory.seed';
import { seedStockTransactions } from './stock-transactions.seed';

export async function runAllSeeds(dataSource: DataSource, logger: Logger): Promise<void> {
  logger.log('====================================================');
  logger.log('   BẮT ĐẦU CHẠY TOÀN BỘ HỆ THỐNG SEED DỮ LIỆU IMS   ');
  logger.log('====================================================');

  logger.log('-> Bước 1/8: Seed Người dùng & Phân quyền...');
  await seedUsers(dataSource, logger);

  logger.log('-> Bước 2/8: Seed Đơn vị tính (Units)...');
  await seedUnits(dataSource, logger);

  logger.log('-> Bước 3/8: Seed Danh mục sản phẩm (Categories)...');
  await seedCategories(dataSource, logger);

  logger.log('-> Bước 4/8: Seed Nhà cung cấp (Suppliers)...');
  await seedSuppliers(dataSource, logger);

  logger.log('-> Bước 5/8: Seed Kho hàng & Kệ vị trí (Warehouses & Locations)...');
  await seedWarehouses(dataSource, logger);

  logger.log('-> Bước 6/8: Seed Danh mục Hàng hóa & Mã vạch EAN-13 (Products)...');
  await seedProducts(dataSource, logger);

  logger.log('-> Bước 7/8: Seed Tồn kho phân bổ thực tế (Inventory)...');
  await seedInventory(dataSource, logger);

  logger.log('-> Bước 8/8: Seed Phiếu Nhập / Xuất / Điều chuyển (Stock Transactions)...');
  await seedStockTransactions(dataSource, logger);

  logger.log('====================================================');
  logger.log('   HOÀN TẤT SEED TOÀN BỘ DỮ LIỆU MẪU IMS THÀNH CÔNG! ');
  logger.log('====================================================');
}

if (require.main === module) {
  runStandaloneSeed(runAllSeeds, 'IMS-AllSeedsRunner');
}
