import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { AuditLogEntity } from '../modules/audit-logs/entities/audit-log.entity';
import { UserEntity } from '../modules/users/entities/user.entity';
import { runStandaloneSeed } from './seed.helper';

export async function seedAuditLogs(dataSource: DataSource, logger: Logger): Promise<AuditLogEntity[]> {
  const auditRepo = dataSource.getRepository(AuditLogEntity);
  const userRepo = dataSource.getRepository(UserEntity);
  const users = await userRepo.find();

  if (!users.length) {
    logger.warn('Chưa có người dùng để seed Nhật ký thao tác (Audit Logs)');
    return [];
  }

  const admin = users[0];
  const manager = users.find((u) => u.role === 'MANAGER') || admin;
  const staff = users.find((u) => u.role === 'STAFF') || admin;

  const now = Date.now();
  const dayMs = 24 * 3600 * 1000;

  const sampleLogs = [
    {
      user_id: admin.id,
      action: 'LOGIN',
      entity_name: 'Auth',
      entity_id: admin.id,
      details: { username: admin.username, method: 'JWT_LOGIN', status: 'SUCCESS' },
      ip_address: '127.0.0.1',
      created_at: new Date(now - 5 * dayMs),
    },
    {
      user_id: staff.id,
      action: 'CREATE_PURCHASE_ORDER',
      entity_name: 'PurchaseOrder',
      entity_id: 'PO-2026-001',
      details: { code: 'PO-2026-001', supplier: 'Công ty TNHH Phân phối Synnex FPT', total_items: 2 },
      ip_address: '192.168.1.105',
      created_at: new Date(now - 5 * dayMs + 3600 * 1000),
    },
    {
      user_id: manager.id,
      action: 'APPROVE_PURCHASE_ORDER',
      entity_name: 'PurchaseOrder',
      entity_id: 'PO-2026-001',
      details: { code: 'PO-2026-001', status: 'APPROVED', note: 'Phê duyệt nhập hàng bổ sung linh kiện' },
      ip_address: '192.168.1.102',
      created_at: new Date(now - 4 * dayMs),
    },
    {
      user_id: staff.id,
      action: 'CREATE_STOCK_IMPORT',
      entity_name: 'StockTransaction',
      entity_id: 'IN-2026-001',
      details: { reference_no: 'IN-2026-001', type: 'IMPORT', warehouse: 'Kho Tổng Hà Nội (Long Biên)' },
      ip_address: '192.168.1.105',
      created_at: new Date(now - 4 * dayMs + 2 * 3600 * 1000),
    },
    {
      user_id: admin.id,
      action: 'CREATE_CUSTOMER',
      entity_name: 'Customer',
      entity_id: 'CUST-001',
      details: { name: 'Công ty CP Thương mại Dịch vụ Phong Vũ', phone: '02873006666' },
      ip_address: '127.0.0.1',
      created_at: new Date(now - 3 * dayMs),
    },
    {
      user_id: staff.id,
      action: 'CREATE_STOCK_EXPORT',
      entity_name: 'StockTransaction',
      entity_id: 'OUT-2026-001',
      details: { reference_no: 'OUT-2026-001', type: 'EXPORT', recipient: 'Phong Vũ Retail', items_count: 3 },
      ip_address: '192.168.1.105',
      created_at: new Date(now - 3 * dayMs + 4 * 3600 * 1000),
    },
    {
      user_id: manager.id,
      action: 'STOCKTAKING_START',
      entity_name: 'StocktakingSession',
      entity_id: 'ST-2026-001',
      details: { code: 'ST-2026-001', warehouse: 'Kho Tổng Hà Nội', title: 'Kiểm kê định kỳ tháng 11' },
      ip_address: '192.168.1.102',
      created_at: new Date(now - 2 * dayMs),
    },
    {
      user_id: manager.id,
      action: 'STOCKTAKING_COMPLETE',
      entity_name: 'StocktakingSession',
      entity_id: 'ST-2026-001',
      details: { code: 'ST-2026-001', diff_quantity: -2, diff_amount: -2400000, status: 'COMPLETED' },
      ip_address: '192.168.1.102',
      created_at: new Date(now - 2 * dayMs + 5 * 3600 * 1000),
    },
    {
      user_id: admin.id,
      action: 'AI_ASSISTANT_QUERY',
      entity_name: 'Assistant',
      entity_id: 'GEMINI_ENGINE',
      details: { prompt: 'Mặt hàng nào đang có số lượng tồn kho nhiều nhất?', tool: 'get_top_inventory_products' },
      ip_address: '127.0.0.1',
      created_at: new Date(now - 1 * dayMs),
    },
    {
      user_id: admin.id,
      action: 'UPDATE_PROFILE',
      entity_name: 'User',
      entity_id: admin.id,
      details: { username: admin.username, field: 'avatar', status: 'UPDATED' },
      ip_address: '127.0.0.1',
      created_at: new Date(now - 4 * 3600 * 1000),
    },
  ];

  const savedLogs: AuditLogEntity[] = [];

  for (const logData of sampleLogs) {
    const log = auditRepo.create(logData);
    const saved = await auditRepo.save(log);
    savedLogs.push(saved);
  }

  logger.log(`-> Đã tạo ${savedLogs.length} bản ghi Nhật ký hệ thống (Audit Logs) từ ngày 16 - 21/11.`);
  return savedLogs;
}

if (require.main === module) {
  runStandaloneSeed(seedAuditLogs, 'AuditLogsSeed');
}

