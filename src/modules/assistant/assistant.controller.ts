import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AssistantService } from './assistant.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('AI Assistant')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post('chat')
  @ApiOperation({
    summary:
      'Gửi câu hỏi tới Trợ lý AI (Tự động thích ứng câu trả lời và quyền hạn theo vai trò Admin, Manager hay Staff)',
  })
  @ApiResponse({
    status: 200,
    description: 'Trợ lý AI trả lời thành công theo phân quyền người dùng',
  })
  chat(
    @CurrentUser() user: any,
    @Body() dto: ChatRequestDto,
  ) {
    return this.assistantService.chat(user, dto);
  }
}
