import { IsOptional, IsString, IsInt, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterProductDto {
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
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi' })
  search?: string;

  @IsOptional()
  @IsUUID('4', { message: 'category_id phải là định dạng UUID hợp lệ' })
  category_id?: string;

  @IsOptional()
  @IsUUID('4', { message: 'supplier_id phải là định dạng UUID hợp lệ' })
  supplier_id?: string;

  @IsOptional()
  @IsUUID('4', { message: 'unit_id phải là định dạng UUID hợp lệ' })
  unit_id?: string;

  @IsOptional()
  @IsString({ message: 'Trường sắp xếp phải là chuỗi' })
  sort?: string;
}
