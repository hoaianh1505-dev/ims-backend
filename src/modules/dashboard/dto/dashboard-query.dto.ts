import { IsOptional, IsUUID, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export type DashboardPeriod = '7d' | '30d' | '90d' | 'year';

export class DashboardQueryDto {
  @IsOptional()
  @IsUUID('4', { message: 'ID kho hàng không hợp lệ' })
  warehouse_id?: string;

  @IsOptional()
  @IsIn(['7d', '30d', '90d', 'year'], {
    message: 'Khoảng thời gian phải là 7d, 30d, 90d hoặc year',
  })
  period?: DashboardPeriod;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số lượng giới hạn phải là số nguyên' })
  @Min(1, { message: 'Số lượng giới hạn tối thiểu là 1' })
  @Max(50, { message: 'Số lượng giới hạn tối đa là 50' })
  limit?: number;
}
