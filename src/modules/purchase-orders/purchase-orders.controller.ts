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
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { FilterPurchaseOrderDto } from './dto/filter-purchase-order.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Purchase Orders')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Lấy danh sách đơn đặt hàng nhà cung cấp (lọc trạng thái, NCC, kho, ngày, tìm kiếm)',
  })
  @ApiResponse({ status: 200, description: 'Danh sách đơn đặt hàng được tải thành công' })
  findAll(@Query() query: FilterPurchaseOrderDto) {
    return this.purchaseOrdersService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Lấy chi tiết đơn đặt hàng theo ID',
  })
  @ApiResponse({ status: 200, description: 'Chi tiết đơn đặt hàng' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchaseOrdersService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Tạo mới đơn đặt hàng nhà cung cấp (trạng thái ban đầu là DRAFT)',
  })
  @ApiResponse({ status: 201, description: 'Đơn đặt hàng được tạo thành công' })
  create(
    @Body() dto: CreatePurchaseOrderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.purchaseOrdersService.create(dto, userId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Cập nhật đơn đặt hàng (chỉ áp dụng khi đơn ở trạng thái DRAFT hoặc PENDING_APPROVAL)',
  })
  @ApiResponse({ status: 200, description: 'Cập nhật đơn đặt hàng thành công' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    return this.purchaseOrdersService.update(id, dto);
  }

  @Post(':id/submit')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Gửi đơn đặt hàng lên cấp Quản lý phê duyệt (DRAFT -> PENDING_APPROVAL)',
  })
  @ApiResponse({ status: 200, description: 'Đã gửi duyệt đơn hàng thành công' })
  submitForApproval(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchaseOrdersService.submitForApproval(id);
  }

  @Post(':id/approve')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Quản lý phê duyệt đơn đặt hàng (PENDING_APPROVAL -> APPROVED)',
  })
  @ApiResponse({ status: 200, description: 'Phê duyệt đơn đặt hàng thành công' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.purchaseOrdersService.approve(id, userId);
  }

  @Post(':id/order')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Xác nhận đã gửi đơn hàng cho NCC, đang chờ giao (APPROVED -> ORDERED)',
  })
  @ApiResponse({ status: 200, description: 'Đã chuyển trạng thái sang Đã đặt hàng' })
  markAsOrdered(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchaseOrdersService.markAsOrdered(id);
  }

  @Post(':id/receive')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Nhận hàng khi NCC giao đến: Tự động chuyển PO sang RECEIVED và tự động sinh phiếu Nhập kho (IMPORT) cộng tồn kho',
  })
  @ApiResponse({ status: 200, description: 'Nhận hàng và nhập kho thành công' })
  receive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReceivePurchaseOrderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.purchaseOrdersService.receive(id, dto, userId);
  }

  @Post(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Hủy đơn đặt hàng',
  })
  @ApiResponse({ status: 200, description: 'Đã hủy đơn đặt hàng' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    return this.purchaseOrdersService.cancel(id, reason);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Xóa đơn đặt hàng (chỉ xóa được đơn DRAFT hoặc CANCELLED)',
  })
  @ApiResponse({ status: 200, description: 'Xóa đơn đặt hàng thành công' })
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchaseOrdersService.delete(id);
  }
}

