import { IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { StockTransactionType } from '../../stock-transactions/enums/stock-transaction-type.enum';

export class ExportStockTransactionsQueryDto {
  @IsOptional()
  @IsEnum(StockTransactionType, { message: 'Loại giao dịch không hợp lệ' })
  type?: StockTransactionType;

  @IsOptional()
  @IsUUID('4', { message: 'warehouse_id phải là UUID hợp lệ' })
  warehouse_id?: string;

  @IsOptional()
  @IsDateString({}, { message: 'from_date phải là định dạng ngày hợp lệ (ISO 8601)' })
  from_date?: string;

  @IsOptional()
  @IsDateString({}, { message: 'to_date phải là định dạng ngày hợp lệ (ISO 8601)' })
  to_date?: string;
}
