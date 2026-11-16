import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StocktakingService } from './stocktaking.service';
import { StocktakingController } from './stocktaking.controller';
import { StocktakingSessionEntity } from './entities/stocktaking-session.entity';
import { StocktakingItemEntity } from './entities/stocktaking-item.entity';
import { WarehouseEntity } from '../warehouses/entities/warehouse.entity';
import { InventoryEntity } from '../inventory/entities/inventory.entity';
import { ProductEntity } from '../products/entities/product.entity';
import { StockTransactionsModule } from '../stock-transactions/stock-transactions.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StocktakingSessionEntity,
      StocktakingItemEntity,
      WarehouseEntity,
      InventoryEntity,
      ProductEntity,
    ]),
    StockTransactionsModule,
    NotificationsModule,
  ],
  controllers: [StocktakingController],
  providers: [StocktakingService],
  exports: [StocktakingService],
})
export class StocktakingModule {}

