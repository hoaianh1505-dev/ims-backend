import {
  IsUUID,
  IsOptional,
  IsString,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AdjustStockItemDto {
  @IsUUID('4', { message: 'product_id phải là UUID hợp lệ' })
  product_id: string;

  @IsOptional()
  @IsUUID('4', { message: 'location_id phải là UUID hợp lệ' })
  location_id?: string;

  @Type(() => Number)
  @IsInt({ message: 'Số lượng thực tế kiểm kê phải là số nguyên' })
  @Min(0, { message: 'Số lượng thực tế kiểm kê không được âm' })
  counted_quantity: number;
}

export class AdjustStockDto {
  @IsUUID('4', { message: 'warehouse_id phải là UUID hợp lệ' })
  warehouse_id: string;

  @IsOptional()
  @IsString({ message: 'Mã phiếu phải là chuỗi ký tự' })
  reference_no?: string;

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  note?: string;

  @IsArray({ message: 'Danh sách sản phẩm phải là mảng' })
  @ArrayMinSize(1, { message: 'Phiếu kiểm kê điều chỉnh phải có ít nhất 1 sản phẩm' })
  @ValidateNested({ each: true })
  @Type(() => AdjustStockItemDto)
  items: AdjustStockItemDto[];
}
