(() => {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg) { tg.ready(); tg.expand(); }
  const params = new URLSearchParams(location.search);
  const devUser = params.get('dev');

  // ---------- text ----------
  const T = {
    en: {
      tab_deals: 'Groups', tab_orders: 'My orders', tab_profile: 'Profile', tab_admin: 'Admin',
      open_groups: 'Open groups', past_groups: 'Past groups',
      no_groups: 'No groups yet. Check back soon.',
      joined_of: '{n} of {moq} units joined', price_now: 'Price now', per: 'per {unit}',
      time_left: '{t} left', ended: 'Ended',
      tiers: 'Price by group size', units_plus: '{n}+ units',
      next_tier: '{n} more units to reach {price}',
      moq_note: 'This group goes ahead if {moq} units are joined by the deadline. If not, it is cancelled and nobody pays.',
      origin: 'Origin', max_per_buyer: 'Maximum per buyer', quantity: 'Quantity',
      join: 'Join this group', update_qty: 'Update quantity', leave: 'Leave group',
      est_total: 'Estimated total',
      price_may_drop: 'The price can drop as more buyers join. You pay only after the group locks.',
      profile_needed: 'Add your phone number and business name first, so we can reach you about delivery.',
      your_order: 'Your order', you_joined: 'You joined: {n}',
      s_joined: 'Joined, waiting for the group to fill', s_awaiting_payment: 'Payment needed',
      s_receipt_uploaded: 'Receipt sent, waiting for confirmation', s_paid: 'Paid',
      d_open: 'Open', d_locked: 'Locked', d_ordered: 'Ordered', d_shipped: 'Shipped', d_arrived: 'Arrived',
      d_closed: 'Closed', d_cancelled: 'Cancelled',
      final_price: 'Final price', amount_due: 'Amount to pay', pay_by: 'Pay by {d}',
      how_to_pay: 'How to pay', payment_missing: 'The organizer will send payment details in Telegram.',
      upload_receipt: 'Upload payment receipt', replace_receipt: 'Replace receipt',
      receipt_hint: 'Send a clear photo or PDF of your transfer receipt.',
      rejected_note: 'Receipt not accepted. {note}', eta: 'Expected arrival',
      share: 'Share this group', back: 'Back',
      orders_empty: 'You have not joined any group yet.',
      profile_title: 'Your details', name: 'Name', phone: 'Phone number',
      business: 'Business name (or planned business)', language: 'Language',
      save: 'Save', saved: 'Saved', total: 'Total', uploaded: 'Receipt uploaded', joined_ok: 'You joined the group',
      left_ok: 'You left the group', loading: 'Loading', error: 'Something went wrong. Try again.',
      confirm_leave: 'Leave this group?',
    },
    am: {
      tab_deals: 'ቡድኖች', tab_orders: 'ትዕዛዞቼ', tab_profile: 'መገለጫ', tab_admin: 'አስተዳዳሪ',
      open_groups: 'ክፍት ቡድኖች', past_groups: 'ያለፉ ቡድኖች',
      no_groups: 'እስካሁን ቡድን የለም። በቅርቡ ይመለሱ።',
      joined_of: 'ከ{moq} ክፍሎች {n} ተቀላቅለዋል', price_now: 'አሁን ያለው ዋጋ', per: 'በ{unit}',
      time_left: '{t} ቀርቷል', ended: 'አብቅቷል',
      tiers: 'በቡድን መጠን ዋጋ', units_plus: '{n}+ ክፍሎች',
      next_tier: 'ወደ {price} ለመድረስ {n} ተጨማሪ ክፍሎች ይቀራሉ',
      moq_note: 'ይህ ቡድን የሚቀጥለው በጊዜ ገደቡ {moq} ክፍሎች ከተቀላቀሉ ነው። ካልሆነ ይሰረዛል፣ ማንም አይከፍልም።',
      origin: 'ምንጭ', max_per_buyer: 'ለአንድ ገዢ ከፍተኛ', quantity: 'ብዛት',
      join: 'ቡድኑን ተቀላቀል', update_qty: 'ብዛት አስተካክል', leave: 'ከቡድኑ ውጣ',
      est_total: 'የሚገመት ጠቅላላ',
      price_may_drop: 'ብዙ ገዢዎች ሲቀላቀሉ ዋጋው ሊቀንስ ይችላል። የሚከፍሉት ቡድኑ ከተቆለፈ በኋላ ነው።',
      profile_needed: 'ስለ ርክክብ ለማግኘት መጀመሪያ ስልክ ቁጥርዎን እና የንግድ ስምዎን ያስገቡ።',
      your_order: 'ትዕዛዝዎ', you_joined: 'ተቀላቅለዋል፡ {n}',
      s_joined: 'ተቀላቅለዋል፣ ቡድኑ እስኪሞላ ይጠብቁ', s_awaiting_payment: 'ክፍያ ያስፈልጋል',
      s_receipt_uploaded: 'ደረሰኝ ተልኳል፣ ማረጋገጫ ይጠብቁ', s_paid: 'ተከፍሏል',
      d_open: 'ክፍት', d_locked: 'ተቆልፏል', d_ordered: 'ታዟል', d_shipped: 'ተልኳል', d_arrived: 'ደርሷል',
      d_closed: 'ተዘግቷል', d_cancelled: 'ተሰርዟል',
      final_price: 'የመጨረሻ ዋጋ', amount_due: 'የሚከፈል መጠን', pay_by: 'እስከ {d} ይክፈሉ',
      how_to_pay: 'እንዴት እንደሚከፍሉ', payment_missing: 'አስተባባሪው የክፍያ መረጃ በቴሌግራም ይልካል።',
      upload_receipt: 'የክፍያ ደረሰኝ ጫን', replace_receipt: 'ደረሰኝ ቀይር',
      receipt_hint: 'የገንዘብ ማስተላለፊያ ደረሰኝዎን ግልጽ ፎቶ ወይም PDF ይላኩ።',
      rejected_note: 'ደረሰኝ አልተቀበለም። {note}', eta: 'የሚደርስበት ጊዜ',
      share: 'ቡድኑን አጋራ', back: 'ተመለስ',
      orders_empty: 'እስካሁን ምንም ቡድን አልተቀላቀሉም።',
      profile_title: 'የእርስዎ መረጃ', name: 'ስም', phone: 'ስልክ ቁጥር',
      business: 'የንግድ ስም (ወይም የታቀደ ንግድ)', language: 'ቋንቋ',
      save: 'አስቀምጥ', saved: 'ተቀምጧል', total: 'ጠቅላላ', uploaded: 'ደረሰኝ ተጭኗል', joined_ok: 'ቡድኑን ተቀላቅለዋል',
      left_ok: 'ከቡድኑ ወጥተዋል', loading: 'በመጫን ላይ', error: 'ችግር ተፈጥሯል። እንደገና ይሞክሩ።',
      confirm_leave: 'ከዚህ ቡድን ይውጡ?',
    },
  };

  const S = {
    tab: 'deals', deals: [], orders: [], cfg: null, lang: 'en', dealId: null, qty: 1,
    adminOrders: {}, adminOpen: null, tierRows: 2, loaded: false,
  };

  const t = (k, v = {}) => {
    const s = (T[S.lang] && T[S.lang][k]) || T.en[k] || k;
    return s.replace(/\{(\w+)\}/g, (_, x) => (v[x] === undefined ? '' : v[x]));
  };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' ETB';
  const $ = (id) => document.getElementById(id);

  const timeLeft = (ms) => {
    const d = ms - Date.now();
    if (d <= 0) return null;
    const m = Math.floor(d / 60000), h = Math.floor(m / 60), days = Math.floor(h / 24);
    if (days >= 1) return `${days}d ${h % 24}h`;
    if (h >= 1) return `${h}h ${m % 60}m`;
    return `${Math.max(1, m)}m`;
  };
  const dateStr = (ms) => new Date(ms).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

  // ---------- api ----------
  async function api(path, { method = 'GET', body, form } = {}) {
    const headers = {};
    if (tg && tg.initData) headers['x-init-data'] = tg.initData;
    else if (devUser) headers['x-dev-user'] = devUser;
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
    const headers = {};
    if (tg && tg.initData) headers['x-init-data'] = tg.initData;
    else if (devUser) headers['x-dev-user'] = devUser;
    const r = await fetch(path, { headers });
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

  function ask({ title, text, input, okLabel = 'OK', danger = false }) {
    return new Promise((resolve) => {
      modal(`
        <div class="title">${esc(title)}</div>
        ${text ? `<p class="muted">${esc(text)}</p>` : ''}
        ${input ? `<input id="askInput" placeholder="${esc(input)}">` : ''}
        <div class="btns">
          <button class="btn ${danger ? 'danger' : ''}" id="askOk">${esc(okLabel)}</button>
          <button class="btn alt" id="askNo">Cancel</button>
        </div>`);
      $('askOk').onclick = () => { const v = input ? $('askInput').value.trim() : true; closeModal(); resolve(v === '' ? true : v); };
      $('askNo').onclick = () => { closeModal(); resolve(false); };
    });
  }

  const fail = (e) => {
    if (e.message === 'profile_required') { toast(t('profile_needed')); S.tab = 'profile'; S.dealId = null; render(); return; }
    toast(e.message && e.message !== 'request failed' ? e.message : t('error'));
  };

  // ---------- data ----------
  async function loadAll() {
    const [cfg, deals, orders] = await Promise.all([api('/api/config'), api('/api/deals'), api('/api/my/orders')]);
    S.cfg = cfg; S.deals = deals; S.orders = orders; S.lang = cfg.user.lang === 'am' ? 'am' : 'en'; S.loaded = true;
  }
  async function refreshDeals() {
    const [deals, orders] = await Promise.all([api('/api/deals'), api('/api/my/orders')]);
    S.deals = deals; S.orders = orders;
  }

  // ---------- views ----------
  const STEPS = ['open', 'locked', 'ordered', 'shipped', 'arrived'];

  function stepsHtml(status) {
    if (status === 'cancelled') return `<span class="badge red">${t('d_cancelled')}</span>`;
    const idx = status === 'closed' ? STEPS.length : STEPS.indexOf(status);
    return `<div class="steps">${STEPS.map((s, i) => `<span class="${i < idx ? 'done' : i === idx ? 'now' : ''}">${t('d_' + s)}</span>`).join('')}</div>`;
  }

  function cover(d) {
    return d.image ? `<img class="cover" src="${esc(d.image)}" alt="">` : `<div class="cover ph">${esc((d.title || '?').trim().charAt(0).toUpperCase())}</div>`;
  }

  function dealCard(d) {
    const pct = Math.min(100, Math.round((d.total_qty / d.moq) * 100));
    const left = d.status === 'open' ? timeLeft(d.deadline) : null;
    const badge = d.status !== 'open' ? `<span class="badge ${d.status === 'cancelled' ? 'red' : 'amber'}">${t('d_' + d.status)}</span>` : '';
    const mine = d.my_order ? `<span class="badge green">${t('you_joined', { n: d.my_order.qty })}</span>` : '';
    return `
      <div class="card tap" data-act="openDeal" data-id="${d.id}">
        ${cover(d)}
        <div class="pad">
          <div class="row"><div class="title">${esc(d.title)}</div><div class="price">${money(d.current_price)} <small>${t('per', { unit: esc(d.unit) })}</small></div></div>
          ${d.origin ? `<div class="muted">${esc(d.origin)}</div>` : ''}
          <div class="bar"><i style="width:${pct}%"></i></div>
          <div class="row"><span class="muted small">${t('joined_of', { n: d.total_qty, moq: d.moq })}</span><span class="muted small">${left ? t('time_left', { t: left }) : d.status === 'open' ? t('ended') : ''}</span></div>
          <div style="margin-top:6px">${badge} ${mine}</div>
        </div>
      </div>`;
  }

  function viewDeals() {
    const open = S.deals.filter((d) => d.status === 'open');
    const past = S.deals.filter((d) => d.status !== 'open');
    if (!S.deals.length) return `<div class="empty">${t('no_groups')}</div>`;
    return `${open.length ? `<h2>${t('open_groups')}</h2>${open.map(dealCard).join('')}` : ''}
            ${past.length ? `<h2>${t('past_groups')}</h2>${past.map(dealCard).join('')}` : ''}`;
  }

  function paymentBlock(d, o) {
    if (!o) return '';
    let html = '';
    if (o.status === 'awaiting_payment' || o.status === 'receipt_uploaded') {
      html += `<h3>${t('amount_due')}</h3><div class="price">${money(o.total)}</div>`;
      if (d.pay_by) html += `<p class="muted small">${t('pay_by', { d: esc(dateStr(d.pay_by)) })}</p>`;
      html += `<h3>${t('how_to_pay')}</h3><div class="pre">${esc(S.cfg.payment_info || t('payment_missing'))}</div>`;
      if (o.reject_note !== null && o.reject_note !== undefined && o.status === 'awaiting_payment' && o.reject_note !== '') {
        html += `<div class="note red">${t('rejected_note', { note: esc(o.reject_note) })}</div>`;
      }
      html += `<p class="muted small">${t('receipt_hint')}</p>`;
      html += `<button class="btn" data-act="pickReceipt" data-order="${o.id}">${o.status === 'receipt_uploaded' ? t('replace_receipt') : t('upload_receipt')}</button>`;
    }
    return html;
  }

  function viewDeal() {
    const d = S.deals.find((x) => x.id === S.dealId);
    if (!d) return '';
    const o = d.my_order;
    const pct = Math.min(100, Math.round((d.total_qty / d.moq) * 100));
    const open = d.status === 'open' && d.deadline > Date.now();
    const left = timeLeft(d.deadline);
    const tierRows = d.tiers.map((x) => {
      const cur = d.locked_price != null ? x.price === d.locked_price : d.current_price === x.price;
      return `<tr class="${cur ? 'cur' : ''}"><td>${t('units_plus', { n: x.min_qty })}</td><td>${money(x.price)}</td></tr>`;
    }).join('');

    let action = '';
    if (open) {
      const maxAttr = d.max_per_buyer > 0 ? `max="${d.max_per_buyer}"` : '';
      action = `
        <h3>${t('quantity')}</h3>
        <div class="stepper">
          <button data-act="qtyMinus">-</button>
          <input id="qtyInput" type="number" inputmode="numeric" min="1" ${maxAttr} value="${S.qty}">
          <button data-act="qtyPlus">+</button>
        </div>
        <div class="kv"><span>${t('est_total')}</span><span id="est">${money(S.qty * d.current_price)}</span></div>
        <p class="muted small">${t('price_may_drop')}</p>
        <div class="btns">
          <button class="btn" data-act="join">${o ? t('update_qty') : t('join')}</button>
          ${o ? `<button class="btn danger" data-act="leave">${t('leave')}</button>` : ''}
        </div>`;
    }

    return `
      <button class="btn alt sm" data-act="back">${t('back')}</button>
      <div class="card" style="margin-top:10px">
        ${cover(d)}
        <div class="pad">
          <div class="title">${esc(d.title)}</div>
          <div class="row" style="margin-top:4px"><div class="price">${money(d.current_price)} <small>${t('per', { unit: esc(d.unit) })}</small></div>${d.locked_price != null ? `<span class="badge green">${t('final_price')}</span>` : `<span class="muted small">${t('price_now')}</span>`}</div>
          ${stepsHtml(d.status)}
          <div class="bar"><i style="width:${pct}%"></i></div>
          <div class="row"><span class="muted small">${t('joined_of', { n: d.total_qty, moq: d.moq })}</span><span class="muted small">${open && left ? t('time_left', { t: left }) : ''}</span></div>
          ${d.next_tier && open ? `<div class="note">${t('next_tier', { n: d.next_tier.min_qty - d.total_qty, price: money(d.next_tier.price) })}</div>` : ''}
        </div>
      </div>
      ${d.description ? `<p>${esc(d.description).replace(/\n/g, '<br>')}</p>` : ''}
      <div class="card"><div class="pad">
        ${d.origin ? `<div class="kv"><span>${t('origin')}</span><span>${esc(d.origin)}</span></div>` : ''}
        ${d.max_per_buyer > 0 ? `<div class="kv"><span>${t('max_per_buyer')}</span><span>${d.max_per_buyer}</span></div>` : ''}
        ${d.eta_text ? `<div class="kv"><span>${t('eta')}</span><span>${esc(d.eta_text)}</span></div>` : ''}
      </div></div>
      <h3>${t('tiers')}</h3>
      <div class="card"><table class="tiers">${tierRows}</table></div>
      <p class="muted small">${t('moq_note', { moq: d.moq })}</p>
      ${o ? `<div class="card"><div class="pad"><div class="title">${t('your_order')}</div>
        <div class="kv"><span>${t('quantity')}</span><span>${o.qty}</span></div>
        <div class="kv"><span>${o.price_is_final ? t('final_price') : t('price_now')}</span><span>${money(o.unit_price)}</span></div>
        <div class="kv"><span>${t('total')}</span><span>${money(o.total)}</span></div>
        <p><span class="badge ${o.status === 'paid' ? 'green' : o.status === 'awaiting_payment' ? 'amber' : ''}">${t('s_' + o.status)}</span></p>
        ${paymentBlock(d, o)}
      </div></div>` : ''}
      ${action}
      ${S.cfg.bot_username ? `<div class="btns"><button class="btn alt" data-act="share">${t('share')}</button></div>` : ''}`;
  }

  function viewOrders() {
    if (!S.orders.length) return `<div class="empty">${t('orders_empty')}</div>`;
    return S.orders.map((o) => `
      <div class="card tap" data-act="openDeal" data-id="${o.deal_id}"><div class="pad">
        <div class="row"><div class="title">${esc(o.title)}</div><span class="badge ${o.deal_status === 'cancelled' ? 'red' : 'amber'}">${t('d_' + o.deal_status)}</span></div>
        <div class="kv"><span>${t('quantity')}</span><span>${o.qty} x ${money(o.unit_price)}</span></div>
        <div class="kv"><span>${t('total')}</span><span>${money(o.total)}</span></div>
        <p><span class="badge ${o.status === 'paid' ? 'green' : o.status === 'awaiting_payment' ? 'amber' : ''}">${t('s_' + o.status)}</span></p>
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

  // ---------- admin views ----------
  function tierRowHtml(i) {
    return `<div class="tier-row">
      <input class="tMin" type="number" inputmode="numeric" min="1" placeholder="From units" ${i === 0 ? 'value="1" disabled' : ''}>
      <input class="tPrice" type="number" inputmode="decimal" min="0" step="0.01" placeholder="Price (ETB)">
      ${i > 0 ? '<button class="btn alt sm x" data-act="removeTier">x</button>' : '<span class="x"></span>'}
    </div>`;
  }

  function defaultDeadline() {
    const d = new Date(Date.now() + 7 * 86400000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }

  const NEXT = { open: ['locked'], locked: ['ordered'], ordered: ['shipped'], shipped: ['arrived'], arrived: ['closed'] };
  const NEXT_LABEL = { locked: 'Lock group', ordered: 'Mark as ordered', shipped: 'Mark as shipped', arrived: 'Mark as arrived', closed: 'Close' };

  function adminOrdersHtml(id) {
    const list = S.adminOrders[id];
    if (!list) return '<p class="muted">Loading</p>';
    if (!list.length) return '<p class="muted">No buyers yet.</p>';
    return list.map((o) => `
      <div class="card"><div class="pad">
        <div class="row"><b>${esc(o.name)}</b><span class="badge ${o.status === 'paid' ? 'green' : o.status === 'receipt_uploaded' ? 'amber' : ''}">${esc(o.status.replace('_', ' '))}</span></div>
        <div class="muted small">${o.username ? `<a href="https://t.me/${esc(o.username)}">@${esc(o.username)}</a> | ` : ''}${esc(o.phone || 'no phone')}${o.business_name ? ' | ' + esc(o.business_name) : ''}</div>
        <div class="kv"><span>${o.qty} units</span><span>${money(o.total)}</span></div>
        ${o.has_receipt ? `<button class="btn alt sm" data-act="viewReceipt" data-order="${o.id}">View receipt</button>` : ''}
        ${['receipt_uploaded', 'awaiting_payment'].includes(o.status) ? `<button class="btn sm" data-act="confirmOrder" data-order="${o.id}" data-deal="${id}">Confirm payment</button>` : ''}
        ${o.status === 'receipt_uploaded' ? `<button class="btn danger sm" data-act="rejectOrder" data-order="${o.id}" data-deal="${id}">Reject</button>` : ''}
        <button class="btn danger sm" data-act="cancelOrder" data-order="${o.id}" data-deal="${id}">Remove</button>
      </div></div>`).join('');
  }

  function viewAdmin() {
    const manage = S.deals.map((d) => {
      const nexts = NEXT[d.status] || [];
      const canCancel = ['open', 'locked'].includes(d.status);
      return `
      <div class="card"><div class="pad">
        <div class="row"><b>${esc(d.title)}</b><span class="badge amber">${esc(d.status)}</span></div>
        <div class="muted small">${d.total_qty} of ${d.moq} units | ${d.buyers} buyers | ${money(d.current_price)}${d.status === 'open' ? ' | ends ' + esc(dateStr(d.deadline)) : ''}</div>
        <div>
          ${nexts.map((n) => `<button class="btn sm" data-act="dealStatus" data-id="${d.id}" data-next="${n}">${NEXT_LABEL[n]}</button>`).join('')}
          ${canCancel ? `<button class="btn danger sm" data-act="dealStatus" data-id="${d.id}" data-next="cancelled">Cancel group</button>` : ''}
          <button class="btn alt sm" data-act="adminOrders" data-id="${d.id}">${S.adminOpen === d.id ? 'Hide buyers' : 'Buyers'}</button>
        </div>
        ${S.adminOpen === d.id ? `<div style="margin-top:10px">${adminOrdersHtml(d.id)}</div>` : ''}
      </div></div>`;
    }).join('');

    return `
      <h2>Payment details</h2>
      <p class="muted small">Shown to buyers after a group locks. Add the bank or mobile money accounts you use.</p>
      <textarea id="payInfo" placeholder="Bank name, account name, account number, Telebirr number">${esc(S.cfg.payment_info)}</textarea>
      <div class="btns"><button class="btn alt" data-act="savePay">Save payment details</button></div>

      <h2>Manage groups</h2>
      ${manage || '<p class="muted">No groups yet.</p>'}

      <h2>New group</h2>
      <label>Product name</label><input id="nTitle" maxlength="120">
      <label>Description</label><textarea id="nDesc" maxlength="2000" placeholder="Specs, model, what is included, quality notes"></textarea>
      <label>Origin</label><input id="nOrigin" placeholder="e.g. Guangzhou, China">
      <label>Sold per (unit)</label><input id="nUnit" placeholder="piece, carton, set" value="piece">
      <label>Photo</label><input id="nImage" type="file" accept="image/*">
      <label>Minimum units for the group to go ahead</label><input id="nMoq" type="number" inputmode="numeric" min="1">
      <label>Maximum units per buyer (0 for no limit)</label><input id="nMax" type="number" inputmode="numeric" min="0" value="0">
      <label>Join deadline</label><input id="nDeadline" type="datetime-local" value="${defaultDeadline()}">
      <label>Expected arrival (text)</label><input id="nEta" placeholder="e.g. about 35 days after the group locks">
      <label>Price tiers (price must drop as units rise)</label>
      <div id="tiers">${Array.from({ length: S.tierRows }, (_, i) => tierRowHtml(i)).join('')}</div>
      <button class="btn alt sm" data-act="addTier">Add tier</button>
      <div class="btns" style="margin-top:14px"><button class="btn" data-act="createDeal">Publish group</button></div>`;
  }

  // ---------- render ----------
  function render() {
    const view = $('view');
    if (!S.loaded) { view.innerHTML = `<div class="empty">${t('loading')}</div>`; return; }
    $('brandSub').textContent = '';
    if (S.dealId) view.innerHTML = viewDeal();
    else if (S.tab === 'deals') view.innerHTML = viewDeals();
    else if (S.tab === 'orders') view.innerHTML = viewOrders();
    else if (S.tab === 'profile') view.innerHTML = viewProfile();
    else if (S.tab === 'admin' && S.cfg.is_admin) view.innerHTML = viewAdmin();

    const tabs = [['deals', 'tab_deals'], ['orders', 'tab_orders'], ['profile', 'tab_profile']];
    if (S.cfg.is_admin) tabs.push(['admin', 'tab_admin']);
    $('nav').innerHTML = tabs.map(([k, label]) => `<button class="${S.tab === k && !S.dealId ? 'on' : ''}" data-act="tab" data-tab="${k}">${t(label)}</button>`).join('');

    if (tg && tg.BackButton) {
      if (S.dealId) tg.BackButton.show(); else tg.BackButton.hide();
    }
  }

  function goBack() { S.dealId = null; render(); window.scrollTo(0, 0); }
  if (tg && tg.BackButton) tg.BackButton.onClick(goBack);

  function clampQty(v) {
    const d = S.deals.find((x) => x.id === S.dealId);
    let n = Math.floor(Number(v));
    if (!Number.isFinite(n) || n < 1) n = 1;
    if (d && d.max_per_buyer > 0 && n > d.max_per_buyer) n = d.max_per_buyer;
    return n;
  }
  function setQty(v) {
    S.qty = clampQty(v);
    const d = S.deals.find((x) => x.id === S.dealId);
    const input = $('qtyInput');
    if (input) input.value = S.qty;
    const est = $('est');
    if (est && d) est.textContent = money(S.qty * d.current_price);
  }

  // ---------- actions ----------
  const H = {
    tab(el) { S.tab = el.dataset.tab; S.dealId = null; render(); window.scrollTo(0, 0); },
    openDeal(el) {
      S.dealId = Number(el.dataset.id);
      const d = S.deals.find((x) => x.id === S.dealId);
      S.qty = d && d.my_order ? d.my_order.qty : 1;
      render(); window.scrollTo(0, 0);
    },
    back: goBack,
    qtyMinus() { setQty(S.qty - 1); },
    qtyPlus() { setQty(S.qty + 1); },
    async join() {
      try {
        await api(`/api/deals/${S.dealId}/join`, { method: 'POST', body: { qty: S.qty } });
        await refreshDeals(); toast(t('joined_ok')); render();
      } catch (e) { fail(e); }
    },
    async leave() {
      const ok = await ask({ title: t('confirm_leave'), okLabel: t('leave'), danger: true });
      if (!ok) return;
      try {
        await api(`/api/deals/${S.dealId}/leave`, { method: 'POST' });
        await refreshDeals(); S.qty = 1; toast(t('left_ok')); render();
      } catch (e) { fail(e); }
    },
    pickReceipt(el) { $('receiptInput').dataset.order = el.dataset.order; $('receiptInput').click(); },
    async saveProfile() {
      try {
        const lang = $('pLang').value;
        const u = await api('/api/me', { method: 'PUT', body: { phone: $('pPhone').value, business_name: $('pBiz').value, lang } });
        S.cfg.user = u; S.lang = lang; toast(t('saved')); render();
      } catch (e) { fail(e); }
    },
    share() {
      const link = `https://t.me/${S.cfg.bot_username}?startapp=deal_${S.dealId}`;
      const d = S.deals.find((x) => x.id === S.dealId);
      const text = `${d.title}: ${money(d.current_price)} per ${d.unit}`;
      const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
      if (tg && tg.openTelegramLink) tg.openTelegramLink(url); else window.open(url, '_blank');
    },

    // admin
    addTier() { S.tierRows += 1; const keep = snapshotForm(); render(); restoreForm(keep); },
    removeTier(el) { el.closest('.tier-row').remove(); },
    async savePay() {
      try { await api('/api/admin/settings', { method: 'PUT', body: { payment_info: $('payInfo').value } }); S.cfg.payment_info = $('payInfo').value; toast('Saved'); }
      catch (e) { fail(e); }
    },
    async createDeal() {
      try {
        const tiers = [...document.querySelectorAll('#tiers .tier-row')].map((r, i) => ({
          min_qty: i === 0 ? 1 : Number(r.querySelector('.tMin').value),
          price: Number(r.querySelector('.tPrice').value),
        }));
        const f = new FormData();
        f.append('title', $('nTitle').value); f.append('description', $('nDesc').value);
        f.append('origin', $('nOrigin').value); f.append('unit', $('nUnit').value);
        f.append('moq', $('nMoq').value); f.append('max_per_buyer', $('nMax').value);
        f.append('deadline', String(new Date($('nDeadline').value).getTime()));
        f.append('eta_text', $('nEta').value); f.append('tiers', JSON.stringify(tiers));
        if ($('nImage').files[0]) f.append('image', $('nImage').files[0]);
        await api('/api/admin/deals', { method: 'POST', form: f });
        await refreshDeals(); S.tierRows = 2; toast('Group published'); render(); window.scrollTo(0, 0);
      } catch (e) { fail(e); }
    },
    async dealStatus(el) {
      const id = Number(el.dataset.id), next = el.dataset.next;
      const labels = { cancelled: 'Cancel this group? Buyers will be notified.', locked: 'Lock the group now? The price becomes final and buyers are asked to pay.' };
      let body = { status: next };
      if (next === 'shipped') {
        const eta = await ask({ title: 'Mark as shipped', text: 'Expected arrival shown to buyers (optional).', input: 'e.g. 12 November', okLabel: 'Mark shipped' });
        if (!eta) return;
        if (eta !== true) body.eta_text = eta;
      } else if (labels[next]) {
        const ok = await ask({ title: labels[next], okLabel: 'Yes', danger: next === 'cancelled' });
        if (!ok) return;
      }
      try {
        await api(`/api/admin/deals/${id}/status`, { method: 'POST', body });
      } catch (e) {
        if (e.data && e.data.can_force) {
          const ok = await ask({ title: 'Minimum not reached', text: 'The group has fewer units than the minimum. Lock it anyway?', okLabel: 'Lock anyway', danger: true });
          if (!ok) return;
          try { await api(`/api/admin/deals/${id}/status`, { method: 'POST', body: { ...body, force: true } }); } catch (e2) { return fail(e2); }
        } else return fail(e);
      }
      await refreshDeals(); delete S.adminOrders[id]; render();
      if (S.adminOpen === id) loadAdminOrders(id);
    },
    adminOrders(el) {
      const id = Number(el.dataset.id);
      S.adminOpen = S.adminOpen === id ? null : id;
      render();
      if (S.adminOpen) loadAdminOrders(id);
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
    async confirmOrder(el) { await orderAction(el, 'confirm'); },
    async rejectOrder(el) {
      const note = await ask({ title: 'Reject receipt', text: 'Tell the buyer why (they get this in Telegram).', input: 'Reason', okLabel: 'Reject', danger: true });
      if (!note) return;
      await orderAction(el, 'reject', { note: note === true ? '' : note });
    },
    async cancelOrder(el) {
      const ok = await ask({ title: 'Remove this buyer from the group?', okLabel: 'Remove', danger: true });
      if (!ok) return;
      await orderAction(el, 'cancel');
    },
  };

  async function orderAction(el, action, body) {
    try {
      await api(`/api/admin/orders/${el.dataset.order}/${action}`, { method: 'POST', body: body || {} });
      const id = Number(el.dataset.deal);
      await refreshDeals(); await loadAdminOrders(id, false); render();
    } catch (e) { fail(e); }
  }

  async function loadAdminOrders(id, rerender = true) {
    try { S.adminOrders[id] = await api(`/api/admin/deals/${id}/orders`); } catch (e) { return fail(e); }
    if (rerender) render();
  }

  // keep typed values when the new-group form re-renders
  function snapshotForm() {
    const ids = ['nTitle', 'nDesc', 'nOrigin', 'nUnit', 'nMoq', 'nMax', 'nDeadline', 'nEta', 'payInfo'];
    const vals = Object.fromEntries(ids.map((i) => [i, $(i) ? $(i).value : '']));
    vals.tiers = [...document.querySelectorAll('#tiers .tier-row')].map((r) => [r.querySelector('.tMin').value, r.querySelector('.tPrice').value]);
    return vals;
  }
  function restoreForm(v) {
    Object.keys(v).forEach((k) => { if (k !== 'tiers' && $(k)) $(k).value = v[k]; });
    document.querySelectorAll('#tiers .tier-row').forEach((r, i) => {
      if (v.tiers[i]) { if (i > 0) r.querySelector('.tMin').value = v.tiers[i][0]; r.querySelector('.tPrice').value = v.tiers[i][1]; }
    });
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || !H[el.dataset.act]) return;
    H[el.dataset.act](el, e);
  });
  document.addEventListener('input', (e) => { if (e.target.id === 'qtyInput') setQty(e.target.value); });

  $('receiptInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    const order = e.target.dataset.order;
    e.target.value = '';
    if (!file || !order) return;
    try {
      const f = new FormData();
      f.append('receipt', file);
      await api(`/api/orders/${order}/receipt`, { method: 'POST', form: f });
      await refreshDeals(); toast(t('uploaded')); render();
    } catch (err) { fail(err); }
  });

  // ---------- start ----------
  render();
  loadAll().then(() => {
    const sp = tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param;
    const m = sp && /^deal_(\d+)$/.exec(sp);
    if (m && S.deals.some((d) => d.id === Number(m[1]))) {
      S.dealId = Number(m[1]);
      const d = S.deals.find((x) => x.id === S.dealId);
      S.qty = d && d.my_order ? d.my_order.qty : 1;
    }
    render();
  }).catch((e) => {
    $('view').innerHTML = `<div class="empty">${e.message === 'unauthorized' ? 'Open this app from Telegram.' : t('error')}</div>`;
  });
})();
