import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StocktakingService } from './stocktaking.service';
import { CreateStocktakingDto } from './dto/create-stocktaking.dto';
import { UpdateStocktakingCountsDto } from './dto/update-stocktaking-counts.dto';
import { FilterStocktakingDto } from './dto/filter-stocktaking.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Stocktaking')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stocktaking')
export class StocktakingController {
  constructor(private readonly stocktakingService: StocktakingService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Lấy danh sách các đợt kiểm kê kho (lọc theo kho, trạng thái, khoảng ngày, tìm kiếm)',
  })
  @ApiResponse({ status: 200, description: 'Danh sách đợt kiểm kê được tải thành công' })
  findAll(@Query() query: FilterStocktakingDto) {
    return this.stocktakingService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Lấy chi tiết đợt kiểm kê kèm danh sách từng mặt hàng, tồn hệ thống và thực đếm',
  })
  @ApiResponse({ status: 200, description: 'Chi tiết đợt kiểm kê' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.stocktakingService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Khởi tạo đợt kiểm kê kho mới (Tự động chụp snapshot tồn kho hệ thống tại thời điểm mở)',
  })
  @ApiResponse({ status: 201, description: 'Đợt kiểm kê được tạo thành công' })
  create(
    @Body() dto: CreateStocktakingDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.stocktakingService.create(dto, userId);
  }

  @Patch(':id/counts')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Cập nhật số lượng kiểm đếm thực tế của nhân viên kho (hệ thống tự động tính độ lệch và tiền chênh lệch)',
  })
  @ApiResponse({ status: 200, description: 'Cập nhật kết quả kiểm đếm thành công' })
  updateCounts(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStocktakingCountsDto,
  ) {
    return this.stocktakingService.updateCounts(id, dto);
  }

  @Post(':id/complete')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Chốt kiểm kê: Tự động sinh phiếu điều chỉnh kho (ADJUSTMENT) để cân bằng tồn kho với thực tế',
  })
  @ApiResponse({ status: 200, description: 'Chốt kiểm kê và cân bằng tồn kho thành công' })
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.stocktakingService.complete(id, userId);
  }

  @Post(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Hủy đợt kiểm kê đang tiến hành',
  })
  @ApiResponse({ status: 200, description: 'Đã hủy đợt kiểm kê' })
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.stocktakingService.cancel(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Xóa đợt kiểm kê (chỉ áp dụng cho đợt chưa chốt cân bằng kho)',
  })
  @ApiResponse({ status: 200, description: 'Đã xóa đợt kiểm kê' })
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.stocktakingService.delete(id);
  }
}

