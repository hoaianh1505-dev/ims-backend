import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { StocktakingStatus } from '../enums/stocktaking-status.enum';
import { WarehouseEntity } from '../../warehouses/entities/warehouse.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { StockTransactionEntity } from '../../stock-transactions/entities/stock-transaction.entity';
import { StocktakingItemEntity } from './stocktaking-item.entity';

@Entity('stocktaking_sessions')
@Index(['code'], { unique: true })
@Index(['warehouse_id'])
@Index(['status'])
@Index(['created_at'])
export class StocktakingSessionEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'uuid' })
  warehouse_id: string;

  @ManyToOne(() => WarehouseEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: WarehouseEntity;

  @Column({
    type: 'enum',
    enum: StocktakingStatus,
    default: StocktakingStatus.IN_PROGRESS,
  })
  status: StocktakingStatus;

  @Column({ type: 'uuid' })
  created_by_user_id: string;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by_user_id' })
  creator: UserEntity;

  @Column({ type: 'uuid', nullable: true })
  completed_by_user_id: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'completed_by_user_id' })
  completer: UserEntity | null;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'int', default: 0 })
  total_system_quantity: number;

  @Column({ type: 'int', default: 0 })
  total_counted_quantity: number;

  @Column({ type: 'int', default: 0 })
  total_diff_quantity: number;

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
  total_diff_amount: number;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'uuid', nullable: true })
  adjustment_transaction_id: string | null;

  @ManyToOne(() => StockTransactionEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'adjustment_transaction_id' })
  adjustment_transaction: StockTransactionEntity | null;

  @OneToMany(() => StocktakingItemEntity, (item) => item.session, {
    cascade: true,
  })
  items: StocktakingItemEntity[];
}
