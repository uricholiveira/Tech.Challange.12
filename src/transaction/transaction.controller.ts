import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransferTransactionDto } from './dto/create-transfer-transaction.dto';
import { CreateDepositTransactionDto } from './dto/create-deposit-transaction.dto';
import { CreateWithdrawalTransactionDto } from './dto/create-withdrawal-transaction.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ETransactionType } from './enums/transaction-type.enum';
import { randomUUID } from 'node:crypto';

@Controller('transaction')
@ApiTags('transaction')
@ApiResponse({
  status: 404,
  description: 'Not found',
  schema: {
    properties: {
      message: { type: 'string', example: 'Transaction found' },
      timestamp: { type: 'string', example: '2021-09-29T18:10:00.000Z' },
    },
  },
})
@ApiResponse({
  status: 500,
  description: 'Internal server error',
  schema: {
    properties: {
      message: { type: 'string', example: 'A server error has occurred' },
      timestamp: { type: 'string', example: '2021-09-29T18:10:00.000Z' },
    },
  },
})
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('transfer')
  @ApiOperation({ summary: 'Create transfer transaction' })
  @HttpCode(202)
  @ApiResponse({
    status: 202,
    schema: {
      properties: {
        id: { type: 'string', example: randomUUID() },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
    schema: {
      properties: {
        message: { type: 'string', example: 'Insuficient funds' },
        timestamp: { type: 'string', example: '2021-09-29T18:10:00.000Z' },
      },
    },
  })
  async transfer(@Body() dto: CreateTransferTransactionDto) {
    const response = await this.transactionService.transfer(dto);
    return { id: response };
  }

  @Post('deposit')
  @ApiOperation({ summary: 'Create deposit transaction' })
  @HttpCode(202)
  @ApiResponse({
    status: 202,
    schema: {
      properties: {
        id: { type: 'string', example: randomUUID() },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
    schema: {
      properties: {
        message: { type: 'string', example: 'Insuficient funds' },
        timestamp: { type: 'string', example: '2021-09-29T18:10:00.000Z' },
      },
    },
  })
  async deposit(@Body() dto: CreateDepositTransactionDto) {
    const response = await this.transactionService.deposit(dto);
    return { id: response };
  }

  @Post('withdrawal')
  @ApiOperation({ summary: 'Create withdrawal transaction' })
  @HttpCode(202)
  @ApiResponse({
    status: 202,
    schema: {
      properties: {
        id: { type: 'string', example: randomUUID() },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
    schema: {
      properties: {
        message: { type: 'string', example: 'Insuficient funds' },
        timestamp: { type: 'string', example: '2021-09-29T18:10:00.000Z' },
      },
    },
  })
  async withdrawal(@Body() dto: CreateWithdrawalTransactionDto) {
    const response = await this.transactionService.withdrawal(dto);
    return { id: response };
  }

  @Get()
  @ApiOperation({ summary: 'List all transactions' })
  @ApiResponse({
    status: 200,
    description: 'List of all transactions',
    schema: {
      type: 'array',
      items: {
        anyOf: [
          {
            type: 'object',
            properties: {
              amount: { type: 'string', example: '20' },
              type: { type: 'string', example: 'DEPOSIT' },
              account: { type: 'string', example: '123' },
            },
          },
          {
            type: 'object',
            properties: {
              amount: { type: 'string', example: '20' },
              type: { type: 'string', example: 'TRANSFER' },
              sourceAccount: { type: 'string', example: '123' },
              destinationAccount: { type: 'string', example: '456' },
            },
          },
        ],
      },
    },
  })
  async findAll() {
    const transactions = await this.transactionService.findAll();

    return transactions.map((t) => ({
      amount: t.amount.toNumber(),
      type: t.type,
      account:
        t.type === ETransactionType.DEPOSIT
          ? t.destinationAccount.number
          : t.type === ETransactionType.WITHDRAWAL
            ? t.sourceAccount.number
            : undefined,
      sourceAccount:
        t.type === ETransactionType.TRANSFER
          ? t.sourceAccount.number
          : undefined,
      destinationAccount:
        t.type === ETransactionType.TRANSFER
          ? t.destinationAccount.number
          : undefined,
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by id' })
  @ApiResponse({
    status: 200,
    description: 'The found transaction',
    schema: {
      anyOf: [
        {
          type: 'object',
          properties: {
            amount: { type: 'string', example: '20' },
            type: { type: 'string', example: 'DEPOSIT' },
            account: { type: 'string', example: '123' },
          },
        },
        {
          type: 'object',
          properties: {
            amount: { type: 'string', example: '20' },
            type: { type: 'string', example: 'TRANSFER' },
            sourceAccount: { type: 'string', example: '123' },
            destinationAccount: { type: 'string', example: '456' },
          },
        },
      ],
    },
  })
  async findOne(@Param('id') id: string) {
    const transaction = await this.transactionService.findOne(id);

    return {
      amount: transaction.amount.toNumber(),
      type: transaction.type,
      account:
        transaction.type === ETransactionType.DEPOSIT ||
        transaction.type === ETransactionType.WITHDRAWAL
          ? transaction.destinationAccount.number
          : undefined,
      sourceAccount:
        transaction.type === ETransactionType.TRANSFER
          ? transaction.sourceAccount.number
          : undefined,
      destinationAccount:
        transaction.type === ETransactionType.TRANSFER
          ? transaction.destinationAccount.number
          : undefined,
    };
  }
}
