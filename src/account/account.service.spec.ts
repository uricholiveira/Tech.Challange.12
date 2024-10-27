import { Test, TestingModule } from '@nestjs/testing';
import { AccountService } from './account.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';

describe('AccountService', () => {
  let service: AccountService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        {
          provide: PrismaService,
          useValue: {
            account: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should return an id', async () => {
      const dto: CreateAccountDto = { balance: 100, number: '123' };
      const expectedResult = { id: 1 };

      jest
        .spyOn(prismaService.account, 'create')
        .mockResolvedValue(expectedResult as any);

      expect(await service.create(dto)).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return an array of accounts', async () => {
      const accounts = [
        {
          id: 1,
          number: '123',
          balance: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          number: '456',
          balance: 200,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest
        .spyOn(prismaService.account, 'findMany')
        .mockResolvedValue(accounts as any);

      expect(await service.findAll()).toEqual(
        accounts.map((account) => ({
          id: account.id,
          number: account.number,
          balance: account.balance,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
        })),
      );
    });
  });

  describe('findOne', () => {
    it('should return a single account', async () => {
      const account = {
        id: 1,
        number: '123456',
        balance: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(prismaService.account, 'findUnique')
        .mockResolvedValue(account as any);

      expect(await service.findOne(1)).toEqual(account);
    });
  });

  describe('findByNumber', () => {
    it('should return a single account by number', async () => {
      const accountNumber = '123456';
      const account = {
        id: 1,
        number: accountNumber,
        balance: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(prismaService.account, 'findUnique')
        .mockResolvedValue(account as any);

      expect(await service.findByNumber(accountNumber)).toEqual(account);
    });

    it('should return null if account number does not exist', async () => {
      const nonExistentNumber = '000000';

      jest.spyOn(prismaService.account, 'findUnique').mockResolvedValue(null);

      expect(await service.findByNumber(nonExistentNumber)).toBeNull();
    });
  });
});
