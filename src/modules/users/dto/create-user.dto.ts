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
  @IsString()
  @IsNotEmpty({ message: 'Username không được để trống' })
  @MaxLength(50)
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  display_name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsOptional()
  email?: string;

  @IsEnum(UserRole, { message: 'Quyền (Role) không hợp lệ' })
  @IsOptional()
  role?: UserRole;
}
