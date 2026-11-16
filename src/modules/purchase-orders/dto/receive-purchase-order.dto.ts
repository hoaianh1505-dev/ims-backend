import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ReceivePurchaseOrderDto {
  @IsOptional()
  @IsUUID('4', { message: 'location_id phải là định dạng UUID' })
  location_id?: string;

  @IsOptional()
  @IsString({ message: 'Ghi chú nhận hàng phải là chuỗi' })
  note?: string;
}
