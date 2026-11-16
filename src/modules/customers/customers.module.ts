import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { CustomerEntity } from './entities/customer.entity';
import { StockTransactionEntity } from '../stock-transactions/entities/stock-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerEntity, StockTransactionEntity])],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}

