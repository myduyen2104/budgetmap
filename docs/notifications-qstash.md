# Daily reminder schedules with QStash

The reminder feature uses three shared daily schedules in Vietnam time: 13:00, 18:00, and 22:00. Each schedule calls the API once per day; the API sends a push to users who enabled reminders. Existing enabled users automatically move to these fixed times after the API is redeployed. This works within Vercel Hobby and QStash Free without polling every few minutes.

## Vercel environment variables

Configure these for Production and redeploy:

- `CRON_SECRET`: a long random secret. Generate locally with `openssl rand -hex 32`.
- `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`: generate locally with `npx web-push generate-vapid-keys`.
- `VAPID_SUBJECT`: a contact URI such as `mailto:hello@budgetmap.app`.

Do not commit or share secret values. QStash must forward `Authorization: Bearer <CRON_SECRET>` to the API.

## Create three QStash schedules

In the Upstash Console, create three schedules, one per time. Use the same production destination and forwarded Authorization header for each:

- Destination: `https://<your-production-domain>/api/notifications/dispatch`
- Method: `GET`
- Forwarded header: `Authorization: Bearer <your CRON_SECRET>`
- Retries: `1`

Set the cron expression for each schedule as follows:

| Reminder time (Vietnam) | Cron expression |
| --- | --- |
| 13:00 | `CRON_TZ=Asia/Ho_Chi_Minh 0 13 * * *` |
| 18:00 | `CRON_TZ=Asia/Ho_Chi_Minh 0 18 * * *` |
| 22:00 | `CRON_TZ=Asia/Ho_Chi_Minh 0 22 * * *` |

QStash supports `CRON_TZ` timezone prefixes. These three schedules produce three messages per day, plus any retries. The Free plan allows up to 1,000 messages/day and 10 active schedules.

## Verify

Inspect QStash delivery logs after each scheduled time. Successful requests return JSON with `eligibleUsers`, `created`, and `pushConfigured`. `pushConfigured` must be `true` for device push. A user must also enable reminders, grant browser notification permission, and keep a valid push subscription.

See [QStash pricing](https://upstash.com/pricing/qstash) and [QStash schedules](https://upstash.com/docs/qstash/features/schedules).
