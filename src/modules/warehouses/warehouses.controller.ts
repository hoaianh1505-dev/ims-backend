import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { FilterWarehouseDto } from './dto/filter-warehouse.dto';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Warehouses & Locations')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get('warehouses')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Lấy danh sách kho hàng (phân trang, tìm kiếm)' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findAllWarehouses(@Query() query: FilterWarehouseDto) {
    return this.warehousesService.findAll(query);
  }

  @Get('warehouses/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Xem chi tiết kho hàng (kèm danh sách vị trí & manager)' })
  @ApiResponse({ status: 200, description: 'Chi tiết kho hàng' })
  @ApiResponse({ status: 404, description: 'Kho không tồn tại' })
  findOneWarehouse(@Param('id', ParseUUIDPipe) id: string) {
    return this.warehousesService.findOne(id);
  }

  @Post('warehouses')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Tạo kho hàng mới (Chỉ Admin)' })
  @ApiResponse({ status: 201, description: 'Tạo kho thành công' })
  @ApiResponse({ status: 409, description: 'Mã kho đã tồn tại' })
  createWarehouse(@Body() createWarehouseDto: CreateWarehouseDto) {
    return this.warehousesService.create(createWarehouseDto);
  }

  @Patch('warehouses/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cập nhật kho hàng / đổi quản lý kho (Chỉ Admin)' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Kho không tồn tại' })
  @ApiResponse({ status: 409, description: 'Mã kho đã được sử dụng' })
  updateWarehouse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWarehouseDto: UpdateWarehouseDto,
  ) {
    return this.warehousesService.update(id, updateWarehouseDto);
  }

  @Delete('warehouses/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Xóa kho hàng (Chỉ Admin)' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Kho không tồn tại' })
  removeWarehouse(@Param('id', ParseUUIDPipe) id: string) {
    return this.warehousesService.remove(id);
  }

  @Get('warehouses/:id/locations')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Lấy danh sách vị trí trong kho' })
  @ApiResponse({ status: 200, description: 'Danh sách vị trí' })
  @ApiResponse({ status: 404, description: 'Kho không tồn tại' })
  findLocations(@Param('id', ParseUUIDPipe) id: string) {
    return this.warehousesService.findLocationsByWarehouse(id);
  }

  @Post('warehouses/:id/locations')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Tạo vị trí mới trong kho (Admin, Manager)' })
  @ApiResponse({ status: 201, description: 'Tạo vị trí thành công' })
  @ApiResponse({ status: 404, description: 'Kho không tồn tại' })
  @ApiResponse({ status: 409, description: 'Mã vị trí đã tồn tại trong kho' })
  createLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createLocationDto: CreateLocationDto,
  ) {
    return this.warehousesService.createLocation(id, createLocationDto);
  }

  @Patch('locations/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Cập nhật thông tin vị trí (Admin, Manager)' })
  @ApiResponse({ status: 200, description: 'Cập nhật vị trí thành công' })
  @ApiResponse({ status: 404, description: 'Vị trí không tồn tại' })
  updateLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    return this.warehousesService.updateLocation(id, updateLocationDto);
  }

  @Delete('locations/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Xóa vị trí trong kho (Admin, Manager)' })
  @ApiResponse({ status: 200, description: 'Xóa vị trí thành công' })
  @ApiResponse({ status: 404, description: 'Vị trí không tồn tại' })
  removeLocation(@Param('id', ParseUUIDPipe) id: string) {
    return this.warehousesService.removeLocation(id);
  }
}
