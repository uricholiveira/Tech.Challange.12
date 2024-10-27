import { IsNumber, IsPositive, IsString, Matches } from 'class-validator';

export class CreateTransferTransactionDto {
  @IsNumber()
  @IsPositive({ message: 'Must be positive' })
  amount: number;

  @IsString()
  @Matches(/^\d+$/, { message: 'Must contain only numbers' })
  sourceAccountNumber: string;

  @IsString()
  @Matches(/^\d+$/, { message: 'Must contain only numbers' })
  destinationAccountNumber: string;
}
