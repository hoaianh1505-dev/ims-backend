import { IsString, IsOptional, MaxLength, IsUUID } from 'class-validator';

export class UpdateCategoryDto {
  @IsString({ message: 'Tên danh mục phải là chuỗi' })
  @IsOptional()
  @MaxLength(100, { message: 'Tên danh mục tối đa 100 ký tự' })
  name?: string;

  @IsString({ message: 'Mô tả phải là chuỗi' })
  @IsOptional()
  description?: string;

  @IsUUID('4', { message: 'parent_id phải là định dạng UUID hợp lệ' })
  @IsOptional()
  parent_id?: string;
}
