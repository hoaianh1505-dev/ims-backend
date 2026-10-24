import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { WarehouseEntity } from '../../warehouses/entities/warehouse.entity';
import { WarehouseLocationEntity } from '../../warehouses/entities/warehouse-location.entity';
import { ProductEntity } from '../../products/entities/product.entity';

@Entity('inventory')
@Index(['warehouse_id', 'location_id', 'product_id'], { unique: true })
export class InventoryEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  warehouse_id: string;

  @ManyToOne(() => WarehouseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: WarehouseEntity;

  @Column({ type: 'uuid', nullable: true })
  location_id: string | null;

  @ManyToOne(() => WarehouseLocationEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'location_id' })
  location: WarehouseLocationEntity | null;

  @Column({ type: 'uuid' })
  product_id: string;

  @ManyToOne(() => ProductEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @Column({ type: 'int', default: 0 })
  quantity: number;
}
