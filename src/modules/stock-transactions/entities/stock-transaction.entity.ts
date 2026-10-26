import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { StockTransactionType } from '../enums/stock-transaction-type.enum';
import { WarehouseEntity } from '../../warehouses/entities/warehouse.entity';
import { SupplierEntity } from '../../suppliers/entities/supplier.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { StockTransactionItemEntity } from './stock-transaction-item.entity';

@Entity('stock_transactions')
export class StockTransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: StockTransactionType,
  })
  type: StockTransactionType;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  reference_no: string;

  @Column({ type: 'uuid' })
  warehouse_id: string;

  @ManyToOne(() => WarehouseEntity)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: WarehouseEntity;

  @Column({ type: 'uuid', nullable: true })
  target_warehouse_id: string | null;

  @ManyToOne(() => WarehouseEntity, { nullable: true })
  @JoinColumn({ name: 'target_warehouse_id' })
  target_warehouse: WarehouseEntity | null;

  @Column({ type: 'uuid', nullable: true })
  supplier_id: string | null;

  @ManyToOne(() => SupplierEntity, { nullable: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier: SupplierEntity | null;

  @Column({ type: 'uuid' })
  created_by_user_id: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by_user_id' })
  creator: UserEntity;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @OneToMany(() => StockTransactionItemEntity, (item) => item.transaction, {
    cascade: true,
  })
  items: StockTransactionItemEntity[];
}
