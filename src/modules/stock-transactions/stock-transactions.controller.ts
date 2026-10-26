import {
  Controller,
  Get,
  Post,
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
import { StockTransactionsService } from './stock-transactions.service';
import { ImportStockDto } from './dto/import-stock.dto';
import { ExportStockDto } from './dto/export-stock.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { FilterStockTransactionDto } from './dto/filter-stock-transaction.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Stock Transactions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stock-transactions')
export class StockTransactionsController {
  constructor(
    private readonly stockTransactionsService: StockTransactionsService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get stock transactions history with filters and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock transactions retrieved successfully',
  })
  findAll(@Query() query: FilterStockTransactionDto) {
    return this.stockTransactionsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get stock transaction details by ID with items and relations',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock transaction retrieved successfully',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.stockTransactionsService.findOne(id);
  }

  @Post('import')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Create import stock transaction (increments inventory)',
  })
  @ApiResponse({
    status: 201,
    description: 'Stock imported successfully and inventory updated',
  })
  importStock(
    @Body() dto: ImportStockDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.stockTransactionsService.importStock(dto, userId);
  }

  @Post('export')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Create export stock transaction (validates and decrements inventory)',
  })
  @ApiResponse({
    status: 201,
    description: 'Stock exported successfully and inventory updated',
  })
  exportStock(
    @Body() dto: ExportStockDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.stockTransactionsService.exportStock(dto, userId);
  }

  @Post('transfer')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Transfer stock between warehouses (decrements source and increments target)',
  })
  @ApiResponse({
    status: 201,
    description: 'Stock transferred successfully between warehouses',
  })
  transferStock(
    @Body() dto: TransferStockDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.stockTransactionsService.transferStock(dto, userId);
  }

  @Post('adjustment')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Adjust inventory stock based on physical count audit',
  })
  @ApiResponse({
    status: 201,
    description: 'Stock adjusted successfully and inventory synchronized',
  })
  adjustStock(
    @Body() dto: AdjustStockDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.stockTransactionsService.adjustStock(dto, userId);
  }
}
