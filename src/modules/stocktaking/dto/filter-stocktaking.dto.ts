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
import { StocktakingStatus } from '../enums/stocktaking-status.enum';

export class FilterStocktakingDto {
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
  @IsUUID('4', { message: 'warehouse_id phải là UUID hợp lệ' })
  warehouse_id?: string;

  @IsOptional()
  @IsEnum(StocktakingStatus, { message: 'Trạng thái kiểm kê không hợp lệ' })
  status?: StocktakingStatus;

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

