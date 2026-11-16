import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsEmail,
  IsEnum,
  IsNumber,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerType } from '../enums/customer-type.enum';

export class CreateCustomerDto {
  @IsString({ message: 'Tên khách hàng phải là chuỗi' })
  @IsNotEmpty({ message: 'Tên khách hàng không được để trống' })
  @MaxLength(150, { message: 'Tên khách hàng tối đa 150 ký tự' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Mã khách hàng phải là chuỗi' })
  @MaxLength(50, { message: 'Mã khách hàng tối đa 50 ký tự' })
  code?: string;

  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  @MaxLength(20, { message: 'Số điện thoại tối đa 20 ký tự' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @MaxLength(100, { message: 'Email tối đa 100 ký tự' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi' })
  address?: string;

  @IsOptional()
  @IsEnum(CustomerType, { message: 'Loại khách hàng không hợp lệ (RETAIL, WHOLESALE, DISTRIBUTOR)' })
  type?: CustomerType;

  @IsOptional()
  @IsString({ message: 'Mã số thuế phải là chuỗi' })
  @MaxLength(50, { message: 'Mã số thuế tối đa 50 ký tự' })
  tax_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Hạn mức công nợ phải là số' })
  @Min(0, { message: 'Hạn mức công nợ không được âm' })
  debt_limit?: number;

  @IsOptional()
  @IsBoolean({ message: 'Trạng thái hoạt động phải là boolean' })
  is_active?: boolean;

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  note?: string;
}
