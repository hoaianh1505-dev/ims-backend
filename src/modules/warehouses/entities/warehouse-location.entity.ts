import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { WarehouseEntity } from './warehouse.entity';

@Entity('warehouse_locations')
export class WarehouseLocationEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  warehouse_id: string;

  @ManyToOne(() => WarehouseEntity, (w) => w.locations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: WarehouseEntity;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;
}
