import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsBoolean({ message: 'Trạng thái hoạt động phải là boolean' })
  is_active?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'must_change_password phải là boolean' })
  must_change_password?: boolean;
}
