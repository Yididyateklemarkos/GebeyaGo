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

## Setup

1. Create the bot with @BotFather (`/newbot`) and copy the token. Get your Telegram user ID from @userinfobot.
2. Host the app over https on any host that runs Node 20 or newer, with a persistent disk for `DATA_DIR` (database, receipts and photos live there).

```
cp .env.example .env     # fill in the values, or set them in your host's dashboard
npm install
npm start
```

Variables are listed in `.env.example`. The important ones are `BOT_TOKEN`, `WEBAPP_URL`, `ADMIN_IDS`, `BOT_USERNAME` and `DATA_DIR`. With a `.env` file, run `node --env-file=.env server.js`.

3. With `WEBAPP_URL` set to your https address, the bot sets its menu button on start and `/start` shows an Open button.
4. First use: open the app from an admin account, go to Admin > Settings, save your payment details, then add products.

## Online payment (optional)

Buyers can pay with a Pay online button, handled by Verify Checkout hosted deposits. Manual receipt upload still works next to it.

1. In the Verify Checkout dashboard: add your receiving account, create an API key that can create and read deposits, and register the return origin (the same address as `WEBAPP_URL`, for example `https://yourapp.onrender.com`).
2. Add a webhook endpoint `https://yourapp.onrender.com/api/verify/webhook`, selecting the deposit outcome events, and copy its signing secret.
3. Set `VERIFY_API_KEY` and `VERIFY_WEBHOOK_SECRET` in your host's environment. Restart.

How it stays safe: an order is marked paid only after the server reads the deposit back from the API and finds status `succeeded`, currency ETB and the exact order amount. The webhook is signed (checked on the raw body, 5 minute tolerance), duplicates are ignored, and a background check every 2 minutes catches missed webhooks. Odd cases (wrong amount, payment on a cancelled order, review required) are sent to the admins in Telegram and the order is not changed. The code is in `payments.js`.

## Branding

- Colors and font: edit `public/brand.css`. It is the only file you need for this.
- Logo: `public/brand/logo.png` (already included). Colors in `brand.css` come from the logo.

## Local testing

`npm run dev` starts the server in dev mode on port 3000. Dev mode lets anyone log in as any user, so never use it on a live server.
