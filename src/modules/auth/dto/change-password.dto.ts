import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password' })
  @IsNotEmpty()
  @IsString()
  current_password: string;

  @ApiProperty({ description: 'New password', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  new_password: string;
}
