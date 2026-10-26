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

export class TransferStockItemDto {
  @IsUUID('4', { message: 'product_id phải là UUID hợp lệ' })
  product_id: string;

  @IsOptional()
  @IsUUID('4', { message: 'location_id phải là UUID hợp lệ' })
  location_id?: string;

  @IsOptional()
  @IsUUID('4', { message: 'target_location_id phải là UUID hợp lệ' })
  target_location_id?: string;

  @Type(() => Number)
  @IsInt({ message: 'Số lượng chuyển phải là số nguyên' })
  @Min(1, { message: 'Số lượng chuyển tối thiểu là 1' })
  quantity: number;
}

export class TransferStockDto {
  @IsUUID('4', { message: 'warehouse_id (kho xuất) phải là UUID hợp lệ' })
  warehouse_id: string;

  @IsUUID('4', { message: 'target_warehouse_id (kho nhập) phải là UUID hợp lệ' })
  target_warehouse_id: string;

  @IsOptional()
  @IsString({ message: 'Mã phiếu phải là chuỗi ký tự' })
  reference_no?: string;

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  note?: string;

  @IsArray({ message: 'Danh sách sản phẩm phải là mảng' })
  @ArrayMinSize(1, { message: 'Phiếu chuyển kho phải có ít nhất 1 sản phẩm' })
  @ValidateNested({ each: true })
  @Type(() => TransferStockItemDto)
  items: TransferStockItemDto[];
}
