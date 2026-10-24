import { 
  IsString, 
  IsNotEmpty, 
  IsEmail, 
  IsOptional, 
  MinLength, 
  MaxLength, 
  IsEnum 
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsString({ message: 'Username phải là chuỗi' })
  @IsNotEmpty({ message: 'Username không được để trống' })
  @MaxLength(50, { message: 'Username tối đa 50 ký tự' })
  username: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @IsString({ message: 'Tên hiển thị phải là chuỗi' })
  @IsOptional()
  @MaxLength(100, { message: 'Tên hiển thị tối đa 100 ký tự' })
  display_name?: string;

  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  @IsOptional()
  @MaxLength(20, { message: 'Số điện thoại tối đa 20 ký tự' })
  phone?: string;

  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsOptional()
  email?: string;

  @IsEnum(UserRole, { message: 'Quyền (Role) không hợp lệ' })
  @IsOptional()
  role?: UserRole;
}
