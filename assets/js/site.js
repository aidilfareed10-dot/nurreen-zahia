(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { TIMEZONES, COUNTRIES, detectTZ, slots, firmOpen } = window.NZA;
  const FIRM_TZ = Store.FIRM_TZ;
  const t = I18N.t;

  const ICONS = {
    globe: '<path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/><circle cx="12" cy="12" r="9"/>',
    scale: '<path d="M12 3v18M5 21h14M4 7h16M7 7l-3 7a3 3 0 0 0 6 0L7 7zm10 0l-3 7a3 3 0 0 0 6 0l-3-7z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    currency: '<circle cx="9" cy="9" r="6"/><path d="M15.5 9.5A6 6 0 1 1 9.5 15.5"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  };
  $$('[data-icon]').forEach((el) => {
    el.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[el.dataset.icon] || ''}</svg>`;
  });

  // ---------- practice areas ----------
  const PRACTICE = [
    ['General Civil Litigation', 'Robust courtroom representation before the High Court of Malaya and subordinate courts, dedicated to protecting client rights and securing optimal remedies.', ['High Court & appellate advocacy', 'Dispute resolution & trial defence', 'Civil claims & court actions']],
    ['Commercial Litigation & Contract Disputes', 'Strategic handling of breach of contract, business disputes and contractual claims, with careful commercial and financial risk assessment — including disputes with overseas counterparties.', ['Breach of contract & enforcement', 'Business & partnership conflicts', 'Claims for damages & restitution']],
    ['Construction Law & Infrastructure', 'Specialised counsel on construction agreements, delays, defective works, payment obligations, and CIPAA adjudication or court claims.', ['Construction contract disputes', 'Payment claims & defective works', 'Delays & liquidated damages']],
    ['Injunctions & Specific Performance', 'Urgent interlocutory applications and equitable remedies where monetary compensation is inadequate to protect legal and commercial interests.', ['Interlocutory & prohibitory injunctions', 'Specific performance orders', 'Asset preservation & restraining orders']],
    ['Debt Recovery & Insolvency', 'Decisive action to recover outstanding corporate and individual debts, including for foreign creditors, with winding-up and bankruptcy remedies.', ['Corporate & commercial debt recovery', 'Creditor rights & bankruptcy actions', 'Enforcement of judgments & winding-up']],
    ['Property & Land Disputes', 'Advisory and dispute handling for real estate, land issues, sale & purchase agreements and proprietary rights — for resident and non-resident owners.', ['Sale & purchase disputes', 'Land titles & proprietary claims', 'Tenancy, lease & boundary issues']],
    ['Shareholder Disputes & Corporate Advisory', 'Guiding owners, directors and shareholders through governance conflicts, oppression claims and commercial agreements.', ['Shareholder & director conflicts', 'Corporate agreements & drafting', 'Oppression & minority protection']],
    ['Arbitration & Mediation (ADR)', 'Alternative dispute resolution strategies that resolve complex commercial disputes confidentially and cost-effectively, including AIAC and international arbitration.', ['Domestic & international arbitration', 'Structured mediation sessions', 'Settlement agreements & negotiations']],
    ['Foreign Investment & Cross-Border Matters', 'A trusted partner on the ground for overseas individuals, investors and companies — from market entry and property acquisition to enforcing foreign judgments and awards in Malaysia.', ['Company set-up & joint ventures', 'Foreign purchase of property & State consent', 'Recognition & enforcement of foreign judgments and awards']],
  ];
  const list = $('#practiceList');
  list.innerHTML = `<div class="p-list" role="tablist">${PRACTICE.map((p, i) => `<button class="p-item${i ? '' : ' active'}" role="tab" aria-selected="${!i}" data-i="${i}"><span>${String(i + 1).padStart(2, '0')}</span>${p[0]}</button>`).join('')}</div><div class="p-detail" id="pDetail" role="tabpanel"></div>`;
  function showPractice(i) {
    const [name, desc, items] = PRACTICE[i];
    const d = $('#pDetail');
    d.classList.remove('fade'); void d.offsetWidth; d.classList.add('fade');
    d.innerHTML = `<div class="num">${String(i + 1).padStart(2, '0')}</div><h3>${name}</h3><p>${desc}</p><ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>
      <a href="#contact" class="btn btn-navy" data-area="${name}"><span>${t('practice.cta')}</span><span class="arrow"></span></a>`;
    $$('.p-item').forEach((b) => { const on = +b.dataset.i === i; b.classList.toggle('active', on); b.setAttribute('aria-selected', on); });
  }
  list.addEventListener('click', (e) => { const b = e.target.closest('.p-item'); if (b) showPractice(+b.dataset.i); });
  document.addEventListener('click', (e) => { const a = e.target.closest('[data-area]'); if (a) $('#fArea').value = a.dataset.area; });
  showPractice(0);

  // ---------- associates ----------
  const ASSOC = [
    ['Adam Afiz bin Zairul Azizi', 'Civil & commercial litigation · Debt recovery'],
    ['Fatihah binti Faizal', 'Corporate & commercial advisory · Regulatory compliance'],
    ['Izza Batrisya binti Ahmad Hamidi', 'Conveyancing & real estate · Banking documentation'],
    ['Muhammad Darwisy bin Mohd Nazri', 'Construction law & claims · Arbitration & mediation'],
    ['Nur Amaniena Huurin binti Aman Rasidi', 'Islamic estate planning · Hibah & wasiat · Family'],
    ['Wan Rania Emalynn Iman bt Wan', 'Employment & industrial relations'],
    ['Wan Nur Aisyah binti Mohd Jaafar', 'Civil litigation · Injunctions · Property disputes'],
  ];
  const initials = (n) => n.split(' ').filter((w) => !/^(bin|binti|bt|b\.)$/i.test(w)).slice(0, 2).map((w) => w[0]).join('');
  $('#associates').innerHTML = ASSOC.map(([n, f]) => `<div class="assoc"><div class="monogram">${initials(n)}</div><div><h4>${n}</h4><p>Legal Associate · LL.B (Hons), Advocate &amp; Solicitor</p><p>${f}</p></div></div>`).join('');

  // ---------- FAQ ----------
  const FAQ = [
    ['', 'Do you offer an initial consultation?', 'Yes. Your first consultation is complimentary and without obligation. We review the facts, give an honest preliminary assessment of available remedies, and explain expected timelines and costs — at our chambers, by secure video conference or by telephone.'],
    ['International', 'I live outside Malaysia. Do I need to travel to instruct you?', 'In most matters, no. Consultations, engagement, identity verification, document exchange and updates are all handled remotely through video calls and our secure client portal. If a court requires your attendance, we will tell you early and explore remote options where the rules allow.'],
    ['International', 'How do I sign documents from abroad?', 'Many documents can be signed electronically. Where a document must be sworn or witnessed — such as an affidavit or a power of attorney — we will guide you through notarisation and any legalisation needed in your country so it is accepted in Malaysia.'],
    ['International', 'Can I pay in my own currency?', 'Our fees are quoted in Malaysian Ringgit, and your portal shows every estimate and invoice converted into your preferred currency for reference. Payment is accepted by international bank transfer.'],
    ['International', 'Can a foreign judgment or arbitral award be enforced in Malaysia?', 'Often, yes. Judgments from certain reciprocating countries can be registered under Malaysian law, and arbitral awards from New York Convention states can be recognised and enforced. We will assess which route applies to your judgment or award.'],
    ['', 'How are your legal fees structured?', 'Depending on the matter we work on fixed fees, staged fees or time-based billing. You will receive a written estimate before any work begins, and no surprise charges.'],
    ['', 'Can you assist with urgent injunctions or freezing orders?', 'Yes. Where assets or evidence are at risk we can move quickly to seek urgent relief from the High Court. Tick the “urgent” box on the enquiry form or call us directly.'],
    ['', 'Is my information kept confidential?', 'Absolutely. Communications with us are protected by legal professional privilege, and personal data is handled in line with the Personal Data Protection Act 2010.'],
  ];
  $('#faqList').innerHTML = FAQ.map(([tag, q, a], i) => `<details${i ? '' : ' open'}><summary>${tag ? `<span class="tag">${tag}</span>` : ''}${q}</summary><p>${a}</p></details>`).join('');

  // ---------- clocks ----------
  const userTZ = detectTZ();
  const fmtT = (tz) => new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit' }).format(new Date());
  function tickTop() {
    $('#clockFirm').textContent = fmtT(FIRM_TZ);
    $('#clockYou').textContent = fmtT(userTZ);
    const open = firmOpen();
    $('#openDot').classList.toggle('off', !open);
    $('#openLabel').textContent = t(open ? 'top.open' : 'top.closed');
  }

  // ---------- time zone planner ----------
  const tzPick = $('#tzPick');
  const tzList = TIMEZONES.includes(userTZ) ? TIMEZONES : [userTZ, ...TIMEZONES];
  tzList.forEach((z) => tzPick.add(new Option(Fmt.tzLabel(z), z)));
  tzPick.value = userTZ;

  function offsetMinutes(tz, d = new Date()) {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }).formatToParts(d).map((x) => [x.type, x.value]));
    const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
    return Math.round((asUTC - d.getTime()) / 60000);
  }
  function renderTZ() {
    const tz = tzPick.value, now = new Date();
    const dOpts = { weekday: 'short', day: 'numeric', month: 'short' };
    $('#tzFirm').textContent = fmtT(FIRM_TZ);
    $('#tzFirmDate').textContent = new Intl.DateTimeFormat('en-GB', { timeZone: FIRM_TZ, ...dOpts }).format(now);
    $('#tzYou').textContent = fmtT(tz);
    $('#tzYouDate').textContent = new Intl.DateTimeFormat('en-GB', { timeZone: tz, ...dOpts }).format(now);
    $('#tzYouLabel').textContent = tz.split('/').pop().replace(/_/g, ' ');
    // chambers 09:00–18:00 KL expressed in the selected zone's 24h day
    const diff = (offsetMinutes(tz) - offsetMinutes(FIRM_TZ)) / 60; // hours ahead of KL
    const start = ((9 + diff) % 24 + 24) % 24, end = start + 9;
    const seg = (a, b) => `<div class="open" style="left:${(a / 24) * 100}%;width:${((b - a) / 24) * 100}%"></div>`;
    let bars = end <= 24 ? seg(start, end) : seg(start, 24) + seg(0, end - 24);
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(now);
    const h = +p.find((x) => x.type === 'hour').value + +p.find((x) => x.type === 'minute').value / 60;
    $('#tzBar').innerHTML = bars + `<div class="now" style="left:${(h / 24) * 100}%"></div><div class="ticks"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div>`;
    const hh = (x) => { const m = Math.round((x % 24) * 60); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
    const diffTxt = diff === 0 ? 'the same time as' : `${Math.abs(diff)} hour${Math.abs(diff) === 1 ? '' : 's'} ${diff > 0 ? 'ahead of' : 'behind'}`;
    $('#tzNote').innerHTML = `You are ${diffTxt} Shah Alam. Our office hours are <strong>${hh(start)} – ${hh(end)}</strong> your time (Mon–Fri). ${firmOpen() ? 'We are <strong>open now</strong>.' : 'We are currently closed — book a slot below and we will confirm by email.'}`;
  }
  tzPick.addEventListener('change', () => { renderTZ(); fTz.value = tzPick.value; renderSlots(); });

  // ---------- enquiry form ----------
  const fCountry = $('#fCountry'), fDial = $('#fDial'), fTz = $('#fTz'), fSlot = $('#fSlot'), fArea = $('#fArea');
  function fillSelects() {
    fArea.innerHTML = ''; fArea.add(new Option(t('f.choose'), ''));
    Store.AREAS.forEach((a) => fArea.add(new Option(a, a)));
    fArea.add(new Option('Other / general consultation', 'Other'));
  }
  COUNTRIES.forEach(([c, d]) => fCountry.add(new Option(c, c)));
  const guess = { 'Asia/Singapore': 'Singapore', 'Europe/London': 'United Kingdom', 'Asia/Dubai': 'United Arab Emirates', 'Asia/Tokyo': 'Japan', 'Australia/Sydney': 'Australia', 'America/New_York': 'United States', 'Asia/Jakarta': 'Indonesia', 'Asia/Shanghai': 'China', 'Asia/Hong_Kong': 'Hong Kong', 'Asia/Riyadh': 'Saudi Arabia', 'Asia/Kolkata': 'India' }[userTZ];
  fCountry.value = guess || 'Malaysia';
  const syncDial = () => { fDial.textContent = (COUNTRIES.find((c) => c[0] === fCountry.value) || [])[1] || '+'; };
  fCountry.addEventListener('change', syncDial); syncDial();
  tzList.forEach((z) => fTz.add(new Option(Fmt.tzLabel(z), z)));
  fTz.value = userTZ;
  function renderSlots() {
    const tz = fTz.value, prev = fSlot.value;
    fSlot.innerHTML = '';
    fSlot.add(new Option('Flexible — please propose a time', ''));
    slots(8).forEach((iso) => fSlot.add(new Option(`${Fmt.dateTime(iso, tz)}  ·  ${Fmt.time(iso, FIRM_TZ)} in Shah Alam`, iso)));
    fSlot.value = prev;
  }
  fTz.addEventListener('change', renderSlots);
  fillSelects(); renderSlots();

  const form = $('#enquiryForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form), err = $('#formError');
    if (fd.get('website')) return; // bot
    const missing = ['name', 'email', 'phone', 'area', 'message'].filter((k) => !String(fd.get(k) || '').trim());
    if (missing.length) { err.textContent = 'Please complete all required fields.'; form.querySelector(`[name=${missing[0]}]`).focus(); return; }
    if (!/^\S+@\S+\.\S+$/.test(fd.get('email'))) { err.textContent = 'Please enter a valid email address.'; return; }
    if (!fd.get('consent')) { err.textContent = 'Please confirm your consent under the PDPA to proceed.'; return; }
    err.textContent = '';
    Store.add('enquiries', {
      name: fd.get('name').trim(), email: fd.get('email').trim(), phone: `${fDial.textContent} ${fd.get('phone').trim()}`, country: fd.get('country'),
      area: fd.get('area'), mode: fd.get('mode'), tz: fd.get('tz'), slot: fd.get('slot') || null, message: fd.get('message').trim(),
      urgent: !!fd.get('urgent'), date: new Date().toISOString(), status: 'new', lang: I18N.getLang(),
    });
    const slot = fd.get('slot');
    form.innerHTML = `<div class="form-success"><span class="check-ic">✓</span><h3>Enquiry received</h3><p>${t('f.thanks')}</p>${slot ? `<p class="muted">Requested: <strong>${Fmt.dateTime(slot, fd.get('tz'))}</strong> your time.</p>` : ''}<p class="muted">Want to track it? <a href="register.html?email=${encodeURIComponent(fd.get('email'))}">Create a client portal account</a>.</p></div>`;
  });

  // ---------- header, menu, reveal, counters ----------
  const header = $('#header');
  addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 10), { passive: true });
  const menuBtn = $('#menuBtn'), nav = $('#nav');
  menuBtn.addEventListener('click', () => { const o = nav.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', o); });
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', false); } });

  $$('.section-head, .split > *, .intl-card, .partner, .assoc, .quotes figure, .steps li, .tz-widget, .contact-form').forEach((el) => el.classList.add('reveal'));
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: 0.12 }) : null;
  $$('.reveal').forEach((el) => (io ? io.observe(el) : el.classList.add('in')));

  const cio = 'IntersectionObserver' in window ? new IntersectionObserver((ents) => ents.forEach((en) => {
    if (!en.isIntersecting) return; cio.unobserve(en.target);
    const el = en.target, end = +el.dataset.count, t0 = performance.now();
    const step = (now) => { const k = Math.min(1, (now - t0) / 1400); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), { threshold: 0.5 }) : null;
  $$('[data-count]').forEach((el) => (cio ? cio.observe(el) : (el.textContent = el.dataset.count)));

  $('#year').textContent = new Date().getFullYear();
  document.addEventListener('langchange', () => { tickTop(); fillSelects(); showPractice(+($('.p-item.active') || { dataset: { i: 0 } }).dataset.i); });
  tickTop(); renderTZ();
  setInterval(() => { tickTop(); renderTZ(); }, 30000);
})();
