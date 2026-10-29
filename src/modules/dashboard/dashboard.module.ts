import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ProductEntity } from '../products/entities/product.entity';
import { WarehouseEntity } from '../warehouses/entities/warehouse.entity';
import { InventoryEntity } from '../inventory/entities/inventory.entity';
import { StockTransactionEntity } from '../stock-transactions/entities/stock-transaction.entity';
import { StockTransactionItemEntity } from '../stock-transactions/entities/stock-transaction-item.entity';
import { CategoryEntity } from '../categories/entities/category.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductEntity,
      WarehouseEntity,
      InventoryEntity,
      StockTransactionEntity,
      StockTransactionItemEntity,
      CategoryEntity,
    ]),
    AuditLogsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
