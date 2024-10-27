import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransferTransactionDto } from './dto/create-transfer-transaction.dto';
import { CreateWithdrawalTransactionDto } from './dto/create-withdrawal-transaction.dto';
import { CreateDepositTransactionDto } from './dto/create-deposit-transaction.dto';
import { ETransactionType } from './enums/transaction-type.enum';
import Decimal from 'decimal.js';
import { BadRequestError, NotFoundError } from '../exception/exceptions';
import { CustomLogger } from '../logger/logger.service';
import { randomUUID } from 'node:crypto';

@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: CustomLogger,
    @InjectQueue('transaction') private transactionQueue: Queue,
  ) {}

  async findAll() {
    this.logger.log('Fetching all transactions');
    return this.prisma.transaction.findMany();
  }

  async findOne(id: string) {
    this.logger.log(`Fetching transaction with id: ${id}`);
    return this.prisma.transaction.findUnique({ where: { id } });
  }

  async transfer(dto: CreateTransferTransactionDto): Promise<string> {
    const transactionId = randomUUID();
    try {
      this.logger.log(`Executing transfer with id: ${transactionId}`);
      await this.executeTransfer(dto, transactionId);
    } catch (error) {
      this.logger.error('Transfer failed, enqueuing transaction:', error);
      await this.transactionQueue.add(
        'transfer',
        { ...dto, transactionId },
        {
          attempts: 5,
          backoff: {
            type: 'fixed',
            delay: 10000,
          },
        },
      );
    }
    return transactionId;
  }

  async deposit(dto: CreateDepositTransactionDto): Promise<string> {
    const transactionId = randomUUID();
    try {
      this.logger.log(`Executing deposit with id: ${transactionId}`);
      await this.executeDeposit(dto, transactionId);
    } catch (error) {
      this.logger.error('Deposit failed, enqueuing transaction:', error);
      await this.transactionQueue.add(
        'deposit',
        { ...dto, transactionId },
        {
          attempts: 5,
          backoff: {
            type: 'fixed',
            delay: 10000,
          },
        },
      );
    }
    return transactionId;
  }

  async withdrawal(dto: CreateWithdrawalTransactionDto): Promise<string> {
    const transactionId = randomUUID();
    try {
      this.logger.log(`Executing withdrawal with id: ${transactionId}`);
      await this.executeWithdrawal(dto, transactionId);
    } catch (error) {
      this.logger.error('Withdrawal failed, enqueuing transaction:', error);
      await this.transactionQueue.add(
        'withdrawal',
        { ...dto, transactionId },
        {
          attempts: 5,
          backoff: {
            type: 'fixed',
            delay: 10000,
          },
        },
      );
    }
    return transactionId;
  }

  public async executeTransfer(
    dto: CreateTransferTransactionDto,
    transactionId: string,
  ) {
    this.logger.log(
      `Started executing transfer with transactionId: ${transactionId}`,
    );
    await this.prisma.$transaction(async (tx) => {
      const sourceAccount = await tx.account.findUnique({
        where: { number: dto.sourceAccountNumber },
      });

      if (sourceAccount === null) {
        this.logger.warn(
          `Source account not found: ${dto.sourceAccountNumber}`,
        );
        throw new NotFoundError('Source account not found');
      }

      if (sourceAccount.balance.lessThan(new Decimal(dto.amount))) {
        this.logger.warn('Insufficient balance');
        throw new BadRequestError('Insufficient balance');
      }

      const destinationAccount = await tx.account.findUnique({
        where: { number: dto.destinationAccountNumber },
      });

      if (destinationAccount === null) {
        this.logger.warn(
          `Destination account not found: ${dto.destinationAccountNumber}`,
        );
        throw new NotFoundError('Destination account not found');
      }

      await tx.$executeRaw`SELECT * FROM "Account" WHERE "number" = ${dto.sourceAccountNumber} FOR UPDATE`;
      await tx.$executeRaw`SELECT * FROM "Account" WHERE "number" = ${dto.destinationAccountNumber} FOR UPDATE`;

      this.logger.log(
        `Transferring amount: ${dto.amount} from ${dto.sourceAccountNumber} to ${dto.destinationAccountNumber}`,
      );

      await tx.account.update({
        where: { number: dto.sourceAccountNumber },
        data: { balance: { decrement: dto.amount } },
      });

      await tx.account.update({
        where: { number: dto.destinationAccountNumber },
        data: { balance: { increment: dto.amount } },
      });

      await tx.transaction.create({
        data: {
          id: transactionId,
          type: ETransactionType.TRANSFER,
          amount: dto.amount,
          sourceAccount: { connect: { number: dto.sourceAccountNumber } },
          destinationAccount: {
            connect: { number: dto.destinationAccountNumber },
          },
        },
      });

      this.logger.log(
        `Successfully transferred amount: ${dto.amount} with transactionId: ${transactionId}`,
      );
    });
    this.logger.log(
      `Finished executing transfer with transactionId: ${transactionId}`,
    );
  }

  public async executeDeposit(
    dto: CreateDepositTransactionDto,
    transactionId: string,
  ) {
    this.logger.log(
      `Started executing deposit with transactionId: ${transactionId}`,
    );
    await this.prisma.$transaction(async (tx) => {
      const destinationAccount = await tx.account.findUnique({
        where: { number: dto.destinationAccountNumber },
      });

      if (destinationAccount === null) {
        this.logger.warn(
          `Destination account not found: ${dto.destinationAccountNumber}`,
        );
        throw new NotFoundError('Destination account not found');
      }

      await tx.$executeRaw`SELECT * FROM "Account" WHERE "number" = ${dto.destinationAccountNumber} FOR UPDATE`;

      this.logger.log(
        `Depositing amount: ${dto.amount} to ${dto.destinationAccountNumber}`,
      );

      await tx.account.update({
        where: { number: dto.destinationAccountNumber },
        data: { balance: { increment: dto.amount } },
      });

      await tx.transaction.create({
        data: {
          id: transactionId,
          type: ETransactionType.DEPOSIT,
          amount: dto.amount,
          destinationAccount: {
            connect: { number: dto.destinationAccountNumber },
          },
        },
      });

      this.logger.log(
        `Successfully deposited amount: ${dto.amount} with transactionId: ${transactionId}`,
      );
    });
    this.logger.log(
      `Finished executing deposit with transactionId: ${transactionId}`,
    );
  }

  public async executeWithdrawal(
    dto: CreateWithdrawalTransactionDto,
    transactionId: string,
  ) {
    this.logger.log(
      `Started executing withdrawal with transactionId: ${transactionId}`,
    );
    await this.prisma.$transaction(async (tx) => {
      const sourceAccount = await tx.account.findUnique({
        where: { number: dto.sourceAccountNumber },
      });

      if (sourceAccount === null) {
        this.logger.warn(
          `Source account not found: ${dto.sourceAccountNumber}`,
        );
        throw new NotFoundError('Source account not found');
      }

      if (sourceAccount.balance.minus(new Decimal(dto.amount)).isNegative()) {
        this.logger.warn('Insufficient balance');
        throw new BadRequestError('Insufficient balance');
      }

      await tx.$executeRaw`SELECT * FROM "Account" WHERE "number" = ${dto.sourceAccountNumber} FOR UPDATE`;

      this.logger.log(
        `Withdrawing amount: ${dto.amount} from ${dto.sourceAccountNumber}`,
      );

      await tx.account.update({
        where: { number: dto.sourceAccountNumber },
        data: { balance: { decrement: dto.amount } },
      });

      await tx.transaction.create({
        data: {
          id: transactionId,
          type: ETransactionType.WITHDRAWAL,
          amount: dto.amount,
          sourceAccount: {
            connect: { number: dto.sourceAccountNumber },
          },
        },
      });

      this.logger.log(
        `Successfully withdrew amount: ${dto.amount} with transactionId: ${transactionId}`,
      );
    });
    this.logger.log(
      `Finished executing withdrawal with transactionId: ${transactionId}`,
    );
  }
}
