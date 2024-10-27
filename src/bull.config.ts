// bull.config.ts
import { BullModule } from '@nestjs/bull';

export const BullConfig = BullModule.forRoot({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 5672,
  },
});
