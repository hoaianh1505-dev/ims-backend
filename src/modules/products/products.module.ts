import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductEntity } from './entities/product.entity';
import { ProductImageEntity } from './entities/product-image.entity';
import { CategoryEntity } from '../categories/entities/category.entity';
import { UnitEntity } from '../units/entities/unit.entity';
import { SupplierEntity } from '../suppliers/entities/supplier.entity';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    UploadModule,
    TypeOrmModule.forFeature([
      ProductEntity,
      ProductImageEntity,
      CategoryEntity,
      UnitEntity,
      SupplierEntity,
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService, TypeOrmModule],
})
export class ProductsModule {}
