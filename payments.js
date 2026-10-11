// Online payments through Verify Checkout (hosted deposits).
// Turned on only when VERIFY_API_KEY is set. Manual receipt upload keeps working either way.
//
// Flow: the server creates a deposit for an order, the buyer pays on the hosted page,
// and the order is marked paid only after the server reads the deposit back from the
// Verify Checkout API and finds status "succeeded" with the right amount.
// A webhook (signed) and a background check both lead to the same reconcile() step,
// so an order can never be marked paid twice.

const crypto = require('crypto');
const express = require('express');

const API_BASE = (process.env.VERIFY_API_BASE || 'https://checkoutapi.verify.et').replace(/\/+$/, '');
const API_KEY = process.env.VERIFY_API_KEY || '';
const WEBHOOK_SECRET = process.env.VERIFY_WEBHOOK_SECRET || '';
const API_VERSION = '2026-06-01';
const FINAL = new Set(['succeeded', 'failed', 'expired', 'cancelled']);
const OPEN_ORDER = ['awaiting_payment', 'receipt_uploaded'];

function createPayments({ db, notifyUser, notifyAdmins, orderVars, webappUrl, botUsername }) {
  const enabled = Boolean(API_KEY);

  db.exec(`
  CREATE TABLE IF NOT EXISTS payment_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    idem_key TEXT NOT NULL UNIQUE,
    deposit_id TEXT,
    checkout_url TEXT,
    status TEXT NOT NULL DEFAULT 'creating',
    amount TEXT,
    note TEXT,
    fulfilled INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    expires_at INTEGER,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_attempts_order ON payment_attempts(order_id);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_attempts_deposit ON payment_attempts(deposit_id) WHERE deposit_id IS NOT NULL;
  CREATE TABLE IF NOT EXISTS verify_events (
    event_id TEXT PRIMARY KEY,
    type TEXT,
    received_at INTEGER NOT NULL
  );
  `);

  // ---------- API client ----------
  async function call(method, path, { body, idemKey } = {}) {
    const headers = { Authorization: `Bearer ${API_KEY}`, 'VerifyCheckout-Version': API_VERSION, Accept: 'application/json' };
    if (body) headers['Content-Type'] = 'application/json';
    if (idemKey) headers['Idempotency-Key'] = idemKey;
    const r = await fetch(API_BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) });
    let data = {};
    try { data = await r.json(); } catch (e) { /* empty body */ }
    if (!r.ok) {
      const err = new Error((data.error && data.error.code) || `verify_http_${r.status}`);
      err.status = r.status;
      err.retryable = Boolean(data.error && data.error.retryable);
      throw err;
    }
    return data.data;
  }

  const fmt = (n) => Number(n).toFixed(2);
  const sameAmount = (a, b) => Math.abs(Number(a) - Number(b)) < 0.005;

  // ---------- reconcile ----------
  // The one place where an order becomes paid. Safe to call any number of times.
  function applyDeposit(attempt, dep) {
    const prev = attempt.status;
    const status = dep.status || prev;
    db.prepare('UPDATE payment_attempts SET status = ?, updated_at = ? WHERE id = ?').run(status, Date.now(), attempt.id);

    if (status === 'review_required' && prev !== 'review_required') {
      notifyAdmins(`Online payment for order #${attempt.order_id} needs a manual check at Verify Checkout (deposit ${dep.id}).`);
    }
    if (status !== 'succeeded') return;

    const order = db.prepare('SELECT * FROM bulk_orders WHERE id = ?').get(attempt.order_id);
    if (!order) return;
    const good = dep.currency === 'ETB' && sameAmount(dep.amount, order.total);

    const tx = db.transaction(() => {
      const claim = db.prepare('UPDATE payment_attempts SET fulfilled = 1, updated_at = ? WHERE id = ? AND fulfilled = 0').run(Date.now(), attempt.id);
      if (claim.changes !== 1) return 'done';
      if (!good) {
        db.prepare('UPDATE payment_attempts SET note = ? WHERE id = ?').run(`amount_mismatch: paid ${dep.amount} ${dep.currency}, order total ${fmt(order.total)}`, attempt.id);
        return 'mismatch';
      }
      if (OPEN_ORDER.includes(order.status)) {
        db.prepare("UPDATE bulk_orders SET status = 'paid', reject_note = NULL, updated_at = ? WHERE id = ?").run(Date.now(), order.id);
        db.prepare("UPDATE payment_attempts SET note = 'paid online' WHERE id = ?").run(attempt.id);
        return 'paid';
      }
      db.prepare('UPDATE payment_attempts SET note = ? WHERE id = ?').run(`paid while order was ${order.status}`, attempt.id);
      return 'odd';
    });
    const result = tx();

    if (result === 'paid') notifyUser(order.tg_id, 'paid', orderVars({ ...order, status: 'paid' }));
    else if (result === 'mismatch') notifyAdmins(`Online payment for order #${order.id} does not match the order: paid ${dep.amount} ${dep.currency}, expected ${fmt(order.total)} ETB. The order was not marked paid. Check it in Verify Checkout (deposit ${dep.id}).`);
    else if (result === 'odd') notifyAdmins(`Online payment received for order #${order.id}, but the order is already ${order.status}. Check for a double payment or a refund (deposit ${dep.id}).`);
  }

  async function reconcileDeposit(depositId) {
    const attempt = db.prepare('SELECT * FROM payment_attempts WHERE deposit_id = ?').get(depositId);
    if (!attempt) return null;
    const dep = await call('GET', `/v1/deposits/${encodeURIComponent(depositId)}`);
    applyDeposit(attempt, dep);
    return db.prepare('SELECT * FROM payment_attempts WHERE id = ?').get(attempt.id);
  }

  // Background check, in case a webhook never arrives.
  async function sweep() {
    if (!enabled) return;
    const rows = db.prepare(`SELECT deposit_id FROM payment_attempts
      WHERE deposit_id IS NOT NULL AND created_at > ? AND (status NOT IN ('succeeded','failed','expired','cancelled') OR (status = 'succeeded' AND fulfilled = 0))`).all(Date.now() - 6 * 3600 * 1000);
    for (const r of rows) {
      try { await reconcileDeposit(r.deposit_id); } catch (e) { console.error('verify sweep:', e.message); }
    }
  }
  function startSweeper(ms = 120000) {
    if (!enabled) return;
    setInterval(() => sweep().catch(() => {}), ms).unref();
  }

  // ---------- webhook (needs the raw body, mounted before express.json) ----------
  function verifySignature(raw, timestamp, header) {
    if (!WEBHOOK_SECRET || !timestamp || !header) return false;
    if (!/^\d{10,13}$/.test(timestamp)) return false;
    const ts = timestamp.length > 10 ? Number(timestamp) / 1000 : Number(timestamp);
    if (Math.abs(Date.now() / 1000 - ts) > 300) return false;
    const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(`${timestamp}.`).update(raw).digest();
    return String(header).split(',').some((part) => {
      const m = /^\s*v1=([0-9a-f]{64})\s*$/i.exec(part);
      return m ? crypto.timingSafeEqual(Buffer.from(m[1], 'hex'), expected) : false;
    });
  }

  function mountWebhook(app) {
    // Always answer, so the dashboard can save the endpoint before the secret exists.
    // Until VERIFY_WEBHOOK_SECRET is set, messages are acknowledged and ignored.
    app.post('/api/verify/webhook', express.raw({ type: '*/*', limit: '256kb' }), (req, res) => {
      if (!enabled || !WEBHOOK_SECRET) return res.json({ ok: true, configured: false });
      const raw = req.body;
      if (!Buffer.isBuffer(raw) || !/application\/json/i.test(req.get('content-type') || '')) return res.status(400).json({ error: 'bad request' });
      if (!verifySignature(raw, req.get('VerifyCheckout-Timestamp'), req.get('VerifyCheckout-Signature'))) return res.status(401).json({ error: 'bad signature' });
      let evt;
      try { evt = JSON.parse(raw.toString('utf8')); } catch (e) { return res.status(400).json({ error: 'bad json' }); }
      const eventId = req.get('VerifyCheckout-Event-Id') || evt.id;
      if (!eventId) return res.status(400).json({ error: 'no event id' });
      const type = String(evt.type || req.get('VerifyCheckout-Event') || '');
      const ins = db.prepare('INSERT OR IGNORE INTO verify_events (event_id, type, received_at) VALUES (?, ?, ?)').run(String(eventId), type, Date.now());
      res.json({ ok: true });
      if (ins.changes === 0 || !type.startsWith('deposit.')) return;
      const depositId = evt.data && evt.data.object && evt.data.object.id;
      if (depositId) reconcileDeposit(String(depositId)).catch((e) => console.error('verify webhook reconcile:', e.message));
    });
  }

  // ---------- buyer routes ----------
  function mountApi(app, auth) {
    app.post('/api/orders/:id/pay', auth, async (req, res) => {
      if (!enabled) return res.status(404).json({ error: 'online payment is not available' });
      const o = db.prepare('SELECT * FROM bulk_orders WHERE id = ? AND tg_id = ?').get(req.params.id, req.tgId);
      if (!o) return res.status(404).json({ error: 'order not found' });
      if (!OPEN_ORDER.includes(o.status)) return res.status(400).json({ error: 'payment is not open for this order' });

      // reuse a checkout link that is still valid
      const live = db.prepare("SELECT * FROM payment_attempts WHERE order_id = ? AND checkout_url IS NOT NULL AND status NOT IN ('succeeded','failed','expired','cancelled') AND expires_at > ? ORDER BY id DESC LIMIT 1").get(o.id, Date.now() + 120000);
      if (live) return res.json({ checkout_url: live.checkout_url });

      const n = db.prepare('SELECT COUNT(*) AS c FROM payment_attempts WHERE order_id = ?').get(o.id).c;
      if (n >= 8) return res.status(429).json({ error: 'too many payment attempts for this order' });
      const idemKey = `gebeya-order-${o.id}-${n + 1}`;
      const now = Date.now();
      const row = db.prepare('INSERT INTO payment_attempts (order_id, idem_key, amount, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(o.id, idemKey, fmt(o.total), now, now);
      try {
        const returnUrl = `${webappUrl.replace(/\/+$/, '')}/return.html?order=${o.id}${botUsername ? `&bot=${encodeURIComponent(botUsername)}` : ''}`;
        const dep = await call('POST', '/v1/deposits', {
          idemKey,
          body: { merchant_customer_id: String(req.tgId), return_url: returnUrl, amount: fmt(o.total), currency: 'ETB' },
        });
        if (!dep || !dep.checkout_url) throw new Error('no checkout url');
        db.prepare('UPDATE payment_attempts SET deposit_id = ?, checkout_url = ?, status = ?, expires_at = ?, updated_at = ? WHERE id = ?')
          .run(dep.id, dep.checkout_url, dep.status || 'created', dep.expires_at ? Date.parse(dep.expires_at) : now + 55 * 60000, Date.now(), row.lastInsertRowid);
        res.json({ checkout_url: dep.checkout_url });
      } catch (e) {
        db.prepare("UPDATE payment_attempts SET status = 'failed', note = ?, updated_at = ? WHERE id = ?").run(`create failed: ${e.message}`, Date.now(), row.lastInsertRowid);
        console.error('verify create deposit:', e.message);
        res.status(502).json({ error: 'Online payment is not available right now. Pay by transfer and upload the receipt.' });
      }
    });

    app.get('/api/orders/:id/pay-status', auth, async (req, res) => {
      const o = db.prepare('SELECT * FROM bulk_orders WHERE id = ? AND tg_id = ?').get(req.params.id, req.tgId);
      if (!o) return res.status(404).json({ error: 'order not found' });
      if (enabled) {
        const a = db.prepare("SELECT * FROM payment_attempts WHERE order_id = ? AND deposit_id IS NOT NULL AND status NOT IN ('failed','expired','cancelled') ORDER BY id DESC LIMIT 1").get(o.id);
        if (a && (!FINAL.has(a.status) || (a.status === 'succeeded' && !a.fulfilled))) {
          try { await reconcileDeposit(a.deposit_id); } catch (e) { /* the sweeper will retry */ }
        }
      }
      const fresh = db.prepare('SELECT status FROM bulk_orders WHERE id = ?').get(o.id);
      res.json({ order_status: fresh.status });
    });
  }

  return { enabled, hasWebhook: enabled && Boolean(WEBHOOK_SECRET), mountWebhook, mountApi, startSweeper, _test: { verifySignature, reconcileDeposit, sweep } };
}

module.exports = { createPayments };
