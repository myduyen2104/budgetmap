import { Body, Controller, Get, HttpCode, Inject, Patch, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { ChangePasswordDto, LoginDto, ProfileDto, RegisterDto } from './dtos.js';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}
  private token(r: Request): string | undefined { return r.cookies?.budgetmap_session as string | undefined; }
  @Post('register') register(@Body() body: RegisterDto) { return this.auth.register(body.username, body.password, body.displayName); }
  @Post('login') async login(@Req() req: Request, @Body() body: LoginDto, @Res({ passthrough: true }) res: Response) { const result = await this.auth.login(body.username, body.password, req.ip); res.cookie('budgetmap_session', result.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 604800000 }); return result.user; }
  @Post('logout') @HttpCode(204) async logout(@Req() req: Request, @Res() res: Response) { await this.auth.logout(this.token(req)); res.clearCookie('budgetmap_session', { path: '/' }); return res.send(); }
  @Get('me') async me(@Req() req: Request) { return this.auth.publicUser(await this.auth.fromToken(this.token(req))); }
  @Patch('me') async update(@Req() req: Request, @Body() body: ProfileDto) { const user = await this.auth.fromToken(this.token(req)); return this.auth.updateProfile(user.id, body); }
  @Patch('password') @HttpCode(204) async changePassword(@Req() req: Request, @Body() body: ChangePasswordDto) { const user = await this.auth.fromToken(this.token(req)); await this.auth.changePassword(user.id, body.currentPassword, body.newPassword); }
}
