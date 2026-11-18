/* Highline Deal Room — page behaviour. Content lives in /data/mandates.js. */
(function () {
  const ALL = (window.MANDATES || []).filter(m => m.published !== false);
  const CFG = window.SITE_CONFIG || {};
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const catColor = c => c === 'Land' ? 'var(--accent)' : c === 'Project finance' ? 'var(--accent-2)' : 'var(--ink-2)';
  const PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';
  const DOC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="11" width="14" height="10" rx="1.5"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>';

  /* ---- board summary + ticker ---- */
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  $('#today').textContent = date;
  $('#ix-open').textContent = String(ALL.length).padStart(2, '0');
  const acres = ALL.reduce((a, m) => a + (m.cat === 'Land' ? (parseFloat(m.facts && m.facts.Size) || 0) : 0), 0);
  $('#ix-acres').textContent = acres ? acres + ' ac' : '—';
  const tick = [`<span><b>HIGHLINE DEAL ROOM</b> · Updated ${esc(date)}</span>`,
    ...ALL.map(m => `<span><b>${esc(m.ref)}</b> ${esc(m.title)} · <span class="live">● ${esc(m.status)}</span></span>`),
    '<span>Price on request · India · United States</span>'].join('');
  // repeat so the strip is always wider than the screen, in two identical halves for a seamless loop
  const half = tick.repeat(Math.max(2, Math.ceil(8 / (ALL.length + 2))));
  $('#ticker').innerHTML = half + half;

  /* ---- filters + cards ---- */
  const CATS = ['All', ...new Set(ALL.map(m => m.cat))];
  $('#filters').innerHTML = CATS.map((c, i) => `<label><input type="radio" name="cat" value="${esc(c)}" ${i ? '' : 'checked'}><span>${esc(c)}</span></label>`).join('');
  $('#f-ref').innerHTML = ALL.map(m => `<option value="${esc(m.ref)}">${esc(m.ref)} — ${esc(m.title)}</option>`).join('') + '<option value="General">General — notify me of new mandates</option>';

  function render(cat) {
    const list = ALL.filter(m => cat === 'All' || m.cat === cat);
    $('#grid').innerHTML = list.length ? list.map((m, i) => {
      const feat = i === 0 && cat === 'All';
      return `<article class="card ${feat ? 'feature' : ''}" tabindex="0" data-ref="${esc(m.ref)}" style="--cat:${catColor(m.cat)}">
  <div class="card-in">
    <div class="card-top"><span class="cat">${esc(m.cat)}</span><span class="ref">${esc(m.ref)}</span></div>
    <h3>${esc(m.title)}</h3>
    <div class="loc">${PIN}${esc(m.loc)}</div>
    ${feat ? `<p class="card-body">${esc(m.body)}</p>` : ''}
    <dl class="facts">${Object.entries(m.facts || {}).slice(0, feat ? 4 : 3).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
  </div>
  <div class="card-f"><span class="status ${/review/i.test(m.status) ? 'review' : ''}">${esc(m.status)}</span><span class="view">View mandate →</span></div>
</article>`;
    }).join('') : '<p class="empty">No open mandates in this category.</p>';
  }
  render('All');
  $('#filters').addEventListener('change', e => render(e.target.value));

  /* ---- mandate detail dialog (shareable as #mandate/REF) ---- */
  let current = null;
  function openM(ref, silent) {
    const m = ALL.find(x => x.ref === ref); if (!m) return;
    current = m;
    $('#dlg-box').style.setProperty('--cat', catColor(m.cat));
    $('#dlg-cat').textContent = m.cat; $('#dlg-cat').style.setProperty('--cat', catColor(m.cat));
    $('#dlg-ref').textContent = m.ref; $('#dlg-loc').innerHTML = PIN + esc(m.loc);
    $('#dlg-title').textContent = m.title; $('#dlg-body').textContent = m.body;
    $('#dlg-facts').innerHTML = Object.entries(m.facts || {}).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');
    $('#dlg-docs').innerHTML = (m.docs || []).map(d => `<span class="doc">${DOC}${esc(d)}</span>`).join('');
    $('#dlg').classList.add('on'); $('#dlg-go').focus();
    if (!silent) history.replaceState(null, '', '#mandate/' + encodeURIComponent(m.ref));
  }
  function closeM() {
    $('#dlg').classList.remove('on');
    if (location.hash.indexOf('#mandate/') === 0) history.replaceState(null, '', location.pathname + location.search);
  }
  $('#grid').addEventListener('click', e => { const c = e.target.closest('.card'); if (c) openM(c.dataset.ref); });
  $('#grid').addEventListener('keydown', e => { const c = e.target.closest('.card'); if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openM(c.dataset.ref); } });
  $('#dlg-x').onclick = closeM;
  $('#dlg').addEventListener('click', e => { if (e.target.id === 'dlg') closeM(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeM(); });
  $('#dlg-go').onclick = () => {
    $('#f-ref').value = current.ref; closeM();
    window.scrollTo({ top: $('#interest').offsetTop - 80, behavior: 'smooth' });
    setTimeout(() => $('#f-name').focus({ preventScroll: true }), 500);
  };
  if (location.hash.indexOf('#mandate/') === 0) openM(decodeURIComponent(location.hash.slice(9)), true);

  /* ---- forms: every entry goes to the Google Sheet via the Apps Script endpoint ---- */
  async function send(form, data) {
    const btn = form.querySelector('button[type=submit]');
    const err = form.querySelector('.form-err');
    err.classList.remove('on');
    if (form.querySelector('.hp input').value) return true;            // bot filled the hidden field: drop silently
    if (!CFG.formEndpoint) { err.classList.add('on'); return false; }
    btn.disabled = true;
    data.page = location.href.split('#')[0];
    try {
      // "no-cors": the browser sends the entry but cannot read the reply; a network failure still throws.
      await fetch(CFG.formEndpoint, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(data) });
      return true;
    } catch (e) {
      err.classList.add('on'); return false;
    } finally { btn.disabled = false; }
  }

  $('#form-interest').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, ref = $('#f-ref').value;
    const m = ALL.find(x => x.ref === ref);
    const ok = await send(f, {
      form: 'Express interest',
      mandate: m ? `${m.ref} — ${m.title}` : 'General — new mandates',
      role: f.querySelector('input[name=role]:checked').value,
      name: $('#f-name').value, organisation: $('#f-org').value,
      email: $('#f-email').value, phone: $('#f-phone').value,
      message: $('#f-note').value
    });
    if (!ok) return;
    const n = $('#f-name').value.trim().split(' ')[0];
    $('#confirm-title').textContent = `Thank you, ${n}. Interest logged for ${m ? m.ref : 'new mandates'}.`;
    f.style.display = 'none'; $('#confirm-interest').classList.add('on');
  });
  $('#again').onclick = () => { $('#form-interest').reset(); $('#form-interest').style.display = ''; $('#confirm-interest').classList.remove('on'); };

  $('#form-list').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    const ok = await send(f, {
      form: 'List a mandate',
      type: $('#l-type').value, location: $('#l-loc').value,
      role: $('#l-cap').value,
      name: $('#l-name').value, email: $('#l-email').value, phone: $('#l-phone').value,
      message: $('#l-note').value
    });
    if (!ok) return;
    f.style.display = 'none'; $('#confirm-list').classList.add('on');
  });
})();
