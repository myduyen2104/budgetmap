import { Body, Controller, Delete, Get, Headers, Inject, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import { NotificationsService } from './notifications.service.js';

@Controller('notifications')
export class NotificationsController {
  constructor(@Inject(AuthService) private readonly auth: AuthService, @Inject(NotificationsService) private readonly service: NotificationsService) {}
  private async uid(req: Request) { return (await this.auth.fromToken(req.cookies?.budgetmap_session)).id; }
  @Get() async list(@Req() req: Request) { return this.service.list(await this.uid(req)); }
  @Patch('reminder') async updateReminder(@Req() req: Request, @Body() body: { enabled: boolean; times: string[] }) { return this.service.updateReminder(await this.uid(req), body); }
  @Get('vapid-public-key') key() { return { publicKey: process.env.VAPID_PUBLIC_KEY ?? null }; }
  @Post('subscribe') async subscribe(@Req() req: Request, @Body() body: { endpoint: string; keys: { p256dh: string; auth: string } }) { return this.service.subscribe(await this.uid(req), body); }
  @Post('test') async testPush(@Req() req: Request) { return this.service.sendTestPush(await this.uid(req)); }
  @Delete('subscribe') async unsubscribe(@Req() req: Request) { return this.service.unsubscribe(await this.uid(req)); }
  @Patch('read-all') async readAll(@Req() req: Request) { return this.service.markAllRead(await this.uid(req)); }
  @Patch(':id/read') async read(@Req() req: Request, @Param('id') id: string) { return this.service.markRead(await this.uid(req), id); }
  @Get('dispatch') dispatch(@Headers('authorization') authorization?: string) { return this.service.dispatch(authorization); }
}
