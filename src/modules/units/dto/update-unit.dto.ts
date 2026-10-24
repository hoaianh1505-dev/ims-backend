import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateUnitDto {
  @IsString({ message: 'Tên đơn vị tính phải là chuỗi' })
  @IsOptional()
  @MaxLength(50, { message: 'Tên đơn vị tính tối đa 50 ký tự' })
  name?: string;

  @IsString({ message: 'Ký hiệu phải là chuỗi' })
  @IsOptional()
  @MaxLength(20, { message: 'Ký hiệu đơn vị tính tối đa 20 ký tự' })
  symbol?: string;
}
