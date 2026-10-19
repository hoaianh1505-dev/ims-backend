import { IsString, IsNotEmpty, IsOptional, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Category name', example: 'Điện thoại & Phụ kiện' })
  @IsString()
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  @MaxLength(100, { message: 'Tên danh mục tối đa 100 ký tự' })
  name: string;

  @ApiPropertyOptional({ description: 'Category description', example: 'Các loại điện thoại và phụ kiện đi kèm' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Parent category UUID if this is a subcategory', example: 'b0a7b489-c454-469b-81f1-ec0cba00ff8e' })
  @IsUUID('4', { message: 'parent_id phải là định dạng UUID hợp lệ' })
  @IsOptional()
  parent_id?: string;
}
