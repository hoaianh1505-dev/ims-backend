import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PurchaseOrderStatus } from '../enums/purchase-order-status.enum';
import { SupplierEntity } from '../../suppliers/entities/supplier.entity';
import { WarehouseEntity } from '../../warehouses/entities/warehouse.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { StockTransactionEntity } from '../../stock-transactions/entities/stock-transaction.entity';
import { PurchaseOrderItemEntity } from './purchase-order-item.entity';

@Entity('purchase_orders')
@Index(['code'], { unique: true })
@Index(['supplier_id'])
@Index(['warehouse_id'])
@Index(['status'])
@Index(['created_at'])
export class PurchaseOrderEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'uuid' })
  supplier_id: string;

  @ManyToOne(() => SupplierEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supplier_id' })
  supplier: SupplierEntity;

  @Column({ type: 'uuid' })
  warehouse_id: string;

  @ManyToOne(() => WarehouseEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: WarehouseEntity;

  @Column({
    type: 'enum',
    enum: PurchaseOrderStatus,
    default: PurchaseOrderStatus.DRAFT,
  })
  status: PurchaseOrderStatus;

  @Column({ type: 'uuid' })
  created_by_user_id: string;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by_user_id' })
  creator: UserEntity;

  @Column({ type: 'uuid', nullable: true })
  approved_by_user_id: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approved_by_user_id' })
  approver: UserEntity | null;

  @Column({ type: 'timestamp', nullable: true })
  approved_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  expected_delivery_date: Date | null;

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
  total_amount: number;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'uuid', nullable: true })
  import_transaction_id: string | null;

  @ManyToOne(() => StockTransactionEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'import_transaction_id' })
  import_transaction: StockTransactionEntity | null;

  @OneToMany(() => PurchaseOrderItemEntity, (item) => item.order, {
    cascade: true,
  })
  items: PurchaseOrderItemEntity[];
}
