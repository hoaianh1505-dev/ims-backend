import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationSeverity } from '../enums/notification-severity.enum';

export class FilterNotificationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Trang phải là số nguyên' })
  @Min(1, { message: 'Trang tối thiểu là 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số lượng mỗi trang phải là số nguyên' })
  @Min(1, { message: 'Số lượng mỗi trang tối thiểu là 1' })
  limit?: number = 15;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean({ message: 'is_read phải là kiểu boolean' })
  is_read?: boolean;

  @IsOptional()
  @IsEnum(NotificationType, { message: 'Loại thông báo không hợp lệ' })
  type?: NotificationType;

  @IsOptional()
  @IsEnum(NotificationSeverity, { message: 'Mức độ nghiêm trọng không hợp lệ' })
  severity?: NotificationSeverity;

  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi' })
  search?: string;
}
