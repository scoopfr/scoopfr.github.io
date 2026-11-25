/* =========================================================
   Scoop — Savoir : glossaire nourri par les actus, recherche, noms et dates, rappels, jauge de connaissance
   - Glossaire : termes de base (data/glossaire.js) + « mot du jour » et termes (`glossary`) de CHAQUE édition,
     gardés en mémoire sur l'appareil. Les mots deviennent cliquables dans les textes de l'actu.
   - Recherche : infos, quiz, glossaire, écoles.
   - Noms et dates : cartes à trous tirées des infos, révision espacée (cases de Leitner), gardées en mémoire.
   - Rappels : questions des éditions précédentes.
   - Jauge : ton estimation de ta connaissance de l'actu face à la mesure réelle de tes réponses.
   ========================================================= */
(window.SCOOP_MODULES = window.SCOOP_MODULES || []).push(ctx => {
  'use strict';
  const { $, $$, esc, rich, shuffle, TODAY, frDate } = ctx;
  const BASE = window.SCOOP_GLOSSAIRE || [];
  const nz = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'`]/g, '\'').replace(/\s+/g, ' ').trim();
  const plain = s => String(s || '').replace(/\*\*|\*/g, '');
  const rxEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const S = () => ctx.S;
  const modal = html => { const m = $('#modal'); $('#modal-inner').innerHTML = html; if (typeof m.showModal === 'function') { if (!m.open) m.showModal(); } else m.setAttribute('open', ''); };

  // =========================================================== GLOSSAIRE
  const extra = () => (S().gloss = S().gloss || {});     // termes issus des actus, gardés en mémoire
  const baseKeys = new Set(BASE.map(b => nz(b.t)));
  let dirty = false, linker = null;
  function absorbDay(day) {
    if (!day) return;
    const g = extra();
    const add = (e, cat) => {
      if (!e || !e.term || !e.def) return;
      const k = nz(e.term); if (baseKeys.has(k) || g[k]) return;
      g[k] = { t: e.term, d: e.def, c: cat || e.cat || 'Actu', date: day.date, a: Array.isArray(e.aliases) ? e.aliases : [] };
      dirty = true; linker = null;
    };
    add(day.word, 'Mot du jour');
    (day.glossary || []).forEach(e => add(e, e && e.cat));
  }
  const allTerms = () => [...BASE.map(b => ({ key: nz(b.t), t: b.t, a: b.a || [], c: b.c, d: b.d, src: 'base' })),
    ...Object.entries(extra()).map(([k, x]) => ({ key: k, t: x.t, a: (x.a && x.a.length) ? x.a : [x.t], c: x.c, d: x.d, date: x.date, src: 'actu' }))];

  // met en lien les termes d'un texte HTML (déjà échappé) : première occurrence de chaque terme seulement
  // - reconnaît aussi le pluriel (« droits de douane », « sanctions »), la forme sans accent et sans majuscule
  // - `skip` (facultatif) : texte dont les termes ne sont PAS mis en lien (les choix d'une question de quiz :
  //   la définition ne doit pas donner la réponse)
  function buildLinker() {
    const map = new Map(), alts = [];
    const unacc = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
    allTerms().forEach(e => e.a.forEach(a => {
      const n = nz(a); if ((n.length < 3 && !/^[A-Z0-9]{2}$/.test(a)) || map.has(n)) return;   // sigles de 2 caractères (G7, IA) acceptés
      map.set(n, e.key); alts.push(a);
      if (unacc(a) !== a) alts.push(unacc(a));
    }));
    alts.sort((x, y) => y.length - x.length);
    if (!alts.length) return html => html;
    const rx = new RegExp('(^|[^\\p{L}\\d])(' + alts.map(a => rxEsc(a).replace(/['’]/g, '(?:\'|&#39;|’)')).join('|') + ')(s|x)?(?![\\p{L}\\d])', 'giu');
    return (html, skip) => {
      const seen = new Set(), sk = skip ? nz(plain(skip)) : '';
      return String(html).split(/(<[^>]+>)/).map((seg, i) => i % 2 ? seg : seg.replace(rx, (m, pre, term, pl) => {
        const n = nz(term.replace(/&#39;/g, '\'')), key = map.get(n); if (!key || seen.has(key)) return m;
        if (sk && sk.includes(n)) return m;
        seen.add(key); return `${pre}<button class="gl" data-gl="${esc(key)}" title="Voir la définition">${term}${pl || ''}</button>`;
      })).join('');
    };
  }
  ctx.setGlossLinker((html, skip) => { if (!linker) linker = buildLinker(); return linker(html, skip); });
  const findTerm = key => allTerms().find(e => e.key === key);

  document.addEventListener('click', e => {
    const b = e.target.closest('.gl'); if (!b) return;
    e.preventDefault(); const t = findTerm(b.dataset.gl); if (!t) return;
    modal(`<div class="modal-head"><div class="kicker">${esc(t.c)}${t.src === 'actu' && t.date ? ' · vu dans l\'actu du ' + esc(frDate(t.date, { day: 'numeric', month: 'long' })) : ''}</div><button class="icon-btn" data-close aria-label="Fermer">✕</button></div>
      <h2>${esc(t.t)}</h2><p style="font-size:16px;line-height:1.55;margin:8px 0 16px">${rich(t.d)}</p>
      <a class="btn small ghost" href="#/glossaire" data-close>📖 Tout le glossaire</a>`);
  });

  function viewGlossaire(q) {
    q = decodeURIComponent(q || '');
    const terms = allTerms().sort((a, b) => a.t.localeCompare(b.t, 'fr'));
    const cats = [...new Set(terms.map(t => t.c))];
    const fresh = terms.filter(t => t.src === 'actu').sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const item = t => `<details class="gl-item card" data-s="${esc(nz(t.t + ' ' + t.d + ' ' + t.c))}" id="gl-${esc(t.key.replace(/\W+/g, '-'))}"><summary><b>${esc(t.t)}</b><span class="gl-cat">${esc(t.c)}</span></summary><p>${rich(t.d)}</p>${t.src === 'actu' && t.date ? `<p class="gl-from">📰 Ajouté depuis l'actu du <a href="#/day/${esc(t.date)}">${esc(frDate(t.date, { day: 'numeric', month: 'long' }))}</a></p>` : ''}</details>`;
    return `<div class="kicker">Glossaire</div><h1 style="font-size:34px;margin:8px 0 6px">Les mots à connaître</h1>
      <p class="muted">Termes juridiques, institutionnels, économiques et du métier. Il <b>grandit avec l'actu</b> : chaque édition y ajoute son mot du jour et ses termes. Dans l'Actu, les mots soulignés en pointillés sont cliquables.</p>
      <input class="gl-search" id="gl-q" type="search" placeholder="Chercher un mot ou une définition…" value="${esc(q)}" aria-label="Chercher dans le glossaire" autocomplete="off">
      <div class="gl-cats">${cats.map(c => `<button class="cc-chip" data-glcat="${esc(c)}">${esc(c)}</button>`).join('')}</div>
      ${fresh.length ? `<h3 class="cc-h">🆕 Issus des actus <small>${fresh.length} mot${fresh.length > 1 ? 's' : ''}</small></h3><div class="gl-list" id="gl-fresh">${fresh.slice(0, 20).map(item).join('')}</div>` : ''}
      <h3 class="cc-h">📖 Tous les mots <small>${terms.length}</small></h3><div class="gl-list" id="gl-all">${terms.map(item).join('')}</div>
      <p class="muted" id="gl-none" hidden style="margin-top:12px">Aucun mot ne correspond. Essaie un autre terme, ou cherche dans <a href="#/search/${encodeURIComponent(q)}">les articles et les quiz</a>.</p>`;
  }
  function filterGloss() {
    const q = nz(($('#gl-q') || {}).value || ''), cat = (document.querySelector('.gl-cats .on') || {}).dataset;
    let n = 0;
    $$('.gl-item').forEach(el => { const ok = (!q || el.dataset.s.includes(q)) && (!cat || !cat.glcat || el.dataset.s.includes(nz(cat.glcat))); el.hidden = !ok; if (ok) n++; });
    const none = $('#gl-none'); if (none) none.hidden = n > 0;
  }
  document.addEventListener('input', e => { if (e.target.id === 'gl-q') filterGloss(); });
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-glcat]'); if (!c) return;
    const on = c.classList.contains('on'); $$('[data-glcat]').forEach(x => x.classList.remove('on')); if (!on) c.classList.add('on'); filterGloss();
  });
  ctx.addRoute('glossaire', arg => viewGlossaire(arg));
  ctx.addTrainItem(() => ({ k: 'glossaire', o: 7, ico: '📖', title: 'Glossaire', sub: `${allTerms().length} mots · il grandit avec l'actu`, href: '#/glossaire' }));

  // =========================================================== RECHERCHE
  const stripMd = s => plain(s);
  function snippet(text, toks) {
    const t = stripMd(text), n = nz(t); let at = -1;
    for (const w of toks) { at = n.indexOf(w); if (at >= 0) break; }
    const from = Math.max(0, at - 50); return (from ? '…' : '') + esc(t.slice(from, from + 170)) + (t.length > from + 170 ? '…' : '');
  }
  async function viewSearch(arg) {
    const q = decodeURIComponent(arg || '').trim(), toks = nz(q).split(' ').filter(w => w.length >= 2);
    const form = `<form class="gl-bigsearch" data-search><input type="search" name="q" value="${esc(q)}" placeholder="Une info, un quiz, un mot…" aria-label="Rechercher" autocomplete="off"><button class="btn primary">Chercher</button></form>`;
    if (!toks.length) return `<div class="kicker">Recherche</div><h1 style="font-size:30px;margin:8px 0 14px">Chercher dans Scoop</h1>${form}<p class="muted">Tape un nom, un lieu, un mot : tu trouveras les infos des éditions, les quiz, le glossaire et les écoles.</p>`;
    const score = text => { const n = nz(text); return toks.reduce((s, w) => s + (n.includes(w) ? 1 : 0), 0); };
    const days = await ctx.loadDays(60);
    const arts = [], quiz = [];
    days.forEach(day => {
      day.stories.forEach((s, i) => { const sc = score(s.title) * 3 + score(s.text) + score(s.why || ''); if (sc >= toks.length && toks.every(w => nz(`${s.title} ${s.text} ${s.why || ''} ${s.tag}`).includes(w))) arts.push({ sc, day, s, i }); });
      day.lessons.forEach((l, li) => l.exercises.forEach(ex => {
        const txt = `${ex.q || ''} ${ex.t === 'qcm' ? (ex.c || []).join(' ') : ''}`;
        if (toks.every(w => nz(txt).includes(w))) quiz.push({ key: `day:${day.date}:${li}`, q: ex.q, where: `${l.title} · ${frDate(day.date, { day: 'numeric', month: 'short' })}`, sc: score(ex.q) });
      }));
    });
    [...(window.SCOOP_UNITS || []), ...(window.SCOOP_CULTURE || [])].forEach(u => u.lessons.forEach((l, li) => l.exercises.forEach(ex => {
      const txt = `${ex.q || ''} ${ex.t === 'qcm' ? (ex.c || []).join(' ') : ''}`;
      if (toks.every(w => nz(txt).includes(w))) quiz.push({ key: `unit:${u.id}:${li}`, q: ex.q, where: `${u.title} · ${l.title}`, sc: score(ex.q) });
    })));
    const gl = allTerms().filter(t => toks.every(w => nz(`${t.t} ${t.d}`).includes(w)));
    const schools = (ctx.PREPA.schools || []).filter(s => toks.every(w => nz(`${s.short} ${s.name} ${s.city}`).includes(w)));
    arts.sort((a, b) => b.sc - a.sc || b.day.date.localeCompare(a.day.date));
    const uniqQ = []; const seenQ = new Set(); quiz.sort((a, b) => b.sc - a.sc).forEach(x => { const k = nz(x.q); if (!seenQ.has(k)) { seenQ.add(k); uniqQ.push(x); } });
    const total = arts.length + uniqQ.length + gl.length + schools.length;
    return `<div class="kicker">Recherche</div><h1 style="font-size:30px;margin:8px 0 14px">« ${esc(q)} »</h1>${form}
      <p class="muted" style="margin:10px 0">${total} résultat${total > 1 ? 's' : ''}${days.length ? ` dans ${days.length} édition${days.length > 1 ? 's' : ''}` : ''}.</p>
      ${arts.length ? `<h3 class="cc-h">📰 Infos <small>${arts.length}</small></h3><div class="list">${arts.slice(0, 12).map(({ day, s, i }) => `<a class="card sr-card" href="#/day/${esc(day.date)}/story-${i}"><div class="sr-meta">${esc(s.tag)} · ${esc(frDate(day.date, { day: 'numeric', month: 'long' }))}</div><b>${esc(s.title)}</b><p>${snippet(s.text, toks)}</p></a>`).join('')}</div>` : ''}
      ${uniqQ.length ? `<h3 class="cc-h">🧠 Quiz <small>${uniqQ.length}</small></h3><div class="list">${uniqQ.slice(0, 10).map(x => `<button class="card sr-card sr-quiz" data-start="${esc(x.key)}"><div class="sr-meta">${esc(x.where)}</div><b>${rich(String(x.q).slice(0, 160))}</b><span class="sr-go">▶ Lancer cette leçon</span></button>`).join('')}</div>` : ''}
      ${gl.length ? `<h3 class="cc-h">📖 Glossaire <small>${gl.length}</small></h3><div class="list">${gl.slice(0, 8).map(t => `<div class="card sr-card"><div class="sr-meta">${esc(t.c)}</div><b>${esc(t.t)}</b><p>${rich(t.d)}</p></div>`).join('')}</div>` : ''}
      ${schools.length ? `<h3 class="cc-h">🏫 Écoles <small>${schools.length}</small></h3><div class="list">${schools.map(s => `<a class="card sr-card" href="#/learn/prepa/annales"><b>${esc(s.short)}</b> · ${esc(s.city)}<p>${esc(s.diploma)}</p></a>`).join('')}</div>` : ''}
      ${!total ? `<div class="empty"><div class="big">🔎</div><h2>Rien trouvé</h2><p class="muted">Essaie un mot plus court, ou un nom propre. La recherche couvre les ${days.length || 'dernières'} éditions, les quiz et le glossaire.</p></div>` : ''}`;
  }
  ctx.addRoute('search', viewSearch);

  // =========================================================== démarrage : le glossaire absorbe les mots des éditions chargées
  ctx.onReady(async () => {
    const days = await ctx.loadDays(60);
    days.slice().reverse().forEach(absorbDay);
    const fresh = dirty;
    if (dirty) { ctx.save(); dirty = false; linker = null; }
    // les mots cliquables apparaissent sans recharger (sauf pendant une leçon ou le fil)
    if (fresh && !document.body.classList.contains('in-lesson') && !document.body.classList.contains('in-welcome') && !/^#\/(feed|search)/.test(location.hash)) ctx.route();
  });
});
