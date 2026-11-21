import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { StocktakingSessionEntity } from '../modules/stocktaking/entities/stocktaking-session.entity';
import { StocktakingItemEntity } from '../modules/stocktaking/entities/stocktaking-item.entity';
import { StocktakingStatus } from '../modules/stocktaking/enums/stocktaking-status.enum';
import { WarehouseEntity } from '../modules/warehouses/entities/warehouse.entity';
import { UserEntity, UserRole } from '../modules/users/entities/user.entity';
import { ProductEntity } from '../modules/products/entities/product.entity';
import { runStandaloneSeed } from './seed.helper';

export async function seedStocktaking(dataSource: DataSource, logger: Logger): Promise<StocktakingSessionEntity[]> {
  const sessionRepo = dataSource.getRepository(StocktakingSessionEntity);
  const itemRepo = dataSource.getRepository(StocktakingItemEntity);
  const warehouseRepo = dataSource.getRepository(WarehouseEntity);
  const userRepo = dataSource.getRepository(UserEntity);
  const productRepo = dataSource.getRepository(ProductEntity);

  const warehouses = await warehouseRepo.find();
  const users = await userRepo.find();
  const products = await productRepo.find();

  if (!warehouses.length || !users.length || !products.length) {
    logger.warn('Chưa đủ dữ liệu Kho, User hoặc Sản phẩm để seed Kiểm kê kho');
    return [];
  }

  const adminUser = users.find((u) => u.role === UserRole.ADMIN) || users[0];
  const managerUser = users.find((u) => u.role === UserRole.MANAGER) || adminUser;

  const sampleSessions = [
    {
      code: 'ST-2026-001',
      title: 'Kiểm kê định kỳ tháng 11 - Kho Tổng Hà Nội (Long Biên)',
      warehouse_id: warehouses[0].id,
      status: StocktakingStatus.COMPLETED,
      created_by_user_id: adminUser.id,
      completed_by_user_id: managerUser.id,
      completed_at: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      note: 'Đã hoàn tất kiểm kê thực tế tại các kệ kho. Chênh lệch đã được đối soát và cân bằng tồn kho.',
      items: [
        { product_id: products[0].id, system_quantity: 50, counted_quantity: 50, diff_quantity: 0, diff_amount: 0 },
        { product_id: products[1 % products.length].id, system_quantity: 80, counted_quantity: 78, diff_quantity: -2, diff_amount: -2400000 },
        { product_id: products[2 % products.length].id, system_quantity: 30, counted_quantity: 31, diff_quantity: 1, diff_amount: 4200000 },
      ],
    },
    {
      code: 'ST-2026-002',
      title: 'Kiểm tra đột xuất số lượng tồn kho ngành Thiết bị ngoại vi',
      warehouse_id: warehouses[1 % warehouses.length].id,
      status: StocktakingStatus.IN_PROGRESS,
      created_by_user_id: managerUser.id,
      completed_by_user_id: null,
      completed_at: null,
      note: 'Đang tiến hành đếm số lượng thực tế tại khu vực kệ A1 và A2.',
      items: [
        { product_id: products[3 % products.length].id, system_quantity: 120, counted_quantity: null, diff_quantity: 0, diff_amount: 0 },
        { product_id: products[4 % products.length].id, system_quantity: 65, counted_quantity: null, diff_quantity: 0, diff_amount: 0 },
      ],
    },
  ];

  const savedSessions: StocktakingSessionEntity[] = [];

  for (const sData of sampleSessions) {
    let session = await sessionRepo.findOne({ where: { code: sData.code } });

    if (!session) {
      const totalSys = sData.items.reduce((sum, it) => sum + it.system_quantity, 0);
      const totalCount = sData.items.reduce((sum, it) => sum + (it.counted_quantity ?? it.system_quantity), 0);
      const totalDiff = sData.items.reduce((sum, it) => sum + it.diff_quantity, 0);
      const totalDiffAmount = sData.items.reduce((sum, it) => sum + it.diff_amount, 0);

      session = sessionRepo.create({
        code: sData.code,
        title: sData.title,
        warehouse_id: sData.warehouse_id,
        status: sData.status,
        created_by_user_id: sData.created_by_user_id,
        completed_by_user_id: sData.completed_by_user_id,
        completed_at: sData.completed_at,
        total_system_quantity: totalSys,
        total_counted_quantity: totalCount,
        total_diff_quantity: totalDiff,
        total_diff_amount: totalDiffAmount,
        note: sData.note,
      });
      session = await sessionRepo.save(session);

      for (const itemData of sData.items) {
        const item = itemRepo.create({
          session_id: session.id,
          product_id: itemData.product_id,
          system_quantity: itemData.system_quantity,
          counted_quantity: itemData.counted_quantity,
          diff_quantity: itemData.diff_quantity,
          diff_amount: itemData.diff_amount,
        });
        await itemRepo.save(item);
      }
      logger.log(`-> Đã tạo Phiên kiểm kê kho: [${session.code}] - ${session.title} (${session.status})`);
    }
    savedSessions.push(session);
  }

  return savedSessions;
}

if (require.main === module) {
  runStandaloneSeed(seedStocktaking, 'StocktakingSeed');
}

