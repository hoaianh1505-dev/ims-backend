import { IsNotEmpty, IsString, MaxLength, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreateWarehouseDto {
  @IsNotEmpty({ message: 'Tên kho không được để trống' })
  @IsString({ message: 'Tên kho phải là chuỗi' })
  @MaxLength(150, { message: 'Tên kho tối đa 150 ký tự' })
  name: string;

  @IsNotEmpty({ message: 'Mã kho không được để trống' })
  @IsString({ message: 'Mã kho phải là chuỗi' })
  @MaxLength(50, { message: 'Mã kho tối đa 50 ký tự' })
  code: string;

  @IsOptional()
  @IsUUID('4', { message: 'manager_id phải là UUID v4 hợp lệ' })
  manager_id?: string;

  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi' })
  address?: string;

  @IsOptional()
  @IsBoolean({ message: 'is_active phải là boolean' })
  is_active?: boolean;
}
