import {
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  Min,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StockTransactionType } from '../enums/stock-transaction-type.enum';

export class FilterStockTransactionDto {
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
  @IsEnum(StockTransactionType, { message: 'Loại giao dịch không hợp lệ' })
  type?: StockTransactionType;

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
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi ký tự' })
  search?: string;
}
