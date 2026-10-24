import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiPropertyOptional({ description: 'Refresh token (nếu không truyền qua body thì đọc từ Cookie)' })
  @IsOptional()
  @IsString({ message: 'refresh_token phải là chuỗi' })
  refresh_token?: string;
}
