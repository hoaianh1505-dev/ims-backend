import { IsOptional, IsString, IsInt, Min, IsBoolean, IsUUID } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class FilterCategoryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Trang phải là số nguyên' })
  @Min(1, { message: 'Trang tối thiểu là 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số lượng mỗi trang phải là số nguyên' })
  @Min(1, { message: 'Số lượng mỗi trang tối thiểu là 1' })
  limit?: number = 20;

  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi' })
  search?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean({ message: 'tree phải là boolean' })
  tree?: boolean = false;

  @IsOptional()
  @IsUUID('4', { message: 'parent_id phải là định dạng UUID hợp lệ' })
  parent_id?: string;
}
