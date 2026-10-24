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

export class UpdateProductDto {
  @IsString({ message: 'Tên sản phẩm phải là chuỗi' })
  @IsOptional()
  @MaxLength(200, { message: 'Tên sản phẩm tối đa 200 ký tự' })
  name?: string;

  @IsString({ message: 'Mã SKU phải là chuỗi' })
  @IsOptional()
  @MaxLength(100, { message: 'Mã SKU tối đa 100 ký tự' })
  sku?: string;

  @IsString({ message: 'Mã vạch phải là chuỗi' })
  @IsOptional()
  @MaxLength(100, { message: 'Mã vạch tối đa 100 ký tự' })
  barcode?: string;

  @IsString({ message: 'Mô tả phải là chuỗi' })
  @IsOptional()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá vốn phải là số' })
  @Min(0, { message: 'Giá vốn không được nhỏ hơn 0' })
  cost_price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá bán phải là số' })
  @Min(0, { message: 'Giá bán không được nhỏ hơn 0' })
  selling_price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Ngưỡng cảnh báo tồn kho phải là số nguyên' })
  @Min(0, { message: 'Ngưỡng cảnh báo tồn kho không được âm' })
  low_stock_threshold?: number;

  @IsUUID('4', { message: 'category_id phải là định dạng UUID hợp lệ' })
  @IsOptional()
  category_id?: string;

  @IsUUID('4', { message: 'unit_id phải là định dạng UUID hợp lệ' })
  @IsOptional()
  unit_id?: string;

  @IsUUID('4', { message: 'supplier_id phải là định dạng UUID hợp lệ' })
  @IsOptional()
  supplier_id?: string;
}
