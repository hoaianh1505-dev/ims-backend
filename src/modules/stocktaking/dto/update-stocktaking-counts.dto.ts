import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class StocktakingCountItemDto {
  @IsUUID('4', { message: 'item_id phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'item_id không được để trống' })
  item_id: string;

  @Type(() => Number)
  @IsInt({ message: 'Số lượng đếm thực tế phải là số nguyên' })
  @Min(0, { message: 'Số lượng đếm thực tế không được âm' })
  counted_quantity: number;

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  note?: string;
}

export class UpdateStocktakingCountsDto {
  @IsArray({ message: 'Danh sách kiểm đếm phải là mảng' })
  @ArrayMinSize(1, { message: 'Cần cập nhật ít nhất 1 dòng kiểm kê' })
  @ValidateNested({ each: true })
  @Type(() => StocktakingCountItemDto)
  items: StocktakingCountItemDto[];
}
