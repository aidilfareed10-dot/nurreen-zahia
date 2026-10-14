/* Nurreen Zahia & Associates — demo data layer.
   Everything lives in localStorage so the prototype runs with no backend.
   Swap these functions for Supabase/Firebase calls when going live. */
(function () {
  const KEY = 'nza_db_v1';
  const SESSION = 'nza_session';
  const FIRM_TZ = 'Asia/Kuala_Lumpur';

  const uid = (p) => p + '_' + Math.random().toString(36).slice(2, 9);
  const daysFromNow = (d, h = 10, m = 0) => {
    const t = new Date();
    t.setUTCDate(t.getUTCDate() + d);
    t.setUTCHours(h - 8, m, 0, 0); // h is Kuala Lumpur local hour (UTC+8)
    return t.toISOString();
  };

  const AREAS = [
    'General Civil Litigation',
    'Commercial Litigation & Contract Disputes',
    'Construction Law & Infrastructure',
    'Injunctions & Specific Performance',
    'Debt Recovery & Insolvency',
    'Property & Land Disputes',
    'Shareholder Disputes & Corporate Advisory',
    'Arbitration & Mediation (ADR)',
    'Foreign Investment & Cross-Border Matters',
  ];

  const STAGES = ['Enquiry', 'Engagement & KYC', 'Case review', 'Pleadings / Negotiation', 'Hearing / Settlement', 'Closed'];

  function seed() {
    return {
      settings: {
        firmName: 'Nurreen Zahia & Associates',
        phone: '+60 3-5510 2266',
        whatsapp: '+60 12-388 6620',
        email: 'general@nza.com',
        // Indicative MYR conversion rates — editable by admin.
        rates: { MYR: 1, USD: 0.236, SGD: 0.305, GBP: 0.178, EUR: 0.204, AUD: 0.358, AED: 0.867, SAR: 0.885, CNY: 1.69, JPY: 34.9, IDR: 3790 },
      },
      users: [
        { id: 'u_admin', role: 'admin', name: 'Nurreen Najieha', title: 'Managing Partner', email: 'admin@nza.com', password: 'admin123', tz: FIRM_TZ, lang: 'en', currency: 'MYR' },
        { id: 'u_sarah', role: 'client', name: 'Sarah Thompson', email: 'client@nza.com', password: 'client123', company: 'Harbourline Capital Ltd', country: 'United Kingdom', phone: '+44 20 7946 0123', tz: 'Europe/London', lang: 'en', currency: 'GBP', joined: daysFromNow(-60) },
        { id: 'u_wei', role: 'client', name: 'Lim Wei Jie', email: 'weijie@example.com', password: 'client123', company: 'Straits Build Pte Ltd', country: 'Singapore', phone: '+65 6123 4567', tz: 'Asia/Singapore', lang: 'zh', currency: 'SGD', joined: daysFromNow(-120) },
        { id: 'u_omar', role: 'client', name: 'Omar Al-Mansouri', email: 'omar@example.com', password: 'client123', company: 'Gulf Horizon Holdings', country: 'United Arab Emirates', phone: '+971 4 123 4567', tz: 'Asia/Dubai', lang: 'ar', currency: 'AED', joined: daysFromNow(-25) },
      ],
      matters: [
        {
          id: 'm1', ref: 'NZA/CL/2026/0142', clientId: 'u_sarah', title: 'Joint-venture breach of contract — Harbourline v. Meridian Properties',
          area: AREAS[1], stage: 3, lawyer: 'Nurreen Najieha', opened: daysFromNow(-55), court: 'Shah Alam Court Complex',
          nextEvent: { label: 'Case management (e-Review)', date: daysFromNow(9, 9, 30) },
          updates: [
            { date: daysFromNow(-55), text: 'Matter opened. Engagement letter and remote KYC completed.' },
            { date: daysFromNow(-41), text: 'Letter of demand issued to Meridian Properties Sdn Bhd.' },
            { date: daysFromNow(-20), text: 'Writ of summons and statement of claim filed via e-Filing.' },
            { date: daysFromNow(-6), text: 'Defence received. We are preparing the reply and a summary judgment assessment.' },
          ],
        },
        {
          id: 'm2', ref: 'NZA/PR/2026/0157', clientId: 'u_sarah', title: 'Purchase of commercial unit, Bangsar South — due diligence',
          area: AREAS[8], stage: 2, lawyer: 'Izza Batrisya binti Ahmad Hamidi', opened: daysFromNow(-18), court: '—',
          nextEvent: { label: 'State consent application review', date: daysFromNow(14) },
          updates: [
            { date: daysFromNow(-18), text: 'Instructions received. Title search and encumbrance check requested.' },
            { date: daysFromNow(-7), text: 'Title search clean. Foreign-purchaser threshold confirmed for Selangor; consent application being prepared.' },
          ],
        },
        {
          id: 'm3', ref: 'NZA/CN/2026/0118', clientId: 'u_wei', title: 'CIPAA adjudication — unpaid progress claims',
          area: AREAS[2], stage: 4, lawyer: 'Muhammad Darwisy bin Mohd Nazri', opened: daysFromNow(-110), court: 'AIAC (CIPAA adjudication)',
          nextEvent: { label: 'Adjudication decision expected', date: daysFromNow(5) },
          updates: [
            { date: daysFromNow(-110), text: 'Payment claim served under CIPAA 2012.' },
            { date: daysFromNow(-70), text: 'Adjudicator appointed by AIAC.' },
            { date: daysFromNow(-30), text: 'Adjudication reply filed.' },
          ],
        },
        {
          id: 'm4', ref: 'NZA/CO/2026/0163', clientId: 'u_omar', title: 'Shareholder agreement — Malaysian subsidiary set-up',
          area: AREAS[6], stage: 1, lawyer: 'Fatihah binti Faizal', opened: daysFromNow(-10), court: '—',
          nextEvent: { label: 'Draft SHA for review', date: daysFromNow(3) },
          updates: [{ date: daysFromNow(-10), text: 'Engagement letter issued. Awaiting certified passport copies for KYC.' }],
        },
      ],
      documents: [
        { id: 'd1', matterId: 'm1', clientId: 'u_sarah', name: 'Engagement letter (signed).pdf', size: 184320, by: 'firm', date: daysFromNow(-55), category: 'Engagement' },
        { id: 'd2', matterId: 'm1', clientId: 'u_sarah', name: 'Statement of claim — sealed.pdf', size: 612000, by: 'firm', date: daysFromNow(-20), category: 'Court filing' },
        { id: 'd3', matterId: 'm1', clientId: 'u_sarah', name: 'JV agreement 2023.pdf', size: 1240000, by: 'client', date: daysFromNow(-50), category: 'Evidence' },
        { id: 'd4', matterId: 'm2', clientId: 'u_sarah', name: 'Title search result.pdf', size: 98000, by: 'firm', date: daysFromNow(-7), category: 'Due diligence' },
        { id: 'd5', matterId: 'm3', clientId: 'u_wei', name: 'Adjudication reply.pdf', size: 870000, by: 'firm', date: daysFromNow(-30), category: 'Court filing' },
      ],
      messages: [
        { id: 'msg1', clientId: 'u_sarah', matterId: 'm1', from: 'firm', author: 'Nurreen Najieha', text: 'Dear Sarah, the defence has been filed. I have uploaded a short note on our next steps — happy to walk you through it on a call at a time that suits London.', date: daysFromNow(-6), read: false },
        { id: 'msg2', clientId: 'u_sarah', matterId: 'm1', from: 'client', author: 'Sarah Thompson', text: 'Thank you. Could we speak next Tuesday afternoon UK time?', date: daysFromNow(-5), read: true },
        { id: 'msg3', clientId: 'u_wei', matterId: 'm3', from: 'firm', author: 'Muhammad Darwisy', text: 'The adjudicator has confirmed the decision timeline. We will update you as soon as it is delivered.', date: daysFromNow(-3), read: false },
      ],
      invoices: [
        { id: 'i1', number: 'INV-2026-0311', clientId: 'u_sarah', matterId: 'm1', amount: 18500, status: 'paid', issued: daysFromNow(-50), due: daysFromNow(-36), items: 'Professional fees — pre-action & filing' },
        { id: 'i2', number: 'INV-2026-0388', clientId: 'u_sarah', matterId: 'm1', amount: 9200, status: 'unpaid', issued: daysFromNow(-4), due: daysFromNow(10), items: 'Professional fees — defence review; disbursements' },
        { id: 'i3', number: 'INV-2026-0354', clientId: 'u_wei', matterId: 'm3', amount: 26000, status: 'unpaid', issued: daysFromNow(-20), due: daysFromNow(-6), items: 'CIPAA adjudication — professional fees' },
      ],
      appointments: [
        { id: 'a1', clientId: 'u_sarah', when: daysFromNow(4, 16, 0), mode: 'Video (Zoom / Google Meet)', lawyer: 'Nurreen Najieha', topic: 'Reply to defence — strategy call', status: 'confirmed' },
        { id: 'a2', clientId: 'u_omar', when: daysFromNow(2, 14, 0), mode: 'Video (Zoom / Google Meet)', lawyer: 'Fatihah binti Faizal', topic: 'SHA kick-off', status: 'requested' },
      ],
      enquiries: [
        { id: 'e1', name: 'Hiroshi Tanaka', email: 'h.tanaka@example.jp', phone: '+81 3 1234 5678', country: 'Japan', area: AREAS[8], mode: 'Video (Zoom / Google Meet)', tz: 'Asia/Tokyo', slot: daysFromNow(3, 10, 0), message: 'We are a Japanese manufacturer planning a JV in Selangor and need advice on structuring and shareholder protections.', urgent: false, date: daysFromNow(-1), status: 'new' },
        { id: 'e2', name: 'Priya Raman', email: 'priya.r@example.com', phone: '+61 2 9876 5432', country: 'Australia', area: AREAS[5], mode: 'Telephone', tz: 'Australia/Sydney', slot: daysFromNow(2, 11, 0), message: 'Dispute with a tenant over a property I own in Shah Alam. I live in Sydney.', urgent: true, date: daysFromNow(0), status: 'new' },
      ],
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* storage unavailable */ }
    const db = seed();
    save(db);
    return db;
  }
  function save(db) {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { console.warn('Could not save', e); }
  }

  let db = load();

  const Store = {
    FIRM_TZ, AREAS, STAGES, uid,
    get db() { return db; },
    commit() { save(db); },
    reset() { db = seed(); save(db); },

    // ---- auth (demo only — replace with real auth before launch) ----
    login(email, password) {
      const u = db.users.find((x) => x.email.toLowerCase() === String(email).trim().toLowerCase() && x.password === password);
      if (!u) return null;
      try { sessionStorage.setItem(SESSION, u.id); } catch (e) {}
      return u;
    },
    logout() { try { sessionStorage.removeItem(SESSION); } catch (e) {} },
    current() {
      let id = null;
      try { id = sessionStorage.getItem(SESSION); } catch (e) {}
      return db.users.find((u) => u.id === id) || null;
    },
    require(role) {
      const u = Store.current();
      if (!u || u.role !== role) { location.href = 'login.html?role=' + role; return null; }
      return u;
    },
    register(data) {
      if (db.users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) return { error: 'An account with this email already exists.' };
      const u = { id: uid('u'), role: 'client', joined: new Date().toISOString(), lang: 'en', ...data };
      db.users.push(u); save(db);
      return { user: u };
    },

    // ---- helpers ----
    user: (id) => db.users.find((u) => u.id === id),
    clients: () => db.users.filter((u) => u.role === 'client'),
    byClient: (coll, id) => db[coll].filter((x) => x.clientId === id),
    add(coll, item) { item.id = item.id || uid(coll[0]); db[coll].unshift(item); save(db); return item; },
    update(coll, id, patch) { const x = db[coll].find((i) => i.id === id); if (x) Object.assign(x, patch); save(db); return x; },
    remove(coll, id) { db[coll] = db[coll].filter((i) => i.id !== id); save(db); },
  };

  // ---------- formatting helpers shared by all pages ----------
  const Fmt = {
    date(iso, tz, opts) {
      return new Intl.DateTimeFormat('en-GB', { timeZone: tz || FIRM_TZ, day: 'numeric', month: 'short', year: 'numeric', ...opts }).format(new Date(iso));
    },
    time(iso, tz) {
      return new Intl.DateTimeFormat('en-GB', { timeZone: tz || FIRM_TZ, hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
    },
    dateTime(iso, tz) {
      return new Intl.DateTimeFormat('en-GB', { timeZone: tz || FIRM_TZ, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
    },
    tzLabel(tz) {
      try {
        const p = new Intl.DateTimeFormat('en-GB', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(new Date());
        const off = (p.find((x) => x.type === 'timeZoneName') || {}).value || '';
        return tz.split('/').pop().replace(/_/g, ' ') + ' (' + off + ')';
      } catch (e) { return tz; }
    },
    money(myr, cur) {
      cur = cur || 'MYR';
      const rate = (db.settings.rates || {})[cur] || 1;
      return new Intl.NumberFormat('en-GB', { style: 'currency', currency: cur, maximumFractionDigits: cur === 'JPY' || cur === 'IDR' ? 0 : 2 }).format(myr * rate);
    },
    size(b) { return b > 1e6 ? (b / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; },
    ago(iso) {
      const s = (Date.now() - new Date(iso).getTime()) / 1000;
      if (s < 60) return 'just now';
      if (s < 3600) return Math.floor(s / 60) + ' min ago';
      if (s < 86400) return Math.floor(s / 3600) + ' h ago';
      return Math.floor(s / 86400) + ' d ago';
    },
    esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); },
  };

  // Common time zones for international clients.
  const TIMEZONES = [
    'Asia/Kuala_Lumpur', 'Asia/Singapore', 'Asia/Jakarta', 'Asia/Bangkok', 'Asia/Hong_Kong', 'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Seoul',
    'Asia/Kolkata', 'Asia/Dubai', 'Asia/Riyadh', 'Asia/Qatar', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Amsterdam',
    'Europe/Zurich', 'Europe/Istanbul', 'Africa/Johannesburg', 'Africa/Lagos', 'America/New_York', 'America/Chicago', 'America/Los_Angeles',
    'America/Toronto', 'America/Sao_Paulo', 'Australia/Perth', 'Australia/Sydney', 'Pacific/Auckland',
  ];

  const COUNTRIES = [
    ['Malaysia', '+60'], ['Singapore', '+65'], ['Indonesia', '+62'], ['Brunei', '+673'], ['Thailand', '+66'], ['China', '+86'], ['Hong Kong', '+852'],
    ['Japan', '+81'], ['South Korea', '+82'], ['India', '+91'], ['United Arab Emirates', '+971'], ['Saudi Arabia', '+966'], ['Qatar', '+974'],
    ['United Kingdom', '+44'], ['Ireland', '+353'], ['Germany', '+49'], ['France', '+33'], ['Netherlands', '+31'], ['Switzerland', '+41'],
    ['Turkey', '+90'], ['United States', '+1'], ['Canada', '+1'], ['Australia', '+61'], ['New Zealand', '+64'], ['South Africa', '+27'], ['Other', ''],
  ];

  function detectTZ() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || FIRM_TZ; } catch (e) { return FIRM_TZ; }
  }

  // Bookable consultation slots: Mon–Fri, 9am–6pm Kuala Lumpur time, next N business days.
  function slots(days = 10) {
    const out = [];
    const base = new Date();
    for (let d = 1; out.length < days * 8 && d < days * 2; d++) {
      const day = new Date(base); day.setUTCDate(base.getUTCDate() + d);
      const klDay = new Intl.DateTimeFormat('en-GB', { timeZone: FIRM_TZ, weekday: 'short' }).format(day);
      if (klDay === 'Sat' || klDay === 'Sun') continue;
      for (const h of [9, 10, 11, 12, 14, 15, 16, 17]) {
        const t = new Date(day); t.setUTCHours(h - 8, 0, 0, 0); out.push(t.toISOString());
      }
    }
    return out;
  }

  function firmOpen() {
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: FIRM_TZ, weekday: 'short', hour: 'numeric', hour12: false }).formatToParts(new Date());
    const wd = p.find((x) => x.type === 'weekday').value, h = +p.find((x) => x.type === 'hour').value;
    return wd !== 'Sat' && wd !== 'Sun' && h >= 9 && h < 18;
  }

  window.Store = Store;
  window.Fmt = Fmt;
  window.NZA = { TIMEZONES, COUNTRIES, detectTZ, slots, firmOpen };
})();
