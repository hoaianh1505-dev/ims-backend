import { IsString, IsNotEmpty, IsOptional, MaxLength, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  @IsString({ message: 'Tên danh mục phải là chuỗi' })
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  @MaxLength(100, { message: 'Tên danh mục tối đa 100 ký tự' })
  name: string;

  @IsString({ message: 'Mô tả phải là chuỗi' })
  @IsOptional()
  description?: string;

  @IsUUID('4', { message: 'parent_id phải là định dạng UUID hợp lệ' })
  @IsOptional()
  parent_id?: string;
}
