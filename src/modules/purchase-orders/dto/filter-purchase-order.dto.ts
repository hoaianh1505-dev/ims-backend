import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseOrderStatus } from '../enums/purchase-order-status.enum';

export class FilterPurchaseOrderDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Trang phải là số nguyên' })
  @Min(1, { message: 'Trang tối thiểu là 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số lượng mỗi trang phải là số nguyên' })
  @Min(1, { message: 'Số lượng mỗi trang tối thiểu là 1' })
  limit?: number = 10;

  @IsOptional()
  @IsEnum(PurchaseOrderStatus, { message: 'Trạng thái đơn hàng không hợp lệ' })
  status?: PurchaseOrderStatus;

  @IsOptional()
  @IsUUID('4', { message: 'supplier_id phải là UUID hợp lệ' })
  supplier_id?: string;

  @IsOptional()
  @IsUUID('4', { message: 'warehouse_id phải là UUID hợp lệ' })
  warehouse_id?: string;

  @IsOptional()
  @IsDateString({}, { message: 'from_date phải là định dạng ngày hợp lệ (ISO 8601)' })
  from_date?: string;

  @IsOptional()
  @IsDateString({}, { message: 'to_date phải là định dạng ngày hợp lệ (ISO 8601)' })
  to_date?: string;

  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi' })
  search?: string;
}

