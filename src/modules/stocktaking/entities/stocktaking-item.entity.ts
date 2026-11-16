import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StocktakingSessionEntity } from './stocktaking-session.entity';
import { ProductEntity } from '../../products/entities/product.entity';
import { WarehouseLocationEntity } from '../../warehouses/entities/warehouse-location.entity';

@Entity('stocktaking_items')
export class StocktakingItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  session_id: string;

  @ManyToOne(() => StocktakingSessionEntity, (session) => session.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session: StocktakingSessionEntity;

  @Column({ type: 'uuid' })
  product_id: string;

  @ManyToOne(() => ProductEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @Column({ type: 'uuid', nullable: true })
  location_id: string | null;

  @ManyToOne(() => WarehouseLocationEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'location_id' })
  location: WarehouseLocationEntity | null;

  @Column({ type: 'int', default: 0 })
  system_quantity: number;

  @Column({ type: 'int', nullable: true })
  counted_quantity: number | null;

  @Column({ type: 'int', default: 0 })
  diff_quantity: number;

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
  unit_cost: number;

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
  diff_amount: number;

  @Column({ type: 'text', nullable: true })
  note: string | null;
}

