import { IsOptional, IsString, IsInt, Min, IsEnum, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { UserRole } from '../entities/user.entity';

export class FilterUserDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Trang phải là số nguyên' })
  @Min(1, { message: 'Trang tối thiểu là 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số lượng mỗi trang phải là số nguyên' })
  @Min(1, { message: 'Số lượng mỗi trang tối thiểu là 1' })
  limit?: number = 10;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Quyền (Role) không hợp lệ' })
  role?: UserRole;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean({ message: 'Trạng thái hoạt động phải là boolean' })
  is_active?: boolean;

  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi' })
  search?: string;
}
