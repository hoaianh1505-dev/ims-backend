import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationSeverity } from '../enums/notification-severity.enum';

export class CreateNotificationDto {
  @ApiPropertyOptional({
    description: 'ID người dùng nhận thông báo (để trống nếu gửi cho toàn bộ Quản lý & Admin)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'user_id phải là định dạng UUID' })
  user_id?: string;

  @ApiProperty({
    description: 'Tiêu đề thông báo',
    example: 'Cảnh báo tồn kho tối thiểu',
  })
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Nội dung chi tiết thông báo',
    example: 'Sản phẩm "Chuột Gaming Logitech G102" tại Kho Tổng chỉ còn 3 cái.',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nội dung thông báo không được để trống' })
  message: string;

  @ApiPropertyOptional({
    description: 'Loại thông báo',
    enum: NotificationType,
    default: NotificationType.SYSTEM,
  })
  @IsOptional()
  @IsEnum(NotificationType, { message: 'Loại thông báo không hợp lệ' })
  type?: NotificationType;

  @ApiPropertyOptional({
    description: 'Mức độ nghiêm trọng',
    enum: NotificationSeverity,
    default: NotificationSeverity.INFO,
  })
  @IsOptional()
  @IsEnum(NotificationSeverity, { message: 'Mức độ nghiêm trọng không hợp lệ' })
  severity?: NotificationSeverity;

  @ApiPropertyOptional({
    description: 'Mã định danh liên quan (ID phiếu, ID sản phẩm)',
    example: 'b13f964e-8f42-4850-b97e-491b42bd94c5',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference_id?: string;

  @ApiPropertyOptional({
    description: 'Loại đối tượng liên quan (PRODUCT, STOCK_TRANSACTION, ...)',
    example: 'PRODUCT',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  reference_type?: string;
}

