import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { CustomerEntity } from '../modules/customers/entities/customer.entity';
import { CustomerType } from '../modules/customers/enums/customer-type.enum';
import { runStandaloneSeed } from './seed.helper';

export const CUSTOMERS_DATA: Array<Partial<CustomerEntity>> = [
  {
    code: 'CUST-HA-NOI-01',
    name: 'Công ty Cổ phần Tin học Bách Khoa (BK Tech)',
    phone: '02438681122',
    email: 'kinhdoanh@bktech.vn',
    address: 'Số 1 Đại Cồ Việt, Phường Bách Khoa, Hai Bà Trưng, Hà Nội',
    type: CustomerType.DISTRIBUTOR,
    tax_id: '0102345678',
    debt_limit: 500000000,
    current_debt: 120000000,
    is_active: true,
  },
  {
    code: 'CUST-HCM-01',
    name: 'Công ty TNHH Đầu tư & Phát triển Công nghệ Sài Gòn (SaigonTech)',
    phone: '02839105566',
    email: 'contact@saigontech.com.vn',
    address: '280 An Dương Vương, Phường 4, Quận 5, TP. HCM',
    type: CustomerType.DISTRIBUTOR,
    tax_id: '0309876543',
    debt_limit: 800000000,
    current_debt: 250000000,
    is_active: true,
  },
  {
    code: 'CUST-DN-01',
    name: 'Công ty TNHH Thương mại Công nghệ Miền Trung',
    phone: '02363889977',
    email: 'sales@mientrungtech.vn',
    address: '158 Nguyễn Văn Linh, Quận Hải Châu, TP. Đà Nẵng',
    type: CustomerType.WHOLESALE,
    tax_id: '0401122334',
    debt_limit: 300000000,
    current_debt: 45000000,
    is_active: true,
  },
  {
    code: 'CUST-RETAIL-01',
    name: 'Chuỗi Hệ thống Bán lẻ Thiết bị Công nghệ TechZone',
    phone: '0903123456',
    email: 'order@techzone.vn',
    address: '42 Thái Hà, Trung Liệt, Đống Đa, Hà Nội',
    type: CustomerType.WHOLESALE,
    tax_id: '0108765432',
    debt_limit: 200000000,
    current_debt: 0,
    is_active: true,
  },
  {
    code: 'CUST-CORP-01',
    name: 'Tập đoàn Công nghệ Giáo dục EduFuture',
    phone: '0912987654',
    email: 'procurement@edufuture.edu.vn',
    address: 'Khu Công nghệ cao Hòa Lạc, Thạch Thất, Hà Nội',
    type: CustomerType.RETAIL,
    tax_id: '0106543219',
    debt_limit: 150000000,
    current_debt: 35000000,
    is_active: true,
  },
  {
    code: 'CUST-HP-01',
    name: 'Công ty Cổ phần Giải pháp Số Hải Phòng',
    phone: '02253847589',
    email: 'contact@haiphongdigital.vn',
    address: '88 Lê Hồng Phong, Đông Khê, Ngô Quyền, Hải Phòng',
    type: CustomerType.WHOLESALE,
    tax_id: '0200889911',
    debt_limit: 250000000,
    current_debt: 80000000,
    is_active: true,
  },
];

export async function seedCustomers(
  dataSource: DataSource,
  logger: Logger,
): Promise<CustomerEntity[]> {
  const customerRepo = dataSource.getRepository(CustomerEntity);
  const savedCustomers: CustomerEntity[] = [];

  for (const item of CUSTOMERS_DATA) {
    let customer = await customerRepo.findOne({ where: { code: item.code } });
    if (!customer) {
      customer = customerRepo.create(item);
      await customerRepo.save(customer);
      logger.log(`+ Thêm khách hàng / đại lý: [${customer.code}] ${customer.name}`);
    } else {
      customer.name = item.name || customer.name;
      customer.phone = item.phone || customer.phone;
      customer.email = item.email || customer.email;
      customer.address = item.address || customer.address;
      customer.type = item.type || customer.type;
      customer.debt_limit = item.debt_limit ?? customer.debt_limit;
      await customerRepo.save(customer);
    }
    savedCustomers.push(customer);
  }

  logger.log(`Tổng cộng: ${savedCustomers.length} khách hàng & đại lý đã sẵn sàng.`);
  return savedCustomers;
}

if (require.main === module) {
  runStandaloneSeed(seedCustomers, 'CustomersSeed');
}
