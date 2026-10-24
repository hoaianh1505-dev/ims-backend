import {
  Controller,
  Get,
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
import { InventoryService } from './inventory.service';
import { FilterInventoryDto } from './dto/filter-inventory.dto';
import { FilterLowStockDto } from './dto/filter-low-stock.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Inventory')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get current inventory list (filter by warehouse, location, product, paginated)' })
  @ApiResponse({ status: 200, description: 'Inventory list retrieved successfully' })
  findAll(@Query() query: FilterInventoryDto) {
    return this.inventoryService.findAll(query);
  }

  @Get('low-stock')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get low stock products below defined threshold' })
  @ApiResponse({ status: 200, description: 'Low stock products retrieved successfully' })
  getLowStock(@Query() query: FilterLowStockDto) {
    return this.inventoryService.getLowStock(query);
  }

  @Get('product/:productId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get inventory breakdown for a product across all warehouses and locations' })
  @ApiResponse({ status: 200, description: 'Product inventory breakdown retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  getByProduct(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.inventoryService.getByProduct(productId);
  }

  @Get('warehouse/:warehouseId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get inventory list for a specific warehouse' })
  @ApiResponse({ status: 200, description: 'Warehouse inventory retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  getByWarehouse(@Param('warehouseId', ParseUUIDPipe) warehouseId: string) {
    return this.inventoryService.getByWarehouse(warehouseId);
  }
}
