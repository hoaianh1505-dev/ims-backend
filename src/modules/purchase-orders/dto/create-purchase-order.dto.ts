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
  IsDateString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseOrderItemDto {
  @IsUUID('4', { message: 'product_id phải là UUID hợp lệ' })
  product_id: string;

  @Type(() => Number)
  @IsInt({ message: 'Số lượng đặt phải là số nguyên' })
  @Min(1, { message: 'Số lượng đặt tối thiểu là 1' })
  quantity: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Đơn giá phải là số' })
  @Min(0, { message: 'Đơn giá không được âm' })
  unit_price: number;

  @IsOptional()
  @IsString({ message: 'Ghi chú mặt hàng phải là chuỗi' })
  note?: string;
}

export class CreatePurchaseOrderDto {
  @IsUUID('4', { message: 'supplier_id phải là UUID hợp lệ' })
  supplier_id: string;

  @IsUUID('4', { message: 'warehouse_id phải là UUID hợp lệ' })
  warehouse_id: string;

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

  @IsArray({ message: 'Danh sách mặt hàng phải là mảng' })
  @ArrayMinSize(1, { message: 'Đơn đặt hàng phải có ít nhất 1 mặt hàng' })
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items: PurchaseOrderItemDto[];
}

