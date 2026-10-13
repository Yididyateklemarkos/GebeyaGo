const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { Bot, InlineKeyboard, webhookCallback } = require('grammy');
const { connect } = require('./db');

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN || '';
const BOT_USERNAME = process.env.BOT_USERNAME || '';
const WEBAPP_URL = process.env.WEBAPP_URL || '';
const ADMIN_IDS = (process.env.ADMIN_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
const DEV_MODE = process.env.DEV_MODE === '1';
// Dev login lets anyone act as any user, so it must never run next to a real bot.
if (DEV_MODE && BOT_TOKEN) { console.error('Refusing to start: DEV_MODE is on while BOT_TOKEN is set. Remove DEV_MODE on a live server.'); process.exit(1); }
// Unpaid orders are cancelled after this many days. Set to 0 to turn this off.
const PAY_DAYS = Number(process.env.PAY_DAYS || 3);
const EXPIRY_CHECK_MS = Number(process.env.EXPIRY_CHECK_MS || 10 * 60 * 1000);
// "webhook" lets Telegram wake a sleeping free host. "polling" is for your own computer.
const BOT_MODE = process.env.BOT_MODE || (process.env.RENDER ? 'webhook' : 'polling');
const TG_SECRET = crypto.createHash('sha256').update('gebeya-telegram:' + BOT_TOKEN).digest('hex').slice(0, 40);
const MAX_FILE = 4 * 1024 * 1024;

let db = null; // set in start()

const getSetting = async (key, fallback = '') => {
  const row = await db.get('SELECT value FROM settings WHERE key = ?', key);
  return row ? row.value : fallback;
};
const setSetting = (key, value) =>
  db.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value', key, value);

// ---------- messages sent through the bot ----------
const MSG = {
  placed: {
    en: 'Order #{id} received: {qty} x {title}. Total: {total} ETB. Open the app to see payment details and upload your receipt.',
    am: 'ትዕዛዝ #{id} ተቀብለናል፡ {qty} x {title}። ጠቅላላ፡ {total} ብር። የክፍያ መረጃውን ለማየት እና ደረሰኝ ለመጫን መተግበሪያውን ይክፈቱ።',
  },
  paid: {
    en: 'Payment confirmed for order #{id} ({title}). Thank you.',
    am: 'ለትዕዛዝ #{id} ({title}) ክፍያዎ ተረጋግጧል። እናመሰግናለን።',
  },
  rejected: {
    en: 'Your receipt for order #{id} ({title}) could not be confirmed. {note} Please upload it again.',
    am: 'ለትዕዛዝ #{id} ({title}) የላኩት ደረሰኝ ሊረጋገጥ አልቻለም። {note} እባክዎ እንደገና ይጫኑ።',
  },
  ordered: {
    en: 'Order #{id} ({title}) has been placed with the supplier.',
    am: 'ትዕዛዝ #{id} ({title}) ለአቅራቢው ተሰጥቷል።',
  },
  shipped: {
    en: 'Order #{id} ({title}) has shipped. Expected arrival: {eta}.',
    am: 'ትዕዛዝ #{id} ({title}) ተልኳል። የሚደርስበት ጊዜ፡ {eta}።',
  },
  arrived: {
    en: 'Order #{id} ({title}) has arrived. We will contact you about pickup or delivery.',
    am: 'ትዕዛዝ #{id} ({title}) ደርሷል። ስለ ርክክብ እናነጋግርዎታለን።',
  },
  completed: {
    en: 'Order #{id} ({title}) is complete. Thank you for buying with Gebeya Go.',
    am: 'ትዕዛዝ #{id} ({title}) ተጠናቋል። ከገበያ ጎ ስለገዙ እናመሰግናለን።',
  },
  cancelled: {
    en: 'Order #{id} ({title}) was cancelled. If you already paid, we will contact you about a refund.',
    am: 'ትዕዛዝ #{id} ({title}) ተሰርዟል። ቀድመው ከከፈሉ፣ ስለ ገንዘብ ተመላሽ እናነጋግርዎታለን።',
  },
  expired: {
    en: 'Order #{id} ({title}) was cancelled because payment was not received in time. You can place a new order any time.',
    am: 'ትዕዛዝ #{id} ({title}) ክፍያ በጊዜው ስላልደረሰ ተሰርዟል። በማንኛውም ጊዜ አዲስ ትዕዛዝ ማዘዝ ይችላሉ።',
  },
};

const fmt = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => (vars[k] === undefined ? '' : vars[k]));
const round2 = (n) => Math.round(n * 100) / 100;
const money = (n) => round2(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
const intId = (v) => { const n = Number(v); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : 0; };

// Giving the bot its own details up front saves a network call on every wake-up of a sleeping host.
const botInfo = BOT_TOKEN && BOT_USERNAME
  ? { id: Number(BOT_TOKEN.split(':')[0]), is_bot: true, first_name: 'Gebeya Go', username: BOT_USERNAME, can_join_groups: true, can_read_all_group_messages: false, supports_inline_queries: false, can_connect_to_business: false, has_main_web_app: false }
  : undefined;
const bot = BOT_TOKEN ? new Bot(BOT_TOKEN, botInfo ? { botInfo } : undefined) : null;
async function notifyUser(tgId, key, vars) {
  if (!bot) return;
  try {
    const user = await db.get('SELECT lang FROM users WHERE tg_id = ?', tgId);
    const lang = user && user.lang === 'am' ? 'am' : 'en';
    await bot.api.sendMessage(tgId, fmt(MSG[key][lang], vars));
  } catch (err) {
    console.warn('notify failed for', tgId, err.description || err.message);
  }
}
async function notifyAdmins(text) {
  if (!bot) return;
  for (const id of ADMIN_IDS) {
    try {
      await bot.api.sendMessage(id, text);
    } catch (err) {
      console.warn('admin notify failed for', id, err.description || err.message);
    }
  }
}

// ---------- products and pricing ----------
function priceFor(tiers, qty) {
  let price = tiers[0].price;
  for (const t of tiers) if (qty >= t.min_qty) price = t.price;
  return price;
}

function serializeProduct(p) {
  const tiers = JSON.parse(p.tiers);
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    origin: p.origin,
    unit: p.unit,
    image: p.image ? `/images/${p.image}` : null,
    moq: p.moq,
    max_qty: p.max_qty,
    tiers,
    lead_time: p.lead_time,
    active: !!p.active,
    base_price: tiers[0].price,
    best_price: tiers[tiers.length - 1].price,
  };
}

// The first tier always starts at the MOQ. Extra tiers must start above it and cost less.
function normalizeTiers(raw, moq) {
  const list = (Array.isArray(raw) ? raw : [])
    .map((t) => ({ min_qty: Math.floor(Number(t.min_qty)), price: round2(Number(t.price)) }))
    .filter((t) => t.min_qty >= 1 && t.price > 0)
    .sort((a, b) => a.min_qty - b.min_qty);
  if (!list.length) return { error: 'add the price at the minimum order' };
  const base = list.filter((t) => t.min_qty <= moq).pop() || list[0];
  const extra = list.filter((t) => t !== base && t.min_qty > moq);
  const out = [{ min_qty: moq, price: base.price }, ...extra];
  for (let i = 1; i < out.length; i++) {
    if (out[i].min_qty <= out[i - 1].min_qty) return { error: 'each price tier needs a higher quantity than the one before' };
    if (out[i].price >= out[i - 1].price) return { error: 'prices must drop as quantity rises' };
  }
  return { tiers: out };
}

function parseProductBody(b) {
  const title = String(b.title || '').trim().slice(0, 120);
  const moq = Math.floor(Number(b.moq));
  const maxQty = Math.max(0, Math.floor(Number(b.max_qty) || 0));
  if (!title) return { error: 'product name is required' };
  if (!(moq >= 1)) return { error: 'minimum order quantity must be at least 1' };
  if (maxQty > 0 && maxQty < moq) return { error: 'maximum per order cannot be lower than the minimum' };
  let rawTiers;
  try { rawTiers = JSON.parse(b.tiers || '[]'); } catch { return { error: 'invalid price tiers' }; }
  const t = normalizeTiers(rawTiers, moq);
  if (t.error) return { error: t.error };
  return {
    fields: {
      title,
      description: String(b.description || '').slice(0, 2000),
      origin: String(b.origin || '').slice(0, 80),
      unit: String(b.unit || 'piece').trim().slice(0, 30) || 'piece',
      moq,
      max_qty: maxQty,
      tiers: JSON.stringify(t.tiers),
      lead_time: String(b.lead_time || '').slice(0, 120),
      active: b.active === undefined ? undefined : ['1', 'true', 1, true].includes(b.active) ? 1 : 0,
    },
  };
}

// ---------- orders ----------
const ORDER_FLOW = { paid: 'ordered', ordered: 'shipped', shipped: 'arrived', arrived: 'completed' };
const PREVIOUS = { ordered: 'paid', shipped: 'ordered', arrived: 'shipped', completed: 'arrived' };

// every order is read together with its product name, unit and photo
const ORDER_SQL = 'SELECT o.*, p.title AS p_title, p.unit AS p_unit, p.image AS p_image FROM bulk_orders o LEFT JOIN products p ON p.id = o.product_id';
const getOrder = (id) => db.get(ORDER_SQL + ' WHERE o.id = ?', id);

function serializeOrder(o) {
  return {
    id: o.id,
    product_id: o.product_id,
    title: o.p_title || '(removed product)',
    unit: o.p_unit || '',
    image: o.p_image ? `/images/${o.p_image}` : null,
    qty: o.qty,
    unit_price: o.unit_price,
    total: o.total,
    status: o.status,
    has_receipt: !!o.receipt,
    reject_note: o.reject_note,
    eta_text: o.eta_text,
    note: o.note,
    created_at: o.created_at,
    pay_by: PAY_DAYS > 0 && o.status === 'awaiting_payment' ? o.created_at + PAY_DAYS * 86400000 : null,
  };
}

const orderVars = (o) => ({ id: o.id, title: o.p_title || '', qty: o.qty, total: money(o.total), eta: o.eta_text || '-' });

async function expireUnpaid() {
  if (!(PAY_DAYS > 0)) return;
  const cutoff = Date.now() - PAY_DAYS * 86400000;
  const rows = await db.all(ORDER_SQL + " WHERE o.status = 'awaiting_payment' AND o.created_at <= ?", cutoff);
  for (const o of rows) {
    const n = await db.run("UPDATE bulk_orders SET status = 'cancelled', updated_at = ? WHERE id = ? AND status = 'awaiting_payment'", Date.now(), o.id);
    if (n) notifyUser(o.tg_id, 'expired', orderVars(o));
  }
}
// A free host sleeps, so a timer alone is not enough. Also check when people use the app.
let lastExpiry = 0;
function maybeExpire() {
  if (Date.now() - lastExpiry < EXPIRY_CHECK_MS - 1000) return;
  lastExpiry = Date.now();
  expireUnpaid().catch((e) => console.error('expiry check failed:', e.message));
}

// ---------- auth ----------
function validateInitData(initData) {
  if (!BOT_TOKEN || !initData) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');
  const check = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const calc = crypto.createHmac('sha256', secret).update(check).digest('hex');
  const a = Buffer.from(calc, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const authDate = Number(params.get('auth_date') || 0);
  if (Date.now() / 1000 - authDate > 86400) return null;
  try {
    return JSON.parse(params.get('user'));
  } catch {
    return null;
  }
}

async function auth(req, res, next) {
  let tgUser = validateInitData(req.get('x-init-data'));
  if (!tgUser && DEV_MODE && req.get('x-dev-user')) {
    const id = String(req.get('x-dev-user')).replace(/\D/g, '') || '1';
    tgUser = { id, first_name: `Dev ${id}`, username: `dev${id}`, language_code: 'en' };
  }
  if (!tgUser) return res.status(401).json({ error: 'unauthorized' });
  const id = String(tgUser.id);
  const name = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ');
  const lang = String(tgUser.language_code || '').startsWith('am') ? 'am' : 'en';
  req.user = await db.get(
    'INSERT INTO users (tg_id, name, username, lang, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT (tg_id) DO UPDATE SET name = EXCLUDED.name, username = EXCLUDED.username RETURNING *',
    id, name, tgUser.username || null, lang, Date.now()
  );
  req.tgId = id;
  req.isAdmin = ADMIN_IDS.includes(id) || (DEV_MODE && id === '1');
  maybeExpire();
  next();
}

function adminOnly(req, res, next) {
  if (!req.isAdmin) return res.status(403).json({ error: 'admin only' });
  next();
}

// ---------- uploads (kept in the database, in memory on the way) ----------
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'application/pdf': '.pdf' };
const makeUpload = (allowPdf) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE, files: 1 },
    fileFilter: (req, file, cb) => {
      const ok = EXT[file.mimetype] && (allowPdf || file.mimetype !== 'application/pdf');
      cb(ok ? null : new Error('unsupported file type'), !!ok);
    },
  });
const receiptUpload = makeUpload(true);
const imageUpload = makeUpload(false);
const runUpload = (mw, req, res) => new Promise((resolve) => mw(req, res, (err) => resolve(err)));

// The declared file type comes from the phone, so also check the first bytes.
function realType(b) {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  if (b.subarray(0, 5).toString() === '%PDF-') return 'application/pdf';
  return null;
}
async function saveFile(kind, file) {
  if (realType(file.buffer) !== file.mimetype) return null;
  const name = crypto.randomBytes(14).toString('hex') + EXT[file.mimetype];
  await db.run('INSERT INTO files (name, kind, mime, data, created_at) VALUES (?, ?, ?, ?, ?)', name, kind, file.mimetype, file.buffer, Date.now());
  return name;
}
const removeFile = async (kind, name) => {
  if (!name) return;
  try { await db.run('DELETE FROM files WHERE name = ? AND kind = ?', String(name), kind); } catch (e) { /* not critical */ }
};

// ---------- app ----------
const app = express();
// security headers
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' https://telegram.org; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors https://web.telegram.org https://*.telegram.org https://t.me; base-uri 'none'; form-action 'self'",
  });
  next();
});

// This must not touch the database, so a keep-awake ping never wakes it.
app.get('/healthz', (req, res) => res.type('text').send('ok'));

// simple rate limit per client (in memory, fine for a single instance)
const hits = new Map();
setInterval(() => hits.clear(), 60 * 1000).unref();
app.use('/api', (req, res, next) => {
  const k = req.get('x-init-data') ? crypto.createHash('sha1').update(req.get('x-init-data')).digest('hex') : req.ip;
  const n = (hits.get(k) || 0) + 1;
  hits.set(k, n);
  if (n > 240) return res.status(429).json({ error: 'Too many requests. Wait a minute and try again.' });
  next();
});

app.use(express.json({ limit: '100kb' }));

// product photos are public, receipts are not (see below)
app.get('/images/:name', async (req, res) => {
  const f = await db.get("SELECT mime, data FROM files WHERE name = ? AND kind = 'image'", String(req.params.name));
  if (!f) return res.status(404).end();
  res.set({ 'Content-Type': f.mime, 'Cache-Control': 'public, max-age=604800, immutable' });
  res.send(Buffer.from(f.data));
});
app.use(express.static(path.join(__dirname, 'public')));

if (bot && BOT_MODE === 'webhook') app.post('/tg/' + TG_SECRET, webhookCallback(bot, 'express', { secretToken: TG_SECRET }));

app.get('/api/config', auth, async (req, res) => {
  res.json({
    user: req.user,
    is_admin: req.isAdmin,
    payment_info: await getSetting('payment_info', ''),
    bot_username: BOT_USERNAME,
    pay_days: PAY_DAYS,
    has_logo: fs.existsSync(path.join(__dirname, 'public', 'brand', 'logo.png')),
  });
});

app.put('/api/me', auth, async (req, res) => {
  const clean = (v, max) => String(v || '').trim().slice(0, max);
  const phone = clean(req.body.phone, 30);
  const business = clean(req.body.business_name, 80);
  const lang = req.body.lang === 'am' ? 'am' : 'en';
  res.json(await db.get('UPDATE users SET phone = ?, business_name = ?, lang = ? WHERE tg_id = ? RETURNING *', phone, business, lang, req.tgId));
});

// products (buyers)
app.get('/api/products', auth, async (req, res) => {
  const rows = await db.all('SELECT * FROM products WHERE active = 1 ORDER BY created_at DESC, id DESC');
  res.json(rows.map(serializeProduct));
});

app.get('/api/products/:id', auth, async (req, res) => {
  const p = await db.get('SELECT * FROM products WHERE id = ?', intId(req.params.id));
  if (!p || (!p.active && !req.isAdmin)) return res.status(404).json({ error: 'not found' });
  res.json(serializeProduct(p));
});

app.post('/api/products/:id/order', auth, async (req, res) => {
  const p = await db.get('SELECT * FROM products WHERE id = ?', intId(req.params.id));
  if (!p || !p.active) return res.status(404).json({ error: 'this product is not available' });
  if (!req.user.phone || !req.user.name) return res.status(400).json({ error: 'profile_required' });
  const qty = Math.floor(Number(req.body.qty));
  if (!Number.isFinite(qty) || qty < 1) return res.status(400).json({ error: 'invalid quantity' });
  if (qty < p.moq) return res.status(400).json({ error: `minimum order is ${p.moq} ${p.unit}` });
  if (p.max_qty > 0 && qty > p.max_qty) return res.status(400).json({ error: `maximum per order is ${p.max_qty} ${p.unit}` });
  const unpaid = (await db.get("SELECT COUNT(*) AS c FROM bulk_orders WHERE tg_id = ? AND status = 'awaiting_payment'", req.tgId)).c;
  if (unpaid >= 10) return res.status(400).json({ error: 'you have too many unpaid orders. Pay or cancel some first.' });
  const unitPrice = priceFor(JSON.parse(p.tiers), qty);
  const total = round2(unitPrice * qty);
  const now = Date.now();
  const id = await db.insert(
    'INSERT INTO bulk_orders (product_id, tg_id, qty, unit_price, total, status, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    p.id, req.tgId, qty, unitPrice, total, 'awaiting_payment', String(req.body.note || '').trim().slice(0, 300), now, now
  );
  const order = await getOrder(id);
  notifyUser(req.tgId, 'placed', orderVars(order));
  notifyAdmins(`New order #${order.id}: ${qty} x ${p.title} from ${req.user.name}${req.user.business_name ? ' (' + req.user.business_name + ')' : ''}, ${req.user.phone}. Total ${money(total)} ETB.`);
  res.json(serializeOrder(order));
});

// orders (buyers)
app.get('/api/my/orders', auth, async (req, res) => {
  const rows = await db.all(ORDER_SQL + ' WHERE o.tg_id = ? ORDER BY o.created_at DESC, o.id DESC', req.tgId);
  res.json(rows.map(serializeOrder));
});

app.get('/api/orders/:id', auth, async (req, res) => {
  const o = await getOrder(intId(req.params.id));
  if (!o || (o.tg_id !== req.tgId && !req.isAdmin)) return res.status(404).json({ error: 'not found' });
  res.json(serializeOrder(o));
});

app.post('/api/orders/:id/cancel', auth, async (req, res) => {
  const o = await getOrder(intId(req.params.id));
  if (!o || o.tg_id !== req.tgId) return res.status(404).json({ error: 'not found' });
  if (o.status !== 'awaiting_payment') return res.status(400).json({ error: 'you can only cancel an order before you pay. Contact us for help.' });
  const n = await db.run("UPDATE bulk_orders SET status = 'cancelled', updated_at = ? WHERE id = ? AND status = 'awaiting_payment'", Date.now(), o.id);
  if (!n) return res.status(400).json({ error: 'this order just changed. Refresh and try again.' });
  res.json(serializeOrder(await getOrder(o.id)));
});

app.post('/api/orders/:id/receipt', auth, async (req, res) => {
  const err = await runUpload(receiptUpload.single('receipt'), req, res);
  if (err) return res.status(400).json({ error: err.message });
  const o = await getOrder(intId(req.params.id));
  if (!o || o.tg_id !== req.tgId || !req.file) return res.status(404).json({ error: 'order or file not found' });
  if (!['awaiting_payment', 'receipt_uploaded'].includes(o.status)) return res.status(400).json({ error: 'payment is not open for this order' });
  const name = await saveFile('receipt', req.file);
  if (!name) return res.status(400).json({ error: 'unsupported file type' });
  const n = await db.run("UPDATE bulk_orders SET receipt = ?, status = 'receipt_uploaded', reject_note = NULL, updated_at = ? WHERE id = ? AND status IN ('awaiting_payment', 'receipt_uploaded')", name, Date.now(), o.id);
  if (!n) { await removeFile('receipt', name); return res.status(400).json({ error: 'payment is not open for this order' }); }
  await removeFile('receipt', o.receipt);
  notifyAdmins(`Receipt uploaded for order #${o.id} by ${req.user.name}. Open the app, Admin tab, to confirm it.`);
  res.json({ ok: true });
});

app.get('/api/orders/:id/receipt', auth, async (req, res) => {
  const o = await getOrder(intId(req.params.id));
  if (!o || !o.receipt) return res.status(404).end();
  if (o.tg_id !== req.tgId && !req.isAdmin) return res.status(403).end();
  const f = await db.get("SELECT mime, data FROM files WHERE name = ? AND kind = 'receipt'", o.receipt);
  if (!f) return res.status(404).end();
  res.set({ 'Content-Type': f.mime, 'Cache-Control': 'private, no-store' });
  res.send(Buffer.from(f.data));
});

// ---------- admin ----------
app.put('/api/admin/settings', auth, adminOnly, async (req, res) => {
  await setSetting('payment_info', String(req.body.payment_info || '').slice(0, 1500));
  res.json({ ok: true });
});

app.get('/api/admin/products', auth, adminOnly, async (req, res) => {
  const rows = await db.all("SELECT p.*, (SELECT COUNT(*) FROM bulk_orders o WHERE o.product_id = p.id AND o.status != 'cancelled') AS orders FROM products p ORDER BY p.created_at DESC, p.id DESC");
  res.json(rows.map((p) => ({ ...serializeProduct(p), orders: p.orders })));
});

app.post('/api/admin/products', auth, adminOnly, async (req, res) => {
  const err = await runUpload(imageUpload.single('image'), req, res);
  if (err) return res.status(400).json({ error: err.message });
  const parsed = parseProductBody(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  let image = null;
  if (req.file) {
    image = await saveFile('image', req.file);
    if (!image) return res.status(400).json({ error: 'unsupported file type' });
  }
  const f = parsed.fields;
  const now = Date.now();
  const id = await db.insert(
    'INSERT INTO products (title, description, origin, unit, image, moq, max_qty, tiers, lead_time, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    f.title, f.description, f.origin, f.unit, image, f.moq, f.max_qty, f.tiers, f.lead_time, f.active === undefined ? 1 : f.active, now, now
  );
  res.json(serializeProduct(await db.get('SELECT * FROM products WHERE id = ?', id)));
});

app.put('/api/admin/products/:id', auth, adminOnly, async (req, res) => {
  const err = await runUpload(imageUpload.single('image'), req, res);
  if (err) return res.status(400).json({ error: err.message });
  const p = await db.get('SELECT * FROM products WHERE id = ?', intId(req.params.id));
  if (!p) return res.status(404).json({ error: 'not found' });
  const parsed = parseProductBody(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const f = parsed.fields;
  let image = p.image;
  if (req.file) {
    image = await saveFile('image', req.file);
    if (!image) return res.status(400).json({ error: 'unsupported file type' });
    await removeFile('image', p.image);
  } else if (req.body.remove_image === '1') {
    await removeFile('image', p.image);
    image = null;
  }
  await db.run(
    'UPDATE products SET title = ?, description = ?, origin = ?, unit = ?, image = ?, moq = ?, max_qty = ?, tiers = ?, lead_time = ?, active = ?, updated_at = ? WHERE id = ?',
    f.title, f.description, f.origin, f.unit, image, f.moq, f.max_qty, f.tiers, f.lead_time, f.active === undefined ? p.active : f.active, Date.now(), p.id
  );
  res.json(serializeProduct(await db.get('SELECT * FROM products WHERE id = ?', p.id)));
});

app.delete('/api/admin/products/:id', auth, adminOnly, async (req, res) => {
  const p = await db.get('SELECT * FROM products WHERE id = ?', intId(req.params.id));
  if (!p) return res.status(404).json({ error: 'not found' });
  const used = (await db.get('SELECT COUNT(*) AS c FROM bulk_orders WHERE product_id = ?', p.id)).c;
  if (used > 0) return res.status(400).json({ error: 'this product has orders, so it cannot be deleted. Hide it instead.' });
  await removeFile('image', p.image);
  await db.run('DELETE FROM products WHERE id = ?', p.id);
  res.json({ ok: true });
});

app.get('/api/admin/orders', auth, adminOnly, async (req, res) => {
  const status = String(req.query.status || 'active');
  const productId = Number(req.query.product_id) || null;
  const where = [];
  const args = [];
  if (status === 'active') where.push("o.status NOT IN ('completed', 'cancelled')");
  else if (status !== 'all') { where.push('o.status = ?'); args.push(status); }
  if (productId) { where.push('o.product_id = ?'); args.push(productId); }
  const rows = await db.all(
    `SELECT o.*, p.title AS p_title, p.unit AS p_unit, p.image AS p_image, u.name, u.username, u.phone, u.business_name
     FROM bulk_orders o JOIN users u ON u.tg_id = o.tg_id LEFT JOIN products p ON p.id = o.product_id
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY o.created_at DESC, o.id DESC LIMIT 300`,
    ...args
  );
  res.json(rows.map((o) => ({ ...serializeOrder(o), name: o.name, username: o.username, phone: o.phone, business_name: o.business_name })));
});

app.post('/api/admin/orders/:id/confirm', auth, adminOnly, async (req, res) => {
  const o = await getOrder(intId(req.params.id));
  if (!o) return res.status(404).json({ error: 'not found' });
  const n = await db.run("UPDATE bulk_orders SET status = 'paid', reject_note = NULL, updated_at = ? WHERE id = ? AND status IN ('receipt_uploaded', 'awaiting_payment')", Date.now(), o.id);
  if (!n) return res.status(400).json({ error: 'order is not waiting for payment' });
  notifyUser(o.tg_id, 'paid', orderVars(o));
  res.json({ ok: true });
});

app.post('/api/admin/orders/:id/reject', auth, adminOnly, async (req, res) => {
  const o = await getOrder(intId(req.params.id));
  if (!o) return res.status(404).json({ error: 'not found' });
  const note = String(req.body.note || '').slice(0, 200);
  const n = await db.run("UPDATE bulk_orders SET status = 'awaiting_payment', receipt = NULL, reject_note = ?, updated_at = ? WHERE id = ? AND status = 'receipt_uploaded'", note, Date.now(), o.id);
  if (!n) return res.status(400).json({ error: 'no receipt to reject' });
  await removeFile('receipt', o.receipt);
  notifyUser(o.tg_id, 'rejected', { ...orderVars(o), note });
  res.json({ ok: true });
});

app.post('/api/admin/orders/:id/cancel', auth, adminOnly, async (req, res) => {
  const o = await getOrder(intId(req.params.id));
  if (!o) return res.status(404).json({ error: 'not found' });
  if (['completed', 'cancelled'].includes(o.status)) return res.status(400).json({ error: `order is already ${o.status}` });
  await db.run("UPDATE bulk_orders SET status = 'cancelled', updated_at = ? WHERE id = ?", Date.now(), o.id);
  notifyUser(o.tg_id, 'cancelled', orderVars(o));
  res.json({ ok: true });
});

// Move several orders forward one step: paid to ordered, ordered to shipped, shipped to arrived, arrived to completed.
app.post('/api/admin/orders/advance', auth, adminOnly, async (req, res) => {
  const status = String(req.body.status || '');
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map(Number).filter(Boolean).slice(0, 300) : [];
  if (!PREVIOUS[status]) return res.status(400).json({ error: 'invalid status' });
  const eta = status === 'shipped' ? String(req.body.eta_text || '').slice(0, 120) : null;
  let updated = 0;
  for (const id of ids) {
    const o = await getOrder(intId(id));
    if (!o) continue;
    const n = await db.run('UPDATE bulk_orders SET status = ?, eta_text = COALESCE(?, eta_text), updated_at = ? WHERE id = ? AND status = ?', status, eta, Date.now(), o.id, PREVIOUS[status]);
    if (!n) continue;
    notifyUser(o.tg_id, status, { ...orderVars(o), eta: eta || o.eta_text || '-' });
    updated++;
  }
  res.json({ updated, skipped: ids.length - updated });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'server error' });
});

// ---------- bot ----------
async function startBot() {
  if (!bot) { console.log('BOT_TOKEN not set: running without Telegram login or notifications'); return; }
  const https = WEBAPP_URL.startsWith('https://');
  bot.command('start', (ctx) => {
    const text =
      'Gebeya Go is where businesses and new business owners buy imported goods in bulk at supplier prices. Tap the button to see the products and their minimum order quantities.\n\n' +
      'ገበያ ጎ ነጋዴዎች እና አዲስ ንግድ የሚጀምሩ ሰዎች ከውጭ የሚገቡ ዕቃዎችን በጅምላ በአቅራቢ ዋጋ የሚገዙበት ነው። ምርቶችን እና ዝቅተኛ የትዕዛዝ መጠኖችን ለማየት ቁልፉን ይጫኑ።';
    if (https) return ctx.reply(text, { reply_markup: new InlineKeyboard().webApp('Open Gebeya Go', WEBAPP_URL) });
    return ctx.reply(text);
  });
  bot.catch((e) => console.error('bot error:', e.message));
  if (https) bot.api.setChatMenuButton({ menu_button: { type: 'web_app', text: 'Gebeya Go', web_app: { url: WEBAPP_URL } } }).catch((e) => console.warn('menu button not set:', e.message));
  if (BOT_MODE === 'webhook') {
    if (!https) { console.error('Webhook mode needs WEBAPP_URL to be an https address.'); return; }
    try {
      if (!botInfo) await bot.init();
      await bot.api.setWebhook(`${WEBAPP_URL.replace(/\/+$/, '')}/tg/${TG_SECRET}`, { secret_token: TG_SECRET, allowed_updates: ['message'] });
      console.log(`bot @${bot.botInfo.username} running (webhook)`);
    } catch (e) { console.error('bot webhook setup failed:', e.message); }
  } else {
    try { await bot.api.deleteWebhook(); } catch (e) { /* ignore */ }
    bot.start({ onStart: (me) => console.log(`bot @${me.username} running (polling)`) }).catch((e) => console.error('bot failed to start:', e.message));
  }
}

async function start() {
  db = await connect();
  await expireUnpaid().catch((e) => console.error('expiry check failed:', e.message));
  setInterval(() => maybeExpire(), EXPIRY_CHECK_MS).unref();
  app.listen(PORT, () => console.log(`Gebeya Go server on port ${PORT}${DEV_MODE ? ' (dev mode)' : ''}`));
  await startBot();
}
start().catch((e) => { console.error('Could not start:', e.message); process.exit(1); });
