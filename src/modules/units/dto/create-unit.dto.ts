import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUnitDto {
  @ApiProperty({ description: 'Unit name (e.g. Cái, Hộp, Kilogram)', example: 'Kilogram' })
  @IsString()
  @IsNotEmpty({ message: 'Tên đơn vị tính không được để trống' })
  @MaxLength(50, { message: 'Tên đơn vị tính tối đa 50 ký tự' })
  name: string;

  @ApiPropertyOptional({ description: 'Unit symbol/abbreviation (e.g. cái, hộp, kg)', example: 'kg' })
  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'Ký hiệu đơn vị tính tối đa 20 ký tự' })
  symbol?: string;
}
