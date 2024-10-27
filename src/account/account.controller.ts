import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('account')
@ApiTags('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  @ApiOperation({ summary: 'Create account' })
  async create(@Body() dto: CreateAccountDto) {
    return await this.accountService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all accounts' })
  async findAll() {
    return await this.accountService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account' })
  async findOne(@Param('id') id: string) {
    return await this.accountService.findOne(+id);
  }
}
