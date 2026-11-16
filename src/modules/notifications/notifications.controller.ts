import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { FilterNotificationDto } from './dto/filter-notification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Sse('stream')
  @ApiOperation({
    summary: 'Kênh truyền sự kiện thời gian thực Server-Sent Events (SSE) để bắn thông báo ngay lập tức',
  })
  @ApiResponse({
    status: 200,
    description: 'Luồng dữ liệu sự kiện thời gian thực (text/event-stream)',
  })
  stream(@CurrentUser('id') userId: string): Observable<MessageEvent> {
    return this.notificationsService.getStream(userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách thông báo của người dùng hiện tại (kèm phân trang, lọc theo trạng thái, tìm kiếm)',
  })
  @ApiResponse({ status: 200, description: 'Danh sách thông báo được tải thành công' })
  findAll(
    @CurrentUser('id') userId: string,
    @Query() query: FilterNotificationDto,
  ) {
    return this.notificationsService.findAll(userId, query);
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'Lấy số lượng thông báo chưa đọc',
  })
  @ApiResponse({ status: 200, description: 'Số lượng thông báo chưa đọc' })
  getUnreadCount(@CurrentUser('id') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch('read-all')
  @ApiOperation({
    summary: 'Đánh dấu tất cả thông báo là đã đọc',
  })
  @ApiResponse({ status: 200, description: 'Đã đánh dấu toàn bộ thông báo là đã đọc' })
  markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Đánh dấu 1 thông báo cụ thể là đã đọc',
  })
  @ApiResponse({ status: 200, description: 'Thông báo đã được đánh dấu là đã đọc' })
  markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa 1 thông báo khỏi danh sách',
  })
  @ApiResponse({ status: 200, description: 'Xóa thông báo thành công' })
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.delete(id, userId);
  }
}

