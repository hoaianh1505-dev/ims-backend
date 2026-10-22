import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreateWarehouseDto {
  @ApiProperty({ example: 'Kho Tổng Miền Nam', description: 'Tên kho hàng' })
  @IsNotEmpty({ message: 'Tên kho không được để trống' })
  @IsString({ message: 'Tên kho phải là chuỗi' })
  @MaxLength(150, { message: 'Tên kho tối đa 150 ký tự' })
  name: string;

  @ApiProperty({ example: 'WH-HCM-01', description: 'Mã kho (duy nhất)' })
  @IsNotEmpty({ message: 'Mã kho không được để trống' })
  @IsString({ message: 'Mã kho phải là chuỗi' })
  @MaxLength(50, { message: 'Mã kho tối đa 50 ký tự' })
  code: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'ID người quản lý kho (Manager)' })
  @IsOptional()
  @IsUUID('4', { message: 'manager_id phải là UUID v4 hợp lệ' })
  manager_id?: string;

  @ApiPropertyOptional({ example: '123 Quốc lộ 1A, Bình Tân, TP.HCM', description: 'Địa chỉ kho' })
  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi' })
  address?: string;

  @ApiPropertyOptional({ example: true, default: true, description: 'Trạng thái hoạt động' })
  @IsOptional()
  @IsBoolean({ message: 'is_active phải là boolean' })
  is_active?: boolean;
}
