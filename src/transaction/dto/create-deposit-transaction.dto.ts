import { IsNumber, IsPositive, IsString, Matches } from 'class-validator';

export class CreateDepositTransactionDto {
  @IsNumber()
  @IsPositive({ message: 'Must be positive' })
  amount: number;

  @IsString()
  @Matches(/^\d+$/, { message: 'Must contain only numbers' })
  destinationAccountNumber: string;
}
