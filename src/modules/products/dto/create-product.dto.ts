import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsNumber,
  Min,
  IsUUID,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ description: 'Product name', example: 'Nước khoáng Lavie 500ml' })
  @IsString()
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  @MaxLength(200, { message: 'Tên sản phẩm tối đa 200 ký tự' })
  name: string;

  @ApiPropertyOptional({ description: 'Product SKU (auto-generated if omitted)', example: 'LAVIE-500' })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Mã SKU tối đa 100 ký tự' })
  sku?: string;

  @ApiPropertyOptional({ description: 'Product barcode', example: '8934567890123' })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Mã vạch tối đa 100 ký tự' })
  barcode?: string;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Cost price (giá vốn)', example: 4000, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá vốn phải là số' })
  @Min(0, { message: 'Giá vốn không được nhỏ hơn 0' })
  cost_price?: number = 0;

  @ApiPropertyOptional({ description: 'Selling price (giá bán)', example: 6000, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá bán phải là số' })
  @Min(0, { message: 'Giá bán không được nhỏ hơn 0' })
  selling_price?: number = 0;

  @ApiPropertyOptional({ description: 'Low stock warning threshold', example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Ngưỡng cảnh báo tồn kho phải là số nguyên' })
  @Min(0, { message: 'Ngưỡng cảnh báo tồn kho không được âm' })
  low_stock_threshold?: number = 10;

  @ApiPropertyOptional({ description: 'Category UUID' })
  @IsUUID('4', { message: 'category_id phải là định dạng UUID hợp lệ' })
  @IsOptional()
  category_id?: string;

  @ApiPropertyOptional({ description: 'Unit UUID' })
  @IsUUID('4', { message: 'unit_id phải là định dạng UUID hợp lệ' })
  @IsOptional()
  unit_id?: string;

  @ApiPropertyOptional({ description: 'Supplier UUID' })
  @IsUUID('4', { message: 'supplier_id phải là định dạng UUID hợp lệ' })
  @IsOptional()
  supplier_id?: string;
}
