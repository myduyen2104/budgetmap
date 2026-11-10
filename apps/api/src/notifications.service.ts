import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import webpush from 'web-push';
import { isIP } from 'node:net';

type SubscriptionPayload = { endpoint: string; keys: { p256dh: string; auth: string } };

const DAILY_REMINDER_MESSAGES = [
  { title: 'Đến giờ ghi lại chi tiêu rồi!', body: 'Dành một phút cập nhật các khoản bạn đã chi hôm nay nhé.' },
  { title: 'Hôm nay bạn đã chi những gì?', body: 'Ghi lại vài khoản nhỏ ngay bây giờ để cuối tháng không phải nhớ lại.' },
  { title: 'Cập nhật ví một chút nhé', body: 'Thêm các khoản thu chi trong ngày để số dư luôn chính xác.' },
  { title: 'Một phút cho kế hoạch tài chính', body: 'Ghi lại chi tiêu hôm nay để xem ngân sách còn lại bao nhiêu.' },
  { title: 'Đừng quên những khoản nhỏ', body: 'Một ly cà phê hay chuyến xe cũng đáng được ghi lại đó.' },
  { title: 'Khép lại ngày với sổ chi tiêu gọn gàng', body: 'Cập nhật giao dịch hôm nay để ngày mai bắt đầu thật nhẹ nhàng.' },
  { title: 'Ghé BudgetMap một chút nha', body: 'Bạn chỉ mất ít phút để ghi lại những gì đã chi trong hôm nay.' },
  { title: 'Theo dõi chi tiêu đều đặn nhé', body: 'Ghi lại hôm nay để nhận ra thói quen chi tiêu của mình rõ hơn.' },
  { title: 'Ngân sách hôm nay thế nào rồi?', body: 'Cập nhật các khoản đã dùng và kiểm tra phần ngân sách còn lại.' },
  { title: 'Lưu lại chi tiêu trước khi quên', body: 'Thêm nhanh giao dịch trong ngày để hành trình quản lý tiền luôn liền mạch.' },
  { title: 'Bạn đang quản lý tiền rất tốt', body: 'Duy trì thói quen ghi chép hôm nay để kế hoạch tháng luôn sát thực tế.' },
  { title: 'Đến lúc nhìn lại hôm nay rồi', body: 'Ghi lại các khoản đã chi và yên tâm khép lại một ngày nhé.' },
];
const DAILY_REMINDER_TIMES = ['13:00', '18:00', '22:00'];

@Injectable()
export class NotificationsService {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}

  async list(userId: string) {
    const [items, unreadCount, dailyReminderEnabled] = await Promise.all([
      this.db.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 }),
      this.db.notification.count({ where: { userId, readAt: null } }),
      this.db.user.findUniqueOrThrow({ where: { id: userId }, select: { dailyReminderEnabled: true, dailyReminderTimes: true } }),
    ]);
    return { items, unreadCount, dailyReminderEnabled: dailyReminderEnabled.dailyReminderEnabled,
      dailyReminderTimes: DAILY_REMINDER_TIMES,
      pushConfigured: Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) };
  }

  async updateReminder(userId: string, input: { enabled: boolean; times: string[] }) {
    if (!Array.isArray(input.times) || input.times.length !== DAILY_REMINDER_TIMES.length || DAILY_REMINDER_TIMES.some((time) => !input.times.includes(time)) || input.times.some((time) => !DAILY_REMINDER_TIMES.includes(time))) throw new ForbiddenException('INVALID_REMINDER_TIMES');
    const existing = await this.db.user.findUniqueOrThrow({ where: { id: userId }, select: { dailyReminderEnabled: true } });
    const updated = await this.db.user.update({ where: { id: userId }, data: { dailyReminderTime: DAILY_REMINDER_TIMES[0], dailyReminderTimes: DAILY_REMINDER_TIMES, dailyReminderEnabled: input.enabled && existing.dailyReminderEnabled } });
    return { dailyReminderTimes: updated.dailyReminderTimes, dailyReminderEnabled: updated.dailyReminderEnabled };
  }

  async subscribe(userId: string, input: SubscriptionPayload) {
    let url: URL;
    try { url = new URL(input.endpoint); } catch { throw new ForbiddenException('INVALID_PUSH_ENDPOINT'); }
    if (url.protocol !== 'https:' || (url.port && url.port !== '443') || url.username || url.password || !url.hostname.includes('.') || isIP(url.hostname) || url.hostname === 'localhost' || url.hostname.endsWith('.local') || url.hostname.endsWith('.internal') || !input.keys?.p256dh || !input.keys?.auth) throw new ForbiddenException('INVALID_PUSH_ENDPOINT');
    await this.db.$transaction([
      this.db.pushSubscription.upsert({
        where: { endpoint: input.endpoint },
        create: { userId, endpoint: input.endpoint, p256dh: input.keys.p256dh, auth: input.keys.auth },
        update: { userId, p256dh: input.keys.p256dh, auth: input.keys.auth },
      }),
      this.db.user.update({ where: { id: userId }, data: { dailyReminderEnabled: true } }),
    ]);
    return { enabled: true };
  }

  async unsubscribe(userId: string) {
    await this.db.$transaction([
      this.db.pushSubscription.deleteMany({ where: { userId } }),
      this.db.user.update({ where: { id: userId }, data: { dailyReminderEnabled: false } }),
    ]);
    return { enabled: false };
  }

  async sendTestPush(userId: string) {
    if (process.env.NODE_ENV === 'production') throw new ForbiddenException();
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) throw new ForbiddenException('PUSH_NOT_CONFIGURED');
    const subscriptions = await this.db.pushSubscription.findMany({ where: { userId } });
    if (!subscriptions.length) throw new ForbiddenException('PUSH_SUBSCRIPTION_NOT_FOUND');
    webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? 'mailto:hello@budgetmap.app', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
    const payload = JSON.stringify({ title: 'Thông báo thử BudgetMap', body: 'Thông báo đẩy trên thiết bị của bạn đã hoạt động.', url: '/notifications', tag: `test-push-${Date.now()}` });
    const results = await Promise.allSettled(subscriptions.map((subscription) => webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, payload)));
    const sent = results.filter((result) => result.status === 'fulfilled').length;
    if (!sent) throw new ForbiddenException('PUSH_DELIVERY_FAILED');
    return { sent };
  }

  async markRead(userId: string, id: string) {
    await this.db.notification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: new Date() } });
    return { ok: true };
  }

  async markAllRead(userId: string) {
    await this.db.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    return { ok: true };
  }

  async dispatch(secret?: string) {
    const expected = process.env.CRON_SECRET;
    if (!expected || secret !== `Bearer ${expected}`) throw new ForbiddenException();
    const now = new Date();
    const localNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const dispatchWindow = new Map<string, string>();
    for (let offset = 0; offset <= 5; offset++) {
      const scheduledAt = new Date(localNow.getTime() - offset * 60_000);
      const time = `${String(scheduledAt.getUTCHours()).padStart(2, '0')}:${String(scheduledAt.getUTCMinutes()).padStart(2, '0')}`;
      const date = `${scheduledAt.getUTCFullYear()}-${String(scheduledAt.getUTCMonth() + 1).padStart(2, '0')}-${String(scheduledAt.getUTCDate()).padStart(2, '0')}`;
      dispatchWindow.set(time, date);
    }
    const dueTimes = DAILY_REMINDER_TIMES.filter((time) => dispatchWindow.has(time));
    const users = dueTimes.length ? await this.db.user.findMany({ where: { dailyReminderEnabled: true }, include: { pushSubscriptions: true } }) : [];
    const canPush = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
    if (canPush) webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? 'mailto:hello@budgetmap.app', process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
    let created = 0;
    for (const user of users) {
      const recentMessages = await this.db.notification.findMany({ where: { userId: user.id, kind: 'DAILY_REMINDER' }, orderBy: { createdAt: 'desc' }, take: DAILY_REMINDER_MESSAGES.length - 1, select: { title: true, body: true } });
      const recentKeys = new Set(recentMessages.map(({ title, body }) => `${title}\n${body}`));
      const matchingTimes = dueTimes;
      for (const time of matchingTimes) {
        const freshMessages = DAILY_REMINDER_MESSAGES.filter(({ title, body }) => !recentKeys.has(`${title}\n${body}`));
        const message = (freshMessages.length ? freshMessages : DAILY_REMINDER_MESSAGES)[Math.floor(Math.random() * (freshMessages.length || DAILY_REMINDER_MESSAGES.length))];
        const slotKey = `${dispatchWindow.get(time)}-${time}`;
        const inserted = await this.db.notification.createMany({ data: [{ userId: user.id, kind: 'DAILY_REMINDER', dateKey: slotKey, ...message }], skipDuplicates: true });
        if (!inserted.count) continue;
        created++;
        recentKeys.add(`${message.title}\n${message.body}`);
        const notification = await this.db.notification.findUniqueOrThrow({ where: { userId_kind_dateKey: { userId: user.id, kind: 'DAILY_REMINDER', dateKey: slotKey } } });
        if (!canPush) continue;
        const payload = JSON.stringify({ title: notification.title, body: notification.body, url: '/notifications', tag: `daily-reminder-${slotKey}` });
        for (const sub of user.pushSubscriptions) {
          try { await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload); }
          catch (error) {
            const statusCode = (error as { statusCode?: number }).statusCode;
            if (statusCode === 404 || statusCode === 410) await this.db.pushSubscription.deleteMany({ where: { id: sub.id } });
          }
        }
      }
    }
    return { dateKey: [...dispatchWindow.values()][0], eligibleUsers: users.length, created, pushConfigured: canPush };
  }
}
