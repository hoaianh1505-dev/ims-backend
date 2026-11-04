import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { SupplierEntity } from '../modules/suppliers/entities/supplier.entity';
import { runStandaloneSeed } from './seed.helper';

export const SUPPLIERS_DATA: Array<Partial<SupplierEntity>> = [
  {
    name: 'Công ty TNHH Phân phối Synnex FPT',
    code: 'SUP-FPT',
    contact_name: 'Nguyễn Văn Hùng',
    email: 'contact@synnexfpt.com.vn',
    phone: '02473000911',
    address: 'Tòa nhà FPT Cầu Giấy, Phố Duy Tân, Cầu Giấy, Hà Nội',
    is_active: true,
  },
  {
    name: 'Công ty Cổ phần Thế Giới Số (Digiworld - DGW)',
    code: 'SUP-DGW',
    contact_name: 'Trần Thị Mai',
    email: 'sales@digiworld.com.vn',
    phone: '02839290059',
    address: '195 Cô Bắc, Phường Cô Giang, Quận 1, TP. HCM',
    is_active: true,
  },
  {
    name: 'Công ty TNHH Tin học Viết Sơn',
    code: 'SUP-VIETSON',
    contact_name: 'Lê Hoàng Nam',
    email: 'support@vietson.com',
    phone: '02838334455',
    address: '150 Nguyễn Thị Minh Khai, Phường 6, Quận 3, TP. HCM',
    is_active: true,
  },
  {
    name: 'Nhà phân phối Tin học Mai Hoàng',
    code: 'SUP-MAIHOANG',
    contact_name: 'Phạm Quốc Bảo',
    email: 'kinhdoanh@maihoang.com.vn',
    phone: '02435377109',
    address: '241 Phố Vọng, Phường Đồng Tâm, Hai Bà Trưng, Hà Nội',
    is_active: true,
  },
  {
    name: 'Công ty TNHH MTV Công nghệ Tin học Viễn Sơn',
    code: 'SUP-VIENSON',
    contact_name: 'Đặng Thanh Tâm',
    email: 'distribution@microstar.com.vn',
    phone: '02838326085',
    address: '162 Bùi Thị Xuân, Phường Phạm Ngũ Lão, Quận 1, TP. HCM',
    is_active: true,
  },
  {
    name: 'Công ty Cổ phần Máy tính Vĩnh Xuân (SPC)',
    code: 'SUP-VINHXUAN',
    contact_name: 'Vũ Trọng Đạt',
    email: 'sales@spc.com.vn',
    phone: '02439743410',
    address: 'Số 9 ngõ 117 Thái Hà, Đống Đa, Hà Nội',
    is_active: true,
  },
  {
    name: 'Công ty Cổ phần Đầu tư Công nghệ HACOM',
    code: 'SUP-HACOM',
    contact_name: 'Đỗ Hữu Minh',
    email: 'b2b@hacom.vn',
    phone: '19001903',
    address: '131 Lê Thanh Nghị, Hai Bà Trưng, Hà Nội',
    is_active: true,
  },
  {
    name: 'Công ty Cổ phần Thương mại Dịch vụ Phong Vũ',
    code: 'SUP-PHONGVU',
    contact_name: 'Ngô Kim Loan',
    email: 'b2b.corporate@phongvu.vn',
    phone: '18006867',
    address: 'Tầng 11, Tòa nhà Dreamplex, 195 Điện Biên Phủ, Bình Thạnh, TP. HCM',
    is_active: true,
  },
];

export async function seedSuppliers(
  dataSource: DataSource,
  logger: Logger,
): Promise<SupplierEntity[]> {
  const supplierRepo = dataSource.getRepository(SupplierEntity);
  const savedSuppliers: SupplierEntity[] = [];

  for (const item of SUPPLIERS_DATA) {
    let sup = await supplierRepo.findOne({ where: { code: item.code } });
    if (!sup) {
      sup = supplierRepo.create(item);
      await supplierRepo.save(sup);
      logger.log(`+ Thêm nhà cung cấp: ${sup.name} (${sup.code})`);
    } else {
      Object.assign(sup, item);
      await supplierRepo.save(sup);
    }
    savedSuppliers.push(sup);
  }

  logger.log(`Tổng cộng: ${savedSuppliers.length} nhà cung cấp đã sẵn sàng.`);
  return savedSuppliers;
}

if (require.main === module) {
  runStandaloneSeed(seedSuppliers, 'SuppliersSeed');
}
