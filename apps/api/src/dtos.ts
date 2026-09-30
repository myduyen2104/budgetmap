import {IsIn, IsOptional, IsString, Length, Matches, MaxLength, MinLength} from 'class-validator';

export class RegisterDto {
  @IsString() @Length(3, 64) @Matches(/^[a-zA-Z0-9_.-]+$/) username!: string;
  @IsString() @MinLength(8) @MaxLength(128) password!: string;
  @IsOptional() @IsString() @MaxLength(120) displayName?: string;
}
export class LoginDto { @IsString() @Length(3, 64) username!: string; @IsString() password!: string; }
export class ProfileDto { @IsOptional() @IsString() @MaxLength(120) displayName?: string; }
export class ChangePasswordDto {
  @IsString() @MinLength(8) @MaxLength(128) currentPassword!: string;
  @IsString() @MinLength(8) @MaxLength(128) newPassword!: string;
}
export class CategoryDto { @IsString() @Length(1, 120) name!: string; @IsIn(['INCOME', 'EXPENSE']) type!: 'INCOME' | 'EXPENSE'; @IsOptional() @IsString() @MaxLength(64) icon?: string; @IsOptional() @IsString() @MaxLength(32) color?: string; }
export class CategoryUpdateDto { @IsOptional() @IsString() @Length(1, 120) name?: string; @IsOptional() @IsIn(['INCOME', 'EXPENSE']) type?: 'INCOME' | 'EXPENSE'; @IsOptional() @IsString() @MaxLength(64) icon?: string; @IsOptional() @IsString() @MaxLength(32) color?: string; }
export class WalletDto { @IsString() @Length(1, 120) name!: string; @IsString() @MaxLength(64) type!: string; @Matches(/^\d+(\.\d{1,2})?$/) initialBalance!: string; }
export class WalletUpdateDto { @IsOptional() @IsString() @Length(1, 120) name?: string; @IsOptional() @IsString() @MaxLength(64) type?: string; }
