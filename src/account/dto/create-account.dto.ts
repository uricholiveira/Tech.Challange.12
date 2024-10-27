import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
} from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @Matches(/^\d+$/, { message: 'Must contain only numbers' })
  number: string;

  @IsOptional()
  @IsNumber()
  @IsPositive({ message: 'Must be positive' })
  balance?: number;
}
