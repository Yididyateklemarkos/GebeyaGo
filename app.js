(() => {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg) { tg.ready(); tg.expand(); }
  const params = new URLSearchParams(location.search);
  const devUser = params.get('dev');

  // ---------- text ----------
  const T = {
    en: {
      tab_products: 'Products', tab_orders: 'My orders', tab_profile: 'Profile', tab_admin: 'Admin',
      intro: 'Buy imported goods in bulk at supplier prices.',
      no_products: 'No products yet. Check back soon.',
      min_order: 'Minimum order: {n} {unit}', per: 'per {unit}',
      down_to: 'Down to {price} for larger orders', lead_time: 'Delivery time', origin: 'Origin',
      tiers_title: 'Price by order size', units_plus: '{n}+ {unit}', tap_tier: 'Tap a row to set that quantity.',
      moq_note: 'You must order at least {n} {unit}. The more you order, the lower the price per {unit}.',
      quantity: 'Quantity', max_qty_note: 'Maximum per order: {n}', price_each: 'Price per {unit}', total: 'Total',
      next_tier_hint: 'Order {n} more to pay {price} per {unit}.',
      delivery_note: 'Note for us (optional)', note_placeholder: 'Delivery city, special requests',
      place_order: 'Place order',
      price_locked_note: 'Your price is fixed when you place the order. You then pay by bank or mobile money transfer and upload the receipt.',
      profile_needed: 'Add your phone number and business name first, so we can reach you about delivery.',
      order_n: 'Order #{id}', order_placed: 'Order placed',
      st_payment: 'Payment', st_paid: 'Paid', st_ordered: 'Ordered', st_shipped: 'Shipped', st_arrived: 'Arrived', st_completed: 'Done',
      s_awaiting_payment: 'Waiting for your payment', s_receipt_uploaded: 'Receipt sent, waiting for confirmation',
      s_paid: 'Paid', s_ordered: 'Ordered from the supplier', s_shipped: 'On the way', s_arrived: 'Arrived',
      s_completed: 'Completed', s_cancelled: 'Cancelled',
      amount_due: 'Amount to pay', pay_by: 'Pay by {d} or the order is cancelled',
      how_to_pay: 'How to pay', payment_missing: 'The organizer will send payment details in Telegram.',
      upload_receipt: 'Upload payment receipt', replace_receipt: 'Replace receipt',
      receipt_hint: 'Send a clear photo or PDF of your transfer receipt.',
      rejected_note: 'Receipt not accepted. {note}', eta: 'Expected arrival',
      cancel_order: 'Cancel order', confirm_cancel: 'Cancel this order?', cancelled_ok: 'Order cancelled',
      orders_empty: 'You have no orders yet.', back: 'Back', share: 'Share this product',
      profile_title: 'Your details', name: 'Name', phone: 'Phone number',
      business: 'Business name (or planned business)', language: 'Language',
      save: 'Save', saved: 'Saved', uploaded: 'Receipt uploaded',
      loading: 'Loading', error: 'Something went wrong. Try again.', yes: 'Yes', no: 'No',
    },
    am: {
      tab_products: 'ምርቶች', tab_orders: 'ትዕዛዞቼ', tab_profile: 'መገለጫ', tab_admin: 'አስተዳዳሪ',
      intro: 'ከውጭ የሚገቡ ዕቃዎችን በጅምላ በአቅራቢ ዋጋ ይግዙ።',
      no_products: 'እስካሁን ምርት የለም። በቅርቡ ይመለሱ።',
      min_order: 'ዝቅተኛ ትዕዛዝ፡ {n} {unit}', per: 'በ{unit}',
      down_to: 'ለትልቅ ትዕዛዝ እስከ {price} ዝቅ ይላል', lead_time: 'የማድረሻ ጊዜ', origin: 'ምንጭ',
      tiers_title: 'በትዕዛዝ መጠን ዋጋ', units_plus: '{n}+ {unit}', tap_tier: 'ያንን መጠን ለመምረጥ ረድፉን ይጫኑ።',
      moq_note: 'ቢያንስ {n} {unit} ማዘዝ አለብዎት። ብዙ ሲያዝዙ የአንዱ {unit} ዋጋ ይቀንሳል።',
      quantity: 'ብዛት', max_qty_note: 'ለአንድ ትዕዛዝ ከፍተኛ፡ {n}', price_each: 'የአንዱ {unit} ዋጋ', total: 'ጠቅላላ',
      next_tier_hint: '{n} ተጨማሪ ካዘዙ የአንዱ {unit} ዋጋ {price} ይሆናል።',
      delivery_note: 'ለእኛ መልዕክት (አማራጭ)', note_placeholder: 'የሚደርስበት ከተማ፣ ልዩ ጥያቄዎች',
      place_order: 'ትዕዛዝ ላክ',
      price_locked_note: 'ትዕዛዝ ሲያስገቡ ዋጋዎ ይቆለፋል። ከዚያ በባንክ ወይም በሞባይል ገንዘብ ከፍለው ደረሰኙን ይጭናሉ።',
      profile_needed: 'ስለ ርክክብ ለማግኘት መጀመሪያ ስልክ ቁጥርዎን እና የንግድ ስምዎን ያስገቡ።',
      order_n: 'ትዕዛዝ #{id}', order_placed: 'ትዕዛዝ ተልኳል',
      st_payment: 'ክፍያ', st_paid: 'ተከፍሏል', st_ordered: 'ታዟል', st_shipped: 'ተልኳል', st_arrived: 'ደርሷል', st_completed: 'ተጠናቋል',
      s_awaiting_payment: 'ክፍያዎን እየጠበቅን ነው', s_receipt_uploaded: 'ደረሰኝ ተልኳል፣ ማረጋገጫ ይጠብቁ',
      s_paid: 'ተከፍሏል', s_ordered: 'ለአቅራቢው ታዟል', s_shipped: 'በመንገድ ላይ', s_arrived: 'ደርሷል',
      s_completed: 'ተጠናቋል', s_cancelled: 'ተሰርዟል',
      amount_due: 'የሚከፈል መጠን', pay_by: 'እስከ {d} ይክፈሉ፣ ካልሆነ ትዕዛዙ ይሰረዛል',
      how_to_pay: 'እንዴት እንደሚከፍሉ', payment_missing: 'አስተባባሪው የክፍያ መረጃ በቴሌግራም ይልካል።',
      upload_receipt: 'የክፍያ ደረሰኝ ጫን', replace_receipt: 'ደረሰኝ ቀይር',
      receipt_hint: 'የገንዘብ ማስተላለፊያ ደረሰኝዎን ግልጽ ፎቶ ወይም PDF ይላኩ።',
      rejected_note: 'ደረሰኝ አልተቀበለም። {note}', eta: 'የሚደርስበት ጊዜ',
      cancel_order: 'ትዕዛዝ ሰርዝ', confirm_cancel: 'ይህን ትዕዛዝ ይሰርዙ?', cancelled_ok: 'ትዕዛዝ ተሰርዟል',
      orders_empty: 'እስካሁን ምንም ትዕዛዝ የለም።', back: 'ተመለስ', share: 'ይህን ምርት አጋራ',
      profile_title: 'የእርስዎ መረጃ', name: 'ስም', phone: 'ስልክ ቁጥር',
      business: 'የንግድ ስም (ወይም የታቀደ ንግድ)', language: 'ቋንቋ',
      save: 'አስቀምጥ', saved: 'ተቀምጧል', uploaded: 'ደረሰኝ ተጭኗል',
      loading: 'በመጫን ላይ', error: 'ችግር ተፈጥሯል። እንደገና ይሞክሩ።', yes: 'አዎ', no: 'አይ',
    },
  };

  const S = {
    tab: 'products', products: [], orders: [], cfg: null, lang: 'en', loaded: false,
    view: null, qty: 1,
    aTab: 'orders', aProducts: [], aOrders: [], aFilter: { status: 'active', product: '' }, form: null,
  };

  const t = (k, v = {}) => {
    const s = (T[S.lang] && T[S.lang][k]) || T.en[k] || k;
    return s.replace(/\{(\w+)\}/g, (_, x) => (v[x] === undefined ? '' : v[x]));
  };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' ETB';
  const $ = (id) => document.getElementById(id);
  const dateStr = (ms) => new Date(ms).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

  // ---------- api ----------
  function authHeaders() {
    const h = {};
    if (tg && tg.initData) h['x-init-data'] = tg.initData;
    else if (devUser) h['x-dev-user'] = devUser;
    return h;
  }
  async function api(path, { method = 'GET', body, form } = {}) {
    const headers = authHeaders();
    let payload;
    if (form) payload = form;
    else if (body) { headers['content-type'] = 'application/json'; payload = JSON.stringify(body); }
    const r = await fetch(path, { method, headers, body: payload });
    if (!r.ok) {
      let data = {};
      try { data = await r.json(); } catch (e) { /* no body */ }
      const err = new Error(data.error || 'request failed');
      err.data = data;
      throw err;
    }
    return r.json();
  }
  async function fetchBlob(path) {
    const r = await fetch(path, { headers: authHeaders() });
    if (!r.ok) throw new Error('could not load file');
    return r.blob();
  }

  // ---------- small ui helpers ----------
  let toastTimer;
  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2800);
  }
  function modal(html) {
    const m = $('modal');
    m.innerHTML = `<div class="box">${html}</div>`;
    m.hidden = false;
    m.onclick = (e) => { if (e.target === m) closeModal(); };
  }
  function closeModal() { $('modal').hidden = true; $('modal').innerHTML = ''; }

  function ask({ title, text, input, okLabel = 'OK', cancelLabel = 'Cancel', danger = false }) {
    return new Promise((resolve) => {
      modal(`
        <div class="title">${esc(title)}</div>
        ${text ? `<p class="muted">${esc(text)}</p>` : ''}
        ${input ? `<input id="askInput" placeholder="${esc(input)}">` : ''}
        <div class="btns">
          <button class="btn ${danger ? 'danger' : ''}" id="askOk">${esc(okLabel)}</button>
          <button class="btn alt" id="askNo">${esc(cancelLabel)}</button>
        </div>`);
      $('askOk').onclick = () => { const v = input ? $('askInput').value.trim() : true; closeModal(); resolve(v === '' ? true : v); };
      $('askNo').onclick = () => { closeModal(); resolve(false); };
    });
  }

  const fail = (e) => {
    if (e.message === 'profile_required') { toast(t('profile_needed')); S.tab = 'profile'; S.view = null; render(); return; }
    toast(e.message && e.message !== 'request failed' ? e.message : t('error'));
  };

  // ---------- data ----------
  async function loadAll() {
    const [cfg, products, orders] = await Promise.all([api('/api/config'), api('/api/products'), api('/api/my/orders')]);
    S.cfg = cfg; S.products = products; S.orders = orders; S.lang = cfg.user.lang === 'am' ? 'am' : 'en'; S.loaded = true;
  }
  async function refreshOrders() { S.orders = await api('/api/my/orders'); }
  async function loadAdmin() {
    const q = new URLSearchParams({ status: S.aFilter.status });
    if (S.aFilter.product) q.set('product_id', S.aFilter.product);
    const [aProducts, aOrders] = await Promise.all([api('/api/admin/products'), api('/api/admin/orders?' + q)]);
    S.aProducts = aProducts; S.aOrders = aOrders;
  }

  // ---------- buyer views ----------
  const STEP_KEYS = ['payment', 'paid', 'ordered', 'shipped', 'arrived', 'completed'];
  const STEP_INDEX = { awaiting_payment: 0, receipt_uploaded: 0, paid: 1, ordered: 2, shipped: 3, arrived: 4, completed: 5 };

  function stepsHtml(status) {
    if (status === 'cancelled') return `<span class="badge red">${t('s_cancelled')}</span>`;
    const idx = STEP_INDEX[status];
    return `<div class="steps">${STEP_KEYS.map((k, i) => `<span class="${i < idx ? 'done' : i === idx ? 'now' : ''}">${t('st_' + k)}</span>`).join('')}</div>`;
  }
  const statusBadge = (s) => `<span class="badge ${s === 'paid' || s === 'completed' ? 'green' : s === 'cancelled' ? 'red' : s === 'awaiting_payment' ? 'amber' : ''}">${t('s_' + s)}</span>`;

  function cover(p) {
    return p.image ? `<img class="cover" src="${esc(p.image)}" alt="">` : `<div class="cover ph">${esc((p.title || '?').trim().charAt(0).toUpperCase())}</div>`;
  }

  function productCard(p) {
    return `
      <div class="card tap" data-act="openProduct" data-id="${p.id}">
        ${cover(p)}
        <div class="pad">
          <div class="title">${esc(p.title)}</div>
          ${p.origin ? `<div class="muted">${esc(p.origin)}</div>` : ''}
          <div class="row" style="margin-top:6px">
            <div class="price">${money(p.base_price)} <small>${t('per', { unit: esc(p.unit) })}</small></div>
            <span class="badge">${t('min_order', { n: p.moq, unit: esc(p.unit) })}</span>
          </div>
          ${p.best_price < p.base_price ? `<div class="muted small">${t('down_to', { price: money(p.best_price) })}</div>` : ''}
        </div>
      </div>`;
  }

  function viewProducts() {
    if (!S.products.length) return `<div class="empty">${t('no_products')}</div>`;
    return `<p class="muted">${t('intro')}</p>${S.products.map(productCard).join('')}`;
  }

  function tierIndexFor(p, qty) {
    let idx = 0;
    p.tiers.forEach((x, i) => { if (qty >= x.min_qty) idx = i; });
    return idx;
  }
  function nextTierHint(p, qty) {
    const idx = tierIndexFor(p, qty);
    const next = p.tiers[idx + 1];
    return next ? t('next_tier_hint', { n: next.min_qty - qty, price: money(next.price), unit: esc(p.unit) }) : '';
  }

  function viewProduct() {
    const p = S.products.find((x) => x.id === S.view.id);
    if (!p) return '';
    const idx = tierIndexFor(p, S.qty);
    const unitPrice = p.tiers[idx].price;
    const tierRows = p.tiers.map((x, i) => `<tr class="${i === idx ? 'cur' : ''} tap" data-act="setQty" data-qty="${x.min_qty}" data-tier="${i}"><td>${t('units_plus', { n: x.min_qty, unit: esc(p.unit) })}</td><td>${money(x.price)}</td></tr>`).join('');
    const hint = nextTierHint(p, S.qty);
    return `
      <button class="btn alt sm" data-act="back">${t('back')}</button>
      <div class="card" style="margin-top:10px">
        ${cover(p)}
        <div class="pad">
          <div class="title">${esc(p.title)}</div>
          ${p.origin ? `<div class="muted">${esc(p.origin)}</div>` : ''}
        </div>
      </div>
      ${p.description ? `<p>${esc(p.description).replace(/\n/g, '<br>')}</p>` : ''}
      ${p.lead_time ? `<div class="kv"><span>${t('lead_time')}</span><span>${esc(p.lead_time)}</span></div>` : ''}
      <h3>${t('tiers_title')}</h3>
      <div class="card"><table class="tiers">${tierRows}</table></div>
      <p class="muted small">${t('tap_tier')} ${t('moq_note', { n: p.moq, unit: esc(p.unit) })}</p>

      <h3>${t('quantity')}</h3>
      <div class="stepper">
        <button data-act="qtyMinus">-</button>
        <input id="qtyInput" type="number" inputmode="numeric" min="${p.moq}" ${p.max_qty > 0 ? `max="${p.max_qty}"` : ''} value="${S.qty}">
        <button data-act="qtyPlus">+</button>
      </div>
      ${p.max_qty > 0 ? `<p class="muted small">${t('max_qty_note', { n: p.max_qty })}</p>` : ''}
      <div class="kv"><span>${t('price_each', { unit: esc(p.unit) })}</span><span id="unitPrice">${money(unitPrice)}</span></div>
      <div class="kv"><span><b>${t('total')}</b></span><span class="price" id="totalPrice">${money(unitPrice * S.qty)}</span></div>
      <div class="note" id="tierHint" ${hint ? '' : 'hidden'}>${hint}</div>
      <label>${t('delivery_note')}</label>
      <textarea id="oNote" maxlength="300" placeholder="${esc(t('note_placeholder'))}"></textarea>
      <p class="muted small">${t('price_locked_note')}</p>
      <div class="btns"><button class="btn" data-act="placeOrder">${t('place_order')}</button></div>
      ${S.cfg.bot_username ? `<div class="btns"><button class="btn alt" data-act="share">${t('share')}</button></div>` : ''}`;
  }

  function paymentBlock(o) {
    if (!['awaiting_payment', 'receipt_uploaded'].includes(o.status)) return '';
    let html = `<h3>${t('amount_due')}</h3><div class="price">${money(o.total)}</div>`;
    if (o.pay_by) html += `<p class="muted small">${t('pay_by', { d: esc(dateStr(o.pay_by)) })}</p>`;
    html += `<h3>${t('how_to_pay')}</h3><div class="pre">${esc(S.cfg.payment_info || t('payment_missing'))}</div>`;
    if (o.status === 'awaiting_payment' && o.reject_note) html += `<div class="note red">${t('rejected_note', { note: esc(o.reject_note) })}</div>`;
    html += `<p class="muted small">${t('receipt_hint')}</p>`;
    html += `<button class="btn" data-act="pickReceipt" data-order="${o.id}">${o.status === 'receipt_uploaded' ? t('replace_receipt') : t('upload_receipt')}</button>`;
    return html;
  }

  function viewOrder() {
    const o = S.orders.find((x) => x.id === S.view.id);
    if (!o) return '';
    return `
      <button class="btn alt sm" data-act="back">${t('back')}</button>
      <div class="card" style="margin-top:10px"><div class="pad">
        <div class="row"><div class="title">${t('order_n', { id: o.id })}</div>${statusBadge(o.status)}</div>
        <div class="muted">${esc(o.title)}</div>
        ${stepsHtml(o.status)}
        <div class="kv"><span>${t('quantity')}</span><span>${o.qty} ${esc(o.unit)}</span></div>
        <div class="kv"><span>${t('price_each', { unit: esc(o.unit) })}</span><span>${money(o.unit_price)}</span></div>
        <div class="kv"><span><b>${t('total')}</b></span><span class="price">${money(o.total)}</span></div>
        ${o.eta_text ? `<div class="kv"><span>${t('eta')}</span><span>${esc(o.eta_text)}</span></div>` : ''}
        ${o.note ? `<p class="muted small">${esc(o.note)}</p>` : ''}
        ${paymentBlock(o)}
        ${o.status === 'awaiting_payment' ? `<div class="btns"><button class="btn danger" data-act="cancelOrder" data-order="${o.id}">${t('cancel_order')}</button></div>` : ''}
      </div></div>`;
  }

  function viewOrders() {
    if (!S.orders.length) return `<div class="empty">${t('orders_empty')}</div>`;
    return S.orders.map((o) => `
      <div class="card tap" data-act="openOrder" data-id="${o.id}"><div class="pad">
        <div class="row"><div class="title">${esc(o.title)}</div>${statusBadge(o.status)}</div>
        <div class="muted small">${t('order_n', { id: o.id })} | ${o.qty} ${esc(o.unit)} | ${money(o.total)}</div>
      </div></div>`).join('');
  }

  function viewProfile() {
    const u = S.cfg.user;
    return `
      <h2>${t('profile_title')}</h2>
      <label>${t('name')}</label><input id="pName" value="${esc(u.name)}" disabled>
      <label>${t('phone')}</label><input id="pPhone" type="tel" inputmode="tel" value="${esc(u.phone)}" placeholder="+251 9...">
      <label>${t('business')}</label><input id="pBiz" value="${esc(u.business_name)}">
      <label>${t('language')}</label>
      <select id="pLang"><option value="en" ${S.lang === 'en' ? 'selected' : ''}>English</option><option value="am" ${S.lang === 'am' ? 'selected' : ''}>አማርኛ</option></select>
      <div class="btns" style="margin-top:16px"><button class="btn" data-act="saveProfile">${t('save')}</button></div>`;
  }

  // ---------- admin views (English only) ----------
  const NEXT = { paid: 'ordered', ordered: 'shipped', shipped: 'arrived', arrived: 'completed' };
  const NEXT_LABEL = { ordered: 'Mark as ordered', shipped: 'Mark as shipped', arrived: 'Mark as arrived', completed: 'Mark as completed' };
  const STATUS_FILTERS = [
    ['active', 'All open orders'], ['receipt_uploaded', 'Receipt to check'], ['awaiting_payment', 'Waiting for payment'],
    ['paid', 'Paid'], ['ordered', 'Ordered'], ['shipped', 'Shipped'], ['arrived', 'Arrived'],
    ['completed', 'Completed'], ['cancelled', 'Cancelled'], ['all', 'Everything'],
  ];
  const plain = (s) => s.replace('_', ' ');

  function adminOrderCard(o) {
    const nxt = NEXT[o.status];
    return `
      <div class="card"><div class="pad">
        <div class="row"><b>#${o.id} ${esc(o.title)}</b><span class="badge ${o.status === 'paid' || o.status === 'completed' ? 'green' : o.status === 'receipt_uploaded' ? 'amber' : o.status === 'cancelled' ? 'red' : ''}">${esc(plain(o.status))}</span></div>
        <div class="muted small">${esc(o.name)}${o.username ? ` (<a href="https://t.me/${esc(o.username)}">@${esc(o.username)}</a>)` : ''} | ${esc(o.phone || 'no phone')}${o.business_name ? ' | ' + esc(o.business_name) : ''}</div>
        <div class="kv"><span>${o.qty} ${esc(o.unit)} at ${money(o.unit_price)}</span><span><b>${money(o.total)}</b></span></div>
        ${o.note ? `<p class="muted small">Note: ${esc(o.note)}</p>` : ''}
        <div>
          ${o.has_receipt ? `<button class="btn alt sm" data-act="viewReceipt" data-order="${o.id}">View receipt</button>` : ''}
          ${['receipt_uploaded', 'awaiting_payment'].includes(o.status) ? `<button class="btn sm" data-act="confirmOrder" data-order="${o.id}">Confirm payment</button>` : ''}
          ${o.status === 'receipt_uploaded' ? `<button class="btn danger sm" data-act="rejectOrder" data-order="${o.id}">Reject receipt</button>` : ''}
          ${nxt ? `<button class="btn sm" data-act="nextStep" data-order="${o.id}" data-next="${nxt}">${NEXT_LABEL[nxt]}</button>` : ''}
          ${!['completed', 'cancelled'].includes(o.status) ? `<button class="btn danger sm" data-act="adminCancel" data-order="${o.id}">Cancel order</button>` : ''}
        </div>
      </div></div>`;
  }

  function adminOrdersView() {
    const f = S.aFilter;
    const nxt = NEXT[f.status];
    const matching = nxt ? S.aOrders.filter((o) => o.status === f.status) : [];
    return `
      <label>Show</label>
      <select id="aStatus">${STATUS_FILTERS.map(([k, l]) => `<option value="${k}" ${f.status === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <label>Product</label>
      <select id="aProduct"><option value="">All products</option>${S.aProducts.map((p) => `<option value="${p.id}" ${String(f.product) === String(p.id) ? 'selected' : ''}>${esc(p.title)}</option>`).join('')}</select>
      ${matching.length ? `<div class="btns"><button class="btn alt" data-act="bulkNext" data-next="${nxt}">${NEXT_LABEL[nxt]} for all ${matching.length} shown</button></div>` : ''}
      <h3>${S.aOrders.length} order${S.aOrders.length === 1 ? '' : 's'}</h3>
      ${S.aOrders.map(adminOrderCard).join('') || '<p class="muted">No orders here.</p>'}`;
  }

  function tierRowHtml(minQty, price) {
    return `<div class="tier-row">
      <input class="tMin" type="number" inputmode="numeric" min="1" placeholder="From units" value="${esc(minQty)}">
      <input class="tPrice" type="number" inputmode="decimal" min="0" step="0.01" placeholder="Price (ETB)" value="${esc(price)}">
      <button class="btn alt sm x" data-act="removeTier">x</button>
    </div>`;
  }

  function productFormHtml(f) {
    const editing = !!f.id;
    return `
      <h2>${editing ? 'Edit product' : 'New product'}</h2>
      <label>Product name</label><input id="fTitle" maxlength="120" value="${esc(f.title)}">
      <label>Description</label><textarea id="fDesc" maxlength="2000" placeholder="Specs, model, what is included, quality notes">${esc(f.description)}</textarea>
      <label>Origin</label><input id="fOrigin" placeholder="e.g. Guangzhou, China" value="${esc(f.origin)}">
      <label>Unit (it must read well after a number, like "20 pcs")</label><input id="fUnit" placeholder="pcs, sets, cartons, kg" value="${esc(f.unit || 'pcs')}">
      <label>Photo</label>
      ${f.image ? `<img class="thumb" src="${esc(f.image)}" alt=""><label class="check"><input type="checkbox" id="fRemoveImage"> Remove current photo</label>` : ''}
      <input id="fImage" type="file" accept="image/*">
      <label>Minimum order quantity (MOQ)</label><input id="fMoq" type="number" inputmode="numeric" min="1" value="${esc(f.moq)}">
      <label>Maximum per order (0 for no limit)</label><input id="fMax" type="number" inputmode="numeric" min="0" value="${esc(f.max_qty || 0)}">
      <label>Price per unit at the MOQ (ETB)</label><input id="fBase" type="number" inputmode="decimal" min="0" step="0.01" value="${esc(f.base)}">
      <label>Cheaper prices for bigger orders (optional, price must keep dropping)</label>
      <div id="fTiers">${f.extra.map((x) => tierRowHtml(x.min_qty, x.price)).join('')}</div>
      <button class="btn alt sm" data-act="addTier">Add price tier</button>
      <label>Delivery time (text)</label><input id="fLead" placeholder="e.g. about 35 days after payment" value="${esc(f.lead_time)}">
      <label class="check"><input type="checkbox" id="fActive" ${f.active ? 'checked' : ''}> Visible to buyers</label>
      ${editing ? '<p class="muted small">Changes apply to new orders only. Orders already placed keep their price.</p>' : ''}
      <div class="btns" style="margin-top:14px">
        <button class="btn" data-act="saveProduct">${editing ? 'Save changes' : 'Publish product'}</button>
        <button class="btn alt" data-act="closeForm">Cancel</button>
      </div>`;
  }

  function adminProductsView() {
    if (S.form) return productFormHtml(S.form);
    return `
      <div class="btns"><button class="btn" data-act="newProduct">Add a product</button></div>
      ${S.aProducts.map((p) => `
        <div class="card"><div class="pad">
          <div class="row"><b>${esc(p.title)}</b><span class="badge ${p.active ? 'green' : ''}">${p.active ? 'visible' : 'hidden'}</span></div>
          <div class="muted small">MOQ ${p.moq} ${esc(p.unit)} | ${money(p.base_price)}${p.best_price < p.base_price ? ' down to ' + money(p.best_price) : ''} | ${p.orders} order${p.orders === 1 ? '' : 's'}</div>
          <div>
            <button class="btn sm" data-act="editProduct" data-id="${p.id}">Edit</button>
            <button class="btn alt sm" data-act="toggleActive" data-id="${p.id}">${p.active ? 'Hide' : 'Show'}</button>
            <button class="btn danger sm" data-act="deleteProduct" data-id="${p.id}">Delete</button>
          </div>
        </div></div>`).join('') || '<p class="muted">No products yet.</p>'}`;
  }

  function adminSettingsView() {
    return `
      <h2>Payment details</h2>
      <p class="muted small">Shown to buyers on their order page. Add the bank or mobile money accounts you use.</p>
      <textarea id="payInfo" placeholder="Bank name, account name, account number, Telebirr number">${esc(S.cfg.payment_info)}</textarea>
      <div class="btns"><button class="btn" data-act="savePay">Save payment details</button></div>`;
  }

  function viewAdmin() {
    const segs = [['orders', 'Orders'], ['products', 'Products'], ['settings', 'Settings']];
    const body = S.aTab === 'orders' ? adminOrdersView() : S.aTab === 'products' ? adminProductsView() : adminSettingsView();
    return `<div class="seg">${segs.map(([k, l]) => `<button class="${S.aTab === k ? 'on' : ''}" data-act="aTab" data-tab="${k}">${l}</button>`).join('')}</div>${body}`;
  }

  // ---------- render ----------
  function render() {
    const view = $('view');
    if (!S.loaded) { view.innerHTML = `<div class="empty">${t('loading')}</div>`; return; }
    if (S.view && S.view.type === 'product') view.innerHTML = viewProduct();
    else if (S.view && S.view.type === 'order') view.innerHTML = viewOrder();
    else if (S.tab === 'products') view.innerHTML = viewProducts();
    else if (S.tab === 'orders') view.innerHTML = viewOrders();
    else if (S.tab === 'profile') view.innerHTML = viewProfile();
    else if (S.tab === 'admin' && S.cfg.is_admin) view.innerHTML = viewAdmin();

    const tabs = [['products', 'tab_products'], ['orders', 'tab_orders'], ['profile', 'tab_profile']];
    if (S.cfg.is_admin) tabs.push(['admin', 'tab_admin']);
    $('nav').innerHTML = tabs.map(([k, label]) => `<button class="${S.tab === k && !S.view ? 'on' : ''}" data-act="tab" data-tab="${k}">${t(label)}</button>`).join('');

    if (tg && tg.BackButton) { if (S.view) tg.BackButton.show(); else tg.BackButton.hide(); }
  }

  function goBack() { S.view = null; render(); window.scrollTo(0, 0); }
  if (tg && tg.BackButton) tg.BackButton.onClick(goBack);

  function clampQty(p, v) {
    let n = Math.floor(Number(v));
    if (!Number.isFinite(n) || n < p.moq) n = p.moq;
    if (p.max_qty > 0 && n > p.max_qty) n = p.max_qty;
    return n;
  }
  function setQty(v, fromTyping) {
    const p = S.products.find((x) => x.id === S.view.id);
    if (!p) return;
    // while typing, allow values below the MOQ until the field loses focus, so the number can be edited
    S.qty = fromTyping && Number(v) < p.moq ? Math.max(1, Math.floor(Number(v)) || 1) : clampQty(p, v);
    const idx = tierIndexFor(p, S.qty);
    const unitPrice = p.tiers[idx].price;
    if (!fromTyping) $('qtyInput').value = S.qty;
    $('unitPrice').textContent = money(unitPrice);
    $('totalPrice').textContent = money(unitPrice * S.qty);
    document.querySelectorAll('.tiers tr').forEach((r) => r.classList.toggle('cur', Number(r.dataset.tier) === idx));
    const hint = nextTierHint(p, S.qty);
    $('tierHint').textContent = hint;
    $('tierHint').hidden = !hint;
  }

  const blankForm = () => ({ id: null, title: '', description: '', origin: '', unit: 'pcs', image: null, moq: '', max_qty: 0, base: '', extra: [], lead_time: '', active: true });

  // ---------- actions ----------
  const H = {
    tab(el) { S.tab = el.dataset.tab; S.view = null; S.form = null; render(); window.scrollTo(0, 0); if (S.tab === 'admin') adminReload(); },
    openProduct(el) {
      const p = S.products.find((x) => x.id === Number(el.dataset.id));
      if (!p) return;
      S.view = { type: 'product', id: p.id }; S.qty = p.moq; render(); window.scrollTo(0, 0);
    },
    openOrder(el) { S.view = { type: 'order', id: Number(el.dataset.id) }; render(); window.scrollTo(0, 0); },
    back: goBack,
    qtyMinus() { setQty(S.qty - 1); },
    qtyPlus() { setQty(S.qty + 1); },
    setQty(el) { setQty(Number(el.dataset.qty)); },
    async placeOrder() {
      const p = S.products.find((x) => x.id === S.view.id);
      setQty(S.qty);
      try {
        const o = await api(`/api/products/${p.id}/order`, { method: 'POST', body: { qty: S.qty, note: $('oNote').value } });
        await refreshOrders();
        S.view = { type: 'order', id: o.id }; S.tab = 'orders';
        toast(t('order_placed')); render(); window.scrollTo(0, 0);
      } catch (e) { fail(e); }
    },
    pickReceipt(el) { $('receiptInput').dataset.order = el.dataset.order; $('receiptInput').click(); },
    async cancelOrder(el) {
      const ok = await ask({ title: t('confirm_cancel'), okLabel: t('yes'), cancelLabel: t('no'), danger: true });
      if (!ok) return;
      try { await api(`/api/orders/${el.dataset.order}/cancel`, { method: 'POST' }); await refreshOrders(); toast(t('cancelled_ok')); render(); } catch (e) { fail(e); }
    },
    async saveProfile() {
      try {
        const lang = $('pLang').value;
        const u = await api('/api/me', { method: 'PUT', body: { phone: $('pPhone').value, business_name: $('pBiz').value, lang } });
        S.cfg.user = u; S.lang = lang; toast(t('saved')); render();
      } catch (e) { fail(e); }
    },
    share() {
      const p = S.products.find((x) => x.id === S.view.id);
      const link = `https://t.me/${S.cfg.bot_username}?startapp=product_${p.id}`;
      const text = `${p.title}: ${money(p.base_price)} ${t('per', { unit: p.unit })}, ${t('min_order', { n: p.moq, unit: p.unit })}`;
      const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
      if (tg && tg.openTelegramLink) tg.openTelegramLink(url); else window.open(url, '_blank');
    },

    // admin
    aTab(el) { S.aTab = el.dataset.tab; S.form = null; render(); adminReload(); },
    async confirmOrder(el) { await adminOrderAction(el.dataset.order, 'confirm'); },
    async rejectOrder(el) {
      const note = await ask({ title: 'Reject receipt', text: 'Tell the buyer why. They receive this in Telegram.', input: 'Reason', okLabel: 'Reject', danger: true });
      if (!note) return;
      await adminOrderAction(el.dataset.order, 'reject', { note: note === true ? '' : note });
    },
    async adminCancel(el) {
      const ok = await ask({ title: 'Cancel this order?', text: 'The buyer is notified. Refunds are handled by you.', okLabel: 'Cancel order', cancelLabel: 'Keep', danger: true });
      if (!ok) return;
      await adminOrderAction(el.dataset.order, 'cancel');
    },
    async nextStep(el) { await advance([Number(el.dataset.order)], el.dataset.next); },
    async bulkNext(el) {
      const from = S.aFilter.status;
      const ids = S.aOrders.filter((o) => o.status === from).map((o) => o.id);
      await advance(ids, el.dataset.next);
    },
    async viewReceipt(el) {
      try {
        const blob = await fetchBlob(`/api/orders/${el.dataset.order}/receipt`);
        const url = URL.createObjectURL(blob);
        if (blob.type === 'application/pdf') modal(`<a class="btn" href="${url}" target="_blank">Open PDF receipt</a><div class="btns"><button class="btn alt" data-act="closeModal">Close</button></div>`);
        else modal(`<img src="${url}" alt="receipt"><div class="btns"><button class="btn alt" data-act="closeModal">Close</button></div>`);
      } catch (e) { fail(e); }
    },
    closeModal,

    newProduct() { S.form = blankForm(); render(); window.scrollTo(0, 0); },
    editProduct(el) {
      const p = S.aProducts.find((x) => x.id === Number(el.dataset.id));
      if (!p) return;
      S.form = { id: p.id, title: p.title, description: p.description, origin: p.origin, unit: p.unit, image: p.image, moq: p.moq, max_qty: p.max_qty, base: p.tiers[0].price, extra: p.tiers.slice(1), lead_time: p.lead_time, active: p.active };
      render(); window.scrollTo(0, 0);
    },
    closeForm() { S.form = null; render(); },
    addTier() { $('fTiers').insertAdjacentHTML('beforeend', tierRowHtml('', '')); },
    removeTier(el) { el.closest('.tier-row').remove(); },
    async saveProduct() {
      try {
        const moq = Number($('fMoq').value);
        const tiers = [{ min_qty: moq, price: Number($('fBase').value) }];
        document.querySelectorAll('#fTiers .tier-row').forEach((r) => {
          const m = r.querySelector('.tMin').value, pr = r.querySelector('.tPrice').value;
          if (m || pr) tiers.push({ min_qty: Number(m), price: Number(pr) });
        });
        const f = new FormData();
        f.append('title', $('fTitle').value); f.append('description', $('fDesc').value);
        f.append('origin', $('fOrigin').value); f.append('unit', $('fUnit').value);
        f.append('moq', String(moq)); f.append('max_qty', $('fMax').value || '0');
        f.append('lead_time', $('fLead').value); f.append('active', $('fActive').checked ? '1' : '0');
        f.append('tiers', JSON.stringify(tiers));
        if ($('fImage').files[0]) f.append('image', $('fImage').files[0]);
        if ($('fRemoveImage') && $('fRemoveImage').checked) f.append('remove_image', '1');
        const editing = S.form.id;
        await api(editing ? `/api/admin/products/${editing}` : '/api/admin/products', { method: editing ? 'PUT' : 'POST', form: f });
        S.form = null;
        S.products = await api('/api/products');
        await loadAdmin(); toast(editing ? 'Saved' : 'Product published'); render(); window.scrollTo(0, 0);
      } catch (e) { fail(e); }
    },
    async toggleActive(el) {
      const p = S.aProducts.find((x) => x.id === Number(el.dataset.id));
      if (!p) return;
      try {
        const f = new FormData();
        f.append('title', p.title); f.append('description', p.description || ''); f.append('origin', p.origin || ''); f.append('unit', p.unit);
        f.append('moq', String(p.moq)); f.append('max_qty', String(p.max_qty)); f.append('lead_time', p.lead_time || '');
        f.append('tiers', JSON.stringify(p.tiers)); f.append('active', p.active ? '0' : '1');
        await api(`/api/admin/products/${p.id}`, { method: 'PUT', form: f });
        S.products = await api('/api/products'); await loadAdmin(); render();
      } catch (e) { fail(e); }
    },
    async deleteProduct(el) {
      const ok = await ask({ title: 'Delete this product?', text: 'This cannot be undone. A product with orders cannot be deleted, hide it instead.', okLabel: 'Delete', danger: true });
      if (!ok) return;
      try {
        await api(`/api/admin/products/${el.dataset.id}`, { method: 'DELETE' });
        S.products = await api('/api/products'); await loadAdmin(); render();
      } catch (e) { fail(e); }
    },
    async savePay() {
      try { await api('/api/admin/settings', { method: 'PUT', body: { payment_info: $('payInfo').value } }); S.cfg.payment_info = $('payInfo').value; toast('Saved'); }
      catch (e) { fail(e); }
    },
  };

  async function adminReload() {
    try { await loadAdmin(); render(); } catch (e) { fail(e); }
  }
  async function adminOrderAction(id, action, body) {
    try { await api(`/api/admin/orders/${id}/${action}`, { method: 'POST', body: body || {} }); await loadAdmin(); render(); } catch (e) { fail(e); }
  }
  async function advance(ids, status) {
    if (!ids.length) return;
    let eta;
    if (status === 'shipped') {
      eta = await ask({ title: 'Mark as shipped', text: 'Expected arrival shown to the buyers (optional).', input: 'e.g. 12 November', okLabel: 'Mark shipped' });
      if (!eta) return;
    } else if (ids.length > 1) {
      const ok = await ask({ title: `${NEXT_LABEL[status]} for ${ids.length} orders?`, text: 'Each buyer is notified in Telegram.', okLabel: 'Yes, update all' });
      if (!ok) return;
    }
    try {
      const r = await api('/api/admin/orders/advance', { method: 'POST', body: { ids, status, eta_text: eta && eta !== true ? eta : '' } });
      toast(`${r.updated} updated`);
      await loadAdmin(); render();
    } catch (e) { fail(e); }
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || !H[el.dataset.act]) return;
    H[el.dataset.act](el, e);
  });
  document.addEventListener('input', (e) => { if (e.target.id === 'qtyInput') setQty(e.target.value, true); });
  document.addEventListener('change', (e) => {
    if (e.target.id === 'qtyInput') setQty(e.target.value);
    if (e.target.id === 'aStatus') { S.aFilter.status = e.target.value; adminReload(); }
    if (e.target.id === 'aProduct') { S.aFilter.product = e.target.value; adminReload(); }
  });

  $('receiptInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    const order = e.target.dataset.order;
    e.target.value = '';
    if (!file || !order) return;
    try {
      const f = new FormData();
      f.append('receipt', file);
      await api(`/api/orders/${order}/receipt`, { method: 'POST', form: f });
      await refreshOrders(); toast(t('uploaded')); render();
    } catch (err) { fail(err); }
  });

  // brand logo: shown only if public/brand/logo.png exists
  const logo = $('logo');
  if (logo) { logo.onload = () => { logo.hidden = false; }; logo.onerror = () => logo.remove(); }

  // ---------- start ----------
  render();
  loadAll().then(() => {
    if (S.cfg.has_logo && logo) logo.src = '/brand/logo.png';
    const sp = tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param;
    const m = sp && /^product_(\d+)$/.exec(sp);
    if (m) {
      const p = S.products.find((x) => x.id === Number(m[1]));
      if (p) { S.view = { type: 'product', id: p.id }; S.qty = p.moq; }
    }
    render();
  }).catch((e) => {
    $('view').innerHTML = `<div class="empty">${e.message === 'unauthorized' ? 'Open this app from Telegram.' : t('error')}</div>`;
  });
})();
