import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { CustomLogger } from '../logger/logger.service';
import { TransactionProcessor } from './transaction.processor';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'transaction',
    }),
  ],
  controllers: [TransactionController],
  providers: [
    TransactionService,
    PrismaService,
    CustomLogger,
    TransactionProcessor,
  ],
})
export class TransactionModule {}
