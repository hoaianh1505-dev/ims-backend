import { IsOptional, IsString, IsUUID, IsObject } from 'class-validator';

export class CreateAuditLogDto {
  @IsOptional()
  @IsUUID('4', { message: 'user_id phải là UUID hợp lệ' })
  user_id?: string | null;

  @IsString({ message: 'action phải là chuỗi ký tự' })
  action: string;

  @IsString({ message: 'entity_name phải là chuỗi ký tự' })
  entity_name: string;

  @IsOptional()
  @IsString({ message: 'entity_id phải là chuỗi ký tự' })
  entity_id?: string | null;

  @IsOptional()
  @IsObject({ message: 'details phải là một đối tượng dữ liệu' })
  details?: Record<string, any> | null;

  @IsOptional()
  @IsString({ message: 'ip_address phải là chuỗi ký tự' })
  ip_address?: string | null;
}
