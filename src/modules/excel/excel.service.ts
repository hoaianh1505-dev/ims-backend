import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { InventoryEntity } from '../inventory/entities/inventory.entity';
import { StockTransactionEntity } from '../stock-transactions/entities/stock-transaction.entity';
import { ProductEntity } from '../products/entities/product.entity';
import { CategoryEntity } from '../categories/entities/category.entity';
import { UnitEntity } from '../units/entities/unit.entity';
import { SupplierEntity } from '../suppliers/entities/supplier.entity';
import { WarehouseEntity } from '../warehouses/entities/warehouse.entity';
import { WarehouseLocationEntity } from '../warehouses/entities/warehouse-location.entity';
import { StockTransactionsService } from '../stock-transactions/stock-transactions.service';
import { ExportInventoryQueryDto } from './dto/export-inventory-query.dto';
import { ExportStockTransactionsQueryDto } from './dto/export-stock-transactions-query.dto';
import { ImportStockTransactionBodyDto } from './dto/import-stock-transaction-body.dto';
import { ImportStockDto, ImportStockItemDto } from '../stock-transactions/dto/import-stock.dto';

@Injectable()
export class ExcelService {
  constructor(
    @InjectRepository(InventoryEntity)
    private readonly inventoryRepo: Repository<InventoryEntity>,
    @InjectRepository(StockTransactionEntity)
    private readonly stockTransactionRepo: Repository<StockTransactionEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepo: Repository<CategoryEntity>,
    @InjectRepository(UnitEntity)
    private readonly unitRepo: Repository<UnitEntity>,
    @InjectRepository(SupplierEntity)
    private readonly supplierRepo: Repository<SupplierEntity>,
    @InjectRepository(WarehouseEntity)
    private readonly warehouseRepo: Repository<WarehouseEntity>,
    @InjectRepository(WarehouseLocationEntity)
    private readonly locationRepo: Repository<WarehouseLocationEntity>,
    private readonly stockTransactionsService: StockTransactionsService,
  ) {}

  private applyHeaderStyle(headerRow: ExcelJS.Row, bgArgb = '1F4E79') {
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgArgb },
      };
      cell.font = {
        name: 'Segoe UI',
        bold: true,
        color: { argb: 'FFFFFF' },
        size: 11,
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'D9D9D9' } },
        bottom: { style: 'medium', color: { argb: 'FFFFFF' } },
        left: { style: 'thin', color: { argb: 'D9D9D9' } },
        right: { style: 'thin', color: { argb: 'D9D9D9' } },
      };
    });
  }

  private applyBordersAndFont(row: ExcelJS.Row, isEven: boolean) {
    row.height = 22;
    row.eachCell((cell) => {
      cell.font = { name: 'Segoe UI', size: 10 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'E0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
        left: { style: 'thin', color: { argb: 'E0E0E0' } },
        right: { style: 'thin', color: { argb: 'E0E0E0' } },
      };
      if (isEven) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F9FAFB' },
        };
      }
    });
  }

  private autoFitColumns(worksheet: ExcelJS.Worksheet) {
    worksheet.columns.forEach((column) => {
      let maxLen = 12;
      column.eachCell?.({ includeEmpty: false }, (cell) => {
        const val = cell.value ? cell.value.toString() : '';
        if (val.length > maxLen) {
          maxLen = val.length;
        }
      });
      column.width = Math.min(Math.max(maxLen + 4, 12), 40);
    });
  }

  async exportInventory(query: ExportInventoryQueryDto): Promise<ExcelJS.Workbook> {
    const qb = this.inventoryRepo
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.warehouse', 'warehouse')
      .leftJoinAndSelect('inv.location', 'location')
      .leftJoinAndSelect('inv.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.unit', 'unit');

    if (query.warehouse_id) {
      qb.andWhere('inv.warehouse_id = :warehouseId', {
        warehouseId: query.warehouse_id,
      });
    }

    if (query.category_id) {
      qb.andWhere('product.category_id = :categoryId', {
        categoryId: query.category_id,
      });
    }

    if (query.low_stock) {
      qb.andWhere('inv.quantity <= product.low_stock_threshold');
    }

    qb.orderBy('warehouse.name', 'ASC').addOrderBy('product.name', 'ASC');

    const items = await qb.getMany();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'IMS Backend';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Tồn kho', {
      views: [{ showGridLines: true }],
    });

    sheet.mergeCells('A1:L1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'BÁO CÁO TỒN KHO THỜI GIAN THỰC (REALTIME INVENTORY)';
    titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F4E79' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 36;

    sheet.mergeCells('A2:L2');
    const subtitleCell = sheet.getCell('A2');
    subtitleCell.value = `Thời gian xuất: ${new Date().toLocaleString('vi-VN')} | Tổng số bản ghi: ${items.length}`;
    subtitleCell.font = { name: 'Segoe UI', size: 10, italic: true };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 20;

    sheet.addRow([]);

    const headers = [
      'STT',
      'Mã SKU',
      'Mã Barcode',
      'Tên sản phẩm',
      'Danh mục',
      'Đơn vị tính',
      'Kho hàng',
      'Vị trí kệ',
      'Số lượng tồn',
      'Định mức tối thiểu',
      'Trạng thái',
      'Cập nhật lần cuối',
    ];

    const headerRow = sheet.addRow(headers);
    this.applyHeaderStyle(headerRow, '2E75B6');

    items.forEach((item, index) => {
      const isLowStock =
        item.quantity <= (item.product?.low_stock_threshold || 10);
      const row = sheet.addRow([
        index + 1,
        item.product?.sku || '',
        item.product?.barcode || '',
        item.product?.name || '',
        item.product?.category?.name || 'Chưa phân loại',
        item.product?.unit?.name || '',
        item.warehouse?.name || '',
        item.location?.code || item.location?.name || 'Chưa xếp vị trí',
        item.quantity,
        item.product?.low_stock_threshold || 10,
        isLowStock ? 'CẢNH BÁO SẮP HẾT' : 'An toàn',
        item.updated_at ? new Date(item.updated_at).toLocaleString('vi-VN') : '',
      ]);

      this.applyBordersAndFont(row, index % 2 === 1);

      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(9).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(10).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(11).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(12).alignment = { horizontal: 'center', vertical: 'middle' };

      row.getCell(9).numFmt = '#,##0';
      row.getCell(10).numFmt = '#,##0';

      if (isLowStock) {
        row.getCell(11).font = { color: { argb: 'D32F2F' }, bold: true };
      } else {
        row.getCell(11).font = { color: { argb: '2E7D32' }, bold: true };
      }
    });

    this.autoFitColumns(sheet);

    return workbook;
  }

  async exportStockTransactions(
    query: ExportStockTransactionsQueryDto,
  ): Promise<ExcelJS.Workbook> {
    const qb = this.stockTransactionRepo
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.warehouse', 'warehouse')
      .leftJoinAndSelect('tx.target_warehouse', 'target_warehouse')
      .leftJoinAndSelect('tx.supplier', 'supplier')
      .leftJoinAndSelect('tx.creator', 'creator')
      .leftJoinAndSelect('tx.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('items.location', 'location')
      .leftJoinAndSelect('items.target_location', 'target_location');

    if (query.type) {
      qb.andWhere('tx.type = :type', { type: query.type });
    }

    if (query.warehouse_id) {
      qb.andWhere(
        '(tx.warehouse_id = :whId OR tx.target_warehouse_id = :whId)',
        { whId: query.warehouse_id },
      );
    }

    if (query.from_date) {
      qb.andWhere('tx.created_at >= :fromDate', {
        fromDate: new Date(query.from_date),
      });
    }

    if (query.to_date) {
      const toDate = new Date(query.to_date);
      toDate.setHours(23, 59, 59, 999);
      qb.andWhere('tx.created_at <= :toDate', { toDate });
    }

    qb.orderBy('tx.created_at', 'DESC');

    const transactions = await qb.getMany();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'IMS Backend';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Lịch sử giao dịch kho', {
      views: [{ showGridLines: true }],
    });

    sheet.mergeCells('A1:Q1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'BÁO CÁO LỊCH SỬ GIAO DỊCH KHO (STOCK TRANSACTIONS REPORT)';
    titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F4E79' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 36;

    sheet.mergeCells('A2:Q2');
    const subtitleCell = sheet.getCell('A2');
    subtitleCell.value = `Thời gian xuất: ${new Date().toLocaleString('vi-VN')} | Tổng số phiếu: ${transactions.length}`;
    subtitleCell.font = { name: 'Segoe UI', size: 10, italic: true };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 20;

    sheet.addRow([]);

    const headers = [
      'STT',
      'Mã phiếu',
      'Loại giao dịch',
      'Kho xuất / chính',
      'Kho nhập / đích',
      'Nhà cung cấp',
      'Mã SKU',
      'Tên sản phẩm',
      'Vị trí xuất',
      'Vị trí nhập',
      'Số lượng',
      'SL kiểm kê',
      'Đơn giá (VNĐ)',
      'Thành tiền (VNĐ)',
      'Người tạo',
      'Ghi chú',
      'Thời gian',
    ];

    const headerRow = sheet.addRow(headers);
    this.applyHeaderStyle(headerRow, '2E75B6');

    let rowIndex = 0;
    transactions.forEach((tx) => {
      const typeMap: Record<string, string> = {
        IMPORT: 'Nhập kho',
        EXPORT: 'Xuất kho',
        TRANSFER: 'Chuyển kho',
        ADJUSTMENT: 'Kiểm kê điều chỉnh',
      };

      tx.items?.forEach((item) => {
        rowIndex++;
        const row = sheet.addRow([
          rowIndex,
          tx.reference_no,
          typeMap[tx.type] || tx.type,
          tx.warehouse?.name || '',
          tx.target_warehouse?.name || '',
          tx.supplier?.name || '',
          item.product?.sku || '',
          item.product?.name || '',
          item.location?.code || item.location?.name || '',
          item.target_location?.code || item.target_location?.name || '',
          item.quantity,
          item.counted_quantity !== null ? item.counted_quantity : '',
          item.unit_price,
          item.total_price,
          tx.creator?.display_name || tx.creator?.username || '',
          tx.note || '',
          tx.created_at ? new Date(tx.created_at).toLocaleString('vi-VN') : '',
        ]);

        this.applyBordersAndFont(row, rowIndex % 2 === 1);

        row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(9).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(11).alignment = { horizontal: 'right', vertical: 'middle' };
        row.getCell(12).alignment = { horizontal: 'right', vertical: 'middle' };
        row.getCell(13).alignment = { horizontal: 'right', vertical: 'middle' };
        row.getCell(14).alignment = { horizontal: 'right', vertical: 'middle' };
        row.getCell(17).alignment = { horizontal: 'center', vertical: 'middle' };

        row.getCell(11).numFmt = '#,##0';
        row.getCell(12).numFmt = '#,##0';
        row.getCell(13).numFmt = '#,##0';
        row.getCell(14).numFmt = '#,##0';
      });
    });

    this.autoFitColumns(sheet);

    return workbook;
  }

  generateProductImportTemplate(): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'IMS Backend';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Mau_Import_San_Pham');

    const headers = [
      'Tên sản phẩm (*)',
      'Mã SKU (*)',
      'Mã Barcode',
      'Tên danh mục',
      'Đơn vị tính',
      'Nhà cung cấp',
      'Giá vốn (VNĐ)',
      'Giá bán (VNĐ)',
      'Định mức tối thiểu',
      'Mô tả sản phẩm',
    ];

    const headerRow = sheet.addRow(headers);
    this.applyHeaderStyle(headerRow, '1F4E79');

    const sampleRow1 = sheet.addRow([
      'Nước ngọt Coca-Cola 330ml',
      'COCA-330',
      '8935001234567',
      'Đồ uống',
      'Lon',
      'Công ty TNHH Coca-Cola VN',
      8500,
      12000,
      24,
      'Thùng 24 lon 330ml',
    ]);
    this.applyBordersAndFont(sampleRow1, false);

    const sampleRow2 = sheet.addRow([
      'Bàn phím cơ không dây K2',
      'KB-KEYCHRON-K2',
      '8936009876543',
      'Phụ kiện máy tính',
      'Cái',
      'Keychron Official',
      1200000,
      1750000,
      5,
      'Bàn phím cơ Bluetooth switch Gateron',
    ]);
    this.applyBordersAndFont(sampleRow2, true);

    this.autoFitColumns(sheet);
    return workbook;
  }

  generateStockImportTemplate(): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'IMS Backend';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Mau_Nhap_Kho');

    const headers = [
      'Mã SKU (*)',
      'Số lượng nhập (*)',
      'Mã hoặc tên vị trí kệ',
      'Đơn giá nhập (VNĐ)',
    ];

    const headerRow = sheet.addRow(headers);
    this.applyHeaderStyle(headerRow, '1F4E79');

    const sampleRow1 = sheet.addRow([
      'COCA-330',
      100,
      'KỆ A1',
      8500,
    ]);
    this.applyBordersAndFont(sampleRow1, false);

    const sampleRow2 = sheet.addRow([
      'KB-KEYCHRON-K2',
      20,
      'KỆ B2',
      1200000,
    ]);
    this.applyBordersAndFont(sampleRow2, true);

    this.autoFitColumns(sheet);
    return workbook;
  }

  async importProducts(fileBuffer: Buffer) {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(fileBuffer as any);
    } catch {
      throw new BadRequestException('Tệp tin không đúng định dạng Excel (.xlsx)');
    }

    const sheet = workbook.worksheets[0];
    if (!sheet) {
      throw new BadRequestException('File Excel không có sheet nào');
    }

    const errors: Array<{ row: number; sku?: string; message: string }> = [];
    let importedCount = 0;
    const totalRows = sheet.rowCount - 1;

    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
      const row = sheet.getRow(rowNumber);
      const name = row.getCell(1).text?.trim();
      const sku = row.getCell(2).text?.trim();
      const barcode = row.getCell(3).text?.trim() || null;
      const categoryName = row.getCell(4).text?.trim();
      const unitName = row.getCell(5).text?.trim();
      const supplierName = row.getCell(6).text?.trim();
      const costPrice = parseFloat(row.getCell(7).text) || 0;
      const sellingPrice = parseFloat(row.getCell(8).text) || 0;
      const lowStock = parseInt(row.getCell(9).text, 10) || 10;
      const description = row.getCell(10).text?.trim() || null;

      if (!name && !sku) {
        continue;
      }

      if (!name) {
        errors.push({ row: rowNumber, sku, message: 'Tên sản phẩm không được để trống' });
        continue;
      }

      if (!sku) {
        errors.push({ row: rowNumber, message: 'Mã SKU không được để trống' });
        continue;
      }

      const existingSku = await this.productRepo.findOne({ where: { sku } });
      if (existingSku) {
        errors.push({
          row: rowNumber,
          sku,
          message: `Mã SKU "${sku}" đã tồn tại trên hệ thống`,
        });
        continue;
      }

      let categoryId: string | null = null;
      if (categoryName) {
        let cat = await this.categoryRepo.findOne({ where: { name: categoryName } });
        if (!cat) {
          cat = this.categoryRepo.create({ name: categoryName });
          await this.categoryRepo.save(cat);
        }
        categoryId = cat.id;
      }

      let unitId: string | null = null;
      if (unitName) {
        let unit = await this.unitRepo.findOne({ where: { name: unitName } });
        if (!unit) {
          unit = this.unitRepo.create({ name: unitName });
          await this.unitRepo.save(unit);
        }
        unitId = unit.id;
      }

      let supplierId: string | null = null;
      if (supplierName) {
        let sup = await this.supplierRepo.findOne({ where: { name: supplierName } });
        if (!sup) {
          sup = this.supplierRepo.create({ name: supplierName });
          await this.supplierRepo.save(sup);
        }
        supplierId = sup.id;
      }

      try {
        const product = this.productRepo.create({
          name,
          sku,
          barcode: barcode || undefined,
          category_id: categoryId || undefined,
          unit_id: unitId || undefined,
          supplier_id: supplierId || undefined,
          cost_price: costPrice,
          selling_price: sellingPrice,
          low_stock_threshold: lowStock,
          description: description || undefined,
        });

        await this.productRepo.save(product);
        importedCount++;
      } catch (err) {
        errors.push({
          row: rowNumber,
          sku,
          message: `Lỗi khi lưu sản phẩm: ${err instanceof Error ? err.message : 'Không xác định'}`,
        });
      }
    }

    return {
      total_rows: totalRows > 0 ? totalRows : 0,
      imported_count: importedCount,
      failed_count: errors.length,
      errors,
    };
  }

  async importStockTransaction(
    fileBuffer: Buffer,
    body: ImportStockTransactionBodyDto,
    userId: string,
  ) {
    const warehouse = await this.warehouseRepo.findOne({
      where: { id: body.warehouse_id },
    });
    if (!warehouse) {
      throw new NotFoundException('Kho hàng không tồn tại');
    }

    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(fileBuffer as any);
    } catch {
      throw new BadRequestException('Tệp tin không đúng định dạng Excel (.xlsx)');
    }

    const sheet = workbook.worksheets[0];
    if (!sheet) {
      throw new BadRequestException('File Excel không có sheet nào');
    }

    const items: ImportStockItemDto[] = [];
    const parseErrors: Array<{ row: number; sku?: string; message: string }> = [];

    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
      const row = sheet.getRow(rowNumber);
      const sku = row.getCell(1).text?.trim();
      const quantityRaw = row.getCell(2).text?.trim();
      const locationText = row.getCell(3).text?.trim();
      const unitPriceRaw = row.getCell(4).text?.trim();

      if (!sku && !quantityRaw) {
        continue;
      }

      if (!sku) {
        parseErrors.push({ row: rowNumber, message: 'Mã SKU không được để trống' });
        continue;
      }

      const quantity = parseInt(quantityRaw, 10);
      if (isNaN(quantity) || quantity <= 0) {
        parseErrors.push({
          row: rowNumber,
          sku,
          message: 'Số lượng phải là số nguyên dương lớn hơn 0',
        });
        continue;
      }

      const product = await this.productRepo.findOne({ where: { sku } });
      if (!product) {
        parseErrors.push({
          row: rowNumber,
          sku,
          message: `Sản phẩm có mã SKU "${sku}" không tồn tại`,
        });
        continue;
      }

      let locationId: string | undefined = undefined;
      if (locationText) {
        const loc = await this.locationRepo
          .createQueryBuilder('loc')
          .where('loc.warehouse_id = :whId', { whId: body.warehouse_id })
          .andWhere('(loc.code ILIKE :text OR loc.name ILIKE :text)', {
            text: locationText,
          })
          .getOne();

        if (!loc) {
          parseErrors.push({
            row: rowNumber,
            sku,
            message: `Vị trí "${locationText}" không tồn tại trong kho ${warehouse.name}`,
          });
          continue;
        }
        locationId = loc.id;
      }

      const unitPrice = unitPriceRaw ? parseFloat(unitPriceRaw) : undefined;

      items.push({
        product_id: product.id,
        quantity,
        location_id: locationId,
        unit_price: !isNaN(unitPrice as number) ? unitPrice : undefined,
      });
    }

    if (parseErrors.length > 0) {
      throw new BadRequestException({
        message: 'File Excel nhập kho có lỗi dữ liệu',
        errors: parseErrors,
      });
    }

    if (items.length === 0) {
      throw new BadRequestException('Không tìm thấy dữ liệu hàng hóa hợp lệ nào để nhập kho');
    }

    const importDto: ImportStockDto = {
      warehouse_id: body.warehouse_id,
      supplier_id: body.supplier_id,
      reference_no: body.reference_no,
      note: body.note,
      items,
    };

    return this.stockTransactionsService.importStock(importDto, userId);
  }
}
