import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { CategoryEntity } from '../modules/categories/entities/category.entity';
import { runStandaloneSeed } from './seed.helper';

export const CATEGORIES_DATA: Array<{ name: string; description: string }> = [
  {
    name: 'Linh kiện máy tính',
    description: 'Bộ vi xử lý CPU, RAM, Mainboard, Card đồ họa VGA, Nguồn PSU, Tản nhiệt',
  },
  {
    name: 'Màn hình máy tính',
    description: 'Màn hình đồ họa chuẩn màu, màn hình văn phòng, màn hình Gaming tần số quét cao',
  },
  {
    name: 'Thiết bị ngoại vi',
    description: 'Chuột không dây/gaming, Bàn phím cơ, Tai nghe chống ồn, Webcam Full HD/4K',
  },
  {
    name: 'Thiết bị lưu trữ',
    description: 'Ổ cứng SSD NVMe PCIe Gen 4/5, HDD máy chủ/NAS, Thẻ nhớ tốc độ cao, USB Flash',
  },
  {
    name: 'Thiết bị mạng & Viễn thông',
    description: 'Router Wi-Fi 6/7, Switch mạng Managed/Unmanaged, Cân bằng tải, Bộ phát Access Point',
  },
  {
    name: 'Phụ kiện & Cáp kết nối',
    description: 'Cáp Thunderbolt, Type-C, HDMI 2.1, DisplayPort, Hub chuyển đổi đa năng',
  },
  {
    name: 'Laptop & Máy tính đồng bộ',
    description: 'Laptop doanh nhân mỏng nhẹ, Laptop đồ họa - Gaming, Máy trạm Workstation chuyên dụng',
  },
  {
    name: 'Thiết bị văn phòng & In ấn',
    description: 'Máy in laser trắng đen/màu, Máy quét scanner tài liệu tốc độ cao, Máy hủy giấy',
  },
  {
    name: 'Thiết bị nguồn & Lưu điện',
    description: 'Bộ lưu điện UPS Online/Offline, Ổ cắm chống sét chuẩn công nghiệp',
  },
  {
    name: 'Camera & An ninh giám sát',
    description: 'Camera IP giám sát kho, Đầu ghi hình NVR, Thiết bị kiểm soát ra vào cửa',
  },
];

export async function seedCategories(
  dataSource: DataSource,
  logger: Logger,
): Promise<CategoryEntity[]> {
  const categoryRepo = dataSource.getRepository(CategoryEntity);
  const savedCategories: CategoryEntity[] = [];

  for (const item of CATEGORIES_DATA) {
    let cat = await categoryRepo.findOne({ where: { name: item.name } });
    if (!cat) {
      cat = categoryRepo.create(item);
      await categoryRepo.save(cat);
      logger.log(`+ Thêm danh mục: ${cat.name}`);
    } else {
      cat.description = item.description;
      await categoryRepo.save(cat);
    }
    savedCategories.push(cat);
  }

  logger.log(`Tổng cộng: ${savedCategories.length} danh mục đã sẵn sàng.`);
  return savedCategories;
}

if (require.main === module) {
  runStandaloneSeed(seedCategories, 'CategoriesSeed');
}
