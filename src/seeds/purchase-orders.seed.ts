import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { PurchaseOrderEntity } from '../modules/purchase-orders/entities/purchase-order.entity';
import { PurchaseOrderItemEntity } from '../modules/purchase-orders/entities/purchase-order-item.entity';
import { PurchaseOrderStatus } from '../modules/purchase-orders/enums/purchase-order-status.enum';
import { SupplierEntity } from '../modules/suppliers/entities/supplier.entity';
import { WarehouseEntity } from '../modules/warehouses/entities/warehouse.entity';
import { UserEntity, UserRole } from '../modules/users/entities/user.entity';
import { ProductEntity } from '../modules/products/entities/product.entity';
import { runStandaloneSeed } from './seed.helper';

export async function seedPurchaseOrders(dataSource: DataSource, logger: Logger): Promise<PurchaseOrderEntity[]> {
  const poRepo = dataSource.getRepository(PurchaseOrderEntity);
  const poItemRepo = dataSource.getRepository(PurchaseOrderItemEntity);
  const supplierRepo = dataSource.getRepository(SupplierEntity);
  const warehouseRepo = dataSource.getRepository(WarehouseEntity);
  const userRepo = dataSource.getRepository(UserEntity);
  const productRepo = dataSource.getRepository(ProductEntity);

  const suppliers = await supplierRepo.find();
  const warehouses = await warehouseRepo.find();
  const users = await userRepo.find();
  const products = await productRepo.find();

  if (!suppliers.length || !warehouses.length || !users.length || !products.length) {
    logger.warn('Chưa đủ dữ liệu NCC, Kho, User hoặc Sản phẩm để seed Đơn mua hàng (PO)');
    return [];
  }

  const adminUser = users.find((u) => u.role === UserRole.ADMIN) || users[0];
  const managerUser = users.find((u) => u.role === UserRole.MANAGER) || adminUser;

  const samplePOs = [
    {
      code: 'PO-2026-001',
      supplier_id: suppliers[0].id,
      warehouse_id: warehouses[0].id,
      status: PurchaseOrderStatus.RECEIVED,
      created_by_user_id: adminUser.id,
      approved_by_user_id: managerUser.id,
      approved_at: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      expected_delivery_date: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      note: 'Đơn đặt hàng linh kiện CPU và RAM phục vụ lắp ráp máy trạm quý 4',
      items: [
        { product_id: products[0].id, quantity: 20, unit_price: products[0].cost_price || 3500000 },
        { product_id: products[1 % products.length].id, quantity: 30, unit_price: products[1 % products.length].cost_price || 1200000 },
      ],
    },
    {
      code: 'PO-2026-002',
      supplier_id: suppliers[1 % suppliers.length].id,
      warehouse_id: warehouses[1 % warehouses.length].id,
      status: PurchaseOrderStatus.APPROVED,
      created_by_user_id: managerUser.id,
      approved_by_user_id: adminUser.id,
      approved_at: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      expected_delivery_date: new Date(Date.now() + 2 * 24 * 3600 * 1000),
      note: 'Nhập bổ sung màn hình máy tính và thiết bị ngoại vi văn phòng',
      items: [
        { product_id: products[2 % products.length].id, quantity: 15, unit_price: products[2 % products.length].cost_price || 4200000 },
        { product_id: products[3 % products.length].id, quantity: 40, unit_price: products[3 % products.length].cost_price || 650000 },
      ],
    },
    {
      code: 'PO-2026-003',
      supplier_id: suppliers[2 % suppliers.length].id,
      warehouse_id: warehouses[0].id,
      status: PurchaseOrderStatus.PENDING_APPROVAL,
      created_by_user_id: adminUser.id,
      approved_by_user_id: null,
      approved_at: null,
      expected_delivery_date: new Date(Date.now() + 5 * 24 * 3600 * 1000),
      note: 'Đơn hàng linh kiện lưu trữ SSD Samsung 980 Pro chờ kế toán duyệt',
      items: [
        { product_id: products[4 % products.length].id, quantity: 50, unit_price: products[4 % products.length].cost_price || 2100000 },
      ],
    },
    {
      code: 'PO-2026-004',
      supplier_id: suppliers[0].id,
      warehouse_id: warehouses[2 % warehouses.length].id,
      status: PurchaseOrderStatus.DRAFT,
      created_by_user_id: managerUser.id,
      approved_by_user_id: null,
      approved_at: null,
      expected_delivery_date: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      note: 'Bản nháp dự trù kinh phí phụ kiện và cáp mạng cho chi nhánh',
      items: [
        { product_id: products[0].id, quantity: 10, unit_price: products[0].cost_price || 3500000 },
      ],
    },
  ];

  const savedPOs: PurchaseOrderEntity[] = [];

  for (const poData of samplePOs) {
    let po = await poRepo.findOne({ where: { code: poData.code } });
    const totalAmount = poData.items.reduce((sum, item) => sum + item.quantity * Number(item.unit_price), 0);

    if (!po) {
      po = poRepo.create({
        code: poData.code,
        supplier_id: poData.supplier_id,
        warehouse_id: poData.warehouse_id,
        status: poData.status,
        created_by_user_id: poData.created_by_user_id,
        approved_by_user_id: poData.approved_by_user_id,
        approved_at: poData.approved_at,
        expected_delivery_date: poData.expected_delivery_date,
        total_amount: totalAmount,
        note: poData.note,
      });
      po = await poRepo.save(po);

      for (const itemData of poData.items) {
        const item = poItemRepo.create({
          purchase_order_id: po.id,
          product_id: itemData.product_id,
          quantity: itemData.quantity,
          unit_price: Number(itemData.unit_price),
          total_price: itemData.quantity * Number(itemData.unit_price),
        });
        await poItemRepo.save(item);
      }
      logger.log(`-> Đã tạo Đơn mua hàng (PO): [${po.code}] (${po.status}) - ${totalAmount.toLocaleString('vi-VN')} đ`);
    }
    savedPOs.push(po);
  }

  return savedPOs;
}

if (require.main === module) {
  runStandaloneSeed(seedPurchaseOrders, 'PurchaseOrdersSeed');
}

