import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  MaxLength,
} from 'class-validator';

export class CreateStocktakingDto {
  @IsUUID('4', { message: 'warehouse_id phải là định dạng UUID' })
  @IsNotEmpty({ message: 'Vui lòng chọn kho hàng cần kiểm kê' })
  warehouse_id: string;

  @IsString({ message: 'Tiêu đề đợt kiểm kê phải là chuỗi' })
  @IsNotEmpty({ message: 'Tiêu đề đợt kiểm kê không được để trống' })
  @MaxLength(255, { message: 'Tiêu đề tối đa 255 ký tự' })
  title: string;

  @IsOptional()
  @IsString({ message: 'Mã phiên kiểm kê phải là chuỗi' })
  @MaxLength(50, { message: 'Mã phiên kiểm kê tối đa 50 ký tự' })
  code?: string;

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  note?: string;

  @IsOptional()
  @IsArray({ message: 'Danh sách ID sản phẩm chỉ định phải là mảng' })
  @IsUUID('4', { each: true, message: 'ID sản phẩm không hợp lệ' })
  product_ids?: string[];
}
