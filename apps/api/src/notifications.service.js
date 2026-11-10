"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_js_1 = require("./prisma.service.js");
const web_push_1 = __importDefault(require("web-push"));
const node_net_1 = require("node:net");
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
let NotificationsService = class NotificationsService {
    constructor(db) {
        this.db = db;
    }
    async list(userId) {
        const [items, unreadCount, dailyReminderEnabled] = await Promise.all([
            this.db.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 }),
            this.db.notification.count({ where: { userId, readAt: null } }),
            this.db.user.findUniqueOrThrow({ where: { id: userId }, select: { dailyReminderEnabled: true, dailyReminderTimes: true } }),
        ]);
        return { items, unreadCount, dailyReminderEnabled: dailyReminderEnabled.dailyReminderEnabled,
            dailyReminderTimes: DAILY_REMINDER_TIMES,
            pushConfigured: Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) };
    }
    async updateReminder(userId, input) {
        if (!Array.isArray(input.times) || input.times.length !== DAILY_REMINDER_TIMES.length || DAILY_REMINDER_TIMES.some((time) => !input.times.includes(time)) || input.times.some((time) => !DAILY_REMINDER_TIMES.includes(time)))
            throw new common_1.ForbiddenException('INVALID_REMINDER_TIMES');
        const existing = await this.db.user.findUniqueOrThrow({ where: { id: userId }, select: { dailyReminderEnabled: true } });
        const updated = await this.db.user.update({ where: { id: userId }, data: { dailyReminderTime: DAILY_REMINDER_TIMES[0], dailyReminderTimes: DAILY_REMINDER_TIMES, dailyReminderEnabled: input.enabled && existing.dailyReminderEnabled } });
        return { dailyReminderTimes: updated.dailyReminderTimes, dailyReminderEnabled: updated.dailyReminderEnabled };
    }
    async subscribe(userId, input) {
        let url;
        try {
            url = new URL(input.endpoint);
        }
        catch {
            throw new common_1.ForbiddenException('INVALID_PUSH_ENDPOINT');
        }
        if (url.protocol !== 'https:' || (url.port && url.port !== '443') || url.username || url.password || !url.hostname.includes('.') || (0, node_net_1.isIP)(url.hostname) || url.hostname === 'localhost' || url.hostname.endsWith('.local') || url.hostname.endsWith('.internal') || !input.keys?.p256dh || !input.keys?.auth)
            throw new common_1.ForbiddenException('INVALID_PUSH_ENDPOINT');
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
    async unsubscribe(userId) {
        await this.db.$transaction([
            this.db.pushSubscription.deleteMany({ where: { userId } }),
            this.db.user.update({ where: { id: userId }, data: { dailyReminderEnabled: false } }),
        ]);
        return { enabled: false };
    }
    async sendTestPush(userId) {
        if (process.env.NODE_ENV === 'production')
            throw new common_1.ForbiddenException();
        if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY)
            throw new common_1.ForbiddenException('PUSH_NOT_CONFIGURED');
        const subscriptions = await this.db.pushSubscription.findMany({ where: { userId } });
        if (!subscriptions.length)
            throw new common_1.ForbiddenException('PUSH_SUBSCRIPTION_NOT_FOUND');
        web_push_1.default.setVapidDetails(process.env.VAPID_SUBJECT ?? 'mailto:hello@budgetmap.app', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
        const payload = JSON.stringify({ title: 'Thông báo thử BudgetMap', body: 'Thông báo đẩy trên thiết bị của bạn đã hoạt động.', url: '/notifications', tag: `test-push-${Date.now()}` });
        const results = await Promise.allSettled(subscriptions.map((subscription) => web_push_1.default.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, payload)));
        const sent = results.filter((result) => result.status === 'fulfilled').length;
        if (!sent)
            throw new common_1.ForbiddenException('PUSH_DELIVERY_FAILED');
        return { sent };
    }
    async markRead(userId, id) {
        await this.db.notification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: new Date() } });
        return { ok: true };
    }
    async markAllRead(userId) {
        await this.db.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
        return { ok: true };
    }
    async dispatch(secret) {
        const expected = process.env.CRON_SECRET;
        if (!expected || secret !== `Bearer ${expected}`)
            throw new common_1.ForbiddenException();
        const now = new Date();
        const localNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
        const dispatchWindow = new Map();
        for (let offset = 0; offset <= 5; offset++) {
            const scheduledAt = new Date(localNow.getTime() - offset * 60_000);
            const time = `${String(scheduledAt.getUTCHours()).padStart(2, '0')}:${String(scheduledAt.getUTCMinutes()).padStart(2, '0')}`;
            const date = `${scheduledAt.getUTCFullYear()}-${String(scheduledAt.getUTCMonth() + 1).padStart(2, '0')}-${String(scheduledAt.getUTCDate()).padStart(2, '0')}`;
            dispatchWindow.set(time, date);
        }
        const dueTimes = DAILY_REMINDER_TIMES.filter((time) => dispatchWindow.has(time));
        const users = dueTimes.length ? await this.db.user.findMany({ where: { dailyReminderEnabled: true }, include: { pushSubscriptions: true } }) : [];
        const canPush = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
        if (canPush)
            web_push_1.default.setVapidDetails(process.env.VAPID_SUBJECT ?? 'mailto:hello@budgetmap.app', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
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
                if (!inserted.count)
                    continue;
                created++;
                recentKeys.add(`${message.title}\n${message.body}`);
                const notification = await this.db.notification.findUniqueOrThrow({ where: { userId_kind_dateKey: { userId: user.id, kind: 'DAILY_REMINDER', dateKey: slotKey } } });
                if (!canPush)
                    continue;
                const payload = JSON.stringify({ title: notification.title, body: notification.body, url: '/notifications', tag: `daily-reminder-${slotKey}` });
                for (const sub of user.pushSubscriptions) {
                    try {
                        await web_push_1.default.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
                    }
                    catch (error) {
                        const statusCode = error.statusCode;
                        if (statusCode === 404 || statusCode === 410)
                            await this.db.pushSubscription.deleteMany({ where: { id: sub.id } });
                    }
                }
            }
        }
        return { dateKey: [...dispatchWindow.values()][0], eligibleUsers: users.length, created, pushConfigured: canPush };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(prisma_service_js_1.PrismaService)),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], NotificationsService);
