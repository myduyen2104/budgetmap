import {IsIn, IsOptional, IsString, Length, Matches, MaxLength, MinLength} from 'class-validator';

export class RegisterDto {
  @IsString() @Matches(/^(?=.{3,15}$)[a-z0-9._@]+$/, { message: 'Tên tài khoản phải có 3–15 ký tự, không có khoảng trắng và chỉ gồm chữ thường, số, ., _, @.' }) username!: string;
  @IsString() @Matches(/^(?=.{8,128}$)(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).+$/, { message: 'Mật khẩu phải có 8–128 ký tự, gồm ít nhất 1 chữ in hoa, 1 chữ số và 1 ký tự đặc biệt.' }) password!: string;
  @IsOptional() @IsString() @MaxLength(120) displayName?: string;
}
export class LoginDto { @IsString() @Length(3, 64) username!: string; @IsString() password!: string; }
export class ProfileDto { @IsOptional() @IsString() @MaxLength(120) displayName?: string; }
export class ChangePasswordDto {
  @IsString() @MinLength(8) @MaxLength(128) currentPassword!: string;
  @IsString() @MinLength(8) @MaxLength(128) newPassword!: string;
}
export class CategoryDto { @IsString() @Length(1, 120) name!: string; @IsIn(['INCOME', 'EXPENSE']) type!: 'INCOME' | 'EXPENSE'; @IsOptional() @IsString() @MaxLength(64) groupId?: string; @IsOptional() @IsString() @MaxLength(64) icon?: string; @IsOptional() @IsString() @MaxLength(32) color?: string; }
export class CategoryUpdateDto { @IsOptional() @IsString() @Length(1, 120) name?: string; @IsOptional() @IsIn(['INCOME', 'EXPENSE']) type?: 'INCOME' | 'EXPENSE'; @IsOptional() @IsString() @MaxLength(64) groupId?: string; @IsOptional() @IsString() @MaxLength(64) icon?: string; @IsOptional() @IsString() @MaxLength(32) color?: string; }
export class WalletDto { @IsString() @Length(1, 120) name!: string; @IsString() @MaxLength(64) type!: string; @Matches(/^\d+(\.\d{1,2})?$/) initialBalance!: string; }
export class WalletUpdateDto { @IsOptional() @IsString() @Length(1, 120) name?: string; @IsOptional() @IsString() @MaxLength(64) type?: string; }
