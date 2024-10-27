import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransferTransactionDto } from './dto/create-transfer-transaction.dto';
import { CreateDepositTransactionDto } from './dto/create-deposit-transaction.dto';
import { CreateWithdrawalTransactionDto } from './dto/create-withdrawal-transaction.dto';
import { ApiTags } from '@nestjs/swagger';

@Controller('transaction')
@ApiTags('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('transfer')
  @HttpCode(202)
  async transfer(@Body() dto: CreateTransferTransactionDto) {
    const response = await this.transactionService.transfer(dto);
    return { id: response };
  }

  @Post('deposit')
  @HttpCode(202)
  async deposit(@Body() dto: CreateDepositTransactionDto) {
    const response = await this.transactionService.deposit(dto);
    return { id: response };
  }

  @Post('withdrawal')
  @HttpCode(202)
  async withdrawal(@Body() dto: CreateWithdrawalTransactionDto) {
    const response = await this.transactionService.withdrawal(dto);
    return { id: response };
  }

  @Get()
  findAll() {
    return this.transactionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionService.findOne(id);
  }
}
