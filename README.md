# Gebeya Go

A Telegram mini app for group buying imported goods. Businesses and people starting a business join a group order, the price drops as the group grows, and the organizer places one bulk order with the supplier.

## How it works

1. The organizer (you) publishes a group: product, supplier price tiers, minimum units, join deadline, expected arrival.
2. Buyers open the app in Telegram, set a quantity and join. They can change the quantity or leave while the group is open. Nobody pays at this stage.
3. At the deadline the group either locks (minimum reached) or is cancelled (minimum not reached). You can also lock it earlier from the Admin tab. Buyers get a Telegram message.
4. When a group locks, the price is final. Each buyer sees the amount to pay and your payment details, pays by bank transfer or mobile money, and uploads the receipt.
5. You check each receipt in the Admin tab and confirm or reject it. Buyers are notified either way.
6. You move the group through Ordered, Shipped, Arrived and Closed. Buyers get a message at each step.

Payment is manual in this version. The app never touches money, it only tracks who has paid.

## Setup

### 1. Create the bot

1. In Telegram, open @BotFather and send `/newbot`. Pick a name and a username. Copy the token.
2. Find your own Telegram user ID by messaging @userinfobot.

### 2. Host the app over https

Telegram mini apps need an https address. Any host that runs Node 20 or newer works (a small VPS, Railway, Render, Fly.io). The app needs a persistent disk for `DATA_DIR`, because the database, receipts and product photos live there.

```
cp .env.example .env     # fill in the values, or set them in your host's dashboard
npm install
npm start
```

Environment variables are listed in `.env.example`. The important ones are `BOT_TOKEN`, `WEBAPP_URL`, `ADMIN_IDS` and `BOT_USERNAME`. If you use a `.env` file, load it with `node --env-file=.env server.js`.

### 3. Connect the app to the bot

1. Start the server with `WEBAPP_URL` set to your https address. On start, the bot sets its menu button to open the app, and `/start` shows an Open button.
2. For the Share button and links that open a specific group, create a mini app in BotFather with `/newapp` (or set the Main Mini App with `/mybots`, then Bot Settings) and point it at the same address. Links then look like `https://t.me/YOUR_BOT?startapp=deal_12`.

### 4. First use

1. Open the bot, tap the menu button, go to the Admin tab (only IDs in `ADMIN_IDS` see it).
2. Under Payment details, enter the accounts buyers should pay to, and save.
3. Under New group, publish your first group.

## Running it on your own computer

```
npm run dev
```

Then open `http://localhost:3000/?dev=1` for the admin view, or `?dev=2`, `?dev=3` to act as different buyers. Dev mode skips Telegram login, so never enable it on a public server. Without `BOT_TOKEN` there are no Telegram notifications.

## Project layout

- `server.js`: API, database (SQLite), Telegram login check, deadline job, bot messages.
- `public/`: the mini app (plain HTML, CSS and JavaScript, no build step).
- `data/`: created at runtime. Back this folder up.

## Notes

- Every buyer needs a phone number and business name before joining, so you can reach them about delivery. These are visible to admins only.
- Receipts are visible only to the buyer who uploaded them and to admins.
- Prices are in ETB and each tier price must be lower than the one before.
- The Amharic text should be reviewed by a native speaker before launch.
- Not built yet: online payment (Telebirr, Chapa), refunds tracking, multiple organizers with separate stock, delivery address capture, product categories and search.
