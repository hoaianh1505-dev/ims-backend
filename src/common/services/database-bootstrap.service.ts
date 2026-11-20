import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { runAllSeeds } from '../../seeds/all.seed';

@Injectable()
export class DatabaseBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger('DatabaseBootstrap');

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    try {
      this.logger.log('Tự động kiểm tra và seed dữ liệu mẫu khởi động hệ thống...');
      await runAllSeeds(this.dataSource, this.logger);
    } catch (error) {
      this.logger.error('Lỗi khi tự động kiểm tra seed dữ liệu:', error);
    }
  }
}

