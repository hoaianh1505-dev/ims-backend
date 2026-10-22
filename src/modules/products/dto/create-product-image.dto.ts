import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductImageDto {
  @ApiProperty({ description: 'Image URL', example: 'https://cdn.example.com/products/lavie-500.jpg' })
  @IsString()
  @IsNotEmpty({ message: 'URL hình ảnh không được để trống' })
  image_url: string;

  @ApiProperty({ description: 'S3 Key for object storage', example: 'products/lavie-500-123456.jpg' })
  @IsString()
  @IsNotEmpty({ message: 's3_key không được để trống' })
  s3_key: string;

  @ApiPropertyOptional({ description: 'Is primary image for the product', default: false })
  @IsBoolean()
  @IsOptional()
  is_primary?: boolean;
}
