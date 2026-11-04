import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { WarehouseEntity } from '../modules/warehouses/entities/warehouse.entity';
import { WarehouseLocationEntity } from '../modules/warehouses/entities/warehouse-location.entity';
import { UserEntity } from '../modules/users/entities/user.entity';
import { runStandaloneSeed } from './seed.helper';

export const WAREHOUSES_DATA: Array<{
  name: string;
  code: string;
  address: string;
  managerUsername?: string;
  locations?: Array<{ code: string; name: string; description: string }>;
}> = [
  {
    name: 'Kho Tổng Hà Nội (Long Biên)',
    code: 'WH-HN-01',
    address: 'Lô 12 KCN Đài Tư, 386 Nguyễn Văn Linh, Long Biên, Hà Nội',
    managerUsername: 'manager_hn',
    locations: [
      { code: 'HN1-A1', name: 'Kệ A1 - Khu vực CPU & RAM', description: 'Bảo quản linh kiện nhỏ, nhiệt độ tiêu chuẩn' },
      { code: 'HN1-A2', name: 'Kệ A2 - Khu vực VGA & Mainboard', description: 'Khu vực hộp linh kiện cồng kềnh' },
      { code: 'HN1-B1', name: 'Kệ B1 - Màn hình máy tính', description: 'Khu vực xếp pallet thùng màn hình lớn' },
      { code: 'HN1-C1', name: 'Kệ C1 - Thiết bị mạng & Cáp', description: 'Khu lưu trữ router và phụ kiện cuộn cáp' },
    ],
  },
  {
    name: 'Kho Chi nhánh Cầu Giấy',
    code: 'WH-HN-02',
    address: 'Tầng 1, Tòa nhà Detech, Số 8C Tôn Thất Thuyết, Cầu Giấy, Hà Nội',
    managerUsername: 'manager_hn',
    locations: [
      { code: 'CG-01', name: 'Kệ Phụ kiện & Ngoại vi', description: 'Chuột, phím, tai nghe phục vụ bán lẻ' },
      { code: 'CG-02', name: 'Kệ Hàng chuyển phát nhanh', description: 'Đơn hàng chuẩn bị giao hỏa tốc nội thành' },
    ],
  },
  {
    name: 'Kho Chi nhánh Hà Đông',
    code: 'WH-HN-03',
    address: 'Số 110 Trần Phú, Mộ Lao, Hà Đông, Hà Nội',
    managerUsername: 'manager_hn',
    locations: [
      { code: 'HD-01', name: 'Kệ Tổng hợp Hà Đông', description: 'Lưu trữ hàng tiêu chuẩn khu vực Tây Nam Hà Nội' },
    ],
  },
  {
    name: 'Kho Tổng Hồ Chí Minh (Tân Tạo)',
    code: 'WH-HCM-01',
    address: 'Đường số 7 KCN Tân Tạo, Bình Tân, TP. HCM',
    managerUsername: 'manager_hcm',
    locations: [
      { code: 'HCM1-K1', name: 'Khoang K1 - Laptop & Workstation', description: 'Khu vực kho an ninh cao, có khóa vân tay' },
      { code: 'HCM1-K2', name: 'Khoang K2 - Linh kiện PC & Màn hình', description: 'Kệ pallet 3 tầng tiêu chuẩn công nghiệp' },
      { code: 'HCM1-K3', name: 'Khoang K3 - Thiết bị lưu trữ & Ổ cứng', description: 'Khu chống tĩnh điện chuyên dụng' },
    ],
  },
  {
    name: 'Kho Chi nhánh Quận 1 (Bến Nghé)',
    code: 'WH-HCM-02',
    address: '45 Lê Duẩn, Bến Nghé, Quận 1, TP. HCM',
    managerUsername: 'manager_hcm',
    locations: [
      { code: 'Q1-01', name: 'Kệ Trưng bày & Xuất lẻ Q1', description: 'Hàng xuất bán trực tiếp trung tâm TP' },
    ],
  },
  {
    name: 'Kho Chi nhánh Tân Bình',
    code: 'WH-HCM-03',
    address: '180 Cộng Hòa, Phường 12, Tân Bình, TP. HCM',
    managerUsername: 'manager_hcm',
    locations: [
      { code: 'TB-01', name: 'Kệ Trung chuyển Sân bay', description: 'Khu vực tiếp nhận hàng không về kho' },
    ],
  },
  {
    name: 'Kho Trung chuyển Đà Nẵng',
    code: 'WH-DN-01',
    address: 'Lô C3 KCN Hòa Khánh, Liên Chiểu, TP. Đà Nẵng',
    managerUsername: 'admin',
    locations: [
      { code: 'DN-01', name: 'Khu vực Điều phối Miền Trung', description: 'Tập kết hàng xuất cho các tỉnh Trung Bộ' },
    ],
  },
  {
    name: 'Kho Chi nhánh Hải Phòng',
    code: 'WH-HP-01',
    address: 'Lô 5 KCN Đình Vũ, Đông Hải 2, Hải An, TP. Hải Phòng',
    managerUsername: 'admin',
    locations: [
      { code: 'HP-01', name: 'Kệ Tiếp nhận Cảng Hải Phòng', description: 'Hàng nhập khẩu đường biển cập cảng' },
    ],
  },
  {
    name: 'Kho Chi nhánh Cần Thơ',
    code: 'WH-CT-01',
    address: 'Số 256 Đường 3/2, Xuân Khánh, Ninh Kiều, Cần Thơ',
    managerUsername: 'admin',
    locations: [
      { code: 'CT-01', name: 'Khu vực Tây Nam Bộ', description: 'Phân phối cho các tỉnh đồng bằng sông Cửu Long' },
    ],
  },
];

export async function seedWarehouses(
  dataSource: DataSource,
  logger: Logger,
): Promise<WarehouseEntity[]> {
  const warehouseRepo = dataSource.getRepository(WarehouseEntity);
  const locationRepo = dataSource.getRepository(WarehouseLocationEntity);
  const userRepo = dataSource.getRepository(UserEntity);

  const savedWarehouses: WarehouseEntity[] = [];

  for (const item of WAREHOUSES_DATA) {
    let wh = await warehouseRepo.findOne({ where: { code: item.code } });

    let managerId: string | null = null;
    if (item.managerUsername) {
      const manager = await userRepo.findOne({ where: { username: item.managerUsername } });
      if (manager) managerId = manager.id;
    }

    if (!wh) {
      wh = warehouseRepo.create({
        name: item.name,
        code: item.code,
        address: item.address,
        manager_id: managerId,
        is_active: true,
      });
      await warehouseRepo.save(wh);
      logger.log(`+ Thêm kho: ${wh.name} (${wh.code})`);
    } else {
      wh.name = item.name;
      wh.address = item.address;
      wh.manager_id = managerId;
      await warehouseRepo.save(wh);
    }

    // Seed vị trí kệ trong kho nếu có
    if (item.locations && item.locations.length > 0) {
      for (const loc of item.locations) {
        let location = await locationRepo.findOne({
          where: { warehouse_id: wh.id, code: loc.code },
        });
        if (!location) {
          location = locationRepo.create({
            warehouse_id: wh.id,
            code: loc.code,
            name: loc.name,
            description: loc.description,
          });
          await locationRepo.save(location);
        }
      }
    }

    savedWarehouses.push(wh);
  }

  logger.log(`Tổng cộng: ${savedWarehouses.length} kho hàng và vị trí kệ đã sẵn sàng.`);
  return savedWarehouses;
}

if (require.main === module) {
  runStandaloneSeed(seedWarehouses, 'WarehousesSeed');
}
