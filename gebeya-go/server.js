const express = require('express');
const Database = require('better-sqlite3');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { Bot, InlineKeyboard } = require('grammy');

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN || '';
const BOT_USERNAME = process.env.BOT_USERNAME || '';
const WEBAPP_URL = process.env.WEBAPP_URL || '';
const ADMIN_IDS = (process.env.ADMIN_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
const DEV_MODE = process.env.DEV_MODE === '1';
const PAY_DAYS = Number(process.env.PAY_DAYS || 3);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const RECEIPT_DIR = path.join(DATA_DIR, 'receipts');
const IMAGE_DIR = path.join(DATA_DIR, 'images');

fs.mkdirSync(RECEIPT_DIR, { recursive: true });
fs.mkdirSync(IMAGE_DIR, { recursive: true });

// ---------- database ----------
const db = new Database(path.join(DATA_DIR, 'gebeya.db'));
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  tg_id TEXT PRIMARY KEY,
  name TEXT,
  username TEXT,
  phone TEXT,
  business_name TEXT,
  lang TEXT DEFAULT 'en',
  created_at INTEGER
);
CREATE TABLE IF NOT EXISTS deals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  origin TEXT,
  unit TEXT,
  image TEXT,
  moq INTEGER NOT NULL,
  max_per_buyer INTEGER DEFAULT 0,
  tiers TEXT NOT NULL,
  deadline INTEGER NOT NULL,
  eta_text TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  locked_price REAL,
  pay_by INTEGER,
  created_at INTEGER
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL,
  tg_id TEXT NOT NULL,
  qty INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'joined',
  receipt TEXT,
  reject_note TEXT,
  created_at INTEGER,
  updated_at INTEGER,
  UNIQUE(deal_id, tg_id)
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
`);

const getSetting = (key, fallback = '') => {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : fallback;
};
const setSetting = (key, value) =>
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value);

// ---------- messages sent through the bot ----------
const MSG = {
  locked: {
    en: 'Group "{title}" reached its minimum and is now locked. Final price: {price} ETB per {unit}. Your total: {total} ETB. Please pay and upload your receipt by {pay_by}.',
    am: '"{title}" የቡድን ግዢ ዝቅተኛውን ብዛት አሟልቷል። የመጨረሻ ዋጋ፡ በ{unit} {price} ብር። ጠቅላላ ክፍያዎ፡ {total} ብር። እባክዎ እስከ {pay_by} ድረስ ከፍለው ደረሰኝ ይጫኑ።',
  },
  paid: {
    en: 'Payment confirmed for "{title}". Thank you.',
    am: 'ለ"{title}" ክፍያዎ ተረጋግጧል። እናመሰግናለን።',
  },
  rejected: {
    en: 'Your receipt for "{title}" could not be confirmed. {note} Please upload it again.',
    am: 'ለ"{title}" የላኩት ደረሰኝ ሊረጋገጥ አልቻለም። {note} እባክዎ እንደገና ይጫኑ።',
  },
  ordered: {
    en: 'The order for "{title}" has been placed with the supplier.',
    am: 'የ"{title}" ትዕዛዝ ለአቅራቢው ተሰጥቷል።',
  },
  shipped: {
    en: '"{title}" has shipped. Expected arrival: {eta}.',
    am: '"{title}" ተልኳል። የሚደርስበት ጊዜ፡ {eta}።',
  },
  arrived: {
    en: '"{title}" has arrived. We will contact you about pickup or delivery.',
    am: '"{title}" ደርሷል። ስለ ርክክብ እናነጋግርዎታለን።',
  },
  cancelled: {
    en: 'The group "{title}" was cancelled. If you already paid, we will contact you about a refund.',
    am: '"{title}" የቡድን ግዢ ተሰርዟል። ቀድመው ከከፈሉ፣ ስለ ገንዘብ ተመላሽ እናነጋግርዎታለን።',
  },
};

const fmt = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => (vars[k] === undefined ? '' : vars[k]));
const money = (n) => (Math.round(n * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 });
const dateStr = (ms) => new Date(ms + 3 * 3600 * 1000).toISOString().slice(0, 16).replace('T', ' ');

let bot = null;
async function notifyUser(tgId, key, vars) {
  if (!bot) return;
  const user = db.prepare('SELECT lang FROM users WHERE tg_id = ?').get(tgId);
  const lang = user && user.lang === 'am' ? 'am' : 'en';
  try {
    await bot.api.sendMessage(tgId, fmt(MSG[key][lang], vars));
  } catch (err) {
    console.warn('notify failed for', tgId, err.description || err.message);
  }
}

// ---------- pricing helpers ----------
const round2 = (n) => Math.round(n * 100) / 100;

function currentPrice(tiers, total) {
  let price = tiers[0].price;
  for (const t of tiers) if (total >= t.min_qty) price = t.price;
  return price;
}

function aggregate(dealId) {
  return db
    .prepare("SELECT COALESCE(SUM(qty), 0) AS total, COUNT(*) AS buyers FROM orders WHERE deal_id = ? AND status != 'cancelled'")
    .get(dealId);
}

function serializeOrder(o, deal, stats) {
  const tiers = JSON.parse(deal.tiers);
  const unitPrice = deal.locked_price != null ? deal.locked_price : currentPrice(tiers, stats.total);
  return {
    id: o.id,
    deal_id: o.deal_id,
    qty: o.qty,
    status: o.status,
    has_receipt: !!o.receipt,
    reject_note: o.reject_note,
    unit_price: unitPrice,
    total: round2(unitPrice * o.qty),
    price_is_final: deal.locked_price != null,
  };
}

function serializeDeal(d, tgId) {
  const tiers = JSON.parse(d.tiers);
  const stats = aggregate(d.id);
  const price = d.locked_price != null ? d.locked_price : currentPrice(tiers, stats.total);
  const next = d.locked_price != null ? null : tiers.find((t) => t.min_qty > stats.total) || null;
  let my = null;
  if (tgId) {
    const o = db.prepare('SELECT * FROM orders WHERE deal_id = ? AND tg_id = ?').get(d.id, tgId);
    if (o && o.status !== 'cancelled') my = serializeOrder(o, d, stats);
  }
  return {
    id: d.id,
    title: d.title,
    description: d.description,
    origin: d.origin,
    unit: d.unit,
    image: d.image ? `/images/${d.image}` : null,
    moq: d.moq,
    max_per_buyer: d.max_per_buyer,
    tiers,
    deadline: d.deadline,
    eta_text: d.eta_text,
    status: d.status,
    locked_price: d.locked_price,
    pay_by: d.pay_by,
    total_qty: stats.total,
    buyers: stats.buyers,
    current_price: price,
    next_tier: next,
    my_order: my,
  };
}

// ---------- deal lifecycle ----------
const TRANSITIONS = {
  open: ['locked', 'cancelled'],
  locked: ['ordered', 'cancelled'],
  ordered: ['shipped'],
  shipped: ['arrived'],
  arrived: ['closed'],
};

function participants(dealId) {
  return db.prepare("SELECT * FROM orders WHERE deal_id = ? AND status != 'cancelled'").all(dealId);
}

function lockDeal(deal) {
  const tiers = JSON.parse(deal.tiers);
  const stats = aggregate(deal.id);
  const price = currentPrice(tiers, stats.total);
  const payBy = Date.now() + PAY_DAYS * 86400000;
  db.transaction(() => {
    db.prepare("UPDATE deals SET status = 'locked', locked_price = ?, pay_by = ? WHERE id = ?").run(price, payBy, deal.id);
    db.prepare("UPDATE orders SET status = 'awaiting_payment', updated_at = ? WHERE deal_id = ? AND status = 'joined'").run(Date.now(), deal.id);
  })();
  for (const o of participants(deal.id)) {
    notifyUser(o.tg_id, 'locked', {
      title: deal.title,
      unit: deal.unit,
      price: money(price),
      total: money(price * o.qty),
      pay_by: dateStr(payBy),
    });
  }
}

function cancelDeal(deal) {
  const people = participants(deal.id);
  db.transaction(() => {
    db.prepare("UPDATE deals SET status = 'cancelled' WHERE id = ?").run(deal.id);
    db.prepare("UPDATE orders SET status = 'cancelled', updated_at = ? WHERE deal_id = ? AND status IN ('joined')").run(Date.now(), deal.id);
  })();
  for (const o of people) notifyUser(o.tg_id, 'cancelled', { title: deal.title });
}

function moveDeal(deal, status) {
  if (status === 'locked') return lockDeal(deal);
  if (status === 'cancelled') return cancelDeal(deal);
  db.prepare('UPDATE deals SET status = ? WHERE id = ?').run(status, deal.id);
  const key = { ordered: 'ordered', shipped: 'shipped', arrived: 'arrived' }[status];
  if (key) {
    for (const o of participants(deal.id)) {
      if (['paid', 'receipt_uploaded', 'awaiting_payment'].includes(o.status)) {
        notifyUser(o.tg_id, key, { title: deal.title, eta: deal.eta_text || '-' });
      }
    }
  }
}

// Runs every minute: lock deals that reached the minimum at the deadline, cancel the rest.
function checkDeadlines() {
  const due = db.prepare("SELECT * FROM deals WHERE status = 'open' AND deadline <= ?").all(Date.now());
  for (const d of due) {
    const stats = aggregate(d.id);
    if (stats.total >= d.moq) lockDeal(d);
    else cancelDeal(d);
  }
}
setInterval(() => { try { checkDeadlines(); } catch (e) { console.error(e); } }, 60 * 1000);

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

function auth(req, res, next) {
  let tgUser = validateInitData(req.get('x-init-data'));
  if (!tgUser && DEV_MODE && req.get('x-dev-user')) {
    const id = String(req.get('x-dev-user')).replace(/\D/g, '') || '1';
    tgUser = { id, first_name: `Dev ${id}`, username: `dev${id}`, language_code: 'en' };
  }
  if (!tgUser) return res.status(401).json({ error: 'unauthorized' });
  const id = String(tgUser.id);
  const name = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ');
  const exists = db.prepare('SELECT tg_id FROM users WHERE tg_id = ?').get(id);
  if (!exists) {
    const lang = String(tgUser.language_code || '').startsWith('am') ? 'am' : 'en';
    db.prepare('INSERT INTO users (tg_id, name, username, lang, created_at) VALUES (?, ?, ?, ?, ?)').run(id, name, tgUser.username || null, lang, Date.now());
  } else {
    db.prepare('UPDATE users SET name = ?, username = ? WHERE tg_id = ?').run(name, tgUser.username || null, id);
  }
  req.tgId = id;
  req.user = db.prepare('SELECT * FROM users WHERE tg_id = ?').get(id);
  req.isAdmin = ADMIN_IDS.includes(id) || (DEV_MODE && id === '1');
  next();
}

function adminOnly(req, res, next) {
  if (!req.isAdmin) return res.status(403).json({ error: 'admin only' });
  next();
}

// ---------- uploads ----------
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'application/pdf': '.pdf' };
const makeUpload = (dir, allowPdf) =>
  multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, dir),
      filename: (req, file, cb) => cb(null, crypto.randomBytes(14).toString('hex') + EXT[file.mimetype]),
    }),
    limits: { fileSize: 6 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
      const ok = EXT[file.mimetype] && (allowPdf || file.mimetype !== 'application/pdf');
      cb(ok ? null : new Error('unsupported file type'), !!ok);
    },
  });
const receiptUpload = makeUpload(RECEIPT_DIR, true);
const imageUpload = makeUpload(IMAGE_DIR, false);

const removeFile = (dir, name) => {
  if (!name) return;
  fs.unlink(path.join(dir, path.basename(name)), () => {});
};

// ---------- app ----------
const app = express();
app.use(express.json({ limit: '100kb' }));
app.use('/images', express.static(IMAGE_DIR, { maxAge: '7d' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/config', auth, (req, res) => {
  res.json({
    user: req.user,
    is_admin: req.isAdmin,
    payment_info: getSetting('payment_info', ''),
    bot_username: BOT_USERNAME,
    pay_days: PAY_DAYS,
  });
});

app.put('/api/me', auth, (req, res) => {
  const clean = (v, max) => String(v || '').trim().slice(0, max);
  const phone = clean(req.body.phone, 30);
  const business = clean(req.body.business_name, 80);
  const lang = req.body.lang === 'am' ? 'am' : 'en';
  db.prepare('UPDATE users SET phone = ?, business_name = ?, lang = ? WHERE tg_id = ?').run(phone, business, lang, req.tgId);
  res.json(db.prepare('SELECT * FROM users WHERE tg_id = ?').get(req.tgId));
});

app.get('/api/deals', auth, (req, res) => {
  const rows = db
    .prepare(`SELECT * FROM deals ORDER BY CASE status WHEN 'open' THEN 0 WHEN 'locked' THEN 1 WHEN 'ordered' THEN 1 WHEN 'shipped' THEN 1 WHEN 'arrived' THEN 1 ELSE 2 END, deadline ASC`)
    .all();
  res.json(rows.map((d) => serializeDeal(d, req.tgId)));
});

app.get('/api/deals/:id', auth, (req, res) => {
  const d = db.prepare('SELECT * FROM deals WHERE id = ?').get(req.params.id);
  if (!d) return res.status(404).json({ error: 'not found' });
  res.json(serializeDeal(d, req.tgId));
});

app.post('/api/deals/:id/join', auth, (req, res) => {
  const d = db.prepare('SELECT * FROM deals WHERE id = ?').get(req.params.id);
  if (!d) return res.status(404).json({ error: 'not found' });
  if (d.status !== 'open' || d.deadline <= Date.now()) return res.status(400).json({ error: 'this group is closed' });
  if (!req.user.phone || !req.user.name) return res.status(400).json({ error: 'profile_required' });
  const qty = Math.floor(Number(req.body.qty));
  if (!Number.isFinite(qty) || qty < 1) return res.status(400).json({ error: 'invalid quantity' });
  if (d.max_per_buyer > 0 && qty > d.max_per_buyer) return res.status(400).json({ error: `maximum ${d.max_per_buyer} per buyer` });
  const now = Date.now();
  db.prepare(
    `INSERT INTO orders (deal_id, tg_id, qty, status, created_at, updated_at) VALUES (?, ?, ?, 'joined', ?, ?)
     ON CONFLICT(deal_id, tg_id) DO UPDATE SET qty = excluded.qty, status = 'joined', updated_at = excluded.updated_at`
  ).run(d.id, req.tgId, qty, now, now);
  res.json(serializeDeal(d, req.tgId));
});

app.post('/api/deals/:id/leave', auth, (req, res) => {
  const d = db.prepare('SELECT * FROM deals WHERE id = ?').get(req.params.id);
  if (!d) return res.status(404).json({ error: 'not found' });
  if (d.status !== 'open') return res.status(400).json({ error: 'you can only leave while the group is open' });
  db.prepare("UPDATE orders SET status = 'cancelled', updated_at = ? WHERE deal_id = ? AND tg_id = ?").run(Date.now(), d.id, req.tgId);
  res.json(serializeDeal(d, req.tgId));
});

app.get('/api/my/orders', auth, (req, res) => {
  const rows = db
    .prepare("SELECT o.*, d.title FROM orders o JOIN deals d ON d.id = o.deal_id WHERE o.tg_id = ? AND o.status != 'cancelled' ORDER BY o.updated_at DESC")
    .all(req.tgId);
  res.json(
    rows.map((o) => {
      const d = db.prepare('SELECT * FROM deals WHERE id = ?').get(o.deal_id);
      return { ...serializeOrder(o, d, aggregate(d.id)), title: d.title, deal_status: d.status, unit: d.unit };
    })
  );
});

app.post('/api/orders/:id/receipt', auth, (req, res, next) => {
  receiptUpload.single('receipt')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    const o = db.prepare('SELECT * FROM orders WHERE id = ? AND tg_id = ?').get(req.params.id, req.tgId);
    if (!o || !req.file) {
      if (req.file) removeFile(RECEIPT_DIR, req.file.filename);
      return res.status(404).json({ error: 'order or file not found' });
    }
    if (!['awaiting_payment', 'receipt_uploaded'].includes(o.status)) {
      removeFile(RECEIPT_DIR, req.file.filename);
      return res.status(400).json({ error: 'payment is not open for this order' });
    }
    removeFile(RECEIPT_DIR, o.receipt);
    db.prepare("UPDATE orders SET receipt = ?, status = 'receipt_uploaded', reject_note = NULL, updated_at = ? WHERE id = ?").run(req.file.filename, Date.now(), o.id);
    res.json({ ok: true });
  });
});

app.get('/api/orders/:id/receipt', auth, (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!o || !o.receipt) return res.status(404).end();
  if (o.tg_id !== req.tgId && !req.isAdmin) return res.status(403).end();
  res.sendFile(path.join(RECEIPT_DIR, path.basename(o.receipt)));
});

app.get('/api/settings', auth, (req, res) => res.json({ payment_info: getSetting('payment_info', '') }));

// ---------- admin ----------
app.put('/api/admin/settings', auth, adminOnly, (req, res) => {
  setSetting('payment_info', String(req.body.payment_info || '').slice(0, 1500));
  res.json({ ok: true });
});

app.post('/api/admin/deals', auth, adminOnly, (req, res, next) => {
  imageUpload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    try {
      const b = req.body;
      const title = String(b.title || '').trim().slice(0, 120);
      const moq = Math.floor(Number(b.moq));
      const deadline = Math.floor(Number(b.deadline));
      let tiers = JSON.parse(b.tiers || '[]');
      tiers = tiers
        .map((t) => ({ min_qty: Math.floor(Number(t.min_qty)), price: round2(Number(t.price)) }))
        .filter((t) => t.min_qty >= 1 && t.price > 0)
        .sort((x, y) => x.min_qty - y.min_qty);
      const problems = [];
      if (!title) problems.push('title is required');
      if (!(moq >= 1)) problems.push('minimum quantity must be at least 1');
      if (!(deadline > Date.now())) problems.push('deadline must be in the future');
      if (!tiers.length) problems.push('add at least one price tier');
      for (let i = 1; i < tiers.length; i++) {
        if (tiers[i].price >= tiers[i - 1].price) problems.push('prices must drop as quantity rises');
      }
      if (problems.length) {
        if (req.file) removeFile(IMAGE_DIR, req.file.filename);
        return res.status(400).json({ error: problems.join('; ') });
      }
      tiers[0].min_qty = 1;
      const info = db
        .prepare(
          `INSERT INTO deals (title, description, origin, unit, image, moq, max_per_buyer, tiers, deadline, eta_text, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)`
        )
        .run(
          title,
          String(b.description || '').slice(0, 2000),
          String(b.origin || '').slice(0, 80),
          String(b.unit || 'piece').slice(0, 30),
          req.file ? req.file.filename : null,
          moq,
          Math.max(0, Math.floor(Number(b.max_per_buyer) || 0)),
          JSON.stringify(tiers),
          deadline,
          String(b.eta_text || '').slice(0, 120),
          Date.now()
        );
      res.json(serializeDeal(db.prepare('SELECT * FROM deals WHERE id = ?').get(info.lastInsertRowid), req.tgId));
    } catch (e) {
      if (req.file) removeFile(IMAGE_DIR, req.file.filename);
      res.status(400).json({ error: 'invalid deal data' });
    }
  });
});

app.post('/api/admin/deals/:id/status', auth, adminOnly, (req, res) => {
  const d = db.prepare('SELECT * FROM deals WHERE id = ?').get(req.params.id);
  if (!d) return res.status(404).json({ error: 'not found' });
  const next = String(req.body.status || '');
  if (!(TRANSITIONS[d.status] || []).includes(next)) return res.status(400).json({ error: `cannot move from ${d.status} to ${next}` });
  if (next === 'locked' && aggregate(d.id).total < d.moq && !req.body.force) {
    return res.status(400).json({ error: 'minimum quantity not reached', can_force: true });
  }
  if (req.body.eta_text !== undefined) {
    d.eta_text = String(req.body.eta_text).slice(0, 120);
    db.prepare('UPDATE deals SET eta_text = ? WHERE id = ?').run(d.eta_text, d.id);
  }
  moveDeal(d, next);
  res.json(serializeDeal(db.prepare('SELECT * FROM deals WHERE id = ?').get(d.id), req.tgId));
});

app.get('/api/admin/deals/:id/orders', auth, adminOnly, (req, res) => {
  const rows = db
    .prepare(
      `SELECT o.*, u.name, u.username, u.phone, u.business_name FROM orders o JOIN users u ON u.tg_id = o.tg_id
       WHERE o.deal_id = ? AND o.status != 'cancelled' ORDER BY o.created_at ASC`
    )
    .all(req.params.id);
  const d = db.prepare('SELECT * FROM deals WHERE id = ?').get(req.params.id);
  if (!d) return res.status(404).json({ error: 'not found' });
  const stats = aggregate(d.id);
  res.json(
    rows.map((o) => ({
      ...serializeOrder(o, d, stats),
      name: o.name,
      username: o.username,
      phone: o.phone,
      business_name: o.business_name,
    }))
  );
});

app.post('/api/admin/orders/:id/confirm', auth, adminOnly, (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!o) return res.status(404).json({ error: 'not found' });
  if (!['receipt_uploaded', 'awaiting_payment'].includes(o.status)) return res.status(400).json({ error: 'order is not waiting for payment' });
  db.prepare("UPDATE orders SET status = 'paid', reject_note = NULL, updated_at = ? WHERE id = ?").run(Date.now(), o.id);
  const d = db.prepare('SELECT * FROM deals WHERE id = ?').get(o.deal_id);
  notifyUser(o.tg_id, 'paid', { title: d.title });
  res.json({ ok: true });
});

app.post('/api/admin/orders/:id/reject', auth, adminOnly, (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!o) return res.status(404).json({ error: 'not found' });
  if (o.status !== 'receipt_uploaded') return res.status(400).json({ error: 'no receipt to reject' });
  const note = String(req.body.note || '').slice(0, 200);
  removeFile(RECEIPT_DIR, o.receipt);
  db.prepare("UPDATE orders SET status = 'awaiting_payment', receipt = NULL, reject_note = ?, updated_at = ? WHERE id = ?").run(note, Date.now(), o.id);
  const d = db.prepare('SELECT * FROM deals WHERE id = ?').get(o.deal_id);
  notifyUser(o.tg_id, 'rejected', { title: d.title, note });
  res.json({ ok: true });
});

app.post('/api/admin/orders/:id/cancel', auth, adminOnly, (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!o) return res.status(404).json({ error: 'not found' });
  db.prepare("UPDATE orders SET status = 'cancelled', updated_at = ? WHERE id = ?").run(Date.now(), o.id);
  res.json({ ok: true });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'server error' });
});

// ---------- bot ----------
if (BOT_TOKEN) {
  bot = new Bot(BOT_TOKEN);
  bot.command('start', (ctx) => {
    const text =
      'Gebeya Go lets you join group orders for imported goods and get supplier prices together. Tap the button to see the open groups.\n\n' +
      'ገበያ ጎ በጋራ በመግዛት ከውጭ የሚገቡ ዕቃዎችን በአቅራቢ ዋጋ ለማግኘት ይረዳዎታል። ክፍት ቡድኖችን ለማየት ቁልፉን ይጫኑ።';
    if (WEBAPP_URL.startsWith('https://')) {
      return ctx.reply(text, { reply_markup: new InlineKeyboard().webApp('Open Gebeya Go', WEBAPP_URL) });
    }
    return ctx.reply(text);
  });
  if (WEBAPP_URL.startsWith('https://')) {
    bot.api.setChatMenuButton({ menu_button: { type: 'web_app', text: 'Gebeya Go', web_app: { url: WEBAPP_URL } } }).catch((e) => console.warn('menu button not set:', e.message));
  }
  bot.start({ onStart: (me) => console.log(`bot @${me.username} running`) }).catch((e) => console.error('bot failed to start:', e.message));
} else {
  console.log('BOT_TOKEN not set: running without Telegram login or notifications');
}

app.listen(PORT, () => console.log(`Gebeya Go server on port ${PORT}${DEV_MODE ? ' (dev mode)' : ''}`));
