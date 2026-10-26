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

export class ExportStockItemDto {
  @IsUUID('4', { message: 'product_id phải là UUID hợp lệ' })
  product_id: string;

  @IsOptional()
  @IsUUID('4', { message: 'location_id phải là UUID hợp lệ' })
  location_id?: string;

  @Type(() => Number)
  @IsInt({ message: 'Số lượng xuất phải là số nguyên' })
  @Min(1, { message: 'Số lượng xuất tối thiểu là 1' })
  quantity: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Đơn giá phải là số' })
  @Min(0, { message: 'Đơn giá không được âm' })
  unit_price?: number;
}

export class ExportStockDto {
  @IsUUID('4', { message: 'warehouse_id phải là UUID hợp lệ' })
  warehouse_id: string;

  @IsOptional()
  @IsString({ message: 'Mã phiếu phải là chuỗi ký tự' })
  reference_no?: string;

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  note?: string;

  @IsArray({ message: 'Danh sách sản phẩm phải là mảng' })
  @ArrayMinSize(1, { message: 'Phiếu xuất phải có ít nhất 1 sản phẩm' })
  @ValidateNested({ each: true })
  @Type(() => ExportStockItemDto)
  items: ExportStockItemDto[];
}
