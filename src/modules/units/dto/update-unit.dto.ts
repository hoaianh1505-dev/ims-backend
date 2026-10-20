import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUnitDto {
  @ApiPropertyOptional({ description: 'Unit name', example: 'Gram' })
  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Tên đơn vị tính tối đa 50 ký tự' })
  name?: string;

  @ApiPropertyOptional({ description: 'Unit symbol/abbreviation', example: 'g' })
  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'Ký hiệu đơn vị tính tối đa 20 ký tự' })
  symbol?: string;
}
