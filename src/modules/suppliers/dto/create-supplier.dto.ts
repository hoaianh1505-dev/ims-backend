import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsEmail,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiProperty({ description: 'Supplier name', example: 'Công ty TNHH Vinamilk' })
  @IsString()
  @IsNotEmpty({ message: 'Tên nhà cung cấp không được để trống' })
  @MaxLength(150, { message: 'Tên nhà cung cấp tối đa 150 ký tự' })
  name: string;

  @ApiPropertyOptional({ description: 'Supplier code', example: 'SUP-VNM' })
  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Mã nhà cung cấp tối đa 50 ký tự' })
  code?: string;

  @ApiPropertyOptional({ description: 'Contact person name', example: 'Nguyễn Văn A' })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Tên người liên hệ tối đa 100 ký tự' })
  contact_name?: string;

  @ApiPropertyOptional({ description: 'Email address', example: 'contact@vinamilk.com.vn' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsOptional()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '0901234567' })
  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'Số điện thoại tối đa 20 ký tự' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Address', example: 'Số 10 Tân Trào, Quận 7, TP.HCM' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'Active status', default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
