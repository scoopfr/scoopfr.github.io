/* =========================================================
   Scoop — « Mes concours » : recherche automatique selon ton profil
   Données : data/concours.js (filtres, dates) + data/prepa.js (fiches des écoles)
   Profil : S.prepa.profile · sélection : S.prepa.picked
   ========================================================= */
(window.SCOOP_MODULES = window.SCOOP_MODULES || []).push(ctx => {
  'use strict';
  const { $, $$, esc, rich, TODAY, parseYmd, ymd } = ctx;
  const D = window.SCOOP_CONCOURS, P = ctx.PREPA;
  if (!D || !P) return;

  const DEF = { level: '', regions: [], budget: 'any', scholar: false, dossier: false, wishes: [], strategy: 'large' };
  const prof = () => { ctx.S.prepa = ctx.S.prepa || {}; ctx.S.prepa.profile = Object.assign({}, DEF, ctx.S.prepa.profile || {}); return ctx.S.prepa.profile; };
  const picks = () => { ctx.S.prepa = ctx.S.prepa || {}; return (ctx.S.prepa.picked = ctx.S.prepa.picked || {}); };
  const DAY = 864e5;
  const days = (a, b) => Math.round((a - b) / DAY);
  const today = () => parseYmd(TODAY);
  const mmdd = (y, s) => new Date(y, +s.slice(0, 2) - 1, +s.slice(3));
  const fmt = d => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const fmtShort = d => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  // Prochaine session : la première dont la clôture n'est pas passée
  function session(d) {
    const t = today(), y = t.getFullYear();
    for (const sy of [y - 1, y, y + 1]) {
      let open = null, close;
      if (d.open) { open = mmdd(sy, d.open); close = mmdd(d.open > d.close ? sy + 1 : sy, d.close); }
      else close = mmdd(sy, d.close);
      if (close >= t) return { open, close };
    }
    return null;
  }
  function status(d) {
    const s = session(d); if (!s) return { code: 'unknown', text: 'Dates à vérifier', cls: 'mute', s };
    const t = today(), toClose = days(s.close, t);
    if (s.open && t < s.open) { const n = days(s.open, t); return { code: 'soon', text: `Ouvre le ${fmtShort(s.open)} (dans ${n} j)`, cls: n <= 45 ? 'warn' : 'mute', s, n }; }
    return { code: 'open', text: toClose <= 21 ? `⚠️ Ferme le ${fmtShort(s.close)} (dans ${toClose} j)` : `Ouvert · ferme le ${fmtShort(s.close)} (dans ${toClose} j)`, cls: toClose <= 21 ? 'bad' : 'ok', s, n: toClose };
  }

  const LVL = { bac: 0, b2: 1, b3: 2, b5: 3 };
  function eligible(d, level) {
    if (!level) return { ok: true, why: '' };
    const L = LVL[level];
    if (d.entry === 'bac') return L <= 1 ? { ok: true, why: 'accessible dès le bac' } : { ok: false, why: 'cursus post-bac (Parcoursup) : pour toi, un master est plus adapté' };
    if (d.entry === 'b2') return L >= 1 ? { ok: true, why: 'bac+2 accepté' } : { ok: false, why: 'demande au moins bac+2' };
    return L >= 2 ? { ok: true, why: 'ton niveau correspond' } : { ok: false, why: 'demande bac+3 à l\'entrée : vise la session suivante' };
  }

  function evaluate() {
    const p = prof(), pk = picks();
    const maxFee = p.budget === 'free' ? 0 : p.budget === 'any' ? Infinity : +p.budget;
    const rows = P.schools.map(s => {
      const d = D.schools[s.short]; if (!d) return null;
      const el = eligible(d, p.level), st = status(d), why = [];
      let score = 50;
      if (el.ok) { if (p.level) why.push('✓ ' + el.why); } else score -= 60;
      const inBudget = d.fee <= maxFee;
      if (maxFee !== Infinity) { if (inBudget) { score += 12; why.push(`✓ ${d.fee ? d.fee + ' €' : 'gratuit'}, dans ton budget`); } else { score -= 25; why.push(`✕ ${d.fee} €, au-dessus de ton budget`); } }
      else if (d.fee === 0) { score += 6; why.push('✓ gratuit'); }
      if (p.regions.length) { if (p.regions.includes(d.region)) { score += 12; why.push('✓ dans une région qui t\'intéresse'); } else score -= 8; }
      if (p.dossier && d.dossier) { score += 8; why.push('✓ sélection sur dossier'); }
      if (d.dossier === false && p.dossier) score -= 2;
      if (p.scholar && d.scholarship) { score += 6; why.push('✓ aide pour les boursier·ères'); }
      if (st.code === 'open' || (st.code === 'soon' && st.n <= 60)) score += 5;
      return { s, d, el, st, why, score, inBudget };
    }).filter(Boolean);
    rows.sort((a, b) => b.score - a.score || (a.st.s ? a.st.s.close : 0) - (b.st.s ? b.st.s.close : 0));
    const elig = rows.filter(r => r.el.ok && (r.inBudget || maxFee === Infinity));
    const K = p.strategy === 'cible' ? 4 : p.strategy === 'equilibre' ? 6 : 99;
    const auto = new Set(elig.slice(0, K).map(r => r.s.short));
    rows.forEach(r => { r.auto = auto.has(r.s.short); r.on = r.s.short in pk ? !!pk[r.s.short] : r.auto; r.tier = !r.el.ok ? 'out' : r.score >= 68 ? 'top' : r.score >= 52 ? 'try' : 'plan'; });
    return rows;
  }

  const TIERS = { top: ['Prioritaire', 'ok'], try: ['À tenter', 'info'], plan: ['Plan B', 'mute'], out: ['Hors niveau', 'mute'] };
  const gsearch = s => `https://www.google.com/search?q=${encodeURIComponent(s.name + ' concours journalisme inscription 2027')}`;

  function card(r) {
    const { s, d, st } = r, [tl, tc] = TIERS[r.tier];
    return `<div class="cc-card ${r.on ? 'on' : ''} ${r.tier === 'out' ? 'out' : ''}">
      <label class="cc-pick"><input type="checkbox" data-cc-pick="${esc(s.short)}" ${r.on ? 'checked' : ''}><span class="sr-only">Je candidate à ${esc(s.short)}</span></label>
      <div class="cc-main">
        <div class="cc-top"><b class="cc-name">${esc(s.short)}</b><span class="cc-badge ${tc}">${tl}</span><span class="cc-city">${esc(s.city)}</span></div>
        <div class="cc-full">${esc(s.diploma)}</div>
        <div class="cc-line"><span class="cc-st ${st.cls}">${esc(st.text)}</span><span class="cc-fee">${d.fee ? d.fee + ' €' : 'Gratuit'}</span></div>
        ${r.why.length ? `<ul class="cc-why">${r.why.map(w => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
        ${r.tier === 'out' ? `<p class="cc-why-out">${esc(r.el.why)}</p>` : ''}
        <details class="cc-more"><summary>Épreuves et dates détaillées</summary>
          <dl><dt>Inscriptions</dt><dd>${esc(s.reg)}</dd><dt>Écrits / dossier</dt><dd>${esc(s.written)}</dd><dt>Oraux</dt><dd>${esc(s.oral)}</dd></dl>
          ${s.note ? `<p class="p-snote">💡 ${rich(s.note)}</p>` : ''}
          ${d.note ? `<p class="p-snote">📌 ${esc(d.note)}</p>` : ''}
          ${d.scholarship ? `<p class="p-snote">🎓 ${esc(d.scholarship)}</p>` : ''}
          <p style="margin-top:8px"><a href="${esc(gsearch(s))}" target="_blank" rel="noopener">Trouver la page officielle ↗</a>${d.platform ? ` · inscription via <b>${esc(d.platform)}</b>` : ''}</p>
        </details>
      </div></div>`;
  }

  function results() {
    const p = prof(), rows = evaluate(), on = rows.filter(r => r.on);
    const total = on.reduce((n, r) => n + r.d.fee, 0);
    const next = on.filter(r => r.st.s).sort((a, b) => a.st.s.close - b.st.s.close).slice(0, 3);
    const eligN = rows.filter(r => r.el.ok).length;
    const groups = ['top', 'try', 'plan'].map(t => [t, rows.filter(r => r.tier === t)]).filter(g => g[1].length);
    const out = rows.filter(r => r.tier === 'out');
    return `<div class="cc-sum">
        <div class="cc-kpi"><b>${on.length}</b><small>concours sélectionnés${p.level ? ` (sur ${eligN} accessibles)` : ''}</small></div>
        <div class="cc-kpi"><b>${total} €</b><small>de frais de concours au total</small></div>
        <div class="cc-kpi"><b>${next[0] ? fmtShort(next[0].st.s.close) : '—'}</b><small>${next[0] ? `prochaine échéance : ${esc(next[0].s.short)}` : 'aucune échéance'}</small></div>
      </div>
      ${!p.level ? `<div class="banner">👆 <span>Indique ton niveau ci-dessus : je masque ce qui n'est pas accessible et je classe le reste pour toi.</span></div>` : ''}
      ${next.length ? `<div class="card cc-next"><div class="kicker">À faire en premier</div><ol>${next.map(r => `<li><b>${esc(r.s.short)}</b> : ${esc(r.st.text)}</li>`).join('')}</ol></div>` : ''}
      <div class="cc-actions"><button class="btn small primary" data-cc-ics>📅 Mettre mes échéances dans mon agenda</button>
        <button class="btn small ghost" data-cc-reset>↺ Revenir à la sélection automatique</button></div>
      ${groups.map(([t, list]) => `<h3 class="cc-h">${TIERS[t][0]} <small>${t === 'top' ? 'les mieux adaptés à ton profil' : t === 'try' ? 'de bonnes options' : 'à garder en filet de sécurité'}</small></h3>${list.map(card).join('')}`).join('')}
      ${out.length ? `<details class="cc-out"><summary>${out.length} concours hors de ton niveau actuel</summary>${out.map(card).join('')}</details>` : ''}`;
  }

  function chips(name, list, sel, multi) {
    return `<div class="cc-chips">${list.map(([id, label, sub]) => `<button type="button" class="cc-chip ${(multi ? sel.includes(id) : sel === id) ? 'on' : ''}" data-cc-${name}="${esc(id)}" aria-pressed="${multi ? sel.includes(id) : sel === id}">${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ''}</button>`).join('')}</div>`;
  }

  function view() {
    const p = prof();
    return `<div class="cc">
      <div class="card cc-intro"><h3>🔎 Je trouve tes concours</h3>
        <p>Dis-moi qui tu es et ce que tu veux : je classe les ${P.schools.length} cursus reconnus par la profession, je garde les plus larges, et je suis les dates pour toi. Tout se recalcule à chaque visite.</p></div>
      <div class="card cc-form">
        <div class="cc-q"><h4>Quel diplôme auras-tu à la rentrée 2027 ?</h4>${chips('level', D.levels.map(l => [l.id, l.label, l.sub]), p.level)}</div>
        <div class="cc-q"><h4>Où es-tu prêt·e à étudier ? <small>(rien de coché = partout en France)</small></h4>${chips('region', D.regions.map(r => [r.id, r.label]), p.regions, true)}</div>
        <div class="cc-q"><h4>Budget maximum par concours</h4>${chips('budget', [['any', 'Peu importe'], ['300', '300 € max'], ['100', '100 € max'], ['free', 'Gratuit seulement']], p.budget)}
          <label class="toggle cc-tg"><span><b>Je suis boursier·ère</b><br><small class="muted">Je mets en avant les écoles qui ont des aides</small></span><input type="checkbox" data-cc-scholar ${p.scholar ? 'checked' : ''}></label></div>
        <div class="cc-q"><h4>Type d'épreuves</h4>${chips('dossier', [['no', 'Peu importe'], ['yes', 'Plutôt sur dossier']], p.dossier ? 'yes' : 'no')}</div>
        <div class="cc-q"><h4>Tes envies <small>(elles personnalisent ton plan et ton entretien avec le jury)</small></h4>${chips('wish', D.wishes.map(w => [w, w]), p.wishes, true)}</div>
        <div class="cc-q"><h4>Ta stratégie</h4>${chips('strategy', [['large', 'Large', 'tous les concours accessibles'], ['equilibre', 'Équilibrée', '6 concours'], ['cible', 'Ciblée', '4 concours']], p.strategy)}
          <p class="muted" style="font-size:13px;margin-top:8px">Aucune école ne garantit une admission, et les taux de réussite sont faibles. Tenter <b>large</b> est ce qui protège le mieux : on ne sait jamais où on passera.</p></div>
      </div>
      <div id="cc-results">${results()}</div>
      <h3 class="cc-h">🎓 Si tu es boursier·ère</h3>
      <div class="list">${D.aides.map(a => `<div class="card p-voice"><div class="p-vwho">${esc(a.title)}</div><p style="margin:6px 0 4px;font-size:14px">${esc(a.text)}</p><div class="p-src"><a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.source)} ↗</a></div></div>`).join('')}</div>
      <p class="muted cc-foot">Dates : session 2026 reportées sur 2027 (L'Etudiant, mars 2026), sauf l'ESJ Lille dont l'école a publié les dates 2027. Elles changent chaque année : vérifie sur le site de l'école avant de t'inscrire.</p>
    </div>`;
  }

  ctx.addPrepaTab('concours', '🔎', 'Mes concours', view, 'plan');

  const refresh = () => { ctx.save(); const el = $('#cc-results'); if (el) el.innerHTML = results(); };

  // ---------- Export agenda (.ics) ----------
  function ics() {
    const on = evaluate().filter(r => r.on && r.st.s);
    const dt = d => `${d.getFullYear()}${ctx.pad(d.getMonth() + 1)}${ctx.pad(d.getDate())}`;
    const nextDay = d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; };
    const ev = [];
    on.forEach(r => {
      const mk = (d, title, alarm) => ev.push(['BEGIN:VEVENT', `UID:scoop-${r.s.short.replace(/\W/g, '')}-${dt(d)}@scoopfr`, `DTSTAMP:${dt(today())}T000000Z`, `DTSTART;VALUE=DATE:${dt(d)}`, `DTEND;VALUE=DATE:${dt(nextDay(d))}`, `SUMMARY:${title}`,
        `DESCRIPTION:Dates de la session précédente reportées : vérifie sur le site de l'école. ${r.d.fee ? 'Frais : ' + r.d.fee + ' euros.' : 'Gratuit.'}`,
        'BEGIN:VALARM', `TRIGGER:-P${alarm}D`, 'ACTION:DISPLAY', `DESCRIPTION:${title}`, 'END:VALARM', 'END:VEVENT'].join('\r\n'));
      if (r.st.s.open && r.st.code === 'soon') mk(r.st.s.open, `🟢 Ouverture des inscriptions : ${r.s.short}`, 1);
      mk(r.st.s.close, `🔴 Clôture des inscriptions : ${r.s.short}`, 7);
    });
    if (!ev.length) { alert('Sélectionne au moins un concours.'); return; }
    const txt = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Scoop//Concours//FR', 'CALSCALE:GREGORIAN', ...ev, 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/calendar' }));
    a.download = 'scoop-concours.ics'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ---------- Événements ----------
  document.addEventListener('click', e => {
    const c = e.target.closest('.cc'); if (!c) return;
    const p = prof();
    const set = (key, val) => { p[key] = val; };
    const chip = e.target.closest('.cc-chip');
    if (chip) {
      const g = chip.parentElement, d = chip.dataset;
      if ('ccLevel' in d) set('level', p.level === d.ccLevel ? '' : d.ccLevel);
      else if ('ccRegion' in d) set('regions', p.regions.includes(d.ccRegion) ? p.regions.filter(x => x !== d.ccRegion) : [...p.regions, d.ccRegion]);
      else if ('ccBudget' in d) set('budget', d.ccBudget);
      else if ('ccDossier' in d) set('dossier', d.ccDossier === 'yes');
      else if ('ccWish' in d) set('wishes', p.wishes.includes(d.ccWish) ? p.wishes.filter(x => x !== d.ccWish) : [...p.wishes, d.ccWish]);
      else if ('ccStrategy' in d) { set('strategy', d.ccStrategy); ctx.S.prepa.picked = {}; }
      // remet à jour l'aspect des puces du groupe
      const sel = { ccLevel: [p.level], ccRegion: p.regions, ccBudget: [p.budget], ccDossier: [p.dossier ? 'yes' : 'no'], ccWish: p.wishes, ccStrategy: [p.strategy] };
      const key = Object.keys(sel).find(k => k in d);
      $$('.cc-chip', g).forEach(b => { const on = sel[key].includes(b.dataset[key]); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      refresh(); return;
    }
    if (e.target.closest('[data-cc-ics]')) { ics(); return; }
    if (e.target.closest('[data-cc-reset]')) { ctx.S.prepa.picked = {}; refresh(); return; }
  });
  document.addEventListener('change', e => {
    const pk = e.target.closest('[data-cc-pick]');
    if (pk) { picks()[pk.dataset.ccPick] = pk.checked; pk.closest('.cc-card').classList.toggle('on', pk.checked); ctx.save(); const r = $('#cc-results'); if (r) { const open = $$('details[open]', r).map(x => x.querySelector('summary').textContent); const y = window.scrollY; r.innerHTML = results(); $$('details', r).forEach(x => { if (open.includes(x.querySelector('summary').textContent)) x.open = true; }); window.scrollTo(0, y); } return; }
    if (e.target.matches('[data-cc-scholar]')) { prof().scholar = e.target.checked; refresh(); }
  });

  // L'oral et le plan réutilisent le profil
  ctx.concours = { profile: prof, evaluate };
});
