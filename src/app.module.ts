import { Module } from '@nestjs/common';
import { AccountModule } from './account/account.module';
import { TransactionModule } from './transaction/transaction.module';
import { CustomLogger } from './logger/logger.service';
import { BullConfig } from './bull.config';

@Module({
  imports: [AccountModule, TransactionModule, BullConfig],
  controllers: [],
  providers: [CustomLogger],
})
export class AppModule {}
