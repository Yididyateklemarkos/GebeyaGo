# Free hosting: Render + Neon + keep-awake ping

The same pieces as the Lotwise site: the app on Render, the data in a hosted PostgreSQL database. Prices and limits of free plans change, so check each plan page before you rely on it.

## 1. Free PostgreSQL database (Neon)
1. Go to https://neon.tech and sign up (free).
2. Create a project. Pick a region close to your Render region. Frankfurt is a good choice for Ethiopia on both.
3. On the project page click Connect and copy the connection string. It starts with `postgresql://` and ends with `?sslmode=require`. Keep it secret.

Other free options work the same way, because the app only needs a standard PostgreSQL connection string:
- Supabase: use the Session pooler connection string, not the direct one (the direct one is IPv6 only, and Render needs IPv4). Free projects pause after a week without use.
- Render PostgreSQL free: it is deleted after about 30 days, so it is not suitable for real data.

The app creates its tables by itself on first start.

## 2. Move the Render service to the free plan
1. In Render open your service, then Disks, and delete the disk. The old test data on it is lost, which is fine. A free service cannot have a disk.
2. Settings, Instance Type, choose Free.
3. Settings, Build Command: `npm install --omit=dev`. Start Command: `npm start`.
4. Environment: add `DATABASE_URL` with the Neon string. You can delete `DATA_DIR`. Keep `BOT_TOKEN`, `BOT_USERNAME`, `ADMIN_IDS`, `WEBAPP_URL`, `PAY_DAYS` and `NODE_VERSION=22`.
5. Upload the new files to GitHub (see the update steps), and Render redeploys.
6. In the Logs look for `Gebeya Go server on port` and `bot @... running (webhook)`.

On Render the bot runs in webhook mode automatically. A free service goes to sleep after 15 minutes without visitors, and with a webhook Telegram wakes it up when someone messages the bot.

## 3. Keep it awake (free)
A sleeping service takes about a minute to wake when a buyer opens the app. A free ping prevents this.
1. Sign up at https://uptimerobot.com (free).
2. Add a monitor: type HTTP(s), URL `https://gebeyago.onrender.com/healthz`, interval 5 minutes.

The `/healthz` address does not touch the database, so the database can still rest when nobody is using the app.

## 4. After the switch
1. Open the Admin tab, save your payment details and add your products again. The new database starts empty.
2. Place a test order from a second Telegram account and upload a receipt.
3. Run `npm run backup` now and then on your own computer. Set `DATABASE_URL` in a `.env` file there first and run `node --env-file=.env scripts/backup.js`.

## Limits to know
- Neon's free plan has a storage limit (0.5 GB when I checked). Receipts and photos are shrunk to a few hundred KB each, so that is about a thousand receipts.
- The first request after the database has rested can take a second.
- Free plans can change. If they do, only the host changes. The app stays the same, because it only needs a PostgreSQL address.
