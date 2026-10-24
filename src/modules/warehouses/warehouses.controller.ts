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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
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
  @ApiOperation({ summary: 'Get list of warehouses with pagination and search' })
  @ApiResponse({ status: 200, description: 'Warehouses retrieved successfully' })
  findAllWarehouses(@Query() query: FilterWarehouseDto) {
    return this.warehousesService.findAll(query);
  }

  @Get('warehouses/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get warehouse details by ID (including locations and manager)' })
  @ApiResponse({ status: 200, description: 'Warehouse details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  findOneWarehouse(@Param('id', ParseUUIDPipe) id: string) {
    return this.warehousesService.findOne(id);
  }

  @Post('warehouses')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new warehouse (Admin only)' })
  @ApiResponse({ status: 201, description: 'Warehouse created successfully' })
  @ApiResponse({ status: 409, description: 'Warehouse code already exists' })
  createWarehouse(@Body() createWarehouseDto: CreateWarehouseDto) {
    return this.warehousesService.create(createWarehouseDto);
  }

  @Patch('warehouses/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update warehouse details or assign manager (Admin only)' })
  @ApiResponse({ status: 200, description: 'Warehouse updated successfully' })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  @ApiResponse({ status: 409, description: 'Warehouse code already in use' })
  updateWarehouse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWarehouseDto: UpdateWarehouseDto,
  ) {
    return this.warehousesService.update(id, updateWarehouseDto);
  }

  @Delete('warehouses/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete warehouse (Admin only)' })
  @ApiResponse({ status: 200, description: 'Warehouse deleted successfully' })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  removeWarehouse(@Param('id', ParseUUIDPipe) id: string) {
    return this.warehousesService.remove(id);
  }

  @Get('warehouses/:id/locations')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get list of locations within a warehouse' })
  @ApiResponse({ status: 200, description: 'Warehouse locations retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  findLocations(@Param('id', ParseUUIDPipe) id: string) {
    return this.warehousesService.findLocationsByWarehouse(id);
  }

  @Post('warehouses/:id/locations')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new location in warehouse (Admin, Manager)' })
  @ApiResponse({ status: 201, description: 'Location created successfully' })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  @ApiResponse({ status: 409, description: 'Location code already exists in this warehouse' })
  createLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createLocationDto: CreateLocationDto,
  ) {
    return this.warehousesService.createLocation(id, createLocationDto);
  }

  @Patch('locations/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update location details (Admin, Manager)' })
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  updateLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    return this.warehousesService.updateLocation(id, updateLocationDto);
  }

  @Delete('locations/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete location from warehouse (Admin, Manager)' })
  @ApiResponse({ status: 200, description: 'Location deleted successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  removeLocation(@Param('id', ParseUUIDPipe) id: string) {
    return this.warehousesService.removeLocation(id);
  }
}
