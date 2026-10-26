import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockTransactionsService } from './stock-transactions.service';
import { StockTransactionsController } from './stock-transactions.controller';
import { StockTransactionEntity } from './entities/stock-transaction.entity';
import { StockTransactionItemEntity } from './entities/stock-transaction-item.entity';
import { WarehouseEntity } from '../warehouses/entities/warehouse.entity';
import { WarehouseLocationEntity } from '../warehouses/entities/warehouse-location.entity';
import { ProductEntity } from '../products/entities/product.entity';
import { SupplierEntity } from '../suppliers/entities/supplier.entity';
import { InventoryEntity } from '../inventory/entities/inventory.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StockTransactionEntity,
      StockTransactionItemEntity,
      WarehouseEntity,
      WarehouseLocationEntity,
      ProductEntity,
      SupplierEntity,
      InventoryEntity,
    ]),
  ],
  controllers: [StockTransactionsController],
  providers: [StockTransactionsService],
  exports: [StockTransactionsService],
})
export class StockTransactionsModule {}
