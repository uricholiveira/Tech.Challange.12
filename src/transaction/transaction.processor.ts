import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransferTransactionDto } from './dto/create-transfer-transaction.dto';
import { CreateDepositTransactionDto } from './dto/create-deposit-transaction.dto';
import { CreateWithdrawalTransactionDto } from './dto/create-withdrawal-transaction.dto';

@Processor('transaction')
@Injectable()
export class TransactionProcessor {
  constructor(private readonly transactionService: TransactionService) {}

  @Process('transfer')
  async handleTransfer(
    job: Job<CreateTransferTransactionDto & { transactionId: string }>,
  ) {
    await this.transactionService.executeTransfer(
      job.data,
      job.data.transactionId,
    );
  }

  @Process('deposit')
  async handleDeposit(
    job: Job<CreateDepositTransactionDto & { transactionId: string }>,
  ) {
    await this.transactionService.executeDeposit(
      job.data,
      job.data.transactionId,
    );
  }

  @Process('withdrawal')
  async handleWithdrawal(
    job: Job<CreateWithdrawalTransactionDto & { transactionId: string }>,
  ) {
    await this.transactionService.executeWithdrawal(
      job.data,
      job.data.transactionId,
    );
  }
}
