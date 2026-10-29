import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ExcelService } from './excel.service';
import { ExportInventoryQueryDto } from './dto/export-inventory-query.dto';
import { ExportStockTransactionsQueryDto } from './dto/export-stock-transactions-query.dto';
import { ImportStockTransactionBodyDto } from './dto/import-stock-transaction-body.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Import & Export Excel')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ExcelController {
  constructor(private readonly excelService: ExcelService) { }

  @Get('export/inventory')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Export current real-time inventory to formatted Excel spreadsheet (.xlsx)',
  })
  @ApiResponse({
    status: 200,
    description: 'Excel file generated and streamed successfully',
  })
  async exportInventory(
    @Query() query: ExportInventoryQueryDto,
    @Res() res: Response,
  ) {
    const workbook = await this.excelService.exportInventory(query);
    const filename = `IMS_Inventory_Report_${Date.now()}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  @Get('export/stock-transactions')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Export stock transactions history to formatted Excel spreadsheet (.xlsx)',
  })
  @ApiResponse({
    status: 200,
    description: 'Excel file generated and streamed successfully',
  })
  async exportStockTransactions(
    @Query() query: ExportStockTransactionsQueryDto,
    @Res() res: Response,
  ) {
    const workbook = await this.excelService.exportStockTransactions(query);
    const filename = `IMS_Stock_Transactions_${Date.now()}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  @Get('export/templates/products')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Download sample Excel template for batch importing products',
  })
  @ApiResponse({
    status: 200,
    description: 'Product import template streamed successfully',
  })
  async downloadProductTemplate(@Res() res: Response) {
    const workbook = this.excelService.generateProductImportTemplate();
    const filename = `Mau_Import_San_Pham.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  @Get('export/templates/import-stock')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Download sample Excel template for batch importing stock transaction',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock import template streamed successfully',
  })
  async downloadStockImportTemplate(@Res() res: Response) {
    const workbook = this.excelService.generateStockImportTemplate();
    const filename = `Mau_Import_Nhap_Kho.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  @Post('import/products')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Excel file (.xlsx) containing product rows',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Batch import products from uploaded Excel file',
  })
  @ApiResponse({
    status: 200,
    description: 'Products parsed and imported with detailed result summary',
  })
  async importProducts(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn tệp tin Excel (.xlsx) để tải lên');
    }
    return this.excelService.importProducts(file.buffer);
  }

  @Post('import/stock-transactions/import')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'warehouse_id'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Excel file (.xlsx) containing stock items',
        },
        warehouse_id: { type: 'string', format: 'uuid', description: 'Destination warehouse UUID' },
        supplier_id: { type: 'string', format: 'uuid', description: 'Supplier UUID (optional)' },
        reference_no: { type: 'string', description: 'Transaction code (optional)' },
        note: { type: 'string', description: 'Note for this stock import (optional)' },
      },
    },
  })
  @ApiOperation({
    summary: 'Batch import stock items from Excel into a warehouse (creates stock transaction and increments inventory)',
  })
  @ApiResponse({
    status: 201,
    description: 'Stock imported successfully from Excel file',
  })
  async importStockTransaction(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: ImportStockTransactionBodyDto,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn tệp tin Excel (.xlsx) để tải lên');
    }
    return this.excelService.importStockTransaction(file.buffer, body, userId);
  }
}
