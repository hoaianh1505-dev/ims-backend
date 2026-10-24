import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateProductImageDto {
  @IsString({ message: 'URL hình ảnh phải là chuỗi' })
  @IsNotEmpty({ message: 'URL hình ảnh không được để trống' })
  image_url: string;

  @IsString({ message: 's3_key phải là chuỗi' })
  @IsNotEmpty({ message: 's3_key không được để trống' })
  s3_key: string;

  @IsBoolean({ message: 'is_primary phải là boolean' })
  @IsOptional()
  is_primary?: boolean;
}
