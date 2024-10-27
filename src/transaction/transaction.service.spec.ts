import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaServiceMock } from '../../mocks/prisma.service';
import { CustomLogger } from '../logger/logger.service';
import { CustomLoggerMock } from '../../mocks/custom-logger';
import { BullModule, getQueueToken } from '@nestjs/bull';
import { QueueMock } from '../../mocks/queue';
import { CreateTransferTransactionDto } from './dto/create-transfer-transaction.dto';
import { CreateDepositTransactionDto } from './dto/create-deposit-transaction.dto';
import { CreateWithdrawalTransactionDto } from './dto/create-withdrawal-transaction.dto';
import Decimal from 'decimal.js';
import { ETransactionType } from './enums/transaction-type.enum';
import { NotFoundError } from '../exception/exceptions';
import { makeTestDbClient } from '../../prisma/prisma-client';
import * as RedisMock from 'redis-mock';

describe('TransactionService', () => {
  let service: TransactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        { provide: PrismaService, useValue: PrismaServiceMock },
        { provide: CustomLogger, useValue: CustomLoggerMock },
        { provide: getQueueToken('transaction'), useValue: QueueMock },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return a list of transactions', async () => {
      const transactions = [{ id: '1' }, { id: '2' }];
      PrismaServiceMock.transaction.findMany.mockResolvedValue(transactions);

      expect(await service.findAll()).toBe(transactions);
      expect(CustomLoggerMock.log).toHaveBeenCalledWith(
        'Fetching all transactions',
      );
    });
  });

  describe('findOne', () => {
    it('should return a transaction by id', async () => {
      const transaction = { id: '1' };
      PrismaServiceMock.transaction.findUnique.mockResolvedValue(transaction);

      expect(await service.findOne('1')).toBe(transaction);
      expect(CustomLoggerMock.log).toHaveBeenCalledWith(
        'Fetching transaction with id: 1',
      );
    });
  });

  describe('transfer', () => {
    it('should enqueue a transfer transaction on failure', async () => {
      const dto: CreateTransferTransactionDto = {
        amount: 100,
        sourceAccountNumber: '123',
        destinationAccountNumber: '456',
      };
      PrismaServiceMock.$transaction.mockRejectedValue(
        new NotFoundError('Source account not found'),
      );

      const transactionId = await service.transfer(dto);

      expect(QueueMock.add).toHaveBeenCalledWith(
        'transfer',
        { ...dto, transactionId },
        { attempts: 5, backoff: { type: 'fixed', delay: 10000 } },
      );
      expect(CustomLoggerMock.error).toHaveBeenCalledWith(
        'Transfer failed, enqueuing transaction:',
        expect.any(Error),
      );
    });
  });

  describe('deposit', () => {
    it('should enqueue a deposit transaction on failure', async () => {
      const dto: CreateDepositTransactionDto = {
        amount: 100,
        destinationAccountNumber: '456',
      };
      const transactionId = await service.deposit(dto);

      expect(QueueMock.add).toHaveBeenCalledWith(
        'deposit',
        { ...dto, transactionId },
        { attempts: 5, backoff: { type: 'fixed', delay: 10000 } },
      );
      expect(CustomLoggerMock.error).toHaveBeenCalledWith(
        'Deposit failed, enqueuing transaction:',
        expect.any(Error),
      );
    });
  });

  describe('withdrawal', () => {
    it('should enqueue a withdrawal transaction on failure', async () => {
      const dto: CreateWithdrawalTransactionDto = {
        amount: 100,
        sourceAccountNumber: '123',
      };
      PrismaServiceMock.$transaction.mockRejectedValue(
        new NotFoundError('Source account not found'),
      );

      const transactionId = await service.withdrawal(dto);

      expect(QueueMock.add).toHaveBeenCalledWith(
        'withdrawal',
        { ...dto, transactionId },
        { attempts: 5, backoff: { type: 'fixed', delay: 10000 } },
      );
      expect(CustomLoggerMock.error).toHaveBeenCalledWith(
        'Withdrawal failed, enqueuing transaction:',
        expect.any(Error),
      );
    });
  });

  describe('executeTransfer', () => {
    it('should execute a transfer transaction', async () => {
      const dto: CreateTransferTransactionDto = {
        amount: 100,
        sourceAccountNumber: '123',
        destinationAccountNumber: '456',
      };
      const transactionId = 'trans-id';
      const sourceAccount = { number: '123', balance: new Decimal(200) };
      const destinationAccount = { number: '456' };

      PrismaServiceMock.$transaction.mockImplementationOnce(
        async (txCallback) => {
          await txCallback({
            account: {
              findUnique: jest
                .fn()
                .mockResolvedValueOnce(sourceAccount)
                .mockResolvedValueOnce(destinationAccount),
              update: PrismaServiceMock.account.update.mockImplementation(() =>
                Promise.resolve(),
              ),
            },
            transaction: PrismaServiceMock.transaction,
            $executeRaw: PrismaServiceMock.$executeRaw,
          });
        },
      );

      await service.executeTransfer(dto, transactionId);

      expect(PrismaServiceMock.$transaction).toHaveBeenCalled();
      expect(CustomLoggerMock.log).toHaveBeenCalledWith(
        `Started executing transfer with transactionId: ${transactionId}`,
      );
      expect(PrismaServiceMock.account.update).toHaveBeenCalledTimes(2);
      expect(PrismaServiceMock.transaction.create).toHaveBeenCalledWith({
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
      expect(CustomLoggerMock.log).toHaveBeenCalledWith(
        `Successfully transferred amount: ${dto.amount} with transactionId: ${transactionId}`,
      );
    });

    it('should throw NotFoundError if source account is not found', async () => {
      PrismaServiceMock.$transaction.mockImplementationOnce(
        async (txCallback) => {
          // Mock para a execução do callback da transação
          await txCallback({
            account: {
              findUnique: jest
                .fn()
                .mockResolvedValueOnce(null) // Primeira chamada retorna sourceAccount
                .mockResolvedValueOnce(null), // Segunda chamada retorna destinationAccount
              update: PrismaServiceMock.account.update.mockImplementation(() =>
                Promise.resolve(),
              ),
            },
            transaction: PrismaServiceMock.transaction,
            $executeRaw: PrismaServiceMock.$executeRaw,
          });
        },
      );

      const dto: CreateTransferTransactionDto = {
        amount: 100,
        sourceAccountNumber: '123',
        destinationAccountNumber: '456',
      };
      const transactionId = 'trans-id';

      await expect(service.executeTransfer(dto, transactionId)).rejects.toThrow(
        NotFoundError,
      );
      expect(CustomLoggerMock.warn).toHaveBeenCalledWith(
        `Source account not found: ${dto.sourceAccountNumber}`,
      );
    });
    it('should throw NotFoundError if destination account is not found', async () => {
      PrismaServiceMock.$transaction.mockImplementationOnce(
        async (txCallback) => {
          await txCallback({
            account: {
              findUnique: jest
                .fn()
                .mockResolvedValueOnce({
                  id: 1,
                  balance: new Decimal(100),
                  number: '123',
                })
                .mockResolvedValueOnce(null),
              update: PrismaServiceMock.account.update.mockImplementation(() =>
                Promise.resolve(),
              ),
            },
            transaction: PrismaServiceMock.transaction,
            $executeRaw: PrismaServiceMock.$executeRaw,
          });
        },
      );

      const dto: CreateTransferTransactionDto = {
        amount: 100,
        sourceAccountNumber: '123',
        destinationAccountNumber: '456',
      };
      const transactionId = 'trans-id';

      await expect(service.executeTransfer(dto, transactionId)).rejects.toThrow(
        NotFoundError,
      );
      expect(CustomLoggerMock.warn).toHaveBeenCalledWith(
        `Destination account not found: ${dto.destinationAccountNumber}`,
      );
    });
  });
});
describe('TransactionService Concurrency', () => {
  let service: TransactionService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        BullModule.forRoot({
          redis: RedisMock.createClient({
            port: 6379,
            host: 'localhost',
          }),
        }),
      ],
      providers: [
        TransactionService,
        {
          provide: PrismaService,
          useFactory: () => makeTestDbClient(), // Utiliza o banco de dados em memória
        },
        {
          provide: CustomLogger,
          useValue: CustomLoggerMock,
        },
        {
          provide: getQueueToken('transaction'),
          useValue: QueueMock,
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Remover aqui caso queira que os dados sejam persistidos
    const accounts = await prisma.account.findMany({
      where: { number: { in: ['TEST_123', 'TEST_456'] } },
    });
    await prisma.transaction.deleteMany({
      where: { sourceAccountId: { in: accounts.map((a) => a.id) } },
    });
    await prisma.transaction.deleteMany({
      where: { destinationAccountId: { in: accounts.map((a) => a.id) } },
    });
    await prisma.account.deleteMany({
      where: { number: { in: ['TEST_123', 'TEST_456'] } },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Remover aqui caso queira que os dados sejam persistidos
    const accounts = await prisma.account.findMany({
      where: { number: { in: ['TEST_123', 'TEST_456'] } },
    });
    await prisma.transaction.deleteMany({
      where: { sourceAccountId: { in: accounts.map((a) => a.id) } },
    });
    await prisma.transaction.deleteMany({
      where: { destinationAccountId: { in: accounts.map((a) => a.id) } },
    });
    await prisma.account.deleteMany({
      where: { number: { in: ['TEST_123', 'TEST_456'] } },
    });
  });

  it('should handle concurrent transfer transactions', async () => {
    // Criação das contas de teste
    await prisma.account.create({
      data: { number: 'TEST_123', balance: new Decimal(1000) },
    });
    await prisma.account.create({
      data: { number: 'TEST_456', balance: new Decimal(500) },
    });

    const transferDto: CreateTransferTransactionDto = {
      sourceAccountNumber: 'TEST_123',
      destinationAccountNumber: 'TEST_456',
      amount: 100,
    };

    // Executa múltiplas transferências simultâneas
    const promises = Array(10)
      .fill(null)
      .map(() => service.transfer(transferDto));

    // Espera a conclusão de todas as transferências
    await Promise.all(promises);

    // Verifica os saldos das contas
    const sourceAccount = await prisma.account.findUnique({
      where: { number: 'TEST_123' },
    });
    const destinationAccount = await prisma.account.findUnique({
      where: { number: 'TEST_456' },
    });

    expect(sourceAccount.balance.toNumber()).toBe(1000 - 100 * 10); // Saldo inicial - total transferido
    expect(destinationAccount.balance.toNumber()).toBe(500 + 100 * 10); // Saldo inicial + total recebido
  });

  it('should handle concurrent deposit transactions', async () => {
    // Criação da conta de teste
    await prisma.account.create({
      data: { number: 'TEST_123', balance: new Decimal(1000) },
    });

    const depositDto: CreateDepositTransactionDto = {
      destinationAccountNumber: 'TEST_123',
      amount: 100,
    };

    // Executa múltiplos depósitos simultâneos
    const promises = Array(10)
      .fill(null)
      .map(() => service.deposit(depositDto));

    // Espera a conclusão de todos os depósitos
    await Promise.all(promises);

    // Verifica o saldo da conta
    const account = await prisma.account.findUnique({
      where: { number: 'TEST_123' },
    });

    expect(account.balance.toNumber()).toBe(1000 + 100 * 10); // Saldo inicial + total depositado
  });

  it('should handle concurrent withdrawal transactions', async () => {
    // Criação da conta de teste
    await prisma.account.create({
      data: { number: 'TEST_123', balance: new Decimal(1000) },
    });

    const withdrawalDto: CreateWithdrawalTransactionDto = {
      sourceAccountNumber: 'TEST_123',
      amount: 100,
    };

    // Executa múltiplos saques simultâneos
    const promises = Array(10)
      .fill(null)
      .map(() => service.withdrawal(withdrawalDto));

    // Espera a conclusão de todos os saques
    await Promise.all(promises);

    // Verifica o saldo da conta
    const account = await prisma.account.findUnique({
      where: { number: 'TEST_123' },
    });

    expect(account.balance.toNumber()).toBe(1000 - 100 * 10); // Saldo inicial - total sacado
  });
});
