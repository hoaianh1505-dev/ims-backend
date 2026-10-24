import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryEntity } from './entities/inventory.entity';
import { ProductEntity } from '../products/entities/product.entity';
import { WarehouseEntity } from '../warehouses/entities/warehouse.entity';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryEntity,
      ProductEntity,
      WarehouseEntity,
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
