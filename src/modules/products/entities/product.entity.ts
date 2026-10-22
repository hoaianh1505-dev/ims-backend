import {
  Entity,
  Column,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CategoryEntity } from '../../categories/entities/category.entity';
import { UnitEntity } from '../../units/entities/unit.entity';
import { SupplierEntity } from '../../suppliers/entities/supplier.entity';
import { ProductImageEntity } from './product-image.entity';

@Entity('products')
export class ProductEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  sku: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  barcode: string;

  @Column({ type: 'text', nullable: true })
  description: string;

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
  cost_price: number;

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
  selling_price: number;

  @Column({ type: 'int', default: 10 })
  low_stock_threshold: number;

  @Column({ type: 'uuid', nullable: true })
  category_id: string;

  @Column({ type: 'uuid', nullable: true })
  unit_id: string;

  @Column({ type: 'uuid', nullable: true })
  supplier_id: string;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at: Date;

  @ManyToOne(() => CategoryEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: CategoryEntity;

  @ManyToOne(() => UnitEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'unit_id' })
  unit: UnitEntity;

  @ManyToOne(() => SupplierEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'supplier_id' })
  supplier: SupplierEntity;

  @OneToMany(() => ProductImageEntity, (image) => image.product)
  images: ProductImageEntity[];
}
