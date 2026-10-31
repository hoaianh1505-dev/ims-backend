import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsArray,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ChatHistoryItemDto {
  @IsIn(['user', 'model'], {
    message: 'Vai trò người gửi phải là user hoặc model',
  })
  role: 'user' | 'model';

  @IsNotEmpty({ message: 'Nội dung tin nhắn lịch sử không được để trống' })
  @IsString({ message: 'Nội dung tin nhắn lịch sử phải là chuỗi' })
  content: string;
}

export class ChatRequestDto {
  @IsNotEmpty({ message: 'Nội dung câu hỏi không được để trống' })
  @IsString({ message: 'Nội dung câu hỏi phải là chuỗi ký tự' })
  @MaxLength(2000, { message: 'Nội dung câu hỏi không được vượt quá 2000 ký tự' })
  message: string;

  @IsOptional()
  @IsArray({ message: 'Lịch sử hội thoại phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryItemDto)
  history?: ChatHistoryItemDto[];
}
