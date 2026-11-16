import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationSeverity } from '../enums/notification-severity.enum';

export class CreateNotificationDto {
  @IsOptional()
  @IsUUID('4', { message: 'user_id phải là định dạng UUID' })
  user_id?: string;

  @IsString({ message: 'Tiêu đề thông báo phải là chuỗi' })
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @MaxLength(255, { message: 'Tiêu đề tối đa 255 ký tự' })
  title: string;

  @IsString({ message: 'Nội dung thông báo phải là chuỗi' })
  @IsNotEmpty({ message: 'Nội dung thông báo không được để trống' })
  message: string;

  @IsOptional()
  @IsEnum(NotificationType, { message: 'Loại thông báo không hợp lệ' })
  type?: NotificationType;

  @IsOptional()
  @IsEnum(NotificationSeverity, { message: 'Mức độ nghiêm trọng không hợp lệ' })
  severity?: NotificationSeverity;

  @IsOptional()
  @IsString({ message: 'reference_id phải là chuỗi' })
  @MaxLength(100, { message: 'reference_id tối đa 100 ký tự' })
  reference_id?: string;

  @IsOptional()
  @IsString({ message: 'reference_type phải là chuỗi' })
  @MaxLength(50, { message: 'reference_type tối đa 50 ký tự' })
  reference_type?: string;
}
