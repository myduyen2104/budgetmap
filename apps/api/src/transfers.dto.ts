import {IsOptional, IsString, Matches, MaxLength, MinLength} from 'class-validator';
export class TransferCreateDto {
  @IsString() @MinLength(1) sourceWalletId!: string;
  @IsString() @MinLength(1) destinationWalletId!: string;
  @Matches(/^\d+(\.\d{1,2})?$/) amount!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) transferDate!: string;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}
export class TransferUpdateDto {
  @IsOptional() @IsString() @MinLength(1) sourceWalletId?: string;
  @IsOptional() @IsString() @MinLength(1) destinationWalletId?: string;
  @IsOptional() @Matches(/^\d+(\.\d{1,2})?$/) amount?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) transferDate?: string;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}
