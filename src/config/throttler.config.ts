import { ThrottlerModuleOptions } from '@nestjs/throttler';

export const throttlerConfig: ThrottlerModuleOptions = [{
  ttl: 60000, // 60 seconds
  limit: 100, // 100 requests max
}];
