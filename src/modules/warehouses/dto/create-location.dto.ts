import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, IsOptional } from 'class-validator';

export class CreateLocationDto {
  @ApiProperty({ example: 'LOC-A1-01', description: 'Mã vị trí (duy nhất trong kho)' })
  @IsNotEmpty({ message: 'Mã vị trí không được để trống' })
  @IsString({ message: 'Mã vị trí phải là chuỗi' })
  @MaxLength(50, { message: 'Mã vị trí tối đa 50 ký tự' })
  code: string;

  @ApiProperty({ example: 'Kệ A Tầng 1 Ô 01', description: 'Tên vị trí' })
  @IsNotEmpty({ message: 'Tên vị trí không được để trống' })
  @IsString({ message: 'Tên vị trí phải là chuỗi' })
  @MaxLength(100, { message: 'Tên vị trí tối đa 100 ký tự' })
  name: string;

  @ApiPropertyOptional({ example: 'Khu vực lưu trữ hàng khô, dễ vỡ', description: 'Mô tả vị trí' })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  description?: string;
}
