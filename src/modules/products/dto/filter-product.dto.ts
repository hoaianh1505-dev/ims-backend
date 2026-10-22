import { IsOptional, IsString, IsInt, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterProductDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Search keyword (name, SKU, barcode)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category UUID' })
  @IsOptional()
  @IsUUID('4')
  category_id?: string;

  @ApiPropertyOptional({ description: 'Filter by supplier UUID' })
  @IsOptional()
  @IsUUID('4')
  supplier_id?: string;

  @ApiPropertyOptional({ description: 'Filter by unit UUID' })
  @IsOptional()
  @IsUUID('4')
  unit_id?: string;

  @ApiPropertyOptional({ description: 'Sort by field:order (e.g. created_at:desc, selling_price:asc)' })
  @IsOptional()
  @IsString()
  sort?: string;
}
