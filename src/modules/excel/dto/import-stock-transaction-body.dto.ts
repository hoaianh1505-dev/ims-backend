import { IsUUID, IsOptional, IsString } from 'class-validator';

export class ImportStockTransactionBodyDto {
  @IsUUID('4', { message: 'warehouse_id phải là UUID hợp lệ' })
  warehouse_id: string;

  @IsOptional()
  @IsUUID('4', { message: 'supplier_id phải là UUID hợp lệ' })
  supplier_id?: string;

  @IsOptional()
  @IsString({ message: 'Mã phiếu phải là chuỗi ký tự' })
  reference_no?: string;

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  note?: string;
}
