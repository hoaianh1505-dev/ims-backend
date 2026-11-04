import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { ProductEntity } from '../modules/products/entities/product.entity';
import { CategoryEntity } from '../modules/categories/entities/category.entity';
import { UnitEntity } from '../modules/units/entities/unit.entity';
import { SupplierEntity } from '../modules/suppliers/entities/supplier.entity';
import { runStandaloneSeed } from './seed.helper';

// Hàm tính mã vạch chuẩn GS1 EAN-13 (12 ký số + 1 số kiểm tra modulo 10)
function makeEAN13(code12: string): string {
  let sumOdd = 0;
  let sumEven = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code12[i], 10);
    if (i % 2 === 0) sumOdd += digit;
    else sumEven += digit;
  }
  const checksum = (10 - ((sumOdd + sumEven * 3) % 10)) % 10;
  return code12 + checksum.toString();
}

export interface SeedProductItem {
  name: string;
  sku: string;
  barcode12: string; // 12 số (bắt đầu bằng 893...)
  cost_price: number;
  selling_price: number;
  low_stock_threshold: number;
  categoryName: string;
  unitName: string;
  supplierCode: string;
  description: string;
}

export const PRODUCTS_SEED_DATA: SeedProductItem[] = [
  // --- 1. LINH KIỆN MÁY TÍNH ---
  {
    name: 'CPU Intel Core i7 14700K (3.4GHz Turbo 5.6GHz, 20 nhân 28 luồng)',
    sku: 'CPU-INTEL-14700K',
    barcode12: '893600100001',
    cost_price: 9200000,
    selling_price: 10890000,
    low_stock_threshold: 8,
    categoryName: 'Linh kiện máy tính',
    unitName: 'Hộp',
    supplierCode: 'SUP-FPT',
    description: 'Bộ vi xử lý Intel Core thế hệ 14 Raptor Lake Refresh, socket LGA1700, hỗ trợ DDR4 & DDR5.',
  },
  {
    name: 'CPU AMD Ryzen 7 7800X3D (4.2GHz Turbo 5.0GHz, 8 nhân 16 luồng 3D V-Cache)',
    sku: 'CPU-AMD-7800X3D',
    barcode12: '893600100002',
    cost_price: 8800000,
    selling_price: 10450000,
    low_stock_threshold: 6,
    categoryName: 'Linh kiện máy tính',
    unitName: 'Hộp',
    supplierCode: 'SUP-DGW',
    description: 'CPU chơi game hàng đầu thế giới với công nghệ 3D V-Cache 96MB L3, Socket AM5.',
  },
  {
    name: 'Card màn hình ASUS ROG Strix GeForce RTX 4070 Ti SUPER 16GB GDDR6X',
    sku: 'VGA-ASUS-4070TIS',
    barcode12: '893600100003',
    cost_price: 23500000,
    selling_price: 27990000,
    low_stock_threshold: 4,
    categoryName: 'Linh kiện máy tính',
    unitName: 'Cái',
    supplierCode: 'SUP-VIENSON',
    description: 'VGA tản nhiệt 3 quạt Axial-tech cao cấp, công nghệ Ray Tracing và DLSS 3.5 đỉnh cao.',
  },
  {
    name: 'Card màn hình MSI GeForce RTX 4060 Ventus 2X Black 8GB OC',
    sku: 'VGA-MSI-4060V2X',
    barcode12: '893600100004',
    cost_price: 7100000,
    selling_price: 8490000,
    low_stock_threshold: 12,
    categoryName: 'Linh kiện máy tính',
    unitName: 'Cái',
    supplierCode: 'SUP-MAIHOANG',
    description: 'Card đồ họa quốc dân thế hệ 40 series, 2 quạt TORX 4.0 mát mẻ, tiết kiệm điện.',
  },
  {
    name: 'Mainboard ASUS ROG MAXIMUS Z790 HERO DDR5',
    sku: 'MB-ASUS-Z790H',
    barcode12: '893600100005',
    cost_price: 14200000,
    selling_price: 16990000,
    low_stock_threshold: 5,
    categoryName: 'Linh kiện máy tính',
    unitName: 'Cái',
    supplierCode: 'SUP-VIENSON',
    description: 'Bo mạch chủ cao cấp cho CPU Intel socket LGA1700, 20+1 phase nguồn, Wi-Fi 6E.',
  },
  {
    name: 'RAM Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz Black',
    sku: 'RAM-COR-DDR5-32G',
    barcode12: '893600100006',
    cost_price: 2450000,
    selling_price: 3190000,
    low_stock_threshold: 15,
    categoryName: 'Linh kiện máy tính',
    unitName: 'Bộ',
    supplierCode: 'SUP-VINHXUAN',
    description: 'Bộ kit 2 thanh RAM DDR5 hiệu năng cao, đèn LED RGB đa vùng đồng bộ iCUE.',
  },
  {
    name: 'RAM Kingston Fury Beast 16GB DDR4 3200MHz',
    sku: 'RAM-KING-16G-32',
    barcode12: '893600100007',
    cost_price: 780000,
    selling_price: 990000,
    low_stock_threshold: 25,
    categoryName: 'Linh kiện máy tính',
    unitName: 'Thanh',
    supplierCode: 'SUP-VIETSON',
    description: 'Thanh RAM DDR4 độ trễ thấp CL16, tản nhiệt nhôm đen nguyên khối.',
  },
  {
    name: 'Nguồn máy tính Seasonic Focus GX-850 850W 80 Plus Gold Full Modular',
    sku: 'PSU-SEA-GX850',
    barcode12: '893600100008',
    cost_price: 2850000,
    selling_price: 3590000,
    low_stock_threshold: 10,
    categoryName: 'Linh kiện máy tính',
    unitName: 'Cái',
    supplierCode: 'SUP-MAIHOANG',
    description: 'Nguồn chuẩn 80 Plus Gold, cáp rời hoàn toàn, quạt FDB 120mm êm ái, bảo hành 10 năm.',
  },

  // --- 2. MÀN HÌNH MÁY TÍNH ---
  {
    name: 'Màn hình Dell UltraSharp U2723QE 27 inch 4K IPS Black',
    sku: 'MON-DELL-U2723QE',
    barcode12: '893600200001',
    cost_price: 10800000,
    selling_price: 13990000,
    low_stock_threshold: 8,
    categoryName: 'Màn hình máy tính',
    unitName: 'Cái',
    supplierCode: 'SUP-FPT',
    description: 'Màn hình đồ họa cao cấp công nghệ IPS Black tỉ lệ tương phản 2000:1, sRGB 100%, Hub Type-C 90W.',
  },
  {
    name: 'Màn hình LG UltraGear 27GP850-B 27 inch Nano IPS 2K 165Hz',
    sku: 'MON-LG-27GP850',
    barcode12: '893600200002',
    cost_price: 6850000,
    selling_price: 8490000,
    low_stock_threshold: 10,
    categoryName: 'Màn hình máy tính',
    unitName: 'Cái',
    supplierCode: 'SUP-DGW',
    description: 'Màn hình gaming tần số quét 165Hz (O/C 180Hz), thời gian đáp ứng 1ms GtG, hỗ trợ G-Sync Compatible.',
  },
  {
    name: 'Màn hình ASUS ProArt PA278CV 27 inch 2K IPS Chuyên Đồ Họa',
    sku: 'MON-ASUS-PA278CV',
    barcode12: '893600200003',
    cost_price: 6900000,
    selling_price: 8690000,
    low_stock_threshold: 7,
    categoryName: 'Màn hình máy tính',
    unitName: 'Cái',
    supplierCode: 'SUP-VIENSON',
    description: 'Đạt chứng nhận Calman Verified, chuẩn màu Delta E < 2, kết nối Daisy-chain DisplayPort.',
  },
  {
    name: 'Màn hình văn phòng Samsung Essential S3 S31C 24 inch IPS 75Hz',
    sku: 'MON-SAM-S31C-24',
    barcode12: '893600200004',
    cost_price: 1850000,
    selling_price: 2490000,
    low_stock_threshold: 20,
    categoryName: 'Màn hình máy tính',
    unitName: 'Cái',
    supplierCode: 'SUP-FPT',
    description: 'Màn hình viền siêu mỏng 3 cạnh, công nghệ Eye Saver Mode chống mỏi mắt cho nhân viên văn phòng.',
  },

  // --- 3. THIẾT BỊ NGOẠI VI ---
  {
    name: 'Chuột không dây Logitech MX Master 3S Ergonomic Silent',
    sku: 'MOU-LOGI-MX3S',
    barcode12: '893600300001',
    cost_price: 1850000,
    selling_price: 2490000,
    low_stock_threshold: 15,
    categoryName: 'Thiết bị ngoại vi',
    unitName: 'Cái',
    supplierCode: 'SUP-DGW',
    description: 'Chuột công thái học hàng đầu cho chuyên gia, click êm ái Quiet Clicks, cuộn MagSpeed 1000 dòng/giây.',
  },
  {
    name: 'Bàn phím cơ Keychron K2 Pro QMK/VIA Wireless',
    sku: 'KB-KEY-K2PRO',
    barcode12: '893600300002',
    cost_price: 1680000,
    selling_price: 2190000,
    low_stock_threshold: 10,
    categoryName: 'Thiết bị ngoại vi',
    unitName: 'Chiếc',
    supplierCode: 'SUP-MAIHOANG',
    description: 'Bàn phím cơ layout 75%, hotswap, keycap PBT double-shot OSA, hỗ trợ tùy biến macro QMK/VIA.',
  },
  {
    name: 'Bàn phím cơ Logitech G Pro X TKL Lightspeed Gaming',
    sku: 'KB-LOGI-GPROX',
    barcode12: '893600300003',
    cost_price: 3200000,
    selling_price: 4290000,
    low_stock_threshold: 5,
    categoryName: 'Thiết bị ngoại vi',
    unitName: 'Chiếc',
    supplierCode: 'SUP-DGW',
    description: 'Bàn phím eSports không dây công nghệ Lightspeed 1ms siêu tốc, switch GX Brown quang học.',
  },
  {
    name: 'Tai nghe chụp tai Sony WH-1000XM5 Chống Ồn Chủ Động',
    sku: 'HP-SONY-XM5-BLK',
    barcode12: '893600300004',
    cost_price: 6300000,
    selling_price: 7990000,
    low_stock_threshold: 5,
    categoryName: 'Thiết bị ngoại vi',
    unitName: 'Chiếc',
    supplierCode: 'SUP-VIETSON',
    description: 'Tai nghe chống ồn khử tạp âm số 1 thị trường, 8 micro AI đàm thoại, pin 30 giờ liên tục.',
  },
  {
    name: 'Webcam Logitech Brio 4K Ultra HD RightLight 3',
    sku: 'CAM-LOGI-BRIO',
    barcode12: '893600300005',
    cost_price: 3150000,
    selling_price: 4190000,
    low_stock_threshold: 8,
    categoryName: 'Thiết bị ngoại vi',
    unitName: 'Cái',
    supplierCode: 'SUP-DGW',
    description: 'Webcam hội nghị truyền hình 4K HDR, mở khóa khuôn mặt Windows Hello, zoom quang học 5x.',
  },

  // --- 4. THIẾT BỊ LƯU TRỮ ---
  {
    name: 'Ổ cứng SSD Samsung 990 PRO 1TB PCIe Gen 4.0 x4 M.2 NVMe',
    sku: 'SSD-SAM-990P-1T',
    barcode12: '893600400001',
    cost_price: 2150000,
    selling_price: 2890000,
    low_stock_threshold: 20,
    categoryName: 'Thiết bị lưu trữ',
    unitName: 'Hộp',
    supplierCode: 'SUP-VIETSON',
    description: 'Tốc độ đọc tuần tự lên đến 7450 MB/s, ghi 6900 MB/s, kiểm soát nhiệt thông minh Dynamic Thermal Guard.',
  },
  {
    name: 'Ổ cứng SSD Samsung 990 PRO 2TB PCIe Gen 4.0 x4 M.2 NVMe',
    sku: 'SSD-SAM-990P-2T',
    barcode12: '893600400002',
    cost_price: 3800000,
    selling_price: 4990000,
    low_stock_threshold: 10,
    categoryName: 'Thiết bị lưu trữ',
    unitName: 'Hộp',
    supplierCode: 'SUP-VIETSON',
    description: 'Phiên bản dung lượng 2TB chuyên dụng cho dựng phim 8K và lưu trữ dữ liệu máy trạm đồ họa nặng.',
  },
  {
    name: 'Ổ cứng di động Western Digital My Passport 2TB USB 3.2 Gen 1',
    sku: 'HDD-WD-PASS-2T',
    barcode12: '893600400003',
    cost_price: 1680000,
    selling_price: 2250000,
    low_stock_threshold: 15,
    categoryName: 'Thiết bị lưu trữ',
    unitName: 'Cái',
    supplierCode: 'SUP-FPT',
    description: 'Ổ cứng gắn ngoài nhỏ gọn bỏ túi, tích hợp phần mềm sao lưu tự động và mã hóa phần cứng AES 256-bit.',
  },
  {
    name: 'Ổ cứng chuyên dụng NAS Western Digital Red Plus 4TB 3.5 inch SATA 3',
    sku: 'HDD-WD-RED-4TB',
    barcode12: '893600400004',
    cost_price: 2750000,
    selling_price: 3490000,
    low_stock_threshold: 8,
    categoryName: 'Thiết bị lưu trữ',
    unitName: 'Cái',
    supplierCode: 'SUP-VINHXUAN',
    description: 'Thiết kế cho hệ thống lưu trữ mạng NAS chạy liên tục 24/7, công nghệ NASware 3.0 chống rung lắc.',
  },

  // --- 5. THIẾT BỊ MẠNG & VIỄN THÔNG ---
  {
    name: 'Router Wi-Fi 6 ASUS RT-AX58U Chuẩn AX3000 Dual-Band',
    sku: 'NET-ASUS-AX58U',
    barcode12: '893600500001',
    cost_price: 1950000,
    selling_price: 2590000,
    low_stock_threshold: 10,
    categoryName: 'Thiết bị mạng & Viễn thông',
    unitName: 'Bộ',
    supplierCode: 'SUP-VIENSON',
    description: 'Băng thông tổng 3000Mbps, 160MHz kênh truyền, bảo mật AiProtection Pro trọn đời bởi Trend Micro.',
  },
  {
    name: 'Switch mạng Cisco Business CBS110-16T 16 Cổng Gigabit Unmanaged',
    sku: 'NET-CISCO-CBS110',
    barcode12: '893600500002',
    cost_price: 2100000,
    selling_price: 2850000,
    low_stock_threshold: 6,
    categoryName: 'Thiết bị mạng & Viễn thông',
    unitName: 'Cái',
    supplierCode: 'SUP-FPT',
    description: 'Bộ chia mạng văn phòng doanh nghiệp 16 cổng 10/100/1000Mbps, vỏ kim loại chắc chắn.',
  },
  {
    name: 'Bộ cân bằng tải Router MikroTik RB750Gr3 (hEX) Gigabit',
    sku: 'NET-MIK-RB750',
    barcode12: '893600500003',
    cost_price: 1250000,
    selling_price: 1690000,
    low_stock_threshold: 12,
    categoryName: 'Thiết bị mạng & Viễn thông',
    unitName: 'Cái',
    supplierCode: 'SUP-VINHXUAN',
    description: 'Router cân bằng tải chuyên dụng cho văn phòng 80-100 người, hệ điều hành RouterOS level 4.',
  },

  // --- 6. PHỤ KIỆN & CÁP KẾT NỐI ---
  {
    name: 'Cáp Ugreen Type-C to HDMI 4K@60Hz bọc dù dài 2m',
    sku: 'CAB-UGR-CH4K-2M',
    barcode12: '893600600001',
    cost_price: 185000,
    selling_price: 290000,
    low_stock_threshold: 30,
    categoryName: 'Phụ kiện & Cáp kết nối',
    unitName: 'Sợi',
    supplierCode: 'SUP-VIETSON',
    description: 'Cáp xuất hình từ laptop/iPad sang màn hình ngoài độ phân giải 4K 60Hz, đầu cắm mạ vàng 24K.',
  },
  {
    name: 'Hub chuyển đổi đa năng Belkin 7-in-1 USB-C Multiport Adapter',
    sku: 'HUB-BEL-7IN1',
    barcode12: '893600600002',
    cost_price: 980000,
    selling_price: 1450000,
    low_stock_threshold: 12,
    categoryName: 'Phụ kiện & Cáp kết nối',
    unitName: 'Cái',
    supplierCode: 'SUP-DGW',
    description: 'Mở rộng cổng USB-C: HDMI 4K, 2x USB-A 3.0, khe thẻ SD/TF, cổng sạc Power Delivery 100W.',
  },
  {
    name: 'Cáp mạng đúc sẵn Cat6 UTP CommScope AMP dài 5 mét',
    sku: 'CAB-AMP-CAT6-5M',
    barcode12: '893600600003',
    cost_price: 45000,
    selling_price: 85000,
    low_stock_threshold: 50,
    categoryName: 'Phụ kiện & Cáp kết nối',
    unitName: 'Sợi',
    supplierCode: 'SUP-FPT',
    description: 'Cáp mạng truyền tín hiệu chuẩn Gigabit Ethernet 1000Mbps, lõi đồng nguyên chất chống suy hao.',
  },

  // --- 7. LAPTOP & MÁY TÍNH ĐỒNG BỘ ---
  {
    name: 'Laptop Dell XPS 13 9340 Core Ultra 7 155H 16GB 512GB SSD 13.4 inch FHD+',
    sku: 'LAP-DELL-XPS13',
    barcode12: '893600700001',
    cost_price: 36500000,
    selling_price: 43990000,
    low_stock_threshold: 4,
    categoryName: 'Laptop & Máy tính đồng bộ',
    unitName: 'Chiếc',
    supplierCode: 'SUP-FPT',
    description: 'Ultrabook doanh nhân siêu sang trọng vỏ nhôm CNC nguyên khối, phím bấm cảm ứng, màn hình vô cực InfinityEdge.',
  },
  {
    name: 'Laptop Lenovo ThinkPad T14 Gen 4 Ryzen 7 PRO 7840U 32GB 1TB SSD',
    sku: 'LAP-LEN-T14G4',
    barcode12: '893600700002',
    cost_price: 27500000,
    selling_price: 32900000,
    low_stock_threshold: 3,
    categoryName: 'Laptop & Máy tính đồng bộ',
    unitName: 'Chiếc',
    supplierCode: 'SUP-DGW',
    description: 'Laptop độ bền tiêu chuẩn quân đội MIL-STD 810H, bàn phím gõ êm số 1 thế giới, bảo mật vân tay và TPM 2.0.',
  },
  {
    name: 'Máy trạm đồng bộ Dell Precision 3660 Tower i7 13700 32GB 1TB RTX A2000',
    sku: 'PC-DELL-PREC3660',
    barcode12: '893600700003',
    cost_price: 39000000,
    selling_price: 46500000,
    low_stock_threshold: 2,
    categoryName: 'Laptop & Máy tính đồng bộ',
    unitName: 'Bộ',
    supplierCode: 'SUP-FPT',
    description: 'Workstation chuyên dụng dựng hình 3D Solidworks, AutoCAD, Revit với nguồn 500W Platinum ổn định cao.',
  },

  // --- 8. THIẾT BỊ VĂN PHÒNG & IN ẤN ---
  {
    name: 'Máy in laser trắng đen Canon LBP2900 Huyền Thoại',
    sku: 'PRI-CANON-2900',
    barcode12: '893600800001',
    cost_price: 3850000,
    selling_price: 4690000,
    low_stock_threshold: 15,
    categoryName: 'Thiết bị văn phòng & In ấn',
    unitName: 'Chiếc',
    supplierCode: 'SUP-DGW',
    description: 'Máy in laser A4 bán chạy nhất Việt Nam, cartridge mực to in bền bỉ, dễ dàng thay thế linh kiện.',
  },
  {
    name: 'Máy in đa chức năng HP LaserJet Pro MFP M236dw (In, Scan, Copy 2 mặt tự động Wi-Fi)',
    sku: 'PRI-HP-M236DW',
    barcode12: '893600800002',
    cost_price: 5100000,
    selling_price: 6390000,
    low_stock_threshold: 8,
    categoryName: 'Thiết bị văn phòng & In ấn',
    unitName: 'Chiếc',
    supplierCode: 'SUP-FPT',
    description: 'In đảo mặt tự động tốc độ 29 trang/phút, kết nối mạng không dây in trực tiếp từ điện thoại thông minh.',
  },

  // --- 9. THIẾT BỊ NGUỒN & LƯU ĐIỆN ---
  {
    name: 'Bộ lưu điện APC Easy UPS BVX 1200VA 230V AVR Universal Sockets',
    sku: 'UPS-APC-1200VA',
    barcode12: '893600900001',
    cost_price: 2150000,
    selling_price: 2790000,
    low_stock_threshold: 10,
    categoryName: 'Thiết bị nguồn & Lưu điện',
    unitName: 'Cái',
    supplierCode: 'SUP-VINHXUAN',
    description: 'Lưu điện cho máy tính và thiết bị mạng chống sập nguồn đột ngột, tự động ổn áp AVR bảo vệ linh kiện.',
  },

  // --- 10. CAMERA & AN NINH GIÁM SÁT ---
  {
    name: 'Camera IP Thân Trụ Hikvision DS-2CD2043G2-I 4MP Chuẩn Chống Nước IP67',
    sku: 'CAM-HIK-2043G2',
    barcode12: '893601000001',
    cost_price: 1350000,
    selling_price: 1850000,
    low_stock_threshold: 16,
    categoryName: 'Camera & An ninh giám sát',
    unitName: 'Cái',
    supplierCode: 'SUP-FPT',
    description: 'Camera quan sát kho bãi độ phân giải 4MP sắc nét, tầm xa hồng ngoại 30m, phân biệt người và phương tiện qua AI AcuSense.',
  },
  {
    name: 'Đầu ghi hình IP Hikvision DS-7608NI-K2 8 Kênh 4K Chuẩn H.265+',
    sku: 'NVR-HIK-7608',
    barcode12: '893601000002',
    cost_price: 2200000,
    selling_price: 2950000,
    low_stock_threshold: 5,
    categoryName: 'Camera & An ninh giám sát',
    unitName: 'Bộ',
    supplierCode: 'SUP-FPT',
    description: 'Hỗ trợ 8 camera IP độ phân giải tối đa 4K 8MP, 2 khe cắm ổ cứng SATA dung lượng tối đa 8TB mỗi ổ.',
  },
];

export async function seedProducts(
  dataSource: DataSource,
  logger: Logger,
): Promise<ProductEntity[]> {
  const productRepo = dataSource.getRepository(ProductEntity);
  const categoryRepo = dataSource.getRepository(CategoryEntity);
  const unitRepo = dataSource.getRepository(UnitEntity);
  const supplierRepo = dataSource.getRepository(SupplierEntity);

  const categories = await categoryRepo.find();
  const units = await unitRepo.find();
  const suppliers = await supplierRepo.find();

  const categoryMap = new Map(categories.map((c) => [c.name, c.id]));
  // fallback mapping if exact unit not found
  const unitMap = new Map(units.map((u) => [u.name, u.id]));
  const defaultUnitId = units[0]?.id;
  const supplierMap = new Map(suppliers.map((s) => [s.code, s.id]));
  const defaultSupplierId = suppliers[0]?.id;

  const savedProducts: ProductEntity[] = [];

  for (const item of PRODUCTS_SEED_DATA) {
    const fullBarcode = makeEAN13(item.barcode12);
    let prod = await productRepo.findOne({ where: { sku: item.sku } });

    const categoryId = categoryMap.get(item.categoryName);
    const unitId = unitMap.get(item.unitName) || defaultUnitId;
    const supplierId = supplierMap.get(item.supplierCode) || defaultSupplierId;

    if (!prod) {
      prod = productRepo.create({
        name: item.name,
        sku: item.sku,
        barcode: fullBarcode,
        cost_price: item.cost_price,
        selling_price: item.selling_price,
        low_stock_threshold: item.low_stock_threshold,
        category_id: (categoryId || null) as any,
        unit_id: (unitId || null) as any,
        supplier_id: (supplierId || null) as any,
        description: item.description,
      });
      await productRepo.save(prod);
      logger.log(`+ Thêm sản phẩm [${prod.sku}]: ${prod.name} (Barcode: ${fullBarcode})`);
    } else {
      prod.name = item.name;
      prod.barcode = fullBarcode;
      prod.cost_price = item.cost_price;
      prod.selling_price = item.selling_price;
      prod.low_stock_threshold = item.low_stock_threshold;
      prod.category_id = (categoryId || null) as any;
      prod.unit_id = (unitId || null) as any;
      prod.supplier_id = (supplierId || null) as any;
      prod.description = item.description;
      await productRepo.save(prod);
    }

    savedProducts.push(prod);
  }

  logger.log(`Tổng cộng: ${savedProducts.length} sản phẩm đầy đủ barcode GS1 EAN-13 đã sẵn sàng.`);
  return savedProducts;
}

if (require.main === module) {
  runStandaloneSeed(seedProducts, 'ProductsSeed');
}
