import { IsString, IsOptional, MaxLength, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ description: 'Category name', example: 'Điện thoại thông minh' })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Tên danh mục tối đa 100 ký tự' })
  name?: string;

  @ApiPropertyOptional({ description: 'Category description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Parent category UUID (set null to make it root)', nullable: true })
  @IsUUID('4', { message: 'parent_id phải là định dạng UUID hợp lệ' })
  @IsOptional()
  parent_id?: string;
}
