# Gebeya Go

A Telegram mini app for bulk buying imported goods. Businesses and people starting a business order any product in bulk. Each product has its own minimum order quantity (MOQ), and the unit price drops as the order quantity goes up.

## How it works

1. You add a product in the Admin tab: name, photo, unit, MOQ, optional maximum, the base price at the MOQ, and optional cheaper prices for larger quantities.
2. A buyer opens the app in Telegram, picks a quantity (at least the MOQ) and places an order. The unit price is locked at that moment.
3. The buyer sees the amount and your payment details, pays by bank transfer or mobile money, and uploads the receipt.
4. You check the receipt in the Admin tab and confirm or reject it. The buyer gets a Telegram message either way.
5. You move orders through Ordered, Shipped, Arrived and Completed, one at a time or in bulk for everything shown. Buyers get a message at each step.
6. Unpaid orders are cancelled automatically after `PAY_DAYS` days (default 3, 0 turns this off).

Payment is manual. The app never touches money, it only tracks who has paid. The buyer side is in English and Amharic. The Admin tab is in English.

## Where the data lives

Everything is in one PostgreSQL database: users, products, orders, settings, and also product photos and payment receipts (photos are shrunk on the phone before upload). The app itself keeps no files, so it can run on a free host that has no permanent disk. See `SETUP-FREE.md` for the free setup.

## Setup

1. Create the bot with @BotFather (`/newbot`) and copy the token. Get your Telegram user ID from @userinfobot.
2. Create a PostgreSQL database and copy its connection string into `DATABASE_URL`.
3. Host the app over https on any host that runs Node 20 or newer.

```
cp .env.example .env     # fill in the values, or set them in your host's dashboard
npm install
node --env-file=.env server.js
```

4. With `WEBAPP_URL` set to your https address, the bot sets its menu button on start and `/start` shows an Open button.
5. First use: open the app from an admin account, go to Admin > Settings, save your payment details, then add products.

## Branding

- Colors and font: edit `public/brand.css`. It is the only file you need for this.
- Logo: `public/brand/logo.png` (already included).

## Local testing

`npm run dev` starts the app with a built in test database in the `.devdb` folder and dev login on port 3000. Dev login lets anyone act as any user, so never use it on a live server (the server refuses to start with it when a bot token is set).

## Backup

`npm run backup` saves every table as JSON and every photo and receipt as a file into `backups/`. Run it on your own computer with the same `DATABASE_URL` as the host.
