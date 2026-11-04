import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { StockTransactionEntity } from '../modules/stock-transactions/entities/stock-transaction.entity';
import { StockTransactionItemEntity } from '../modules/stock-transactions/entities/stock-transaction-item.entity';
import { StockTransactionType } from '../modules/stock-transactions/enums/stock-transaction-type.enum';
import { ProductEntity } from '../modules/products/entities/product.entity';
import { WarehouseEntity } from '../modules/warehouses/entities/warehouse.entity';
import { SupplierEntity } from '../modules/suppliers/entities/supplier.entity';
import { UserEntity } from '../modules/users/entities/user.entity';
import { runStandaloneSeed } from './seed.helper';

export async function seedStockTransactions(
  dataSource: DataSource,
  logger: Logger,
): Promise<StockTransactionEntity[]> {
  const txRepo = dataSource.getRepository(StockTransactionEntity);
  const itemRepo = dataSource.getRepository(StockTransactionItemEntity);
  const productRepo = dataSource.getRepository(ProductEntity);
  const warehouseRepo = dataSource.getRepository(WarehouseEntity);
  const supplierRepo = dataSource.getRepository(SupplierEntity);
  const userRepo = dataSource.getRepository(UserEntity);

  const products = await productRepo.find();
  const warehouses = await warehouseRepo.find();
  const suppliers = await supplierRepo.find();
  const users = await userRepo.find();

  if (products.length === 0 || warehouses.length === 0) {
    logger.warn('Chưa có dữ liệu sản phẩm hoặc kho để tạo giao dịch kho.');
    return [];
  }

  const admin = users.find((u) => u.username === 'admin') || users[0];
  const managerHn = users.find((u) => u.username === 'manager_hn') || admin;
  const managerHcm = users.find((u) => u.username === 'manager_hcm') || admin;

  const whHn1 = warehouses.find((w) => w.code === 'WH-HN-01') || warehouses[0];
  const whHn2 = warehouses.find((w) => w.code === 'WH-HN-02') || warehouses[1];
  const whHcm1 = warehouses.find((w) => w.code === 'WH-HCM-01') || warehouses[2];
  const whHcm2 = warehouses.find((w) => w.code === 'WH-HCM-02') || warehouses[3];
  const whDn = warehouses.find((w) => w.code === 'WH-DN-01') || warehouses[4];

  const supFpt = suppliers.find((s) => s.code === 'SUP-FPT') || suppliers[0];
  const supDgw = suppliers.find((s) => s.code === 'SUP-DGW') || suppliers[1];
  const supVietson = suppliers.find((s) => s.code === 'SUP-VIETSON') || suppliers[2];
  const supVienSon = suppliers.find((s) => s.code === 'SUP-VIENSON') || suppliers[3];

  const transactionsData = [
    // 1. Nhập kho đợt 1 tại Kho Tổng Hà Nội từ FPT
    {
      reference_no: 'PNK-2026-001',
      type: StockTransactionType.IMPORT,
      warehouse_id: whHn1.id,
      target_warehouse_id: null,
      supplier_id: supFpt.id,
      created_by_user_id: managerHn.id,
      note: 'Nhập lô hàng CPU Intel và Màn hình Dell UltraSharp chính hãng từ Synnex FPT',
      items: [
        { product: products[0], qty: 50, price: products[0]?.cost_price || 9200000 },
        { product: products[8], qty: 30, price: products[8]?.cost_price || 10800000 },
        { product: products[11], qty: 60, price: products[11]?.cost_price || 1850000 },
      ],
    },
    // 2. Nhập kho đợt 2 tại Kho Tổng TP. HCM từ Digiworld
    {
      reference_no: 'PNK-2026-002',
      type: StockTransactionType.IMPORT,
      warehouse_id: whHcm1.id,
      target_warehouse_id: null,
      supplier_id: supDgw.id,
      created_by_user_id: managerHcm.id,
      note: 'Nhập lô thiết bị ngoại vi Logitech & màn hình LG Gaming từ DGW',
      items: [
        { product: products[9], qty: 40, price: products[9]?.cost_price || 6850000 },
        { product: products[12], qty: 80, price: products[12]?.cost_price || 1850000 },
        { product: products[16], qty: 25, price: products[16]?.cost_price || 3150000 },
      ],
    },
    // 3. Nhập kho SSD Samsung từ Viết Sơn
    {
      reference_no: 'PNK-2026-003',
      type: StockTransactionType.IMPORT,
      warehouse_id: whHn1.id,
      target_warehouse_id: null,
      supplier_id: supVietson.id,
      created_by_user_id: admin.id,
      note: 'Nhập bổ sung ổ cứng SSD Samsung 990 PRO 1TB & 2TB phục vụ dự án cơ quan',
      items: [
        { product: products[17], qty: 100, price: products[17]?.cost_price || 2150000 },
        { product: products[18], qty: 50, price: products[18]?.cost_price || 3800000 },
      ],
    },
    // 4. Xuất kho bán sỉ cho đại lý tại Hà Nội
    {
      reference_no: 'PXK-2026-001',
      type: StockTransactionType.EXPORT,
      warehouse_id: whHn1.id,
      target_warehouse_id: null,
      supplier_id: null,
      created_by_user_id: managerHn.id,
      note: 'Xuất hợp đồng cung cấp linh kiện PC cho chuỗi phòng game Hà Nội',
      items: [
        { product: products[0], qty: 10, price: products[0]?.selling_price || 10890000 },
        { product: products[3], qty: 15, price: products[3]?.selling_price || 8490000 },
        { product: products[5], qty: 20, price: products[5]?.selling_price || 3190000 },
      ],
    },
    // 5. Xuất kho thiết bị văn phòng cho showroom Cầu Giấy
    {
      reference_no: 'PXK-2026-002',
      type: StockTransactionType.EXPORT,
      warehouse_id: whHn2.id,
      target_warehouse_id: null,
      supplier_id: null,
      created_by_user_id: managerHn.id,
      note: 'Xuất bán lẻ chuột Logitech MX Master 3S và bàn phím Keychron cho khách hàng',
      items: [
        { product: products[12], qty: 5, price: products[12]?.selling_price || 2490000 },
        { product: products[13], qty: 4, price: products[13]?.selling_price || 2190000 },
      ],
    },
    // 6. Điều chuyển hàng giữa Kho Tổng Hà Nội -> Kho Chi nhánh Cầu Giấy
    {
      reference_no: 'PDC-2026-001',
      type: StockTransactionType.TRANSFER,
      warehouse_id: whHn1.id,
      target_warehouse_id: whHn2.id,
      supplier_id: null,
      created_by_user_id: managerHn.id,
      note: 'Điều chuyển cân đối hàng tồn kho ngoại vi và phụ kiện lên chi nhánh Cầu Giấy',
      items: [
        { product: products[12], qty: 20, price: products[12]?.cost_price || 1850000 },
        { product: products[24], qty: 40, price: products[24]?.cost_price || 185000 },
        { product: products[25], qty: 15, price: products[25]?.cost_price || 980000 },
      ],
    },
    // 7. Điều chuyển liên miền: Kho Tổng HCM -> Kho Trung chuyển Đà Nẵng
    {
      reference_no: 'PDC-2026-002',
      type: StockTransactionType.TRANSFER,
      warehouse_id: whHcm1.id,
      target_warehouse_id: whDn.id,
      supplier_id: null,
      created_by_user_id: managerHcm.id,
      note: 'Chuyển hàng bằng xe tải chuyên dụng chi viện tồn kho cho khu vực Miền Trung',
      items: [
        { product: products[9], qty: 10, price: products[9]?.cost_price || 6850000 },
        { product: products[17], qty: 25, price: products[17]?.cost_price || 2150000 },
        { product: products[21], qty: 12, price: products[21]?.cost_price || 1950000 },
      ],
    },
    // 8. Nhập kho Router Wi-Fi & Thiết bị mạng từ Viễn Sơn
    {
      reference_no: 'PNK-2026-004',
      type: StockTransactionType.IMPORT,
      warehouse_id: whHcm1.id,
      target_warehouse_id: null,
      supplier_id: supVienSon.id,
      created_by_user_id: managerHcm.id,
      note: 'Nhập lô Router ASUS Wi-Fi 6 chuẩn AX3000 phục vụ khách hàng doanh nghiệp',
      items: [
        { product: products[21], qty: 50, price: products[21]?.cost_price || 1950000 },
        { product: products[2], qty: 10, price: products[2]?.cost_price || 23500000 },
      ],
    },
  ];

  const savedTransactions: StockTransactionEntity[] = [];

  for (const t of transactionsData) {
    let tx = await txRepo.findOne({ where: { reference_no: t.reference_no } });
    if (!tx) {
      tx = txRepo.create({
        type: t.type,
        reference_no: t.reference_no,
        warehouse_id: t.warehouse_id,
        target_warehouse_id: t.target_warehouse_id,
        supplier_id: t.supplier_id,
        created_by_user_id: t.created_by_user_id,
        note: t.note,
      });
      await txRepo.save(tx);

      // Thêm items
      const itemsToSave: StockTransactionItemEntity[] = [];
      for (const it of t.items) {
        if (!it.product) continue;
        const item = itemRepo.create({
          transaction_id: tx.id,
          product_id: it.product.id,
          quantity: it.qty,
          unit_price: it.price,
          total_price: it.qty * it.price,
        });
        itemsToSave.push(item);
      }
      if (itemsToSave.length > 0) {
        await itemRepo.save(itemsToSave);
      }
      logger.log(`+ Thêm phiếu [${tx.reference_no}] (${tx.type}): ${t.items.length} mặt hàng`);
    }
    savedTransactions.push(tx);
  }

  logger.log(`Tổng cộng: ${savedTransactions.length} phiếu xuất/nhập/điều chuyển kho đã sẵn sàng.`);
  return savedTransactions;
}

if (require.main === module) {
  runStandaloneSeed(seedStockTransactions, 'StockTransactionsSeed');
}
