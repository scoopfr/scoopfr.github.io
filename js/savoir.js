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
  function buildLinker() {
    const map = new Map(), alts = [];
    allTerms().forEach(e => e.a.forEach(a => { const n = nz(a); if (n.length >= 3 && !map.has(n)) { map.set(n, e.key); alts.push(a); } }));
    alts.sort((x, y) => y.length - x.length);
    if (!alts.length) return html => html;
    const rx = new RegExp('(^|[^\\p{L}\\d])(' + alts.map(a => rxEsc(a).replace(/['’]/g, '(?:\'|&#39;|’)')).join('|') + ')(?![\\p{L}\\d])', 'giu');
    return html => {
      const seen = new Set();
      return String(html).split(/(<[^>]+>)/).map((seg, i) => i % 2 ? seg : seg.replace(rx, (m, pre, term) => {
        const n = nz(term.replace(/&#39;/g, '\'')), key = map.get(n); if (!key || seen.has(key)) return m;
        seen.add(key); return `${pre}<button class="gl" data-gl="${esc(key)}" title="Voir la définition">${term}</button>`;
      })).join('');
    };
  }
  ctx.setGlossLinker(html => { if (!linker) linker = buildLinker(); return linker(html); });
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

  // =========================================================== NOMS ET DATES (cartes à trous, révision espacée)
  const MONTHS = 'janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre';
  const DATE_RX = new RegExp(`\\b\\d{1,2}(?:er)? (?:${MONTHS})(?: \\d{4})?`, 'i');
  const NUM_RX = /\b\d[\d\s  .,]*\d?\s?(?:milliards?|millions?|%|euros?|€|dollars?|morts?|victimes?|voix|députés|sièges|femmes)\b|\b\d{2,3}(?:[\s  ]\d{3})+\b/i;
  const NOPE = new Set('Le La Les Un Une Des Du De Au Aux En Dans Sur Pour Par Avec Sans Selon Lundi Mardi Mercredi Jeudi Vendredi Samedi Dimanche Janvier Février Mars Avril Mai Juin Juillet Août Septembre Octobre Novembre Décembre Cette Ces Son Ses Leur Après Avant Depuis Alors Mais Donc Ainsi Cela Ils Elle Dès Monde Figaro Libération Guardian Times AFP Reuters Franceinfo Parisien Croix Express France Europe Selon'.split(' '));
  const NAME_RX = /[A-ZÉÈÀ][\p{L}'’-]{2,}(?:\s+[A-ZÉÈÀ][\p{L}'’-]{2,})+|[A-ZÉÈÀ][\p{L}'’-]{3,}/gu;
  const sentencesOf = t => (plain(t).match(/[^.!?]+[.!?]+/g) || []).map(s => s.trim()).filter(s => s.length >= 40 && s.length <= 260);
  const BLANK = '……';
  function cardsOf(day) {
    const out = [];
    day.stories.forEach((s, i) => {
      const ss = sentencesOf(s.text);
      const mk = (kind, sentence, answer) => out.push({ id: `${day.date}:${i}:${kind}`, k: kind, f: sentence.replace(answer, BLANK), b: answer, t: s.title, d: day.date });
      let done = { date: false, chiffre: false, nom: false };
      for (const sen of ss) {
        if (!done.date) { const m = sen.match(DATE_RX); if (m) { mk('date', sen, m[0]); done.date = true; continue; } }
        if (!done.chiffre) { const m = sen.match(NUM_RX); if (m && m[0].replace(/\D/g, '').length >= 2 && !DATE_RX.test(m[0])) { mk('chiffre', sen, m[0].trim()); done.chiffre = true; continue; } }
        if (!done.nom) {
          const names = (sen.slice(1).match(NAME_RX) || []).filter(n => !NOPE.has(n.split(' ')[0]) && n.length >= 5);
          const nm = names.find(n => n.includes(' ')) || names[0];
          if (nm) { mk('nom', sen, nm); done.nom = true; }
        }
      }
    });
    return out;
  }
  const mem = () => { const s = S(); s.mem = s.mem || { cards: {} }; s.mem.cards = s.mem.cards || {}; return s.mem; };
  const INTERVALS = [1, 2, 4, 8, 16, 32];
  const addDaysStr = (d, n) => ctx.addDays(d, n);
  function absorbCards(day) {
    const m = mem(); let added = 0;
    cardsOf(day).forEach(c => { if (!m.cards[c.id]) { m.cards[c.id] = { ...c, box: 0, due: TODAY, n: 0, ok: 0 }; added++; } });
    // on garde au plus 600 cartes : les mieux maîtrisées et les plus anciennes partent d'abord
    const ids = Object.keys(m.cards);
    if (ids.length > 600) ids.sort((a, b) => (m.cards[b].box - m.cards[a].box) || m.cards[a].d.localeCompare(m.cards[b].d)).slice(0, ids.length - 600).forEach(id => delete m.cards[id]);
    if (added) dirty = true;
  }
  const memStats = () => { const cs = Object.values(mem().cards); return { total: cs.length, due: cs.filter(c => c.due <= TODAY).length, mastered: cs.filter(c => c.box >= 4).length }; };
  let M = null;   // séance de révision en cours { queue, i, flip, done, ok }
  const KINDS = { nom: ['👤', 'Qui ?'], date: ['📅', 'Quand ?'], chiffre: ['🔢', 'Combien ?'] };
  function memStart() {
    const cs = Object.values(mem().cards).filter(c => c.due <= TODAY);
    const seen = cs.filter(c => c.n > 0).sort((a, b) => a.due.localeCompare(b.due)), fresh = shuffle(cs.filter(c => c.n === 0)).slice(0, 6);
    M = { queue: shuffle([...seen.slice(0, 10), ...fresh]).slice(0, 12), i: 0, flip: false, ok: 0 };
    renderMem();
  }
  function renderMem() {
    const el = $('#mem-area'); if (!el) return;
    if (!M) { el.innerHTML = ''; return; }
    if (M.i >= M.queue.length) {
      el.innerHTML = `<div class="card mem-end"><div class="big" style="font-size:46px">🎉</div><h3>Séance terminée</h3><p>${M.ok}/${M.queue.length} retenus. Ce que tu n'as pas su revient demain, le reste dans quelques jours.</p><a class="btn primary" href="#/memoire">Retour</a></div>`;
      ctx.sfx.end(); return;
    }
    const c = M.queue[M.i], [ico, label] = KINDS[c.k] || ['❓', ''];
    el.innerHTML = `<div class="mem-card" data-memflip><div class="mem-top"><span>${ico} ${label}</span><span>${M.i + 1} / ${M.queue.length}</span></div>
      <p class="mem-q">${esc(c.f).replace(esc(BLANK), '<span class="mem-blank">……</span>')}</p>
      ${M.flip ? `<div class="mem-a"><small>Réponse</small><b>${esc(c.b)}</b><p class="mem-ctx">📰 ${esc(c.t)} · ${esc(frDate(c.d, { day: 'numeric', month: 'long' }))}</p></div>` : '<p class="mem-hint">Touche la carte pour voir la réponse</p>'}</div>
      ${M.flip ? `<div class="mem-btns"><button class="btn danger" data-mem="0">😕 Je ne savais pas</button><button class="btn green" data-mem="1">👍 Je savais</button></div>` : `<div class="mem-btns"><button class="btn primary block" data-memflip>Voir la réponse</button></div>`}`;
  }
  document.addEventListener('click', e => {
    if (e.target.closest('[data-memstart]')) { memStart(); return; }
    if (e.target.closest('[data-memflip]') && M && !M.flip) { M.flip = true; renderMem(); return; }
    const r = e.target.closest('[data-mem]');
    if (r && M) {
      const ok = r.dataset.mem === '1', c = mem().cards[M.queue[M.i].id];
      if (c) { c.n++; if (ok) { c.ok++; c.due = addDaysStr(TODAY, INTERVALS[Math.min(c.box, 5)]); c.box = Math.min(c.box + 1, 5); } else { c.box = 0; c.due = addDaysStr(TODAY, 1); } }
      if (ok) { M.ok++; ctx.addXp(2); ctx.sfx.pair(); } else ctx.sfx.ko();
      record(ok); ctx.markActive(); ctx.save(); ctx.renderChrome();
      M.i++; M.flip = false; renderMem();
    }
  });
  function viewMemoire() {
    const st = memStats();
    return `<div class="kicker">Mémoire</div><h1 style="font-size:34px;margin:8px 0 6px">Noms, dates et chiffres</h1>
      <p class="muted">Chaque info de l'actu devient des <b>cartes à trous</b> : un nom, une date, un chiffre à retrouver. Ce que tu rates revient le lendemain ; ce que tu sais revient de plus en plus tard. Tout reste en mémoire, jour après jour.</p>
      <div class="cc-sum"><div class="cc-kpi"><b>${st.due}</b><small>à réviser aujourd'hui</small></div><div class="cc-kpi"><b>${st.total}</b><small>cartes en mémoire</small></div><div class="cc-kpi"><b>${st.mastered}</b><small>bien maîtrisées</small></div></div>
      <div id="mem-area">${st.due ? `<button class="btn primary block" data-memstart>▶ Réviser maintenant (${Math.min(st.due, 12)} cartes)</button>` : `<div class="card"><b>${st.total ? 'Tout est à jour 👏' : 'Pas encore de cartes'}</b><p class="muted" style="margin-top:6px">${st.total ? 'Reviens demain : de nouvelles cartes arrivent avec l\'édition du jour, et les anciennes reviennent au bon moment.' : 'Les cartes se créent à partir des éditions. Ouvre l\'Actu pour en générer.'}</p></div>`}</div>
      ${gaugeCard()}
      <p class="muted" style="margin-top:16px;font-size:13px">Les cartes sont créées automatiquement à partir des phrases des infos : un nom, une date ou un chiffre est caché, à toi de le retrouver.</p>`;
  }
  ctx.addRoute('memoire', () => { M = null; return viewMemoire(); });

  // =========================================================== RAPPELS (questions des éditions précédentes)
  let prevQs = [];
  function buildPrev(days) {
    prevQs = [];
    days.filter(d => d.date < (ctx.CURRENT || TODAY)).forEach(d => d.lessons.forEach((l, li) => l.exercises.forEach((ex, ei) => {
      if ((ex.t === 'qcm' && ex.c && ex.c.length <= 4) || ex.t === 'vf') prevQs.push({ id: `day:${d.date}:${li}:${ei}`, ex, date: d.date });
    })));
  }
  ctx.addLesson('rappel', key => {
    if (!prevQs.length) return null;
    const rv = new Set(S().review.map(r => r.id)), rec = S().recall || {};
    const pool = shuffle(prevQs).sort((a, b) => ((rv.has(b.id) ? 2 : 0) - (rv.has(a.id) ? 2 : 0)) + ((rec[a.id] || 0) - (rec[b.id] || 0)) * 0.5).slice(0, 8);
    return { key, mode: 'review', title: 'Rappel des jours précédents', color: '#2BA84A', exercises: pool.map(p => p.ex), ids: pool.map(p => p.id), context: 'Actu des éditions précédentes' };
  });
  ctx.onAnswer((ok, src, it) => {
    if (it && it.id && /^day:/.test(String(it.id))) { const s = S(); s.recall = s.recall || {}; s.recall[it.id] = (s.recall[it.id] || 0) + (ok ? 1 : -1); }
  });

  // =========================================================== JAUGE DE CONNAISSANCE
  const know = () => { const s = S(); s.know = s.know || { self: null, recent: [], hist: [] }; s.know.recent = s.know.recent || []; s.know.hist = s.know.hist || []; return s.know; };
  function record(ok) {
    const k = know(); k.recent.push(ok ? 1 : 0); if (k.recent.length > 40) k.recent.shift();
    const v = real(); if (v != null) { const last = k.hist[k.hist.length - 1]; if (last && last.d === TODAY) last.v = v; else { k.hist.push({ d: TODAY, v }); if (k.hist.length > 90) k.hist.shift(); } }
  }
  const real = () => { const r = know().recent; return r.length >= 5 ? Math.round(r.reduce((a, b) => a + b, 0) / r.length * 100) : null; };
  ctx.onAnswer((ok, src, it) => { if (src === 'feed' || (it && it.id && /^day:/.test(String(it.id)))) { record(ok); ctx.save(); } });
  function gaugeCard() {
    const k = know(), r = real(), n = k.recent.length, self = k.self;
    let msg;
    if (r == null) msg = `Réponds à encore ${Math.max(1, 5 - n)} question${5 - n > 1 ? 's' : ''} d'actu pour mesurer ton niveau réel.`;
    else if (self == null) msg = 'Place ton estimation, puis compare-la avec la mesure.';
    else { const gap = self - r; msg = gap >= 15 ? `Tu te surestimes de ${gap} points : l'actu est plus fuyante qu'elle n'en a l'air. Révise les cartes !` : gap <= -15 ? `Tu te sous-estimes de ${-gap} points : tu en sais plus que tu ne crois.` : 'Ton estimation est juste : bonne connaissance de ton niveau.'; }
    return `<div class="card gauge" id="gauge"><h4>📊 Ma connaissance de l'actualité</h4>
      <div class="gauge-row"><span>Mon estimation</span><b>${self == null ? '—' : self + ' %'}</b></div>
      <input class="gauge-slider" type="range" min="0" max="100" step="5" value="${self == null ? 50 : self}" data-gauge-self aria-label="Mon estimation de ma connaissance de l'actualité">
      <div class="gauge-row"><span>Mesure réelle <small>(sur mes ${Math.min(n, 40)} dernières réponses d'actu)</small></span><b>${r == null ? '—' : r + ' %'}</b></div>
      <div class="gauge-bar"><i class="gauge-real" style="width:${r || 0}%"></i>${self != null ? `<i class="gauge-self" style="left:${self}%" title="Mon estimation"></i>` : ''}</div>
      <p class="gauge-msg">${esc(msg)}</p></div>`;
  }
  document.addEventListener('input', e => { const g = e.target.closest('[data-gauge-self]'); if (g) { know().self = +g.value; ctx.save(); const card = $('#gauge'); if (card) card.outerHTML = gaugeCard(); } });
  ctx.addHomeBlock(() => `<div class="tools-row"><a class="tool-chip" href="#/memoire"><span>🧩</span><b>Noms & dates</b><small>${memStats().due ? memStats().due + ' à réviser' : 'cartes à trous'}</small></a>
    ${prevQs.length ? `<button class="tool-chip" data-start="rappel"><span>🔁</span><b>Rappel</b><small>jours précédents</small></button>` : ''}
    <a class="tool-chip" href="#/glossaire"><span>📖</span><b>Glossaire</b><small>${allTerms().length} mots</small></a>
    <a class="tool-chip" href="#/voix"><span>🗣️</span><b>Voix officielles</b><small>prises de parole</small></a>
    <a class="tool-chip" href="#/search"><span>🔎</span><b>Recherche</b><small>infos, quiz, mots</small></a></div>${gaugeCard()}`);

  // =========================================================== démarrage : absorbe les éditions chargées
  ctx.onReady(async () => {
    const days = await ctx.loadDays(60);
    days.slice().reverse().forEach(d => { absorbDay(d); absorbCards(d); });
    buildPrev(days);
    const fresh = dirty;
    if (dirty) { ctx.save(); dirty = false; linker = null; }
    // les mots cliquables, les cartes et les rappels apparaissent sans recharger (sauf pendant une leçon ou le fil)
    if (fresh && !document.body.classList.contains('in-lesson') && !document.body.classList.contains('in-welcome') && !/^#\/(feed|search|memoire)/.test(location.hash)) ctx.route();
    else if (!fresh && /^#\/home|^$/.test(location.hash || '')) ctx.route();
  });

  // =========================================================== VOIX OFFICIELLES (X)
  // Pas de flux en direct dans Scoop : à ma connaissance l'API de X est payante, et ses widgets intégrés ajoutent des traceurs et du poids.
  // On propose donc des liens directs vers les comptes officiels, et une recherche par info (sous chaque info, bloc « source primaire »).
  const VOIX = [
    ['France', [['Élysée', 'Elysee'], ['Emmanuel Macron', 'EmmanuelMacron'], ['Gouvernement', 'gouvernementFR'], ['Diplomatie française', 'FranceDiplomatie'], ['Assemblée nationale', 'Assemblee_nat'], ['Sénat', 'Senat']]],
    ['Europe', [['Commission européenne', 'EU_Commission'], ['Ursula von der Leyen', 'vonderleyen'], ['Parlement européen (FR)', 'Europarl_FR'], ['OTAN', 'NATO']]],
    ['Monde', [['ONU', 'UN'], ['ONU (français)', 'ONU_fr'], ['António Guterres', 'antonioguterres'], ['OMS', 'WHO'], ['FMI', 'IMFNews']]],
    ['Médias', [['AFP', 'AFP'], ['Reporters sans frontières', 'RSF_fr']]]
  ];
  ctx.addRoute('voix', () => `<div class="kicker">Voix officielles</div><h1 style="font-size:32px;margin:8px 0 6px">Les prises de parole à la source</h1>
    <p class="muted">Quand une personnalité ou une institution s'exprime, le plus sûr est de lire <b>ce qu'elle a réellement dit</b>, à la source. Voici des comptes officiels à suivre sur X. Vérifie toujours que le compte est bien le bon (badge, lien depuis le site officiel) avant de citer.</p>
    <div class="banner">ℹ️ <span>Scoop n'affiche pas les messages en direct : l'accès automatique à X est payant et ses widgets intégrés ajoutent des traceurs et alourdissent la page. Les liens s'ouvrent sur X ; sous chaque info, le bloc « 📜 Retrouver la source primaire » lance une recherche avec les bons mots.</span></div>
    ${VOIX.map(([g, list]) => `<h3 class="cc-h">${esc(g)}</h3><div class="tools-row">${list.map(([n, h]) => `<a class="tool-chip" href="https://x.com/${esc(h)}" target="_blank" rel="noopener"><span>🗣️</span><b>${esc(n)}</b><small>@${esc(h)}</small></a>`).join('')}</div>`).join('')}
    <p class="muted" style="font-size:12.5px;margin-top:14px">Liste d'exemples, non exhaustive. Pour les responsables politiques en poste, passe par le site officiel de l'institution, qui indique les comptes à jour.</p>`);
});
