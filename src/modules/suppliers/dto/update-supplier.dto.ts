import {
  IsString,
  IsOptional,
  MaxLength,
  IsEmail,
  IsBoolean,
} from 'class-validator';

export class UpdateSupplierDto {
  @IsString({ message: 'Tên nhà cung cấp phải là chuỗi' })
  @IsOptional()
  @MaxLength(150, { message: 'Tên nhà cung cấp tối đa 150 ký tự' })
  name?: string;

  @IsString({ message: 'Mã nhà cung cấp phải là chuỗi' })
  @IsOptional()
  @MaxLength(50, { message: 'Mã nhà cung cấp tối đa 50 ký tự' })
  code?: string;

  @IsString({ message: 'Tên người liên hệ phải là chuỗi' })
  @IsOptional()
  @MaxLength(100, { message: 'Tên người liên hệ tối đa 100 ký tự' })
  contact_name?: string;

  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsOptional()
  @MaxLength(100, { message: 'Email tối đa 100 ký tự' })
  email?: string;

  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  @IsOptional()
  @MaxLength(20, { message: 'Số điện thoại tối đa 20 ký tự' })
  phone?: string;

  @IsString({ message: 'Địa chỉ phải là chuỗi' })
  @IsOptional()
  address?: string;

  @IsBoolean({ message: 'Trạng thái hoạt động phải là boolean' })
  @IsOptional()
  is_active?: boolean;
}
