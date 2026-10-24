import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsOptional()
  @IsString({ message: 'refresh_token phải là chuỗi' })
  refresh_token?: string;
}
