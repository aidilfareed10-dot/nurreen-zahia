/* Shared UI for the client and admin portals: shell, router, modal, toast and the case-progress tracker. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = Fmt.esc;

  const ICON = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
    doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"/><path d="M14 3v5h5"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2 .7 3.2 2.6 3.7 5.5"/>',
    inbox: '<path d="M3 13l3-8h12l3 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M3 13h5l1 3h6l1-3h5"/>',
    board: '<rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="11" rx="1"/><rect x="17" y="4" width="4" height="7" rx="1"/>',
    cog: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  };
  const icon = (n, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICON[n] || ''}</svg>`;
  const initials = (n) => String(n || '?').split(' ').filter((w) => !/^(bin|binti|bt|al-)/i.test(w)).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  function toast(msg) {
    let el = $('#toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg; el.classList.add('show');
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 2800);
  }

  function modal(html, { wide } = {}) {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal${wide ? ' wide' : ''}" role="dialog" aria-modal="true">${html}</div>`;
    const close = () => { bg.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    bg.addEventListener('click', (e) => { if (e.target === bg || e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(bg);
    const first = bg.querySelector('input, select, textarea'); if (first) first.focus();
    return { el: bg, close };
  }

  // ---------- case progress ----------
  const pct = (m) => Math.round((m.stage / (Store.STAGES.length - 1)) * 100);
  function progress(m) {
    const stages = Store.STAGES;
    return `<div class="progress">
      <div class="prog-top"><div class="pct">${pct(m)}%<small>complete</small></div><span class="badge ${m.stage === stages.length - 1 ? 'ok' : 'gold'}">Stage ${m.stage + 1} of ${stages.length}: ${esc(stages[m.stage])}</span></div>
      <div class="bar" style="margin-bottom:22px"><i style="width:${pct(m)}%"></i></div>
      <ol class="stages">${stages.map((s, i) => `<li class="${i < m.stage ? 'done' : i === m.stage ? 'current' : ''}">${esc(s)}</li>`).join('')}</ol>
    </div>`;
  }
  const miniProgress = (m) => `<div class="mini-prog"><div class="bar"><i style="width:${pct(m)}%"></i></div><span>${pct(m)}%</span></div>`;
  function nextEvent(m, tz) {
    if (!m.nextEvent || !m.nextEvent.date) return '';
    const d = m.nextEvent.date;
    const mon = new Intl.DateTimeFormat('en-GB', { timeZone: tz, month: 'short' }).format(new Date(d));
    const day = new Intl.DateTimeFormat('en-GB', { timeZone: tz, day: 'numeric' }).format(new Date(d));
    return `<div class="next-ev"><div class="cal"><small>${mon}</small><strong>${day}</strong></div><div><h4>${esc(m.nextEvent.label)}</h4><p>${Fmt.dateTime(d, tz)} ${tz === Store.FIRM_TZ ? 'Shah Alam time' : `your time · ${Fmt.time(d)} in Shah Alam`}</p></div></div>`;
  }
  function timeline(m, { tz, showInternal } = {}) {
    const ups = [...(m.updates || [])].filter((u) => showInternal || !u.internal).sort((a, b) => b.date.localeCompare(a.date));
    if (!ups.length) return '<p class="empty">No updates yet.</p>';
    return `<ul class="timeline">${ups.map((u) => `<li class="${u.internal ? 'internal' : ''}"><time>${Fmt.date(u.date, tz)}</time>${u.internal ? ' <span class="badge">Internal note</span>' : ''}<p>${esc(u.text)}</p>${u.by ? `<span class="by">— ${esc(u.by)}</span>` : ''}</li>`).join('')}</ul>`;
  }

  // ---------- shell ----------
  function shell({ user, nav, role }) {
    document.body.className = 'app';
    document.body.innerHTML = `
      <div class="shell">
        <aside class="side" id="side">
          <a class="brand" href="index.html"><span class="brand-mark">NZ</span><span class="brand-text"><strong>Nurreen Zahia</strong><small>${role === 'admin' ? 'Chambers admin' : 'Client portal'}</small></span></a>
          <nav id="sideNav">${nav.map((n) => n.label ? `<div class="side-label">${esc(n.label)}</div>` : `<a class="nav-i" href="#${n.id}" data-id="${n.id}">${icon(n.icon)}<span ${n.i18n ? `data-i18n="${n.i18n}"` : ''}>${esc(n.text)}</span>${n.count ? `<span class="count">${n.count}</span>` : ''}</a>`).join('')}</nav>
          <div class="side-foot"><div class="monogram">${initials(user.name)}</div><div><strong>${esc(user.name)}</strong><small>${esc(role === 'admin' ? user.title || 'Administrator' : user.country || 'Client')}</small></div><button id="signOut" title="Sign out" aria-label="Sign out">${icon('out', 16)}</button></div>
        </aside>
        <div class="main">
          <div class="topline">
            <button class="burger" id="burger" aria-label="Menu">${icon('menu')}</button>
            <div class="clocks"><span>Shah Alam <strong id="ckFirm"></strong></span><span class="hide-m">${role === 'admin' ? 'Today' : 'Your time'} <strong id="ckYou"></strong></span></div>
            <div class="right"><label class="lang"><select data-lang-switch aria-label="Language"></select></label><a class="btn btn-plain btn-sm" href="index.html">Website</a></div>
          </div>
          <div class="content" id="view"></div>
        </div>
      </div>`;
    I18N.bindSwitchers(); I18N.apply();
    $('#signOut').onclick = () => { Store.logout(); location.href = 'login.html' + (role === 'admin' ? '?role=admin' : ''); };
    const side = $('#side');
    $('#burger').onclick = () => side.classList.toggle('open');
    $('#sideNav').addEventListener('click', () => side.classList.remove('open'));
    const tick = () => {
      $('#ckFirm').textContent = Fmt.time(new Date().toISOString(), Store.FIRM_TZ);
      $('#ckYou').textContent = role === 'admin' ? Fmt.date(new Date().toISOString(), Store.FIRM_TZ, { weekday: 'short' }) : Fmt.time(new Date().toISOString(), user.tz);
    };
    tick(); setInterval(tick, 30000);
  }

  function router(views, fallback) {
    const go = () => {
      const [id, arg] = (location.hash.slice(1) || fallback).split('/');
      const fn = views[id] || views[fallback];
      document.querySelectorAll('.nav-i').forEach((a) => a.classList.toggle('on', a.dataset.id === (views[id] ? id : fallback)));
      $('#view').innerHTML = '';
      fn($('#view'), arg ? decodeURIComponent(arg) : undefined);
      I18N.apply($('#view'));
      window.scrollTo(0, 0);
    };
    addEventListener('hashchange', go);
    document.addEventListener('langchange', go);
    go();
    return go;
  }

  function setCount(id, n) {
    const a = document.querySelector(`.nav-i[data-id="${id}"]`); if (!a) return;
    let c = a.querySelector('.count');
    if (!n) { if (c) c.remove(); return; }
    if (!c) { c = document.createElement('span'); c.className = 'count'; a.appendChild(c); }
    c.textContent = n;
  }

  // Read a picked file as a data URL (kept small so localStorage doesn't overflow in the demo).
  function readFile(file) {
    return new Promise((res) => {
      if (file.size > 1.5e6) return res(null);
      const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => res(null); r.readAsDataURL(file);
    });
  }
  const fileExt = (n) => (String(n).split('.').pop() || 'FILE').slice(0, 4).toUpperCase();
  function downloadDoc(d) {
    if (d.data) { const a = document.createElement('a'); a.href = d.data; a.download = d.name; a.click(); }
    else toast('Demo file — no content stored. Real files are kept in secure cloud storage once connected.');
  }

  const statusBadge = (s) => ({ paid: 'ok', unpaid: 'warn', overdue: 'danger', confirmed: 'ok', requested: 'warn', cancelled: 'danger', completed: '', new: 'gold', contacted: 'warn', converted: 'ok', declined: '' }[s] ?? '');
  function invoiceStatus(i) { return i.status === 'unpaid' && new Date(i.due) < new Date() ? 'overdue' : i.status; }

  window.Portal = { $, esc, icon, initials, toast, modal, progress, miniProgress, nextEvent, timeline, pct, shell, router, setCount, readFile, fileExt, downloadDoc, statusBadge, invoiceStatus };
})();
