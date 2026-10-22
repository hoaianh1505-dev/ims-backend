import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarehouseEntity } from './entities/warehouse.entity';
import { WarehouseLocationEntity } from './entities/warehouse-location.entity';
import { UserEntity } from '../users/entities/user.entity';
import { WarehousesService } from './warehouses.service';
import { WarehousesController } from './warehouses.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WarehouseEntity,
      WarehouseLocationEntity,
      UserEntity,
    ]),
  ],
  controllers: [WarehousesController],
  providers: [WarehousesService],
  exports: [WarehousesService],
})
export class WarehousesModule {}
