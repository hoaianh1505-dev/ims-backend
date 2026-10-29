import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExcelService } from './excel.service';
import { ExcelController } from './excel.controller';
import { InventoryEntity } from '../inventory/entities/inventory.entity';
import { StockTransactionEntity } from '../stock-transactions/entities/stock-transaction.entity';
import { ProductEntity } from '../products/entities/product.entity';
import { CategoryEntity } from '../categories/entities/category.entity';
import { UnitEntity } from '../units/entities/unit.entity';
import { SupplierEntity } from '../suppliers/entities/supplier.entity';
import { WarehouseEntity } from '../warehouses/entities/warehouse.entity';
import { WarehouseLocationEntity } from '../warehouses/entities/warehouse-location.entity';
import { StockTransactionsModule } from '../stock-transactions/stock-transactions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryEntity,
      StockTransactionEntity,
      ProductEntity,
      CategoryEntity,
      UnitEntity,
      SupplierEntity,
      WarehouseEntity,
      WarehouseLocationEntity,
    ]),
    StockTransactionsModule,
  ],
  controllers: [ExcelController],
  providers: [ExcelService],
  exports: [ExcelService],
})
export class ExcelModule {}
