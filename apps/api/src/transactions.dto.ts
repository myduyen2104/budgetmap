import {IsIn, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength} from 'class-validator';
export class TransactionCreateDto {
  @IsIn(['INCOME', 'EXPENSE']) type!: 'INCOME' | 'EXPENSE';
  @Matches(/^\d+(\.\d{1,2})?$/) amount!: string;
  @IsString() @MinLength(1) walletId!: string;
  @IsString() @MinLength(1) categoryId!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) transactionDate!: string;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}
export class TransactionUpdateDto {
  @IsOptional() @IsIn(['INCOME', 'EXPENSE']) type?: 'INCOME' | 'EXPENSE';
  @IsOptional() @Matches(/^\d+(\.\d{1,2})?$/) amount?: string;
  @IsOptional() @IsString() walletId?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) transactionDate?: string;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}
