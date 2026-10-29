import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Lấy các chỉ số KPI tổng quan (sản phẩm, kho, tồn kho, giá trị tồn, cảnh báo)',
  })
  @ApiResponse({
    status: 200,
    description: 'Thống kê tổng quan KPI thành công',
  })
  getStats(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getStats(query);
  }

  @Get('stock-movement')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Biểu đồ biến động xuất nhập tồn kho theo thời gian (7d, 30d, 90d, year)',
  })
  @ApiResponse({
    status: 200,
    description: 'Dữ liệu biểu đồ biến động kho thành công',
  })
  getStockMovement(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getStockMovement(query);
  }

  @Get('inventory-by-warehouse')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Thống kê phân bổ tồn kho và giá trị theo từng kho hàng',
  })
  @ApiResponse({
    status: 200,
    description: 'Dữ liệu tồn kho theo từng kho hàng',
  })
  getInventoryByWarehouse() {
    return this.dashboardService.getInventoryByWarehouse();
  }

  @Get('inventory-by-category')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Thống kê tỷ lệ và số lượng sản phẩm theo danh mục',
  })
  @ApiResponse({
    status: 200,
    description: 'Dữ liệu tỷ lệ tồn kho theo danh mục',
  })
  getInventoryByCategory() {
    return this.dashboardService.getInventoryByCategory();
  }

  @Get('top-products')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Top sản phẩm xuất kho nhiều nhất trong kỳ',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách top sản phẩm xuất kho',
  })
  getTopProducts(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getTopProducts(query);
  }

  @Get('low-stock-alerts')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Danh sách các sản phẩm sắp hết hoặc đã hết hàng',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách cảnh báo tồn kho tối thiểu',
  })
  getLowStockAlerts(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getLowStockAlerts(query);
  }

  @Get('recent-transactions')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Danh sách giao dịch kho mới nhất',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách giao dịch gần đây',
  })
  getRecentTransactions(@Query('limit') limit?: number) {
    return this.dashboardService.getRecentTransactions(limit ? Number(limit) : 10);
  }

  @Get('recent-activity')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Nhật ký hoạt động và thao tác người dùng gần đây',
  })
  @ApiResponse({
    status: 200,
    description: 'Nhật ký thao tác gần đây',
  })
  getRecentActivity(@Query('limit') limit?: number) {
    return this.dashboardService.getRecentActivity(limit ? Number(limit) : 10);
  }
}
