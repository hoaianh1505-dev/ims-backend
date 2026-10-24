import { IsNotEmpty, IsString, MaxLength, IsOptional } from 'class-validator';

export class CreateLocationDto {
  @IsNotEmpty({ message: 'Mã vị trí không được để trống' })
  @IsString({ message: 'Mã vị trí phải là chuỗi' })
  @MaxLength(50, { message: 'Mã vị trí tối đa 50 ký tự' })
  code: string;

  @IsNotEmpty({ message: 'Tên vị trí không được để trống' })
  @IsString({ message: 'Tên vị trí phải là chuỗi' })
  @MaxLength(100, { message: 'Tên vị trí tối đa 100 ký tự' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  description?: string;
}
