import {
  IsUUID,
  IsOptional,
  IsString,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsInt,
  Min,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ImportStockItemDto {
  @IsUUID('4', { message: 'product_id phải là UUID hợp lệ' })
  product_id: string;

  @IsOptional()
  @IsUUID('4', { message: 'location_id phải là UUID hợp lệ' })
  location_id?: string;

  @Type(() => Number)
  @IsInt({ message: 'Số lượng nhập phải là số nguyên' })
  @Min(1, { message: 'Số lượng nhập tối thiểu là 1' })
  quantity: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Đơn giá phải là số' })
  @Min(0, { message: 'Đơn giá không được âm' })
  unit_price?: number;
}

export class ImportStockDto {
  @IsUUID('4', { message: 'warehouse_id phải là UUID hợp lệ' })
  warehouse_id: string;

  @IsOptional()
  @IsUUID('4', { message: 'supplier_id phải là UUID hợp lệ' })
  supplier_id?: string;

  @IsOptional()
  @IsString({ message: 'Mã phiếu phải là chuỗi ký tự' })
  reference_no?: string;

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  note?: string;

  @IsArray({ message: 'Danh sách sản phẩm phải là mảng' })
  @ArrayMinSize(1, { message: 'Phiếu nhập phải có ít nhất 1 sản phẩm' })
  @ValidateNested({ each: true })
  @Type(() => ImportStockItemDto)
  items: ImportStockItemDto[];
}
