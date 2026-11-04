import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';

export async function runStandaloneSeed(
  seedFn: (dataSource: DataSource, logger: Logger) => Promise<any>,
  seedName: string,
) {
  const logger = new Logger(seedName);
  logger.log(`=== BẮT ĐẦU CHẠY SEED: ${seedName} ===`);
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const dataSource = app.get(DataSource);
    await seedFn(dataSource, logger);
    logger.log(`=== HOÀN THÀNH SEED: ${seedName} THÀNH CÔNG ===`);
  } catch (error) {
    logger.error(`Lỗi khi thực thi seed ${seedName}:`, error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}
