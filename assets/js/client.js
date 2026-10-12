(function () {
  const me = Store.require('client');
  if (!me) return;
  const P = Portal, { esc, icon } = P, db = () => Store.db;
  const tz = () => me.tz || NZA.detectTZ();
  const cur = () => me.currency || 'MYR';

  const myMatters = () => Store.byClient('matters', me.id);
  const myDocs = () => Store.byClient('documents', me.id);
  const myMsgs = () => Store.byClient('messages', me.id).sort((a, b) => a.date.localeCompare(b.date));
  const myInv = () => Store.byClient('invoices', me.id);
  const myAppts = () => Store.byClient('appointments', me.id).sort((a, b) => a.when.localeCompare(b.when));
  const unread = () => myMsgs().filter((m) => m.from === 'firm' && !m.read).length;
  const matterTitle = (id) => (db().matters.find((m) => m.id === id) || {}).title || 'General';

  P.shell({
    user: me, role: 'client',
    nav: [
      { id: 'overview', icon: 'home', text: 'Overview', i18n: 'p.overview' },
      { id: 'matters', icon: 'briefcase', text: 'My matters', i18n: 'p.matters' },
      { id: 'documents', icon: 'doc', text: 'Documents', i18n: 'p.documents' },
      { id: 'messages', icon: 'chat', text: 'Messages', i18n: 'p.messages', count: unread() },
      { id: 'appointments', icon: 'cal', text: 'Appointments', i18n: 'p.appointments' },
      { id: 'invoices', icon: 'receipt', text: 'Invoices', i18n: 'p.invoices' },
      { id: 'profile', icon: 'user', text: 'Profile & preferences', i18n: 'p.profile' },
    ],
  });

  const matterCard = (m) => `
    <article class="card matter" data-go="matters/${m.id}">
      <span class="ref">${esc(m.ref)}</span>
      <h3>${esc(m.title)}</h3>
      <div class="meta"><span>${esc(m.area)}</span><span>Lead: ${esc(m.lawyer)}</span></div>
      ${P.progress(m)}
      ${P.nextEvent(m, tz())}
    </article>`;

  const views = {
    overview(v) {
      const ms = myMatters(), inv = myInv().filter((i) => i.status !== 'paid'), appts = myAppts().filter((a) => new Date(a.when) > new Date() && a.status !== 'cancelled');
      const outstanding = inv.reduce((s, i) => s + i.amount, 0);
      const latest = ms.flatMap((m) => (m.updates || []).filter((u) => !u.internal).map((u) => ({ ...u, m }))).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
      v.innerHTML = `
        <div class="page-head"><div><h1><span data-i18n="p.welcome">Welcome back</span>, ${esc(me.name.split(' ')[0])}</h1><p>All dates are shown in your time zone: ${esc(Fmt.tzLabel(tz()))}.</p></div>
          <a class="btn btn-gold" href="#appointments/new">${icon('cal', 16)} Book a call</a></div>
        <div class="grid g-4">
          <div class="card kpi accent"><small>Active matters</small><strong>${ms.filter((m) => m.stage < 5).length}</strong><span>${ms.length} in total</span></div>
          <div class="card kpi"><small>Unread messages</small><strong>${unread()}</strong><span>from your legal team</span></div>
          <div class="card kpi"><small>Next appointment</small><strong style="font-size:24px">${appts[0] ? Fmt.dateTime(appts[0].when, tz()) : '—'}</strong><span>${appts[0] ? esc(appts[0].mode) : 'None booked'}</span></div>
          <div class="card kpi"><small>Outstanding</small><strong style="font-size:28px">${Fmt.money(outstanding, cur())}</strong><span>${outstanding ? Fmt.money(outstanding, 'MYR') + ' billed' : 'All settled'}</span></div>
        </div>
        <div class="grid g-main" style="margin-top:20px">
          <div>${ms.length ? ms.map(matterCard).join('') : `<div class="card empty">You don't have any matters yet. Once we've confirmed your engagement, your matter and its progress will appear here.<br/><br/><a class="btn btn-navy btn-sm" href="#messages">Message the chambers</a></div>`}</div>
          <div class="card"><div class="card-head"><h3>Latest updates</h3></div>
            ${latest.length ? `<ul class="timeline">${latest.map((u) => `<li><time>${Fmt.date(u.date, tz())} · ${esc(u.m.ref)}</time><p>${esc(u.text)}</p></li>`).join('')}</ul>` : '<p class="empty">No updates yet.</p>'}
          </div>
        </div>`;
    },

    matters(v, id) {
      const m = id && myMatters().find((x) => x.id === id);
      if (!m) {
        const ms = myMatters();
        v.innerHTML = `<div class="page-head"><div><h1 data-i18n="p.matters">My matters</h1><p>Track the progress of each matter stage by stage.</p></div></div>
          ${ms.length ? `<div class="grid g-2">${ms.map(matterCard).join('')}</div>` : '<div class="card empty">No matters yet.</div>'}`;
        return;
      }
      const docs = myDocs().filter((d) => d.matterId === m.id);
      v.innerHTML = `
        <p><a class="btn-link" href="#matters">← All matters</a></p>
        <div class="page-head"><div><span class="badge gold">${esc(m.ref)}</span><h1 style="margin-top:10px">${esc(m.title)}</h1><p>${esc(m.area)}</p></div>
          <a class="btn btn-navy" href="#messages/${m.id}">${icon('chat', 16)} Message your lawyer</a></div>
        <div class="card"><div class="card-head"><h3>Case progress</h3><span class="muted" style="font-size:13px">Updated by your legal team</span></div>${P.progress(m)}${P.nextEvent(m, tz())}</div>
        <div class="grid g-main" style="margin-top:20px">
          <div class="card"><div class="card-head"><h3>Timeline</h3></div>${P.timeline(m, { tz: tz() })}</div>
          <div>
            <div class="card"><div class="card-head"><h3>Details</h3></div>
              <dl class="kv"><dt>Lead lawyer</dt><dd>${esc(m.lawyer)}</dd><dt>Forum</dt><dd>${esc(m.court || '—')}</dd><dt>Opened</dt><dd>${Fmt.date(m.opened, tz())}</dd><dt>Status</dt><dd>${esc(Store.STAGES[m.stage])}</dd></dl></div>
            <div class="card"><div class="card-head"><h3>Documents</h3><a class="btn-link" href="#documents">Upload</a></div>
              ${docs.length ? docs.map(docRow).join('') : '<p class="empty">No documents yet.</p>'}</div>
          </div>
        </div>`;
    },

    documents(v) {
      const docs = myDocs().sort((a, b) => b.date.localeCompare(a.date));
      const ms = myMatters();
      v.innerHTML = `<div class="page-head"><div><h1 data-i18n="p.documents">Documents</h1><p>Shared securely between you and the chambers.</p></div></div>
        <div class="card">
          <div class="grid g-2" style="margin-bottom:16px">
            <div class="field"><label for="upMatter">Attach to matter</label><select id="upMatter" class="input">${ms.map((m) => `<option value="${m.id}">${esc(m.ref)} — ${esc(m.title)}</option>`).join('')}<option value="">General / not matter-specific</option></select></div>
            <div class="field"><label for="upCat">Category</label><select id="upCat" class="input"><option>Evidence</option><option>Identity / KYC</option><option>Correspondence</option><option>Contract</option><option>Other</option></select></div>
          </div>
          <label class="drop" id="drop">${icon('up', 22)}<br/><strong>Drop files here or click to upload</strong><br/><small>PDF, images or Word documents. Files you upload are visible to your legal team.</small><input type="file" id="file" multiple hidden /></label>
        </div>
        <div class="card"><div class="card-head"><h3>All documents</h3><span class="muted" style="font-size:13px">${docs.length} files</span></div>
          ${docs.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>File</th><th>Matter</th><th>Shared by</th><th>Date</th><th></th></tr></thead><tbody>
          ${docs.map((d) => `<tr><td><div class="file"><span class="file-ic">${P.fileExt(d.name)}</span><div><div class="strong">${esc(d.name)}</div><div class="sub">${esc(d.category || '')} · ${Fmt.size(d.size)}</div></div></div></td><td class="sub">${esc(matterTitle(d.matterId))}</td><td>${d.by === 'client' ? 'You' : 'Chambers'}</td><td class="sub">${Fmt.date(d.date, tz())}</td><td><button class="btn-link" data-dl="${d.id}">Download</button></td></tr>`).join('')}
          </tbody></table></div>` : '<p class="empty">No documents yet.</p>'}</div>`;
      const drop = v.querySelector('#drop'), file = v.querySelector('#file');
      const handle = async (files) => {
        for (const f of files) {
          const data = await P.readFile(f);
          Store.add('documents', { clientId: me.id, matterId: v.querySelector('#upMatter').value, name: f.name, size: f.size, by: 'client', date: new Date().toISOString(), category: v.querySelector('#upCat').value, data });
        }
        P.toast(`${files.length} file${files.length > 1 ? 's' : ''} uploaded — your lawyer has been notified.`);
        views.documents(v);
      };
      file.onchange = () => file.files.length && handle([...file.files]);
      drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('over'); };
      drop.ondragleave = () => drop.classList.remove('over');
      drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('over'); handle([...e.dataTransfer.files]); };
    },

    messages(v, matterId) {
      myMsgs().forEach((m) => { if (m.from === 'firm') m.read = true; });
      Store.commit(); P.setCount('messages', 0);
      const ms = myMatters();
      const render = () => {
        const msgs = myMsgs();
        v.innerHTML = `<div class="page-head"><div><h1 data-i18n="p.messages">Messages</h1><p>A private channel with your legal team. We reply within one business day.</p></div></div>
          <div class="card">
            <div class="thread" id="thread">${msgs.length ? msgs.map((m) => `<div class="bubble ${m.from === 'client' ? 'me' : ''}">${esc(m.text)}<small>${esc(m.from === 'client' ? 'You' : m.author)} · ${m.matterId ? esc((db().matters.find((x) => x.id === m.matterId) || {}).ref || '') + ' · ' : ''}${Fmt.dateTime(m.date, tz())}</small></div>`).join('') : '<p class="empty">No messages yet — say hello.</p>'}</div>
            <form class="composer" id="composer">
              <select id="msgMatter" class="input" style="max-width:200px">${ms.map((m) => `<option value="${m.id}" ${m.id === matterId ? 'selected' : ''}>${esc(m.ref)}</option>`).join('')}<option value="">General</option></select>
              <textarea id="msgText" class="input" placeholder="Write a message…" required></textarea>
              <button class="btn btn-navy" type="submit">Send</button>
            </form>
          </div>`;
        const th = v.querySelector('#thread'); th.scrollTop = th.scrollHeight;
        v.querySelector('#composer').onsubmit = (e) => {
          e.preventDefault();
          const text = v.querySelector('#msgText').value.trim(); if (!text) return;
          Store.add('messages', { clientId: me.id, matterId: v.querySelector('#msgMatter').value, from: 'client', author: me.name, text, date: new Date().toISOString(), read: false });
          render();
        };
      };
      render();
    },

    appointments(v, arg) {
      const list = myAppts();
      v.innerHTML = `<div class="page-head"><div><h1 data-i18n="p.appointments">Appointments</h1><p>Times shown in ${esc(Fmt.tzLabel(tz()))}, with Shah Alam time alongside.</p></div><button class="btn btn-gold" id="book">${icon('plus', 16)} Book a call</button></div>
        <div class="card">${list.length ? list.map((a) => `<div class="list-row"><div><h4>${esc(a.topic)}</h4><p>${Fmt.dateTime(a.when, tz())} your time · ${Fmt.time(a.when)} Shah Alam · ${esc(a.mode)} · ${esc(a.lawyer || 'To be assigned')}</p></div><span class="badge ${P.statusBadge(a.status)}">${esc(a.status)}</span></div>`).join('') : '<p class="empty">No appointments yet.</p>'}</div>`;
      const open = () => {
        const slots = NZA.slots(10);
        const mdl = P.modal(`<h2>Book a call</h2><p class="sub">Choose a slot — shown in your time zone. We'll confirm by email.</p>
          <form id="bk">
            <div class="field"><label>Topic</label><input name="topic" class="input" required placeholder="e.g. Next steps on my case" /></div>
            <div class="field"><label>Slot (your time · Shah Alam time)</label><select name="when" class="input">${slots.map((s) => `<option value="${s}">${Fmt.dateTime(s, tz())} · ${Fmt.time(s)} SA</option>`).join('')}</select></div>
            <div class="field"><label>Mode</label><select name="mode" class="input"><option>Video (Zoom / Google Meet)</option><option>Telephone</option><option>In person — Shah Alam chambers</option></select></div>
            <div class="modal-actions"><button type="button" class="btn btn-plain" data-close>Cancel</button><button class="btn btn-navy">Request booking</button></div>
          </form>`);
        mdl.el.querySelector('#bk').onsubmit = (e) => {
          e.preventDefault(); const f = new FormData(e.target);
          if (!f.get('topic').trim()) return;
          const m = myMatters()[0];
          Store.add('appointments', { clientId: me.id, when: f.get('when'), mode: f.get('mode'), topic: f.get('topic').trim(), lawyer: m ? m.lawyer : '', status: 'requested' });
          mdl.close(); P.toast('Booking requested — we will confirm shortly.'); location.hash = 'appointments';
          views.appointments(v);
        };
      };
      v.querySelector('#book').onclick = open;
      if (arg === 'new') open();
    },

    invoices(v) {
      const inv = myInv().sort((a, b) => b.issued.localeCompare(a.issued));
      const rateNote = cur() !== 'MYR' ? `Amounts in ${cur()} are indicative, converted from Malaysian Ringgit (the billing currency).` : 'All amounts in Malaysian Ringgit.';
      v.innerHTML = `<div class="page-head"><div><h1 data-i18n="p.invoices">Invoices</h1><p>${rateNote}</p></div>
        <label class="field" style="flex-direction:row;align-items:center;gap:10px"><span class="muted" style="font-size:13px">View in</span><select id="curSel" class="input" style="width:auto">${Object.keys(db().settings.rates).map((c) => `<option ${c === cur() ? 'selected' : ''}>${c}</option>`).join('')}</select></label></div>
        <div class="card">${inv.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Invoice</th><th>Matter</th><th>Issued</th><th>Due</th><th class="num">Amount (${cur()})</th><th class="num">MYR</th><th>Status</th></tr></thead><tbody>
          ${inv.map((i) => { const s = P.invoiceStatus(i); return `<tr class="click" data-inv="${i.id}"><td class="strong">${esc(i.number)}</td><td class="sub">${esc(matterTitle(i.matterId))}</td><td class="sub">${Fmt.date(i.issued, tz())}</td><td class="sub">${Fmt.date(i.due, tz())}</td><td class="num strong">${Fmt.money(i.amount, cur())}</td><td class="num sub">${Fmt.money(i.amount, 'MYR')}</td><td><span class="badge ${P.statusBadge(s)}">${s}</span></td></tr>`; }).join('')}
          </tbody></table></div>` : '<p class="empty">No invoices yet.</p>'}</div>`;
      v.querySelector('#curSel').onchange = (e) => { me.currency = e.target.value; Store.commit(); views.invoices(v); };
      v.querySelectorAll('[data-inv]').forEach((r) => r.onclick = () => {
        const i = db().invoices.find((x) => x.id === r.dataset.inv);
        P.modal(`<h2>${esc(i.number)}</h2><p class="sub">${esc(matterTitle(i.matterId))}</p>
          <dl class="kv"><dt>Description</dt><dd>${esc(i.items)}</dd><dt>Amount</dt><dd><strong>${Fmt.money(i.amount, 'MYR')}</strong>${cur() !== 'MYR' ? ` ≈ ${Fmt.money(i.amount, cur())}` : ''}</dd><dt>Due</dt><dd>${Fmt.date(i.due, tz())}</dd><dt>Status</dt><dd>${P.invoiceStatus(i)}</dd></dl>
          <div class="notice" style="margin-top:20px"><strong>International bank transfer</strong><br/>Beneficiary: Nurreen Zahia &amp; Associates (client account)<br/>Bank / SWIFT details are provided on your PDF invoice. Please quote <strong>${esc(i.number)}</strong> as the reference.</div>
          <div class="modal-actions"><button class="btn btn-plain" data-close>Close</button></div>`);
      });
    },

    profile(v) {
      const zones = NZA.TIMEZONES.includes(tz()) ? NZA.TIMEZONES : [tz(), ...NZA.TIMEZONES];
      v.innerHTML = `<div class="page-head"><div><h1 data-i18n="p.profile">Profile & preferences</h1><p>These settings control how dates and amounts appear across your portal.</p></div></div>
        <form class="card" id="pf" style="max-width:720px">
          <div class="grid g-2">
            <div class="field"><label>Full name</label><input name="name" class="input" value="${esc(me.name)}" /></div>
            <div class="field"><label>Email</label><input class="input" value="${esc(me.email)}" disabled /></div>
            <div class="field"><label>Company</label><input name="company" class="input" value="${esc(me.company || '')}" /></div>
            <div class="field"><label>Phone / WhatsApp</label><input name="phone" class="input" value="${esc(me.phone || '')}" /></div>
            <div class="field"><label>Country</label><select name="country" class="input">${NZA.COUNTRIES.map(([c]) => `<option ${c === me.country ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
            <div class="field"><label>Time zone</label><select name="tz" class="input">${zones.map((z) => `<option value="${z}" ${z === tz() ? 'selected' : ''}>${Fmt.tzLabel(z)}</option>`).join('')}</select></div>
            <div class="field"><label>Preferred currency</label><select name="currency" class="input">${Object.keys(db().settings.rates).map((c) => `<option ${c === cur() ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
            <div class="field"><label>Portal language</label><select name="lang" class="input">${I18N.LANGS.map(([c, n]) => `<option value="${c}" ${c === I18N.getLang() ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
          </div>
          <div class="modal-actions"><button class="btn btn-navy">Save preferences</button></div>
        </form>`;
      v.querySelector('#pf').onsubmit = (e) => {
        e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
        Object.assign(me, { name: f.name.trim() || me.name, company: f.company, phone: f.phone, country: f.country, tz: f.tz, currency: f.currency, lang: f.lang });
        Store.commit(); P.toast('Preferences saved.');
        if (f.lang !== I18N.getLang()) I18N.setLang(f.lang); else views.profile(v);
      };
    },
  };

  function docRow(d) {
    return `<div class="list-row"><div class="file"><span class="file-ic">${P.fileExt(d.name)}</span><div><h4>${esc(d.name)}</h4><p>${d.by === 'client' ? 'You' : 'Chambers'} · ${Fmt.date(d.date, tz())}</p></div></div><button class="btn-link" data-dl="${d.id}">Download</button></div>`;
  }

  document.addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]'); if (go) location.hash = go.dataset.go;
    const dl = e.target.closest('[data-dl]'); if (dl) P.downloadDoc(db().documents.find((d) => d.id === dl.dataset.dl));
  });

  if (me.lang && !localStorage.getItem('nza_lang')) I18N.setLang(me.lang);
  P.router(views, 'overview');
})();
