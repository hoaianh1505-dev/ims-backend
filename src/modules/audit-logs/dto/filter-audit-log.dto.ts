import {
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FilterAuditLogDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Trang phải là số nguyên' })
  @Min(1, { message: 'Trang tối thiểu là 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số lượng mỗi trang phải là số nguyên' })
  @Min(1, { message: 'Số lượng mỗi trang tối thiểu là 1' })
  limit?: number = 20;

  @IsOptional()
  @IsUUID('4', { message: 'user_id phải là UUID hợp lệ' })
  user_id?: string;

  @IsOptional()
  @IsString({ message: 'Hành động phải là chuỗi ký tự' })
  action?: string;

  @IsOptional()
  @IsString({ message: 'Tên đối tượng phải là chuỗi ký tự' })
  entity_name?: string;

  @IsOptional()
  @IsString({ message: 'Mã đối tượng phải là chuỗi ký tự' })
  entity_id?: string;

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
