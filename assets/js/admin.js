(function () {
  const me = Store.require('admin');
  if (!me) return;
  const P = Portal, { esc, icon } = P, db = () => Store.db;
  const FIRM_TZ = Store.FIRM_TZ, STAGES = Store.STAGES;
  const LAWYERS = ['Nurreen Najieha', 'Zahia Azzahraa', 'Adam Afiz bin Zairul Azizi', 'Fatihah binti Faizal', 'Izza Batrisya binti Ahmad Hamidi', 'Muhammad Darwisy bin Mohd Nazri', 'Nur Amaniena Huurin binti Aman Rasidi', 'Wan Rania Emalynn Iman bt Wan', 'Wan Nur Aisyah binti Mohd Jaafar'];

  const client = (id) => Store.user(id) || { name: 'Unknown client', tz: FIRM_TZ };
  const matter = (id) => db().matters.find((m) => m.id === id);
  const newEnq = () => db().enquiries.filter((e) => e.status === 'new').length;
  const unreadMsgs = () => db().messages.filter((m) => m.from === 'client' && !m.read).length;
  const pendingAppts = () => db().appointments.filter((a) => a.status === 'requested').length;
  const opts = (arr, sel) => arr.map((x) => { const [v, l] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(v)}" ${v === sel ? 'selected' : ''}>${esc(l)}</option>`; }).join('');
  const clientOpts = (sel) => opts(Store.clients().map((c) => [c.id, `${c.name} — ${c.country || ''}`]), sel);

  P.shell({
    user: me, role: 'admin',
    nav: [
      { id: 'dashboard', icon: 'home', text: 'Dashboard' },
      { id: 'progress', icon: 'board', text: 'Case progress' },
      { label: 'Practice' },
      { id: 'enquiries', icon: 'inbox', text: 'Enquiries', count: newEnq() },
      { id: 'clients', icon: 'users', text: 'Clients' },
      { id: 'matters', icon: 'briefcase', text: 'Matters' },
      { id: 'appointments', icon: 'cal', text: 'Appointments', count: pendingAppts() },
      { id: 'messages', icon: 'chat', text: 'Messages', count: unreadMsgs() },
      { id: 'documents', icon: 'doc', text: 'Documents' },
      { id: 'invoices', icon: 'receipt', text: 'Invoices' },
      { label: 'Chambers' },
      { id: 'settings', icon: 'cog', text: 'Settings' },
    ],
  });
  const refreshCounts = () => { P.setCount('enquiries', newEnq()); P.setCount('messages', unreadMsgs()); P.setCount('appointments', pendingAppts()); };

  const greet = () => { const h = +new Intl.DateTimeFormat('en-GB', { timeZone: FIRM_TZ, hour: 'numeric', hourCycle: 'h23' }).format(new Date()); return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'; };
  const localTimeFor = (tz) => `${Fmt.time(new Date().toISOString(), tz)} ${tz.split('/').pop().replace(/_/g, ' ')}`;

  const views = {
    dashboard(v) {
      const ms = db().matters, active = ms.filter((m) => m.stage < 5);
      const unpaid = db().invoices.filter((i) => i.status !== 'paid');
      const countries = new Set(Store.clients().map((c) => c.country).filter(Boolean));
      const upcoming = db().appointments.filter((a) => new Date(a.when) > new Date() && a.status !== 'cancelled').sort((a, b) => a.when.localeCompare(b.when)).slice(0, 5);
      const events = ms.filter((m) => m.nextEvent && m.nextEvent.date && new Date(m.nextEvent.date) > new Date()).sort((a, b) => a.nextEvent.date.localeCompare(b.nextEvent.date)).slice(0, 5);
      v.innerHTML = `
        <div class="page-head"><div><h1>Good ${greet()}, ${esc(me.name.split(' ')[0])}</h1><p>Overview of chambers activity · all times Shah Alam (UTC+8)</p></div>
          <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-plain" data-act="newClient">${icon('plus', 16)} New client</button><button class="btn btn-gold" data-act="newMatter">${icon('plus', 16)} New matter</button></div></div>
        <div class="grid g-4">
          <div class="card kpi accent"><small>Active matters</small><strong>${active.length}</strong><span>${ms.length} total</span></div>
          <div class="card kpi"><small>New enquiries</small><strong>${newEnq()}</strong><span>${db().enquiries.filter((e) => e.urgent && e.status === 'new').length} marked urgent</span></div>
          <div class="card kpi"><small>Outstanding fees</small><strong style="font-size:28px">${Fmt.money(unpaid.reduce((s, i) => s + i.amount, 0), 'MYR')}</strong><span>${unpaid.filter((i) => P.invoiceStatus(i) === 'overdue').length} overdue</span></div>
          <div class="card kpi"><small>Client countries</small><strong>${countries.size}</strong><span>${Store.clients().length} clients</span></div>
        </div>
        <div class="card" style="margin-top:20px"><div class="card-head"><h3>Case progress at a glance</h3><a class="btn-link" href="#progress">Open board →</a></div>
          <div class="table-wrap"><table class="t"><thead><tr><th>Matter</th><th>Client</th><th>Stage</th><th>Progress</th><th>Next</th></tr></thead><tbody>
          ${active.map((m) => { const c = client(m.clientId); return `<tr class="click" data-go="matters/${m.id}"><td><div class="strong">${esc(m.title)}</div><div class="sub">${esc(m.ref)}</div></td><td>${esc(c.name)}<div class="sub">${esc(c.country || '')}</div></td><td><span class="badge gold">${esc(STAGES[m.stage])}</span></td><td>${P.miniProgress(m)}</td><td class="sub">${m.nextEvent && m.nextEvent.date ? Fmt.date(m.nextEvent.date) : '—'}</td></tr>`; }).join('')}
          </tbody></table></div></div>
        <div class="grid g-3" style="margin-top:20px">
          <div class="card"><div class="card-head"><h3>New enquiries</h3><a class="btn-link" href="#enquiries">All →</a></div>
            ${db().enquiries.filter((e) => e.status === 'new').slice(0, 4).map((e) => `<div class="list-row click" data-go="enquiries/${e.id}" style="cursor:pointer"><div><h4>${esc(e.name)} ${e.urgent ? '<span class="badge danger">Urgent</span>' : ''}</h4><p>${esc(e.country)} · ${esc(e.area)}</p></div><span class="sub" style="font-size:12px;color:var(--muted)">${Fmt.ago(e.date)}</span></div>`).join('') || '<p class="empty">Inbox clear.</p>'}</div>
          <div class="card"><div class="card-head"><h3>Upcoming calls</h3><a class="btn-link" href="#appointments">All →</a></div>
            ${upcoming.map((a) => { const c = client(a.clientId); return `<div class="list-row"><div><h4>${esc(c.name)}</h4><p>${Fmt.dateTime(a.when)} SA · ${Fmt.time(a.when, c.tz || FIRM_TZ)} client time</p></div><span class="badge ${P.statusBadge(a.status)}">${a.status}</span></div>`; }).join('') || '<p class="empty">Nothing scheduled.</p>'}</div>
          <div class="card"><div class="card-head"><h3>Key dates</h3></div>
            ${events.map((m) => `<div class="list-row click" data-go="matters/${m.id}" style="cursor:pointer"><div><h4>${esc(m.nextEvent.label)}</h4><p>${esc(m.ref)}</p></div><span class="badge">${Fmt.date(m.nextEvent.date, FIRM_TZ, { year: undefined })}</span></div>`).join('') || '<p class="empty">No key dates.</p>'}</div>
        </div>`;
    },

    progress(v) {
      v.innerHTML = `<div class="page-head"><div><h1>Case progress</h1><p>Every matter by stage. Click a card to update it — clients see the change in their portal immediately.</p></div></div>
        <div class="board">${STAGES.map((s, i) => { const ms = db().matters.filter((m) => m.stage === i); return `<div class="col"><h4>${esc(s)}<span>${ms.length}</span></h4>${ms.map((m) => { const c = client(m.clientId); return `<div class="card" data-go="matters/${m.id}"><span class="ref">${esc(m.ref)}</span><p>${esc(m.title)}</p><small>${esc(c.name)} · ${esc(c.country || '')}</small>${P.miniProgress(m)}</div>`; }).join('')}</div>`; }).join('')}</div>`;
    },

    enquiries(v, id) {
      const e = id && db().enquiries.find((x) => x.id === id);
      if (e) return enquiryDetail(v, e);
      let filter = 'new';
      const render = () => {
        const list = db().enquiries.filter((x) => filter === 'all' || x.status === filter).sort((a, b) => b.date.localeCompare(a.date));
        v.innerHTML = `<div class="page-head"><div><h1>Enquiries</h1><p>Submitted through the website consultation form.</p></div></div>
          <div class="chips" style="margin-bottom:16px">${['new', 'contacted', 'converted', 'declined', 'all'].map((f) => `<button class="chip ${f === filter ? 'on' : ''}" data-f="${f}">${f[0].toUpperCase() + f.slice(1)}</button>`).join('')}</div>
          <div class="card">${list.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Name</th><th>Country</th><th>Area</th><th>Requested slot</th><th>Received</th><th>Status</th></tr></thead><tbody>
          ${list.map((x) => `<tr class="click" data-go="enquiries/${x.id}"><td><div class="strong">${esc(x.name)} ${x.urgent ? '<span class="badge danger">Urgent</span>' : ''}</div><div class="sub">${esc(x.email)}</div></td><td>${esc(x.country)}<div class="sub">${esc(localTimeFor(x.tz || FIRM_TZ))} now</div></td><td class="sub">${esc(x.area)}</td><td class="sub">${x.slot ? Fmt.dateTime(x.slot) + ' SA' : 'Flexible'}</td><td class="sub">${Fmt.ago(x.date)}</td><td><span class="badge ${P.statusBadge(x.status)}">${x.status}</span></td></tr>`).join('')}
          </tbody></table></div>` : '<p class="empty">No enquiries here.</p>'}</div>`;
        v.querySelectorAll('[data-f]').forEach((b) => b.onclick = () => { filter = b.dataset.f; render(); });
      };
      render();
    },

    clients(v, id) {
      const c = id && Store.user(id);
      if (c) return clientDetail(v, c);
      const render = (q = '') => {
        const list = Store.clients().filter((c) => (c.name + c.email + (c.country || '') + (c.company || '')).toLowerCase().includes(q.toLowerCase()));
        v.querySelector('#rows').innerHTML = list.map((c) => {
          const ms = Store.byClient('matters', c.id);
          return `<tr class="click" data-go="clients/${c.id}"><td><div class="strong">${esc(c.name)}</div><div class="sub">${esc(c.company || c.email)}</div></td><td>${esc(c.country || '—')}</td><td class="sub">${esc(localTimeFor(c.tz || FIRM_TZ))}</td><td>${esc(c.currency || 'MYR')}</td><td>${ms.length}</td><td>${ms[0] ? P.miniProgress(ms[0]) : '<span class="sub">—</span>'}</td></tr>`;
        }).join('') || '<tr><td colspan="6" class="empty">No clients found.</td></tr>';
      };
      v.innerHTML = `<div class="page-head"><div><h1>Clients</h1><p>${Store.clients().length} clients across ${new Set(Store.clients().map((c) => c.country)).size} countries.</p></div><button class="btn btn-gold" data-act="newClient">${icon('plus', 16)} New client</button></div>
        <div class="filters"><input class="input" id="q" placeholder="Search name, company, country…" /></div>
        <div class="card"><div class="table-wrap"><table class="t"><thead><tr><th>Client</th><th>Country</th><th>Their time now</th><th>Currency</th><th>Matters</th><th>Lead matter progress</th></tr></thead><tbody id="rows"></tbody></table></div></div>`;
      v.querySelector('#q').oninput = (e) => render(e.target.value);
      render();
    },

    matters(v, id) {
      const m = id && matter(id);
      if (m) return matterDetail(v, m);
      let stage = 'all';
      const render = () => {
        const list = db().matters.filter((m) => stage === 'all' || String(m.stage) === stage);
        v.querySelector('#mrows').innerHTML = list.map((m) => { const c = client(m.clientId); return `<tr class="click" data-go="matters/${m.id}"><td><div class="strong">${esc(m.title)}</div><div class="sub">${esc(m.ref)} · ${esc(m.area)}</div></td><td>${esc(c.name)}<div class="sub">${esc(c.country || '')}</div></td><td class="sub">${esc(m.lawyer)}</td><td>${P.miniProgress(m)}<div class="sub">${esc(STAGES[m.stage])}</div></td></tr>`; }).join('') || '<tr><td colspan="4" class="empty">No matters.</td></tr>';
      };
      v.innerHTML = `<div class="page-head"><div><h1>Matters</h1><p>Open a matter to update its stage, post progress and share documents.</p></div><button class="btn btn-gold" data-act="newMatter">${icon('plus', 16)} New matter</button></div>
        <div class="filters"><select class="input" id="st"><option value="all">All stages</option>${STAGES.map((s, i) => `<option value="${i}">${s}</option>`).join('')}</select></div>
        <div class="card"><div class="table-wrap"><table class="t"><thead><tr><th>Matter</th><th>Client</th><th>Lead lawyer</th><th>Progress</th></tr></thead><tbody id="mrows"></tbody></table></div></div>`;
      v.querySelector('#st').onchange = (e) => { stage = e.target.value; render(); };
      render();
    },

    appointments(v) {
      const list = [...db().appointments].sort((a, b) => a.when.localeCompare(b.when));
      v.innerHTML = `<div class="page-head"><div><h1>Appointments</h1><p>Times shown in Shah Alam and in each client's own time zone.</p></div><button class="btn btn-gold" data-act="newAppt">${icon('plus', 16)} Schedule</button></div>
        <div class="card"><div class="table-wrap"><table class="t"><thead><tr><th>Client</th><th>Shah Alam</th><th>Client time</th><th>Topic</th><th>Lawyer</th><th>Status</th><th></th></tr></thead><tbody>
        ${list.map((a) => { const c = client(a.clientId); return `<tr><td><div class="strong">${esc(c.name)}</div><div class="sub">${esc(c.country || '')}</div></td><td>${Fmt.dateTime(a.when)}</td><td class="sub">${Fmt.dateTime(a.when, c.tz || FIRM_TZ)}</td><td>${esc(a.topic)}<div class="sub">${esc(a.mode)}</div></td><td class="sub">${esc(a.lawyer || '—')}</td><td><span class="badge ${P.statusBadge(a.status)}">${a.status}</span></td>
          <td style="white-space:nowrap">${a.status === 'requested' ? `<button class="btn btn-navy btn-sm" data-appt="${a.id}" data-s="confirmed">Confirm</button> ` : ''}${a.status !== 'cancelled' ? `<button class="btn btn-plain btn-sm" data-appt="${a.id}" data-s="cancelled">Cancel</button>` : ''}</td></tr>`; }).join('') || '<tr><td colspan="7" class="empty">No appointments.</td></tr>'}
        </tbody></table></div></div>`;
      v.querySelectorAll('[data-appt]').forEach((b) => b.onclick = () => { Store.update('appointments', b.dataset.appt, { status: b.dataset.s }); refreshCounts(); P.toast(`Appointment ${b.dataset.s}.`); views.appointments(v); });
    },

    messages(v, cid) {
      const clients = Store.clients().map((c) => ({ c, msgs: Store.byClient('messages', c.id).sort((a, b) => a.date.localeCompare(b.date)) })).filter((x) => x.msgs.length || x.c.id === cid)
        .sort((a, b) => ((b.msgs.at(-1) || {}).date || '').localeCompare((a.msgs.at(-1) || {}).date || ''));
      const sel = cid || (clients[0] && clients[0].c.id);
      if (sel) { db().messages.forEach((m) => { if (m.clientId === sel && m.from === 'client') m.read = true; }); Store.commit(); refreshCounts(); }
      const cur = clients.find((x) => x.c.id === sel);
      v.innerHTML = `<div class="page-head"><div><h1>Messages</h1><p>Secure conversations with clients.</p></div><select class="input" id="startConv" style="width:auto"><option value="">Start a conversation…</option>${clientOpts('')}</select></div>
        <div class="grid" style="grid-template-columns:minmax(220px,300px) 1fr">
          <div class="card" style="padding:10px"><div class="conv-list">${clients.map(({ c, msgs }) => { const last = msgs.at(-1); const un = msgs.filter((m) => m.from === 'client' && !m.read).length; return `<button class="conv ${c.id === sel ? 'on' : ''}" data-go="messages/${c.id}"><span class="monogram">${P.initials(c.name)}</span><div><strong>${esc(c.name)} ${un ? `<span class="badge gold">${un}</span>` : ''}</strong><span>${last ? esc(last.text) : 'No messages yet'}</span></div></button>`; }).join('') || '<p class="empty">No conversations.</p>'}</div></div>
          <div class="card">${cur ? `<div class="card-head"><h3>${esc(cur.c.name)}</h3><span class="sub" style="font-size:13px;color:var(--muted)">Their time: ${esc(localTimeFor(cur.c.tz || FIRM_TZ))}</span></div>
            <div class="thread" id="thread">${cur.msgs.map((m) => `<div class="bubble ${m.from === 'firm' ? 'me' : ''}">${esc(m.text)}<small>${esc(m.author)} · ${m.matterId && matter(m.matterId) ? esc(matter(m.matterId).ref) + ' · ' : ''}${Fmt.dateTime(m.date)} SA</small></div>`).join('') || '<p class="empty">No messages yet.</p>'}</div>
            <form class="composer" id="composer"><select id="mm" class="input" style="max-width:190px">${opts(Store.byClient('matters', cur.c.id).map((m) => [m.id, m.ref]))}<option value="">General</option></select><textarea id="mt" class="input" placeholder="Reply to ${esc(cur.c.name.split(' ')[0])}…"></textarea><button class="btn btn-navy">Send</button></form>` : '<p class="empty">Select a conversation.</p>'}</div>
        </div>`;
      const th = v.querySelector('#thread'); if (th) th.scrollTop = th.scrollHeight;
      v.querySelector('#startConv').onchange = (e) => { if (e.target.value) location.hash = 'messages/' + e.target.value; };
      const f = v.querySelector('#composer');
      if (f) f.onsubmit = (e) => { e.preventDefault(); const t = v.querySelector('#mt').value.trim(); if (!t) return; Store.add('messages', { clientId: sel, matterId: v.querySelector('#mm').value, from: 'firm', author: me.name, text: t, date: new Date().toISOString(), read: false }); views.messages(v, sel); };
    },

    documents(v) {
      const docs = [...db().documents].sort((a, b) => b.date.localeCompare(a.date));
      v.innerHTML = `<div class="page-head"><div><h1>Documents</h1><p>All documents shared with and by clients.</p></div><button class="btn btn-gold" data-act="upload">${icon('up', 16)} Share a document</button></div>
        <div class="card"><div class="table-wrap"><table class="t"><thead><tr><th>File</th><th>Client</th><th>Matter</th><th>From</th><th>Date</th><th></th></tr></thead><tbody>
        ${docs.map((d) => `<tr><td><div class="file"><span class="file-ic">${P.fileExt(d.name)}</span><div><div class="strong">${esc(d.name)}</div><div class="sub">${esc(d.category || '')} · ${Fmt.size(d.size)}</div></div></div></td><td>${esc(client(d.clientId).name)}</td><td class="sub">${esc((matter(d.matterId) || {}).ref || 'General')}</td><td>${d.by === 'client' ? '<span class="badge gold">Client</span>' : '<span class="badge">Chambers</span>'}</td><td class="sub">${Fmt.date(d.date)}</td><td><button class="btn-link" data-dl="${d.id}">Download</button></td></tr>`).join('') || '<tr><td colspan="6" class="empty">No documents.</td></tr>'}
        </tbody></table></div></div>`;
    },

    invoices(v) {
      const list = [...db().invoices].sort((a, b) => b.issued.localeCompare(a.issued));
      v.innerHTML = `<div class="page-head"><div><h1>Invoices</h1><p>Billed in MYR — clients also see an indicative amount in their preferred currency.</p></div><button class="btn btn-gold" data-act="newInvoice">${icon('plus', 16)} New invoice</button></div>
        <div class="card"><div class="table-wrap"><table class="t"><thead><tr><th>Invoice</th><th>Client</th><th>Due</th><th class="num">MYR</th><th class="num">Client currency</th><th>Status</th><th></th></tr></thead><tbody>
        ${list.map((i) => { const c = client(i.clientId), s = P.invoiceStatus(i); return `<tr><td><div class="strong">${esc(i.number)}</div><div class="sub">${esc((matter(i.matterId) || {}).ref || '')}</div></td><td>${esc(c.name)}</td><td class="sub">${Fmt.date(i.due)}</td><td class="num strong">${Fmt.money(i.amount, 'MYR')}</td><td class="num sub">${c.currency && c.currency !== 'MYR' ? Fmt.money(i.amount, c.currency) : '—'}</td><td><span class="badge ${P.statusBadge(s)}">${s}</span></td><td>${i.status !== 'paid' ? `<button class="btn btn-plain btn-sm" data-paid="${i.id}">Mark paid</button>` : ''}</td></tr>`; }).join('') || '<tr><td colspan="7" class="empty">No invoices.</td></tr>'}
        </tbody></table></div></div>`;
      v.querySelectorAll('[data-paid]').forEach((b) => b.onclick = () => { Store.update('invoices', b.dataset.paid, { status: 'paid' }); P.toast('Invoice marked as paid.'); views.invoices(v); });
    },

    settings(v) {
      const s = db().settings;
      v.innerHTML = `<div class="page-head"><div><h1>Settings</h1><p>Chambers details and the indicative exchange rates shown to international clients.</p></div></div>
        <div class="grid g-2">
          <form class="card" id="firmF"><div class="card-head"><h3>Chambers details</h3></div>
            <div style="display:grid;gap:14px">
              <div class="field"><label>Phone</label><input name="phone" class="input" value="${esc(s.phone)}" /></div>
              <div class="field"><label>WhatsApp</label><input name="whatsapp" class="input" value="${esc(s.whatsapp)}" /></div>
              <div class="field"><label>Email</label><input name="email" class="input" value="${esc(s.email)}" /></div>
            </div>
            <div class="modal-actions"><button class="btn btn-navy">Save</button></div></form>
          <form class="card" id="rateF"><div class="card-head"><h3>Exchange rates</h3><span class="muted" style="font-size:13px">1 MYR =</span></div>
            <div class="grid g-2" style="gap:12px">${Object.entries(s.rates).filter(([c]) => c !== 'MYR').map(([c, r]) => `<div class="field"><label>${c}</label><input name="${c}" type="number" step="any" min="0" class="input" value="${r}" /></div>`).join('')}</div>
            <div class="modal-actions"><button class="btn btn-navy">Update rates</button></div></form>
        </div>
        <div class="card"><div class="card-head"><h3>Demo data</h3></div><p class="muted">This prototype stores data in the browser. Reset to restore the sample clients, matters and enquiries.</p><button class="btn btn-plain" id="reset">Reset demo data</button></div>`;
      v.querySelector('#firmF').onsubmit = (e) => { e.preventDefault(); Object.assign(s, Object.fromEntries(new FormData(e.target))); Store.commit(); P.toast('Chambers details saved.'); };
      v.querySelector('#rateF').onsubmit = (e) => { e.preventDefault(); for (const [c, r] of new FormData(e.target)) if (+r > 0) s.rates[c] = +r; Store.commit(); P.toast('Exchange rates updated.'); };
      v.querySelector('#reset').onclick = () => { if (confirm('Reset all demo data? Any changes made in this browser will be lost.')) { Store.reset(); Store.login('admin@nza.com', 'admin123'); location.hash = 'dashboard'; location.reload(); } };
    },
  };

  // ---------- detail screens ----------
  function enquiryDetail(v, e) {
    v.innerHTML = `<p><a class="btn-link" href="#enquiries">← All enquiries</a></p>
      <div class="page-head"><div><h1>${esc(e.name)}</h1><p>${esc(e.area)} · received ${Fmt.dateTime(e.date)} SA</p></div><span class="badge ${P.statusBadge(e.status)}">${e.status}</span></div>
      ${e.urgent ? '<div class="notice"><strong>Marked urgent</strong> — the enquirer indicated assets or evidence may be at risk.</div>' : ''}
      <div class="grid g-main">
        <div class="card"><div class="card-head"><h3>Their message</h3></div><p style="white-space:pre-wrap">${esc(e.message)}</p></div>
        <div class="card"><div class="card-head"><h3>Contact</h3></div>
          <dl class="kv"><dt>Email</dt><dd><a href="mailto:${esc(e.email)}">${esc(e.email)}</a></dd><dt>Phone</dt><dd>${esc(e.phone)}</dd><dt>Country</dt><dd>${esc(e.country)}</dd><dt>Their time now</dt><dd>${esc(localTimeFor(e.tz || FIRM_TZ))}</dd>
          <dt>Mode</dt><dd>${esc(e.mode)}</dd><dt>Requested slot</dt><dd>${e.slot ? `${Fmt.dateTime(e.slot)} SA<br/><span class="muted">${Fmt.dateTime(e.slot, e.tz)} their time</span>` : 'Flexible'}</dd></dl>
          <div class="modal-actions" style="justify-content:flex-start;margin-top:20px">
            ${e.status !== 'converted' ? `<button class="btn btn-gold" id="convert">Convert to client &amp; matter</button>` : ''}
            ${e.status === 'new' ? `<button class="btn btn-plain" data-st="contacted">Mark contacted</button>` : ''}
            ${e.status !== 'declined' && e.status !== 'converted' ? `<button class="btn btn-plain" data-st="declined">Decline</button>` : ''}
          </div></div>
      </div>`;
    v.querySelectorAll('[data-st]').forEach((b) => b.onclick = () => { Store.update('enquiries', e.id, { status: b.dataset.st }); refreshCounts(); enquiryDetail(v, e); });
    const conv = v.querySelector('#convert');
    if (conv) conv.onclick = () => {
      const existing = db().users.find((u) => u.email.toLowerCase() === e.email.toLowerCase());
      const mdl = P.modal(`<h2>Open a matter</h2><p class="sub">${existing ? `Links to the existing account for ${esc(existing.name)}.` : `Creates a client account for ${esc(e.name)}. They can set their password via “Create an account” with the same email.`}</p>
        <form id="cv">
          <div class="field"><label>Matter title</label><input name="title" class="input" required value="${esc(e.area)} — ${esc(e.name)}" /></div>
          <div class="grid g-2"><div class="field"><label>Practice area</label><select name="area" class="input">${opts(Store.AREAS, e.area)}</select></div>
          <div class="field"><label>Lead lawyer</label><select name="lawyer" class="input">${opts(LAWYERS)}</select></div></div>
          ${e.slot ? `<label class="toggle"><input type="checkbox" name="book" checked /> Confirm their requested consultation slot</label>` : ''}
          <div class="modal-actions"><button type="button" class="btn btn-plain" data-close>Cancel</button><button class="btn btn-navy">Create</button></div></form>`);
      mdl.el.querySelector('#cv').onsubmit = (ev) => {
        ev.preventDefault(); const f = Object.fromEntries(new FormData(ev.target));
        const cu = existing || Store.register({ name: e.name, email: e.email, phone: e.phone, country: e.country, tz: e.tz || FIRM_TZ, currency: 'MYR', lang: e.lang || 'en', password: Store.uid('tmp') }).user;
        const m = Store.add('matters', { ref: nextRef(f.area), clientId: cu.id, title: f.title, area: f.area, stage: 1, lawyer: f.lawyer, opened: new Date().toISOString(), court: '—', nextEvent: null, updates: [{ date: new Date().toISOString(), text: 'Matter opened. Engagement letter and KYC to follow.', by: me.name }] });
        if (f.book && e.slot) Store.add('appointments', { clientId: cu.id, when: e.slot, mode: e.mode, topic: 'Initial consultation', lawyer: f.lawyer, status: 'confirmed' });
        Store.update('enquiries', e.id, { status: 'converted', clientId: cu.id });
        refreshCounts(); mdl.close(); P.toast('Client and matter created.'); location.hash = 'matters/' + m.id;
      };
    };
  }

  function clientDetail(v, c) {
    const ms = Store.byClient('matters', c.id), inv = Store.byClient('invoices', c.id);
    v.innerHTML = `<p><a class="btn-link" href="#clients">← All clients</a></p>
      <div class="page-head"><div><h1>${esc(c.name)}</h1><p>${esc(c.company || '')}${c.company ? ' · ' : ''}${esc(c.country || '')}</p></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-plain" href="#messages/${c.id}">${icon('chat', 16)} Message</a><button class="btn btn-gold" data-act="newMatter" data-client="${c.id}">${icon('plus', 16)} New matter</button></div></div>
      <div class="grid g-main">
        <div>${ms.map((m) => `<article class="card matter" data-go="matters/${m.id}"><span class="ref">${esc(m.ref)}</span><h3>${esc(m.title)}</h3><div class="meta"><span>${esc(m.area)}</span><span>${esc(m.lawyer)}</span></div>${P.progress(m)}</article>`).join('') || '<div class="card empty">No matters yet.</div>'}</div>
        <div><div class="card"><div class="card-head"><h3>Profile</h3></div><dl class="kv"><dt>Email</dt><dd>${esc(c.email)}</dd><dt>Phone</dt><dd>${esc(c.phone || '—')}</dd><dt>Time zone</dt><dd>${esc(Fmt.tzLabel(c.tz || FIRM_TZ))}</dd><dt>Their time</dt><dd>${esc(localTimeFor(c.tz || FIRM_TZ))}</dd><dt>Currency</dt><dd>${esc(c.currency || 'MYR')}</dd><dt>Language</dt><dd>${esc((I18N.LANGS.find((l) => l[0] === c.lang) || [, 'English'])[1])}</dd><dt>Client since</dt><dd>${c.joined ? Fmt.date(c.joined) : '—'}</dd></dl></div>
        <div class="card"><div class="card-head"><h3>Billing</h3></div>${inv.map((i) => `<div class="list-row"><div><h4>${esc(i.number)}</h4><p>${Fmt.money(i.amount, 'MYR')}${c.currency && c.currency !== 'MYR' ? ' · ≈ ' + Fmt.money(i.amount, c.currency) : ''}</p></div><span class="badge ${P.statusBadge(P.invoiceStatus(i))}">${P.invoiceStatus(i)}</span></div>`).join('') || '<p class="empty">No invoices.</p>'}</div></div>
      </div>`;
  }

  function matterDetail(v, m) {
    const c = client(m.clientId), docs = db().documents.filter((d) => d.matterId === m.id);
    v.innerHTML = `<p><a class="btn-link" href="#matters">← All matters</a></p>
      <div class="page-head"><div><span class="badge gold">${esc(m.ref)}</span><h1 style="margin-top:10px">${esc(m.title)}</h1><p><a class="btn-link" href="#clients/${c.id}">${esc(c.name)}</a> · ${esc(c.country || '')} · their time ${esc(localTimeFor(c.tz || FIRM_TZ))}</p></div>
        <button class="btn btn-plain" id="editM">Edit details</button></div>
      <div class="card"><div class="card-head"><h3>Case progress</h3><span class="muted" style="font-size:13px">Visible to the client</span></div>
        ${P.progress(m)}
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:20px;align-items:center">
          <button class="btn btn-plain btn-sm" id="back" ${m.stage === 0 ? 'disabled' : ''}>← Previous stage</button>
          <button class="btn btn-navy btn-sm" id="fwd" ${m.stage === STAGES.length - 1 ? 'disabled' : ''}>Advance to “${esc(STAGES[Math.min(m.stage + 1, STAGES.length - 1)])}” →</button>
          <label class="toggle" style="margin-inline-start:auto"><input type="checkbox" id="notify" checked /> Post stage change to client timeline</label>
        </div>
        ${P.nextEvent(m, FIRM_TZ)}
      </div>
      <div class="grid g-main" style="margin-top:20px">
        <div class="card"><div class="card-head"><h3>Post an update</h3></div>
          <form id="upF" style="display:grid;gap:12px">
            <textarea name="text" class="input" placeholder="e.g. Hearing fixed for 12 November; we have filed our written submissions." required></textarea>
            <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center"><label class="toggle"><input type="checkbox" name="internal" /> Internal note (hidden from client)</label><button class="btn btn-navy btn-sm">Post update</button></div>
          </form>
          <h3 class="h3" style="font-size:22px;margin:28px 0 16px">Timeline</h3>
          ${P.timeline(m, { tz: FIRM_TZ, showInternal: true })}
        </div>
        <div>
          <div class="card"><div class="card-head"><h3>Next key date</h3></div>
            <form id="evF" style="display:grid;gap:12px">
              <div class="field"><label>Event</label><input name="label" class="input" value="${esc((m.nextEvent || {}).label || '')}" placeholder="e.g. Case management" /></div>
              <div class="field"><label>Date &amp; time (Shah Alam)</label><input name="date" type="datetime-local" class="input" value="${m.nextEvent && m.nextEvent.date ? toLocalInput(m.nextEvent.date) : ''}" /></div>
              <button class="btn btn-plain btn-sm">Save date</button>
            </form></div>
          <div class="card"><div class="card-head"><h3>Documents</h3><label class="btn-link" style="cursor:pointer">Upload<input type="file" id="mFile" multiple hidden /></label></div>
            ${docs.map((d) => `<div class="list-row"><div class="file"><span class="file-ic">${P.fileExt(d.name)}</span><div><h4>${esc(d.name)}</h4><p>${d.by === 'client' ? 'From client' : 'Chambers'} · ${Fmt.date(d.date)}</p></div></div><button class="btn-link" data-dl="${d.id}">Get</button></div>`).join('') || '<p class="empty">No documents.</p>'}</div>
          <div class="card"><div class="card-head"><h3>Details</h3></div><dl class="kv"><dt>Area</dt><dd>${esc(m.area)}</dd><dt>Lead</dt><dd>${esc(m.lawyer)}</dd><dt>Forum</dt><dd>${esc(m.court || '—')}</dd><dt>Opened</dt><dd>${Fmt.date(m.opened)}</dd></dl></div>
        </div>
      </div>`;

    const move = (d) => {
      m.stage = Math.max(0, Math.min(STAGES.length - 1, m.stage + d));
      if (v.querySelector('#notify').checked) m.updates.push({ date: new Date().toISOString(), text: `Matter moved to stage: ${STAGES[m.stage]}.`, by: me.name });
      Store.commit(); P.toast(`Stage updated — ${c.name.split(' ')[0]} can see it now.`); matterDetail(v, m);
    };
    v.querySelector('#fwd').onclick = () => move(1);
    v.querySelector('#back').onclick = () => move(-1);
    v.querySelector('#upF').onsubmit = (e) => {
      e.preventDefault(); const f = new FormData(e.target); const text = f.get('text').trim(); if (!text) return;
      m.updates.push({ date: new Date().toISOString(), text, by: me.name, internal: !!f.get('internal') });
      Store.commit(); P.toast(f.get('internal') ? 'Internal note saved.' : 'Update posted to the client portal.'); matterDetail(v, m);
    };
    v.querySelector('#evF').onsubmit = (e) => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
      m.nextEvent = f.label && f.date ? { label: f.label, date: fromLocalInput(f.date) } : null;
      Store.commit(); P.toast('Key date saved.'); matterDetail(v, m);
    };
    v.querySelector('#mFile').onchange = async (e) => {
      for (const f of e.target.files) Store.add('documents', { clientId: m.clientId, matterId: m.id, name: f.name, size: f.size, by: 'firm', date: new Date().toISOString(), category: 'Shared by chambers', data: await P.readFile(f) });
      P.toast('Shared with the client.'); matterDetail(v, m);
    };
    v.querySelector('#editM').onclick = () => {
      const mdl = P.modal(`<h2>Edit matter</h2><p class="sub">${esc(m.ref)}</p><form id="em">
        <div class="field"><label>Title</label><input name="title" class="input" value="${esc(m.title)}" required /></div>
        <div class="grid g-2"><div class="field"><label>Area</label><select name="area" class="input">${opts(Store.AREAS, m.area)}</select></div><div class="field"><label>Lead lawyer</label><select name="lawyer" class="input">${opts(LAWYERS, m.lawyer)}</select></div></div>
        <div class="field"><label>Court / forum</label><input name="court" class="input" value="${esc(m.court || '')}" /></div>
        <div class="modal-actions"><button type="button" class="btn btn-plain" data-close>Cancel</button><button class="btn btn-navy">Save</button></div></form>`);
      mdl.el.querySelector('#em').onsubmit = (e) => { e.preventDefault(); Object.assign(m, Object.fromEntries(new FormData(e.target))); Store.commit(); mdl.close(); matterDetail(v, m); };
    };
  }

  // Shah Alam wall-clock <-> ISO helpers for datetime-local inputs.
  function toLocalInput(iso) { const d = new Date(new Date(iso).getTime() + 8 * 3600e3); return d.toISOString().slice(0, 16); }
  function fromLocalInput(s) { return new Date(new Date(s + 'Z').getTime() - 8 * 3600e3).toISOString(); }
  function nextRef(area) {
    const code = { 'General Civil Litigation': 'CV', 'Commercial Litigation & Contract Disputes': 'CL', 'Construction Law & Infrastructure': 'CN', 'Injunctions & Specific Performance': 'IN', 'Debt Recovery & Insolvency': 'DR', 'Property & Land Disputes': 'PR', 'Shareholder Disputes & Corporate Advisory': 'CO', 'Arbitration & Mediation (ADR)': 'AR' }[area] || 'XB';
    const n = Math.max(100, ...db().matters.map((m) => +String(m.ref).split('/').pop() || 0)) + 1;
    return `NZA/${code}/${new Date().getFullYear()}/${String(n).padStart(4, '0')}`;
  }

  // ---------- create dialogs ----------
  const actions = {
    newClient() {
      const zones = NZA.TIMEZONES;
      const mdl = P.modal(`<h2>New client</h2><p class="sub">The client can then activate portal access via “Create an account” with this email.</p><form id="nc">
        <div class="grid g-2"><div class="field"><label>Full name</label><input name="name" class="input" required /></div><div class="field"><label>Email</label><input name="email" type="email" class="input" required /></div>
        <div class="field"><label>Company</label><input name="company" class="input" /></div><div class="field"><label>Phone</label><input name="phone" class="input" /></div>
        <div class="field"><label>Country</label><select name="country" class="input">${opts(NZA.COUNTRIES.map((c) => c[0]), 'Malaysia')}</select></div>
        <div class="field"><label>Time zone</label><select name="tz" class="input">${opts(zones.map((z) => [z, Fmt.tzLabel(z)]), FIRM_TZ)}</select></div>
        <div class="field"><label>Currency</label><select name="currency" class="input">${opts(Object.keys(db().settings.rates), 'MYR')}</select></div>
        <div class="field"><label>Language</label><select name="lang" class="input">${opts(I18N.LANGS, 'en')}</select></div></div>
        <p id="ncErr" style="color:var(--danger);font-size:14px;margin:0"></p>
        <div class="modal-actions"><button type="button" class="btn btn-plain" data-close>Cancel</button><button class="btn btn-navy">Create client</button></div></form>`, { wide: true });
      mdl.el.querySelector('#nc').onsubmit = (e) => {
        e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
        if (!f.name.trim() || !/^\S+@\S+\.\S+$/.test(f.email)) return (mdl.el.querySelector('#ncErr').textContent = 'Name and a valid email are required.');
        const r = Store.register({ ...f, password: Store.uid('tmp') });
        if (r.error) return (mdl.el.querySelector('#ncErr').textContent = r.error);
        mdl.close(); P.toast('Client created.'); location.hash = 'clients/' + r.user.id;
      };
    },
    newMatter(btn) {
      const mdl = P.modal(`<h2>New matter</h2><p class="sub">The matter and its progress tracker appear in the client's portal straight away.</p><form id="nm">
        <div class="field"><label>Client</label><select name="clientId" class="input">${clientOpts(btn && btn.dataset.client)}</select></div>
        <div class="field"><label>Title</label><input name="title" class="input" required /></div>
        <div class="grid g-2"><div class="field"><label>Area</label><select name="area" class="input">${opts(Store.AREAS)}</select></div><div class="field"><label>Lead lawyer</label><select name="lawyer" class="input">${opts(LAWYERS)}</select></div>
        <div class="field"><label>Starting stage</label><select name="stage" class="input">${opts(STAGES.map((s, i) => [String(i), s]), '1')}</select></div><div class="field"><label>Court / forum</label><input name="court" class="input" placeholder="—" /></div></div>
        <div class="modal-actions"><button type="button" class="btn btn-plain" data-close>Cancel</button><button class="btn btn-navy">Create matter</button></div></form>`, { wide: true });
      mdl.el.querySelector('#nm').onsubmit = (e) => {
        e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); if (!f.title.trim()) return;
        const m = Store.add('matters', { ...f, ref: nextRef(f.area), stage: +f.stage, opened: new Date().toISOString(), nextEvent: null, updates: [{ date: new Date().toISOString(), text: 'Matter opened.', by: me.name }] });
        mdl.close(); P.toast('Matter created.'); location.hash = 'matters/' + m.id;
      };
    },
    newAppt() {
      const mdl = P.modal(`<h2>Schedule a call</h2><form id="na">
        <div class="field"><label>Client</label><select name="clientId" class="input">${clientOpts()}</select></div>
        <div class="field"><label>Topic</label><input name="topic" class="input" required /></div>
        <div class="grid g-2"><div class="field"><label>Date &amp; time (Shah Alam)</label><input name="when" type="datetime-local" class="input" required /></div><div class="field"><label>Mode</label><select name="mode" class="input"><option>Video (Zoom / Google Meet)</option><option>Telephone</option><option>In person — Shah Alam chambers</option></select></div></div>
        <div class="field"><label>Lawyer</label><select name="lawyer" class="input">${opts(LAWYERS)}</select></div>
        <p class="sub" id="naHint"></p>
        <div class="modal-actions"><button type="button" class="btn btn-plain" data-close>Cancel</button><button class="btn btn-navy">Schedule</button></div></form>`);
      const f = mdl.el.querySelector('#na');
      const hint = () => { const c = client(f.clientId.value); f.querySelector('#naHint').textContent = f.when.value ? `That is ${Fmt.dateTime(fromLocalInput(f.when.value), c.tz || FIRM_TZ)} for ${c.name} (${Fmt.tzLabel(c.tz || FIRM_TZ)}).` : ''; };
      f.oninput = hint;
      f.onsubmit = (e) => { e.preventDefault(); const d = Object.fromEntries(new FormData(f)); if (!d.topic.trim()) return; Store.add('appointments', { ...d, when: fromLocalInput(d.when), status: 'confirmed' }); mdl.close(); P.toast('Call scheduled.'); location.hash = 'appointments'; views.appointments(document.getElementById('view')); };
    },
    newInvoice() {
      const mdl = P.modal(`<h2>New invoice</h2><form id="ni">
        <div class="field"><label>Matter</label><select name="matterId" class="input">${opts(db().matters.map((m) => [m.id, `${m.ref} — ${client(m.clientId).name}`]))}</select></div>
        <div class="field"><label>Description</label><input name="items" class="input" required placeholder="Professional fees — …" /></div>
        <div class="grid g-2"><div class="field"><label>Amount (MYR)</label><input name="amount" type="number" min="0" step="0.01" class="input" required /></div><div class="field"><label>Due in (days)</label><input name="days" type="number" value="14" class="input" /></div></div>
        <p class="sub" id="niHint"></p>
        <div class="modal-actions"><button type="button" class="btn btn-plain" data-close>Cancel</button><button class="btn btn-navy">Issue invoice</button></div></form>`);
      const f = mdl.el.querySelector('#ni');
      f.oninput = () => { const c = client((matter(f.matterId.value) || {}).clientId); f.querySelector('#niHint').textContent = f.amount.value && c.currency && c.currency !== 'MYR' ? `Client will see ≈ ${Fmt.money(+f.amount.value, c.currency)}.` : ''; };
      f.onsubmit = (e) => {
        e.preventDefault(); const d = Object.fromEntries(new FormData(f)); const m = matter(d.matterId); if (!(+d.amount > 0)) return;
        const n = db().invoices.length + 400;
        Store.add('invoices', { number: `INV-${new Date().getFullYear()}-${String(n).padStart(4, '0')}`, clientId: m.clientId, matterId: m.id, amount: +d.amount, items: d.items, status: 'unpaid', issued: new Date().toISOString(), due: new Date(Date.now() + (+d.days || 14) * 864e5).toISOString() });
        mdl.close(); P.toast('Invoice issued.'); views.invoices(document.getElementById('view'));
      };
    },
    upload() {
      const mdl = P.modal(`<h2>Share a document</h2><form id="up">
        <div class="field"><label>Matter</label><select name="matterId" class="input">${opts(db().matters.map((m) => [m.id, `${m.ref} — ${client(m.clientId).name}`]))}</select></div>
        <div class="field"><label>File</label><input name="file" type="file" class="input" required multiple /></div>
        <div class="modal-actions"><button type="button" class="btn btn-plain" data-close>Cancel</button><button class="btn btn-navy">Share</button></div></form>`);
      mdl.el.querySelector('#up').onsubmit = async (e) => {
        e.preventDefault(); const m = matter(e.target.matterId.value), files = [...e.target.file.files]; if (!files.length) return;
        for (const f of files) Store.add('documents', { clientId: m.clientId, matterId: m.id, name: f.name, size: f.size, by: 'firm', date: new Date().toISOString(), category: 'Shared by chambers', data: await P.readFile(f) });
        mdl.close(); P.toast('Document shared.'); views.documents(document.getElementById('view'));
      };
    },
  };

  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-act]'); if (a && actions[a.dataset.act]) return actions[a.dataset.act](a);
    const go = e.target.closest('[data-go]'); if (go) location.hash = go.dataset.go;
    const dl = e.target.closest('[data-dl]'); if (dl) P.downloadDoc(db().documents.find((d) => d.id === dl.dataset.dl));
  });

  P.router(views, 'dashboard');
})();
