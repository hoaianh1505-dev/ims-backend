import { IsOptional, IsString, IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterInventoryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Trang phải là số nguyên' })
  @Min(1, { message: 'Trang tối thiểu là 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số lượng mỗi trang phải là số nguyên' })
  @Min(1, { message: 'Số lượng mỗi trang tối thiểu là 1' })
  limit?: number = 20;

  @IsOptional()
  @IsUUID('4', { message: 'warehouse_id phải là UUID hợp lệ' })
  warehouse_id?: string;

  @IsOptional()
  @IsUUID('4', { message: 'location_id phải là UUID hợp lệ' })
  location_id?: string;

  @IsOptional()
  @IsUUID('4', { message: 'product_id phải là UUID hợp lệ' })
  product_id?: string;

  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi' })
  search?: string;
}
