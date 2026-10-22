import {
  IsString,
  IsOptional,
  MaxLength,
  IsNumber,
  Min,
  IsUUID,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto {
  @ApiPropertyOptional({ description: 'Product name', example: 'Nước khoáng Lavie 500ml (Thùng 24)' })
  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'Tên sản phẩm tối đa 200 ký tự' })
  name?: string;

  @ApiPropertyOptional({ description: 'Product SKU', example: 'LAVIE-500-T24' })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Mã SKU tối đa 100 ký tự' })
  sku?: string;

  @ApiPropertyOptional({ description: 'Product barcode' })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Mã vạch tối đa 100 ký tự' })
  barcode?: string;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Cost price (giá vốn)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá vốn phải là số' })
  @Min(0, { message: 'Giá vốn không được nhỏ hơn 0' })
  cost_price?: number;

  @ApiPropertyOptional({ description: 'Selling price (giá bán)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá bán phải là số' })
  @Min(0, { message: 'Giá bán không được nhỏ hơn 0' })
  selling_price?: number;

  @ApiPropertyOptional({ description: 'Low stock warning threshold' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Ngưỡng cảnh báo tồn kho phải là số nguyên' })
  @Min(0, { message: 'Ngưỡng cảnh báo tồn kho không được âm' })
  low_stock_threshold?: number;

  @ApiPropertyOptional({ description: 'Category UUID', nullable: true })
  @IsUUID('4', { message: 'category_id phải là định dạng UUID hợp lệ' })
  @IsOptional()
  category_id?: string;

  @ApiPropertyOptional({ description: 'Unit UUID', nullable: true })
  @IsUUID('4', { message: 'unit_id phải là định dạng UUID hợp lệ' })
  @IsOptional()
  unit_id?: string;

  @ApiPropertyOptional({ description: 'Supplier UUID', nullable: true })
  @IsUUID('4', { message: 'supplier_id phải là định dạng UUID hợp lệ' })
  @IsOptional()
  supplier_id?: string;
}
