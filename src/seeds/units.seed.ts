import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { UnitEntity } from '../modules/units/entities/unit.entity';
import { runStandaloneSeed } from './seed.helper';

export const UNITS_DATA: Array<{ name: string; symbol: string }> = [
  { name: 'Cái', symbol: 'cái' },
  { name: 'Chiếc', symbol: 'chiếc' },
  { name: 'Bộ', symbol: 'bộ' },
  { name: 'Hộp', symbol: 'hộp' },
  { name: 'Thùng', symbol: 'thùng' },
  { name: 'Gói', symbol: 'gói' },
  { name: 'Mét', symbol: 'm' },
  { name: 'Cuộn', symbol: 'cuộn' },
  { name: 'Cặp', symbol: 'cặp' },
  { name: 'Thanh', symbol: 'thanh' },
  { name: 'Ram', symbol: 'ram' },
];

export async function seedUnits(dataSource: DataSource, logger: Logger): Promise<UnitEntity[]> {
  const unitRepo = dataSource.getRepository(UnitEntity);
  const savedUnits: UnitEntity[] = [];

  for (const item of UNITS_DATA) {
    let unit = await unitRepo.findOne({ where: { name: item.name } });
    if (!unit) {
      unit = unitRepo.create(item);
      await unitRepo.save(unit);
      logger.log(`+ Thêm đơn vị tính: ${unit.name} (${unit.symbol})`);
    } else {
      unit.symbol = item.symbol;
      await unitRepo.save(unit);
    }
    savedUnits.push(unit);
  }

  logger.log(`Tổng cộng: ${savedUnits.length} đơn vị tính đã sẵn sàng.`);
  return savedUnits;
}

if (require.main === module) {
  runStandaloneSeed(seedUnits, 'UnitsSeed');
}
