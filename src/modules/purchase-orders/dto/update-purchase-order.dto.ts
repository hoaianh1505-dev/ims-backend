import {
  IsUUID,
  IsOptional,
  IsString,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseOrderItemDto } from './create-purchase-order.dto';

export class UpdatePurchaseOrderDto {
  @IsOptional()
  @IsUUID('4', { message: 'supplier_id phải là UUID hợp lệ' })
  supplier_id?: string;

  @IsOptional()
  @IsUUID('4', { message: 'warehouse_id phải là UUID hợp lệ' })
  warehouse_id?: string;

  @IsOptional()
  @IsString({ message: 'Mã đơn đặt hàng phải là chuỗi' })
  @MaxLength(50, { message: 'Mã đơn đặt hàng tối đa 50 ký tự' })
  code?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày dự kiến giao hàng phải đúng định dạng ngày (ISO 8601)' })
  expected_delivery_date?: string;

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  note?: string;

  @IsOptional()
  @IsArray({ message: 'Danh sách mặt hàng phải là mảng' })
  @ArrayMinSize(1, { message: 'Đơn đặt hàng phải có ít nhất 1 mặt hàng' })
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items?: PurchaseOrderItemDto[];
}
