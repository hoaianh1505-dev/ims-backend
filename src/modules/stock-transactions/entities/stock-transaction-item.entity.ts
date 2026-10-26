import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StockTransactionEntity } from './stock-transaction.entity';
import { ProductEntity } from '../../products/entities/product.entity';
import { WarehouseLocationEntity } from '../../warehouses/entities/warehouse-location.entity';

@Entity('stock_transaction_items')
export class StockTransactionItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  transaction_id: string;

  @ManyToOne(() => StockTransactionEntity, (tx) => tx.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'transaction_id' })
  transaction: StockTransactionEntity;

  @Column({ type: 'uuid' })
  product_id: string;

  @ManyToOne(() => ProductEntity)
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @Column({ type: 'uuid', nullable: true })
  location_id: string | null;

  @ManyToOne(() => WarehouseLocationEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'location_id' })
  location: WarehouseLocationEntity | null;

  @Column({ type: 'uuid', nullable: true })
  target_location_id: string | null;

  @ManyToOne(() => WarehouseLocationEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'target_location_id' })
  target_location: WarehouseLocationEntity | null;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ type: 'int', nullable: true })
  counted_quantity: number | null;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 0,
    },
  })
  unit_price: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 0,
    },
  })
  total_price: number;
}
