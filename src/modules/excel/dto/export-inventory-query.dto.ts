import { IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class ExportInventoryQueryDto {
  @IsOptional()
  @IsUUID('4', { message: 'warehouse_id phải là UUID hợp lệ' })
  warehouse_id?: string;

  @IsOptional()
  @IsUUID('4', { message: 'category_id phải là UUID hợp lệ' })
  category_id?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'low_stock phải là giá trị boolean (true/false)' })
  low_stock?: boolean;
}
