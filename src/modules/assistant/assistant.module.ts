import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { AssistantToolsService } from './assistant-tools.service';
import { ProductEntity } from '../products/entities/product.entity';
import { WarehouseEntity } from '../warehouses/entities/warehouse.entity';
import { InventoryEntity } from '../inventory/entities/inventory.entity';
import { StockTransactionEntity } from '../stock-transactions/entities/stock-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductEntity,
      WarehouseEntity,
      InventoryEntity,
      StockTransactionEntity,
    ]),
  ],
  controllers: [AssistantController],
  providers: [AssistantService, AssistantToolsService],
  exports: [AssistantService],
})
export class AssistantModule {}
