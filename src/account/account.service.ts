import { Injectable } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictError, NotFoundError } from '../exception/exceptions';

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAccountDto) {
    const hasAccount = await this.prisma.account.findUnique({
      where: { number: dto.number },
    });

    if (hasAccount !== null) {
      throw new ConflictError('Account already exists');
    }

    const account = await this.prisma.account.create({
      data: {
        number: dto.number,
        balance: dto.balance || 0,
      },
    });

    return { id: account.id };
  }

  async findAll() {
    const accounts = await this.prisma.account.findMany();
    return accounts.map((account) => ({
      id: account.id,
      number: account.number,
      balance: account.balance,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    }));
  }

  async findOne(id: number) {
    const account = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    return account;
  }

  async findByNumber(number: string) {
    const account = await this.prisma.account.findUnique({
      where: { number: number },
    });

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    return account;
  }
}
