/* =========================================================
   Scoop — moteur de l'application
   Données : data/units.js (parcours concours, permanent)
             data/days/index.js + data/days/AAAA-MM-JJ.js (éditions quotidiennes)
   Progression : localStorage (clé "scoop.v1")
   ========================================================= */
'use strict';
(() => {
  // ---------- Utilitaires ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rich = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>');
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[’'`\-–—_.,;:!?«»"()]/g, ' ').replace(/\s+/g, ' ').trim();
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };
  const frDate = (s, o = { weekday: 'long', day: 'numeric', month: 'long' }) => parseYmd(s).toLocaleDateString('fr-FR', o);
  const TODAY = ymd(new Date());
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

  // ---------- État persistant ----------
  const STORE = 'scoop.v1';
  const DEFAULT = {
    xp: 0, streak: 0, best: 0, last: null, daily: {}, lessons: {}, review: [], saved: [], prepa: {},
    stats: { answered: 0, correct: 0, lessons: 0 },
    settings: { name: '', goal: 50, exam: '', sound: true, theme: 'auto', freeText: false }
  };
  const clone = o => JSON.parse(JSON.stringify(o));
  function merge(a, b) {
    for (const k in b) {
      if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) merge(a[k], b[k]);
      else a[k] = b[k];
    }
    return a;
  }
  function load() {
    try { const raw = localStorage.getItem(STORE); if (raw) return merge(clone(DEFAULT), JSON.parse(raw)); } catch (e) { /* stockage indisponible */ }
    return clone(DEFAULT);
  }
  let S = load();
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) { /* ignore */ } };

  const streakNow = () => (S.last === TODAY || S.last === addDays(TODAY, -1)) ? S.streak : 0;
  const todayXp = () => S.daily[TODAY] || 0;
  function markActive() {
    if (S.last === TODAY) return;
    S.streak = S.last === addDays(TODAY, -1) ? S.streak + 1 : 1;
    S.last = TODAY;
    S.best = Math.max(S.best, S.streak);
  }
  function addXp(n) { S.xp += n; S.daily[TODAY] = (S.daily[TODAY] || 0) + n; }

  const LEVELS = [
    [0, 'Stagiaire'], [100, 'Pigiste'], [300, 'Localier'], [600, 'Rédacteur·rice'], [1000, 'Reporter'],
    [1600, 'Grand reporter'], [2500, "Chef d'édition"], [4000, 'Rédac’ chef'], [6000, 'Prix Albert-Londres']
  ];
  function level(xp = S.xp) {
    let i = 0; while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1][0]) i++;
    const [base, name] = LEVELS[i]; const next = LEVELS[i + 1];
    return { n: i + 1, name, base, next: next ? next[0] : null, nextName: next ? next[1] : null, pct: next ? (xp - base) / (next[0] - base) : 1 };
  }

  // ---------- Thème ----------
  function applyTheme() {
    const t = S.settings.theme;
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
    else delete document.documentElement.dataset.theme;
  }
  applyTheme();

  // ---------- Son ----------
  let actx = null;
  function tone(freqs, type = 'sine', dur = 0.12, gap = 0.09, vol = 0.12) {
    if (!S.settings.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended' && actx.resume) actx.resume(); // iPhone : l'audio démarre « suspendu »
      freqs.forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain(), t0 = actx.currentTime + i * gap;
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        o.connect(g).connect(actx.destination); o.start(t0); o.stop(t0 + dur + 0.02);
      });
    } catch (e) { /* audio indisponible */ }
  }
  const sfx = {
    ok: () => tone([660, 990], 'sine', 0.16),
    ko: () => tone([196, 165], 'square', 0.16, 0.11, 0.05),
    tick: () => tone([520], 'sine', 0.05, 0, 0.05),
    pair: () => tone([740], 'triangle', 0.09, 0, 0.08),
    end: () => tone([523, 659, 784, 1047], 'triangle', 0.22, 0.12, 0.1)
  };

  // ---------- Confettis ----------
  function confetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = $('#confetti'), ctx = c.getContext('2d'), dpr = window.devicePixelRatio || 1;
    c.width = innerWidth * dpr; c.height = innerHeight * dpr; ctx.scale(dpr, dpr);
    const cols = ['#E63946', '#FFC93C', '#2BA84A', '#3A86FF', '#1B1B1F', '#F4A261'];
    const P = Array.from({ length: 160 }, () => ({
      x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * .35,
      vx: (Math.random() - .5) * 16, vy: -Math.random() * 14 - 4, s: 6 + Math.random() * 6,
      r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[Math.floor(Math.random() * cols.length)]
    }));
    const t0 = performance.now();
    (function frame(t) {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      P.forEach(p => { p.vy += .45; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .66); ctx.restore(); });
      if (t - t0 < 2600) requestAnimationFrame(frame); else ctx.clearRect(0, 0, innerWidth, innerHeight);
    })(t0);
  }

  // ---------- Données ----------
  const UNITS = window.SCOOP_UNITS || [];
  const CULTURE = window.SCOOP_CULTURE || [];
  const PREPA = window.SCOOP_PREPA || null;
  const PREPA_UNITS = window.SCOOP_PREPA_UNITS || [];
  const findUnit = id => UNITS.find(x => x.id === id) || CULTURE.find(x => x.id === id) || PREPA_UNITS.find(x => x.id === id);
  const DAYS = {};
  let INDEX = [];        // [{date, title}] du plus récent au plus ancien
  let CURRENT = null;    // date de l'édition affichée par défaut

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.onload = () => { s.remove(); res(); }; s.onerror = () => { s.remove(); rej(new Error(src)); };
      document.head.appendChild(s);
    });
  }
  async function getDay(date) {
    if (!date || !DATE_RE.test(date)) return null;
    if (DAYS[date]) return DAYS[date];
    try { await loadScript(`data/days/${date}.js?t=${Date.now()}`); } catch (e) { return null; }
    const d = (window.SCOOP_DAYS || {})[date];
    if (d) DAYS[date] = d;
    return d || null;
  }

  // ---------- Clés de leçons ----------
  // "unit:<id>:<i>"  |  "day:<date>:<i>"  |  "review"
  function lessonFromKey(key) {
    const [kind, a, b] = key.split(':');
    if (kind === 'unit') {
      const u = findUnit(a); const l = u && u.lessons[+b];
      if (!l) return null;
      return { key, mode: 'unit', title: l.title, color: u.color, exercises: l.exercises, context: u.title };
    }
    if (kind === 'day') {
      const d = DAYS[a]; const l = d && d.lessons[+b];
      if (!l) return null;
      return { key, mode: 'day', date: a, title: l.title, color: '#E63946', exercises: l.exercises, context: `Édition du ${frDate(a)}`, bonus: a === TODAY ? 20 : 0 };
    }
    if (kind === 'oral' && PREPA) {
      // Simulateur d'oral : 5 questions de jury au hasard, en exercices d'écriture auto-évalués
      const pick = shuffle(PREPA.oral).slice(0, 5);
      return {
        key, mode: 'drill', title: 'Simulateur d\'oral', color: '#E63946', context: 'Prépa concours',
        exercises: pick.map(o => ({ t: 'write', q: `🎤 Le jury : « ${o.q} »`, src: 'Note les grandes lignes de ta réponse (ou réponds à voix haute, puis résume-la ici). Vise environ 2 minutes à l\'oral.', model: o.tip, crit: o.keys }))
      };
    }
    if (kind === 'cgmix') {
      const pool = CULTURE.flatMap(u => u.lessons.flatMap((l, li) => l.exercises.map((ex, ei) => ({ ex, id: `unit:${u.id}:${li}:${ei}` }))));
      const pick = shuffle(pool).slice(0, 10);
      if (!pick.length) return null;
      return { key, mode: 'review', title: 'Quiz éclair', color: '#9D4EDD', exercises: pick.map(p => p.ex), ids: pick.map(p => p.id), context: 'Culture G' };
    }
    if (kind === 'review') {
      const items = shuffle(S.review).slice(0, 10);
      if (!items.length) return null;
      return { key, mode: 'review', title: 'Révisions', color: '#3A86FF', exercises: items.map(i => i.ex), ids: items.map(i => i.id), context: 'À revoir' };
    }
    return null;
  }
  const lessonState = key => S.lessons[key] || null;
  const starStr = n => '★'.repeat(n) + '☆'.repeat(3 - n);

  // ---------- Barre du haut + rail ----------
  function renderChrome() {
    const st = streakNow(), goal = S.settings.goal, tx = todayXp(), done = tx >= goal;
    $('#topbar').innerHTML = `
      <a class="tb-logo" href="#/home">scoop<span>.</span></a>
      <div class="tb-stats">
        <span class="tb-stat ${st ? '' : 'off'}" title="Série">🔥 ${st}</span>
        <span class="tb-stat" title="XP total">⚡ ${S.xp}</span>
        <span class="tb-stat ${done ? '' : 'off'}" title="Objectif du jour">🎯 ${Math.min(tx, goal)}/${goal}</span>
      </div>`;

    const lv = level(), R = 32, C = 2 * Math.PI * R, pct = Math.min(1, tx / goal);
    let exam = '';
    if (S.settings.exam && DATE_RE.test(S.settings.exam)) {
      const days = Math.round((parseYmd(S.settings.exam) - parseYmd(TODAY)) / 864e5);
      exam = days >= 0
        ? `<div class="card"><div class="kicker">Compte à rebours</div><div class="countdown">J-${days}</div><p class="muted" style="font-size:14px;margin-top:6px">avant le concours du ${esc(frDate(S.settings.exam, { day: 'numeric', month: 'long', year: 'numeric' }))}</p></div>`
        : `<div class="card"><div class="kicker">Concours</div><p style="margin-top:6px">La date est passée. Bonne chance pour les résultats !</p></div>`;
    } else {
      exam = `<div class="card"><div class="kicker">Concours</div><p style="margin:6px 0 12px;font-size:14px" class="muted">Indique la date de ton concours pour afficher un compte à rebours.</p><a class="btn small ghost" href="#/profile">Définir la date</a></div>`;
    }
    const rv = S.review.length;
    $('#rail').innerHTML = `
      <div class="stat-row">
        <div class="stat-chip ${st ? '' : 'off'}" title="Jours d'affilée">🔥 ${st}</div>
        <div class="stat-chip" title="XP total">⚡ ${S.xp}</div>
        <div class="stat-chip" title="Niveau">🎖️ ${lv.n}</div>
      </div>
      <div class="card">
        <div class="ring-wrap">
          <svg class="ring" viewBox="0 0 76 76" aria-hidden="true"><circle class="bg" cx="38" cy="38" r="${R}"/><circle class="fg" cx="38" cy="38" r="${R}" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}" transform="rotate(-90 38 38)"/><text x="38" y="44" text-anchor="middle" font-size="20">${done ? '✅' : '🎯'}</text></svg>
          <div><h4>Objectif du jour</h4><p class="muted" style="font-size:14px">${Math.min(tx, goal)} / ${goal} XP${done ? ' · bravo !' : ''}</p></div>
        </div>
      </div>
      <div class="card">
        <div class="kicker">Niveau ${lv.n}</div>
        <div class="level-name" style="margin-top:6px">${esc(lv.name)}</div>
        <div class="bar"><i style="width:${Math.round(lv.pct * 100)}%"></i></div>
        <p class="muted" style="font-size:13px;margin-top:6px">${lv.next ? `${lv.next - S.xp} XP avant « ${esc(lv.nextName)} »` : 'Niveau maximum atteint'}</p>
      </div>
      ${exam}
      <div class="card">
        <div class="kicker" style="color:var(--blue)">À revoir</div>
        <p style="margin:6px 0 12px;font-size:14px" class="muted">${rv ? `${rv} question${rv > 1 ? 's' : ''} ratée${rv > 1 ? 's' : ''} t'attend${rv > 1 ? 'ent' : ''}.` : 'Aucune erreur en attente. Impeccable.'}</p>
        ${rv ? `<button class="btn small blue" data-start="review">Réviser</button>` : ''}
      </div>`;
    const badge = $('#review-badge'); badge.hidden = !rv; badge.textContent = rv;
  }

  // ---------- Vues ----------
  function lessonCards(date, day) {
    return `<div class="lesson-cards">${day.lessons.map((l, i) => {
      const k = `day:${date}:${i}`, st = lessonState(k);
      return `<button class="lcard ${st ? 'done' : ''}" data-start="${k}">
        <span class="lc-ico">${esc(l.icon || '📰')}</span>
        <span><span class="lc-title">${esc(l.title)}</span><br><span class="lc-sub">${l.exercises.length} exercices${l.desc ? ' · ' + esc(l.desc) : ''}</span></span>
        <span class="lc-end">${st ? starStr(st.stars) : 'Commencer ›'}</span>
      </button>`;
    }).join('')}</div>`;
  }
  // Sources d'une info : nouveau format `sources: [{name, url}]`, ou ancien `source` + `link`
  function storySources(s) {
    if (Array.isArray(s.sources) && s.sources.length) return s.sources.filter(x => x && x.name);
    return String(s.source || '').split(',').map(n => n.trim()).filter(Boolean).map((name, i) => ({ name, url: i === 0 ? s.link : '' }));
  }
  function sourcesBlock(s) {
    const list = storySources(s), ok = list.length >= 2;
    return `<div class="story-foot">
      <span class="verif ${ok ? 'ok' : ''}">${ok ? `✓ Recoupé par ${list.length} sources` : 'Source unique'}</span>
      ${list.map(x => x.url && /^https?:\/\//.test(x.url) ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.name)} ↗</a>` : `<span>${esc(x.name)}</span>`).join('')}
    </div>`;
  }
  const wordCard = w => w ? `<div class="word"><div class="kicker">Le mot du jour</div><h3>${esc(w.term)}</h3><p>${rich(w.def)}</p></div>` : '';

  const CREDIT = `<p class="credit">conçu par <b>by.naufrage</b></p>`;
  function viewHome() {
    let html = '';
    const day = CURRENT && DAYS[CURRENT];
    if (day) {
      if (CURRENT !== TODAY) html += `<div class="banner">⏳ <span>L'édition d'aujourd'hui n'est pas encore en kiosque. Voici la dernière disponible, celle du <b>${esc(frDate(CURRENT))}</b>.</span></div>`;
      const next = day.lessons.findIndex((_, i) => !lessonState(`day:${CURRENT}:${i}`));
      const vids = newFeedVideos(CURRENT, day);
      const live = window.SCOOP_LIVE, upd = live && live.updated ? ago(live.updated) : '';
      html += `<a class="feed-teaser" href="#/feed/${CURRENT}">
        <div class="ft-thumbs">${vids.slice(0, 3).map(v => `<img src="${ytThumb(v.id)}" alt="" loading="lazy">`).join('') || '<span class="ft-emoji">📱</span>'}</div>
        <div class="ft-txt"><div class="ft-kick">${vids.length ? `${vids.length} nouvelle${vids.length > 1 ? 's' : ''} vidéo${vids.length > 1 ? 's' : ''}` : '✓ Tu es à jour'}</div><h3>Le fil de l'actu</h3>
        <p>${upd ? `Mis à jour ${esc(upd)}` : `${day.stories.length} infos`} · questions flash</p></div>
        <span class="ft-play" aria-hidden="true">▶</span>
      </a>`;
      html += `
      <section class="hero">
        <div class="kicker">Édition du ${esc(frDate(CURRENT))}${lastUpdate(day) ? ` · 🔄 ${esc(lastUpdate(day))}` : ''}</div>
        <h1>${esc(day.title)}</h1>
        <ul class="hero-heads">${heroStories(day).map(({ s, i }) => `<li>${esc(s.title)}${newBadge(day, i)}</li>`).join('')}</ul>
        <div class="hero-actions">
          <a class="btn ghost" href="#/day/${CURRENT}">📰 Lire le brief</a>
          ${next >= 0 ? `<button class="btn primary" data-start="day:${CURRENT}:${next}">▶ ${next === 0 ? 'Quiz du jour' : 'Continuer'}</button>` : `<a class="btn green" href="#/day/${CURRENT}">✓ Édition bouclée</a>`}
        </div>
        ${lessonCards(CURRENT, day)}
      </section>
      ${wordCard(day.word)}`;
    } else {
      html += `<div class="hero"><div class="kicker">Édition du jour</div><h1>Pas encore d'édition</h1><p class="muted">Lance la mise à jour quotidienne (voir README) pour générer la première édition. En attendant, le parcours concours est disponible ci-dessous.</p></div>`;
    }

    // Tableau de bord « Continuer » : la suite logique, sans avoir à chercher dans les onglets
    const nxt = nextLesson(UNITS), nxtC = nextLesson(CULTURE), rv = S.review.length;
    let exam = '';
    if (S.settings.exam && DATE_RE.test(S.settings.exam)) { const d = Math.round((parseYmd(S.settings.exam) - parseYmd(TODAY)) / 864e5); if (d >= 0) exam = `J-${d}`; }
    html += `<h2 class="section-title">Continuer</h2>
      <div class="dash">
        ${nxt ? `<button class="dash-card" data-start="${nxt.key}" style="--u:${esc(nxt.unit.color)}"><span class="dash-ico">${esc(nxt.lesson.icon || nxt.unit.icon)}</span><span class="dash-txt"><small>Parcours concours · ${esc(nxt.unit.title)}</small><b>${esc(nxt.lesson.title)}</b></span><span class="dash-go">▶</span></button>` : ''}
        ${nxtC ? `<button class="dash-card" data-start="${nxtC.key}" style="--u:${esc(nxtC.unit.color)}"><span class="dash-ico">${esc(nxtC.lesson.icon || nxtC.unit.icon)}</span><span class="dash-txt"><small>Culture G · ${esc(nxtC.unit.title)}</small><b>${esc(nxtC.lesson.title)}</b></span><span class="dash-go">▶</span></button>` : ''}
        ${rv ? `<button class="dash-card" data-start="review" style="--u:#3A86FF"><span class="dash-ico">🔁</span><span class="dash-txt"><small>À revoir</small><b>${rv} question${rv > 1 ? 's' : ''} ratée${rv > 1 ? 's' : ''}</b></span><span class="dash-go">▶</span></button>` : ''}
      </div>
      <div class="dash-mini">
        <button class="dash-chip" data-start="cgmix">⚡ Quiz éclair</button>
        <button class="dash-chip" data-start="oral">🎤 Simulateur d'oral</button>
        <a class="dash-chip" href="#/learn/prepa">🎯 Prépa${exam ? ` · ${exam}` : ''}</a>
        <a class="dash-chip" href="#/learn">🎓 Tout le parcours</a>
      </div>`;
    return html + CREDIT;
  }

  // ---------- Mises à jour de la journée (toutes les 3 h) ----------
  // heure d'ajout d'une info (« 13:00 ») si elle vient d'une mise à jour, sinon ''
  function storyAddedAt(day, i) {
    const u = (day && day.updates || []).find(x => x && Array.isArray(x.stories) && x.stories.includes(i));
    return u ? u.at : '';
  }
  const fmtHour = at => at ? `${parseInt(at, 10)} h${at.slice(3) !== '00' ? at.slice(3) : ''}` : '';
  const lastUpdate = day => { const u = (day && day.updates || []).slice(-1)[0]; return u ? `à ${fmtHour(u.at)}` : ''; };
  const newBadge = (day, i) => { const at = storyAddedAt(day, i); return at ? ` <span class="new-badge">NOUVEAU · ${esc(fmtHour(at))}</span>` : ''; };
  // à la une de l'accueil : les ajouts les plus récents d'abord, puis les infos du matin
  function heroStories(day) {
    const all = day.stories.map((s, i) => ({ s, i }));
    const added = all.filter(x => storyAddedAt(day, x.i)).reverse();
    return [...added, ...all.filter(x => !storyAddedAt(day, x.i))].slice(0, 4);
  }

  // Prochaine leçon à faire dans une liste d'unités (la première non terminée et débloquée)
  function nextLesson(units) {
    for (const u of units) for (let i = 0; i < u.lessons.length; i++) {
      const key = `unit:${u.id}:${i}`;
      if (!lessonState(key) && (i === 0 || lessonState(`unit:${u.id}:${i - 1}`))) return { key, unit: u, lesson: u.lessons[i] };
    }
    return null;
  }

  // ---------- Onglet « Apprendre » : Concours, Culture G, Prépa, À revoir ----------
  function viewLearn(sub, arg) {
    const rv = S.review.length;
    const tabs = [['concours', '🧭', 'Concours'], ['culture', '🧠', 'Culture G'], ['prepa', '🎯', 'Prépa'], ['revoir', '🔁', `À revoir${rv ? ` · ${rv}` : ''}`]];
    sub = tabs.some(t => t[0] === sub) ? sub : 'concours';
    try { localStorage.setItem('scoop.learnTab', sub); } catch (e) { /* ignore */ }
    let body;
    if (sub === 'culture') body = viewCulture();
    else if (sub === 'prepa') body = viewPrepa(arg);
    else if (sub === 'revoir') body = viewReview();
    else body = `<div class="kicker">Parcours concours</div>
      <h1 style="font-size:34px;margin:8px 0 6px">Les fondamentaux</h1>
      <p class="muted">Institutions, Europe et monde, médias, déontologie, écriture, langue, économie : ce que les concours attendent de toi. Les leçons se débloquent dans l'ordre.</p>
      ${unitsPath(UNITS)}`;
    return `<nav class="l-tabs" aria-label="Rubriques d'apprentissage">${tabs.map(([id, ico, label]) => `<a class="l-tab ${id === sub ? 'on' : ''}" href="#/learn/${id}">${ico} ${esc(label)}</a>`).join('')}</nav>${body}`;
  }

  // Parcours d'unités en chemin (réutilisé par le parcours concours et la Culture G)
  function unitsPath(units) {
    let html = '';
    const offs = [0, 46, 72, 46, 0, -46, -72, -46];
    units.forEach((u, ui) => {
      const doneCount = u.lessons.filter((_, i) => lessonState(`unit:${u.id}:${i}`)).length;
      let firstOpen = u.lessons.findIndex((_, i) => !lessonState(`unit:${u.id}:${i}`));
      html += `<section class="unit" style="--u:${esc(u.color)}">
        <div class="unit-head">
          <div><div class="unit-kicker">Unité ${ui + 1}</div><h3>${esc(u.icon)} ${esc(u.title)}</h3><p>${esc(u.subtitle)}</p><div class="unit-progress">${doneCount}/${u.lessons.length} leçons</div></div>
          <button class="guide-btn" data-guide="${esc(u.id)}">📖 Fiche</button>
        </div>
        <div class="path">${u.lessons.map((l, i) => {
          const k = `unit:${u.id}:${i}`, st = lessonState(k), locked = !st && i > 0 && !lessonState(`unit:${u.id}:${i - 1}`);
          const cur = i === firstOpen;
          const cls = st ? 'done' : locked ? 'locked' : cur ? 'current' : '';
          return `<div class="node-wrap" style="--x:${offs[(i + ui * 2) % offs.length]}px">
            ${cur ? '<div class="bubble">COMMENCER</div>' : ''}
            <button class="node ${cls}" data-start="${k}" ${locked ? 'disabled' : ''} aria-label="${esc(l.title)}${locked ? ' (verrouillée)' : ''}">${st ? '★' : locked ? '🔒' : esc(l.icon || '▶')}</button>
            <div class="node-label">${esc(l.title)}${st ? `<span class="node-stars">${starStr(st.stars)}</span>` : ''}</div>
          </div>`;
        }).join('')}</div>
      </section>`;
    });
    return html;
  }

  function viewCulture() {
    const all = CULTURE.flatMap(u => u.lessons.map((_, i) => `unit:${u.id}:${i}`));
    const done = all.filter(k => lessonState(k)).length;
    const nq = CULTURE.reduce((n, u) => n + u.lessons.reduce((m, l) => m + l.exercises.length, 0), 0);
    return `<div class="kicker" style="color:#9D4EDD">Culture générale</div>
      <h1 style="font-size:34px;margin:8px 0 6px">Culture G</h1>
      <p class="muted">Histoire, géographie, arts, sciences, idées : le socle de l'épreuve de culture générale et du QCM d'actualité. ${CULTURE.length} thèmes, ${nq} questions, ${done}/${all.length} leçons terminées.</p>
      <button class="cg-quick" data-start="cgmix">
        <span class="cg-quick-ico">⚡</span>
        <span><b>Quiz éclair</b><br><small>10 questions au hasard, tous thèmes confondus</small></span>
        <span class="cg-quick-go">▶</span>
      </button>
      ${unitsPath(CULTURE)}`;
  }

  // ---------- Prépa concours ----------
  const PREPA_TABS = [['plan', '🗺️', 'Plan'], ['ecoles', '🏫', 'Écoles'], ['methode', '🧭', 'Méthode'], ['oral', '🎤', 'Oral'], ['metier', '📡', 'Le métier'], ['conseils', '💬', 'Conseils'], ['quiz', '🧠', 'Quiz']];
  const srcLinks = list => (list && list.length) ? `<div class="p-src">Sources : ${list.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)} ↗</a>`).join(' · ')}</div>` : '';

  function viewPrepa(tab) {
    if (!PREPA) return `<div class="empty"><h2>Prépa indisponible</h2></div>`;
    tab = PREPA_TABS.some(t => t[0] === tab) ? tab : 'plan';
    const checks = (S.prepa && S.prepa.checks) || {};
    const nDone = PREPA.checklist.filter(c => checks[c.id]).length;
    let html = `<div class="kicker">Prépa concours</div>
      <h1 style="font-size:34px;margin:8px 0 6px">Objectif admission</h1>
      <p class="muted">Les écoles, les épreuves, l'oral et le métier : tout ce qu'il faut pour maximiser tes chances. Infos vérifiées le ${esc(PREPA.updated)}, avec les sources à chaque bloc.</p>
      <nav class="p-tabs" aria-label="Rubriques de la prépa">${PREPA_TABS.map(([id, ico, label]) => `<a class="p-tab ${id === tab ? 'on' : ''}" href="#/learn/prepa/${id}">${ico} ${label}</a>`).join('')}</nav>`;

    if (tab === 'plan') {
      let exam = '';
      if (S.settings.exam && DATE_RE.test(S.settings.exam)) {
        const d = Math.round((parseYmd(S.settings.exam) - parseYmd(TODAY)) / 864e5);
        if (d >= 0) exam = `<div class="p-count"><b>J-${d}</b> avant ton premier concours</div>`;
      }
      html += `<div class="card p-hero">
          ${exam || `<p class="muted" style="font-size:14px">Ajoute la date de ton premier concours dans <a href="#/profile">Profil</a> pour afficher le compte à rebours.</p>`}
          <div class="p-progress"><div><b>${nDone}/${PREPA.checklist.length}</b> étapes de ton plan</div><div class="bar"><i style="width:${Math.round(nDone / PREPA.checklist.length * 100)}%"></i></div></div>
        </div>
        <div class="p-quick">
          <button class="p-qbtn" data-start="oral"><span>🎤</span><b>Simulateur d'oral</b><small>5 questions de jury</small></button>
          <a class="p-qbtn" href="#/learn/prepa/ecoles"><span>🏫</span><b>Les 16 écoles</b><small>dates, frais, épreuves</small></a>
          <a class="p-qbtn" href="#/learn/prepa/quiz"><span>🧠</span><b>Quiz prépa</b><small>écoles, métier, méthode</small></a>
        </div>
        <h2 class="section-title" style="font-size:22px">Mon plan de prépa</h2>
        <p class="section-sub">Coche au fur et à mesure : c'est enregistré sur ton appareil.</p>
        <div class="p-checks">${PREPA.checklist.map(c => `<label class="crit p-check ${checks[c.id] ? 'done' : ''}"><input type="checkbox" data-pcheck="${esc(c.id)}" ${checks[c.id] ? 'checked' : ''}><span>${rich(c.text)}</span></label>`).join('')}</div>
        ${guideCard(PREPA.guides.find(g => g.id === 'planning'), true)}`;
    }
    if (tab === 'ecoles') {
      html += `<div class="banner">ℹ️ <span>${rich(PREPA.schoolsNote)}</span></div>
        <div class="p-schools">${PREPA.schools.map(s => `
          <details class="p-school">
            <summary><span class="p-sname">${esc(s.short)}</span><span class="p-scity">${esc(s.city)}</span><span class="p-sfee">${esc(s.fee)}</span></summary>
            <div class="p-sbody">
              <div class="p-sfull">${esc(s.name)}</div>
              <dl>
                <dt>Diplôme</dt><dd>${esc(s.diploma)}</dd>
                <dt>Niveau d'entrée</dt><dd>${esc(s.level)}</dd>
                <dt>Inscriptions 2026</dt><dd>${esc(s.reg)}</dd>
                <dt>Écrits / dossier</dt><dd>${esc(s.written)}</dd>
                <dt>Oraux 2026</dt><dd>${esc(s.oral)}</dd>
                <dt>Frais de concours</dt><dd>${esc(s.fee)}</dd>
              </dl>
              ${s.note ? `<p class="p-snote">💡 ${rich(s.note)}</p>` : ''}
            </div>
          </details>`).join('')}</div>
        ${srcLinks(PREPA.schoolsSources)}`;
    }
    if (tab === 'methode') {
      html += PREPA.guides.filter(g => !['oral', 'planning'].includes(g.id)).map(g => guideCard(g)).join('');
    }
    if (tab === 'oral') {
      html += `<button class="cg-quick" data-start="oral" style="background:linear-gradient(120deg,#E63946,#F4A261);box-shadow:0 5px 0 #B92B37">
          <span class="cg-quick-ico">🎤</span><span><b>Lancer le simulateur d'oral</b><br><small>5 questions de jury au hasard, une proposition de réponse et une auto-évaluation</small></span><span class="cg-quick-go">▶</span></button>
        ${guideCard(PREPA.guides.find(g => g.id === 'oral'), true)}
        <h2 class="section-title" style="font-size:22px">Les questions qui reviennent</h2>
        <div class="list">${PREPA.oral.map(o => `
          <details class="p-q"><summary>${esc(o.q)}</summary><div class="p-qbody"><p>${rich(o.tip)}</p><ul>${o.keys.map(k => `<li>${esc(k)}</li>`).join('')}</ul></div></details>`).join('')}</div>`;
    }
    if (tab === 'metier') {
      html += `<p class="section-sub" style="margin-top:18px">Des chiffres récents pour argumenter à l'oral et à l'écrit, chacun avec sa source.</p>
        <div class="p-metier">${PREPA.metier.map(m => `
          <div class="card p-mcard"><div class="p-mico">${m.icon}</div><div><h4>${esc(m.title)}</h4><p>${rich(m.text)}</p>
          <div class="p-src"><a href="${esc(m.url)}" target="_blank" rel="noopener">${esc(m.source)} ↗</a></div></div></div>`).join('')}</div>`;
    }
    if (tab === 'conseils') {
      html += `<div class="banner">🔎 <span>${rich(PREPA.voicesNote)}</span></div>
        <div class="list">${PREPA.voices.map(v => `
          <div class="card p-voice"><div class="p-vwho">${esc(v.who)}</div><div class="p-vrole">${esc(v.role)}</div>
          <ul>${v.points.map(p => `<li>${rich(p)}</li>`).join('')}</ul>
          <div class="p-src"><a href="${esc(v.url)}" target="_blank" rel="noopener">Lire la source ↗</a></div></div>`).join('')}</div>`;
    }
    if (tab === 'quiz') {
      html += `<p class="section-sub" style="margin-top:18px">Teste tes connaissances sur les écoles, le métier et la méthode. Les leçons se débloquent dans l'ordre.</p>${unitsPath(PREPA_UNITS)}`;
    }
    return html;
  }

  function guideCard(g, open) {
    if (!g) return '';
    return `<details class="card p-guide" ${open ? 'open' : ''}><summary><span class="p-gico">${g.icon}</span>${esc(g.title)}</summary>
      <ul>${g.points.map(p => `<li>${rich(p)}</li>`).join('')}</ul>${srcLinks(g.sources)}</details>`;
  }

  async function viewDay(date) {
    date = date || CURRENT;
    if (!date) return `<div class="empty"><div class="big">🗞️</div><h2>Aucune édition</h2><p class="muted">La première édition apparaîtra après la mise à jour quotidienne.</p></div>`;
    const day = await getDay(date);
    if (!day) return `<div class="empty"><div class="big">🕳️</div><h2>Édition introuvable</h2><p class="muted">Pas d'édition pour le ${esc(date)}.</p><p style="margin-top:16px"><a class="btn ghost" href="#/archive">Voir les archives</a></p></div>`;
    const tagColors = day.tagColors || {};
    return `<article class="edition">
      <div class="kicker">Édition du ${esc(frDate(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}${lastUpdate(day) ? ` · 🔄 mise à jour ${esc(lastUpdate(day))}` : ''}</div>
      <h1>${esc(day.title)}</h1>
      ${day.intro ? `<p class="lede">${rich(day.intro)}</p>` : ''}
      <p style="margin-top:12px"><button class="btn small ghost" data-scroll="archives">🗂️ Éditions précédentes et infos gardées ↓</button></p>
      ${wordCard(day.word)}
      <h2 class="section-title">Les ${day.stories.length} infos à connaître</h2>
      <div class="stories">${day.stories.map((s, i) => `
        <div class="story" style="--tag:${esc(s.color || tagColors[s.tag] || '#E63946')}">
          <span class="tag">${esc(s.tag)}</span>${newBadge(day, i)}
          <h3>${esc(s.title)}</h3>
          <p>${rich(s.text)}</p>
          ${s.why ? `<div class="why"><b>🎯 Pour le concours :</b> ${rich(s.why)}</div>` : ''}
          ${sourcesBlock(s)}
        </div>`).join('')}
      </div>
      ${day.memo && day.memo.length ? `<div class="card memo"><div class="kicker">À retenir</div><ul>${day.memo.map(m => `<li>${rich(m)}</li>`).join('')}</ul></div>` : ''}
      <h2 class="section-title">Teste-toi</h2>
      ${lessonCards(date, day)}
    </article>
    <section id="archives" class="actu-archives">${viewArchive()}</section>`;
  }

  function viewReview() {
    const n = S.review.length;
    if (!n) return `<div class="empty"><div class="big">🧹</div><h2>Rien à revoir</h2><p class="muted">Chaque question ratée atterrit ici. Tu la réussis en révision, elle disparaît.</p><p style="margin-top:18px"><a class="btn primary" href="#/home">Retour au parcours</a></p></div>`;
    return `<div class="kicker" style="color:var(--blue)">Révisions</div>
      <h1 style="font-size:34px;margin:8px 0 6px">${n} question${n > 1 ? 's' : ''} à revoir</h1>
      <p class="muted">Les séries de révision tirent jusqu'à 10 questions au hasard. Une bonne réponse retire la question de la pile.</p>
      <p style="margin:18px 0 24px"><button class="btn blue" data-start="review">🔁 Lancer une révision</button></p>
      <div class="list">${S.review.slice().reverse().map(r => `
        <div class="card" style="padding:14px 16px"><div class="muted" style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em">${esc(r.from || '')}</div><div style="font-weight:600;margin-top:4px">${rich(r.ex.q)}</div></div>`).join('')}
      </div>`;
  }

  function viewArchive() {
    if (!INDEX.length) return `<div class="empty"><div class="big">🗂️</div><h2>Archives vides</h2><p class="muted">Les éditions s'accumuleront ici, jour après jour.</p></div>`;
    const saved = S.saved.slice().reverse();
    return `${saved.length ? `<div class="kicker">🔖 Infos gardées</div><h1 style="font-size:28px;margin:8px 0 14px">Ta revue de presse perso</h1>
      <div class="list" style="margin-bottom:34px">${saved.map(s => `
        <div class="card" style="padding:14px 16px;display:flex;gap:12px;align-items:flex-start">
          <div style="flex:1;min-width:0"><div class="muted" style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em">${esc(s.tag)} · ${esc(frDate(s.date, { day: 'numeric', month: 'short' }))} · ${esc(s.source)}</div>
          <div style="font-weight:700;margin-top:4px">${esc(s.title)}</div>
          <div style="margin-top:6px;font-size:14px"><a href="#/day/${esc(s.date)}">Voir l'édition</a>${s.link ? ` · <a href="${esc(s.link)}" target="_blank" rel="noopener">Article ↗</a>` : ''}</div></div>
          <button class="icon-btn" data-unsave="${esc(s.key)}" aria-label="Retirer">✕</button>
        </div>`).join('')}</div>` : ''}
      <div class="kicker">Archives</div><h1 style="font-size:34px;margin:8px 0 20px">Toutes les éditions</h1>
      <div class="list">${INDEX.map(({ date, title, lessons }) => {
        const n = lessons || 3; let done = 0;
        for (let i = 0; i < n; i++) if (lessonState(`day:${date}:${i}`)) done++;
        return `<a class="lcard ${done >= n ? 'done' : ''}" href="#/day/${date}" style="text-decoration:none">
          <span class="lc-ico">${done >= n ? '✅' : '📰'}</span>
          <span><span class="lc-title">${esc(frDate(date, { weekday: 'long', day: 'numeric', month: 'long' }))}</span><br><span class="lc-sub">${esc(title || '')}</span></span>
          <span class="lc-end">${done}/${n}</span></a>`;
      }).join('')}</div>`;
  }

  function viewProfile() {
    const acc = S.stats.answered ? Math.round(S.stats.correct / S.stats.answered * 100) : 0;
    const lv = level();
    const week = [...Array(7)].map((_, i) => addDays(TODAY, i - 6));
    const max = Math.max(S.settings.goal, ...week.map(d => S.daily[d] || 0));
    return `<div class="kicker">Profil</div>
      <h1 style="font-size:34px;margin:8px 0 4px">${esc(S.settings.name || 'Futur·e journaliste')}</h1>
      <p class="muted">${esc(lv.name)} · niveau ${lv.n} · ${S.xp} XP</p>
      <p style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><a class="btn small ghost" href="#/archive">🗂️ Archives et infos gardées</a><a class="btn small ghost" href="#/learn/prepa">🎯 Ma prépa</a></p>

      <div class="grid2" style="margin-top:20px">
        <div class="card"><div class="big-num">🔥 ${streakNow()}</div><div class="muted" style="font-size:13px">jours d'affilée (record : ${S.best})</div></div>
        <div class="card"><div class="big-num">${acc}%</div><div class="muted" style="font-size:13px">de bonnes réponses</div></div>
        <div class="card"><div class="big-num">${S.stats.lessons}</div><div class="muted" style="font-size:13px">leçons terminées</div></div>
        <div class="card"><div class="big-num">${S.stats.answered}</div><div class="muted" style="font-size:13px">questions répondues</div></div>
      </div>

      <div class="card" style="margin-top:12px"><h4>Cette semaine</h4>
        <div class="week">${week.map(d => { const v = S.daily[d] || 0; return `<div class="col"><div class="b ${v >= S.settings.goal ? 'hit' : ''}" style="height:${Math.round(v / max * 90)}%" title="${v} XP"></div><div class="d">${esc(frDate(d, { weekday: 'short' }).slice(0, 3))}</div></div>`; }).join('')}</div>
      </div>

      <h2 class="section-title" style="font-size:22px">Réglages</h2>
      <div class="card">
        <div class="form-row"><label for="f-name">Prénom</label><input id="f-name" value="${esc(S.settings.name)}" placeholder="Ton prénom" maxlength="40"></div>
        <div class="form-row"><label for="f-exam">Date de ton concours</label><input id="f-exam" type="date" value="${esc(S.settings.exam)}"></div>
        <div class="form-row"><label for="f-goal">Objectif quotidien</label>
          <select id="f-goal">${[[30, 'Tranquille · 30 XP'], [50, 'Régulier · 50 XP'], [100, 'Sérieux · 100 XP'], [150, 'Intense · 150 XP']].map(([v, l]) => `<option value="${v}" ${S.settings.goal === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="form-row"><label for="f-theme">Thème</label>
          <select id="f-theme">${[['auto', 'Automatique'], ['light', 'Clair'], ['dark', 'Sombre']].map(([v, l]) => `<option value="${v}" ${S.settings.theme === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <label class="toggle"><span style="font-weight:700;font-size:14px">Effets sonores</span><input id="f-sound" type="checkbox" ${S.settings.sound ? 'checked' : ''}></label>
        <label class="toggle" style="margin-top:14px"><span><span style="font-weight:700;font-size:14px">⌨️ Mode réponse libre</span><br><small class="muted">Tu tapes la réponse au lieu de choisir parmi des propositions. Aussi activable pendant un quiz (bouton en haut).</small></span><input id="f-free" type="checkbox" ${S.settings.freeText ? 'checked' : ''}></label>
      </div>

      <h2 class="section-title" style="font-size:22px">Ma progression</h2>
      <div class="card">
        <p class="muted" style="font-size:14px;margin-bottom:14px">La progression est enregistrée dans ce navigateur. Exporte-la pour la transférer sur un autre appareil.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn small ghost" id="b-export">⬇ Exporter</button>
          <label class="btn small ghost" for="b-import">⬆ Importer</label><input id="b-import" type="file" accept="application/json" hidden>
          <button class="btn small danger" id="b-reset">Réinitialiser</button>
        </div>
      </div>` + CREDIT;
  }
  function bindProfile() {
    const upd = () => { save(); renderChrome(); };
    $('#f-name').oninput = e => { S.settings.name = e.target.value.slice(0, 40); upd(); };
    $('#f-exam').onchange = e => { S.settings.exam = e.target.value; upd(); };
    $('#f-goal').onchange = e => { S.settings.goal = +e.target.value; upd(); };
    $('#f-theme').onchange = e => { S.settings.theme = e.target.value; applyTheme(); upd(); };
    $('#f-sound').onchange = e => { S.settings.sound = e.target.checked; upd(); };
    $('#f-free').onchange = e => { S.settings.freeText = e.target.checked; upd(); };
    $('#b-export').onclick = () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }));
      a.download = `scoop-progression-${TODAY}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
    $('#b-import').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then(t => { const o = JSON.parse(t); if (typeof o.xp !== 'number') throw new Error(); S = merge(clone(DEFAULT), o); save(); applyTheme(); route(); })
        .catch(() => alert("Ce fichier n'est pas une sauvegarde Scoop valide."));
    };
    $('#b-reset').onclick = () => { if (confirm('Effacer toute ta progression ? Cette action est définitive.')) { S = clone(DEFAULT); save(); applyTheme(); route(); } };
  }

  // ---------- Routeur ----------
  async function route() {
    const parts = (location.hash || '#/home').slice(2).split('/');
    let view = parts[0] || 'home', arg = parts[1], arg2 = parts[2];
    // anciens liens (avant la navigation à 5 onglets) → onglet « Apprendre »
    if (view === 'culture') { view = 'learn'; arg = 'culture'; }
    else if (view === 'prepa') { view = 'learn'; arg2 = arg; arg = 'prepa'; }
    else if (view === 'review') { view = 'learn'; arg = 'revoir'; }
    if (view === 'learn' && !arg) { try { arg = localStorage.getItem('scoop.learnTab') || 'concours'; } catch (e) { arg = 'concours'; } }
    if (view !== 'feed' && F) closeFeed();
    const navKey = view === 'archive' ? 'day' : view;
    $$('.nav-link').forEach(a => a.classList.toggle('active', a.dataset.nav === navKey));
    if (view === 'feed') {
      // le fil s'ouvre par-dessus l'accueil ; le bouton « retour » du téléphone le referme
      if (!$('#view').innerHTML.trim() || !$('.hero, .unit', $('#view'))) { $('#view').innerHTML = viewHome(); window.__scoopReady = true; }
      await openFeed(arg);
      return;
    }
    renderChrome();
    const el = $('#view');
    let html;
    switch (view) {
      case 'day': html = await viewDay(arg); break;
      case 'learn': html = viewLearn(arg, arg2); break;
      case 'archive': html = viewArchive(); break;
      case 'profile': html = viewProfile(); break;
      default: html = viewHome();
    }
    el.innerHTML = (view === 'home' || view === 'profile' ? '<div data-install-slot></div>' : '') + html;
    window.__scoopReady = true;
    refreshInstall();
    if (view === 'profile') bindProfile();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  // ---------- Fiche d'unité ----------
  function openGuide(id) {
    const u = findUnit(id); if (!u) return;
    $('#modal-inner').innerHTML = `
      <div class="modal-head"><div class="kicker" style="color:${esc(u.color)}">Fiche de révision</div><button class="icon-btn" data-close aria-label="Fermer">✕</button></div>
      <h2>${esc(u.icon)} ${esc(u.title)}</h2>
      <ul>${(u.guide || []).map(g => `<li>${rich(g)}</li>`).join('')}</ul>
      <button class="btn primary block" data-close>Compris</button>`;
    const m = $('#modal');
    if (typeof m.showModal === 'function') m.showModal(); else m.setAttribute('open', ''); // vieux navigateurs
  }

  // ---------- Délégation des clics ----------
  document.addEventListener('click', e => {
    const s = e.target.closest('[data-start]');
    if (s && !s.disabled) { e.preventDefault(); startLesson(s.dataset.start); return; }
    const g = e.target.closest('[data-guide]');
    if (g) { openGuide(g.dataset.guide); return; }
    const sc = e.target.closest('[data-scroll]');
    if (sc) { const t = document.getElementById(sc.dataset.scroll); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    const pc = e.target.closest('[data-pcheck]');
    if (pc) {
      S.prepa = S.prepa || {}; S.prepa.checks = S.prepa.checks || {};
      S.prepa.checks[pc.dataset.pcheck] = pc.checked; save();
      pc.closest('.p-check').classList.toggle('done', pc.checked);
      if (pc.checked) sfx.pair();
      const n = PREPA.checklist.filter(c => S.prepa.checks[c.id]).length, prog = $('.p-progress');
      if (prog) { $('b', prog).textContent = `${n}/${PREPA.checklist.length}`; $('i', prog).style.width = `${Math.round(n / PREPA.checklist.length * 100)}%`; }
      return;
    }
    const u = e.target.closest('[data-unsave]');
    if (u) { S.saved = S.saved.filter(x => x.key !== u.dataset.unsave); save(); route(); return; }
    if (e.target.closest('[data-close]') || e.target === $('#modal')) { const m = $('#modal'); if (typeof m.close === 'function') m.close(); else m.removeAttribute('open'); }
  });

  // =========================================================
  //   MOTEUR DE LEÇON
  // =========================================================
  let L = null;
  const PRAISE = ['Excellent !', 'Bien vu !', 'Parfait !', 'Scoop !', 'Exact !', 'Bravo !', 'Info vérifiée !', 'Impeccable !'];

  function startLesson(key) {
    const cfg = lessonFromKey(key);
    if (!cfg) return;
    const items = cfg.exercises.map((ex, i) => ({ ex, id: cfg.ids ? cfg.ids[i] : `${key}:${i}`, retry: false }));
    L = { cfg, queue: items, pos: 0, total: items.length, resolved: 0, firstOk: 0, xp: 0, combo: 0, maxCombo: 0, t0: Date.now(), state: 'answer', check: null };
    document.body.classList.add('in-lesson');
    $('#lesson').hidden = false;
    refreshModeToggle();
    // le bouton Texte/Choix n'a de sens que s'il y a des QCM dans la leçon
    $('#mode-toggle').hidden = !cfg.exercises.some(ex => ex.t === 'qcm');
    $('#lesson').style.setProperty('--u', cfg.color);
    if (document.activeElement) document.activeElement.blur();
    showEx();
  }

  function closeLesson(force) {
    if (!L) return;
    if (!force && L.state !== 'end' && L.resolved > 0 && !confirm('Quitter la leçon ? Les XP de cette leçon seront perdus.')) return;
    save();
    L = null;
    $('#lesson').hidden = true;
    document.body.classList.remove('in-lesson');
    route();
  }

  function updateProgress() {
    const p = L.total ? L.resolved / L.total : 0;
    $('#progress-fill').style.width = `${Math.max(p * 100, 2)}%`;
    const c = $('#combo');
    if (L.combo >= 3) { c.hidden = false; c.textContent = `🔥 ${L.combo} d'affilée`; c.style.animation = 'none'; void c.offsetWidth; c.style.animation = ''; }
    else c.hidden = true;
  }

  function setBar(mode, title = '', sol = '', text = '', icon = '') {
    const bar = $('#checkbar');
    bar.className = 'checkbar ' + mode;
    $('#fb-title').textContent = title;
    $('#fb-sol').innerHTML = sol;
    $('#fb-text').innerHTML = text;
    $('#fb-icon').textContent = icon;
    const btn = $('#check');
    if (mode === 'idle') { btn.textContent = 'Valider'; btn.disabled = true; btn.className = 'btn primary'; }
    else if (mode === 'ok') { btn.textContent = 'Continuer'; btn.disabled = false; btn.className = 'btn green'; }
    else if (mode === 'ko') { btn.textContent = 'Continuer'; btn.disabled = false; btn.className = 'btn danger'; }
    else if (mode === 'info') { btn.textContent = 'Continuer'; btn.disabled = false; btn.className = 'btn green'; }
    else if (mode === 'end') { btn.textContent = 'Continuer'; btn.disabled = false; btn.className = 'btn primary'; }
    $('#override').hidden = true; L && (L.overrideCtx = null);
  }

  function showEx() {
    const it = L.queue[L.pos];
    updateProgress();
    // Conteneur neuf à chaque exercice : sinon les écouteurs de clic des exercices précédents
    // (association, remise en ordre) restent attachés et interceptent les clics du suivant.
    const old = $('#ex'), body = old.cloneNode(false);
    old.replaceWith(body);
    body.className = 'ex'; void body.offsetWidth; body.classList.add('anim');
    body.innerHTML = '';
    L.state = 'answer';
    setBar('idle');
    const render = RENDER[it.ex.t];
    if (!render) { L.resolved++; next(); return; }
    L.check = render(it.ex, body, ready => { if (L && L.state === 'answer') $('#check').disabled = !ready; });
    if (it.retry) body.insertAdjacentHTML('afterbegin', '<div class="retry-tag">↻ Deuxième chance</div>');
    $('.lesson-body').scrollTop = 0;
  }

  function grade(it, ok, sol, free) {
    S.stats.answered++;
    const expl = it.ex.x ? rich(it.ex.x) : '';
    if (ok) {
      S.stats.correct++;
      L.combo++; L.maxCombo = Math.max(L.maxCombo, L.combo);
      let g = it.retry ? 5 : 10;
      if (L.combo % 5 === 0) g += 5;
      L.xp += g;
      if (!it.retry) L.firstOk++;
      L.resolved++;
      if (L.cfg.mode === 'review') S.review = S.review.filter(r => r.id !== it.id);
      sfx.ok();
      setBar('ok', PRAISE[Math.floor(Math.random() * PRAISE.length)], '', expl, '✓');
    } else {
      L.combo = 0;
      if (!it.retry) {
        L.queue.push({ ...it, retry: true });
        if (!S.review.some(r => r.id === it.id)) S.review.push({ id: it.id, ex: it.ex, from: L.cfg.context, at: TODAY });
        if (S.review.length > 300) S.review.shift();
      } else L.resolved++;
      sfx.ko();
      setBar('ko', 'Pas tout à fait…', sol ? rich(sol) : '', expl, '✕');
      // réponse libre jugée fausse : tu peux la compter juste si c'était la bonne, mal formulée
      if (free) { L.overrideCtx = { it }; $('#override').hidden = false; }
    }
    L.state = 'feedback';
    $('#ex').classList.add('locked');
    updateProgress();
  }

  // « J'avais juste » : annule l'échec d'une réponse libre (2e chance retirée, sortie de « À revoir »)
  function overrideAnswer() {
    const c = L && L.overrideCtx; if (!c || L.state !== 'feedback') return;
    const it = c.it;
    if (!it.retry) {
      const qi = L.queue.findIndex((q, i) => i > L.pos && q.id === it.id && q.retry);
      if (qi > -1) L.queue.splice(qi, 1);
      L.firstOk++; L.resolved++;
    }
    S.review = S.review.filter(r => r.id !== it.id);
    S.stats.correct++;
    L.combo++; L.maxCombo = Math.max(L.maxCombo, L.combo);
    L.xp += it.retry ? 5 : 10;
    sfx.ok();
    setBar('ok', 'Compté juste 👍', '', it.ex.x ? rich(it.ex.x) : '', '✓');
    L.state = 'feedback';
    updateProgress(); save();
  }

  // Bascule « réponse libre » ↔ « choix », à tout moment (s'applique tout de suite à la question en cours)
  function toggleFreeMode() {
    S.settings.freeText = !S.settings.freeText; save();
    refreshModeToggle();
    if (L && L.state === 'answer' && L.queue[L.pos] && L.queue[L.pos].ex.t === 'qcm') showEx();
  }
  function refreshModeToggle() {
    const b = $('#mode-toggle'); if (!b) return;
    const on = !!S.settings.freeText;
    b.setAttribute('aria-pressed', on);
    b.innerHTML = on ? '⌨️ <span>Texte</span>' : '☑️ <span>Choix</span>';
    b.title = on ? 'Mode réponse libre activé : touche pour revenir aux choix' : 'Mode choix : touche pour répondre en tapant';
  }

  function onCheck() {
    if (!L) return;
    if (L.state === 'answer') {
      const it = L.queue[L.pos];
      const r = L.check && L.check();
      if (!r) return;
      if (r.self) {
        L.state = 'self'; L.self = r;
        setBar('info', 'Compare avec la proposition', '', 'Coche honnêtement les critères respectés, puis continue.', '✍️');
        $('#fb-icon').style.background = 'var(--card)';
        return;
      }
      grade(it, r.ok, r.sol, r.free);
    } else if (L.state === 'self') {
      const n = L.self.count(), tot = L.self.total;
      S.stats.answered++;
      if (n >= Math.ceil(tot / 2)) { S.stats.correct++; L.firstOk++; }
      L.xp += 5 + n * 3;
      L.resolved++;
      sfx.ok();
      next();
    } else if (L.state === 'feedback') next();
    else if (L.state === 'end') closeLesson(true);
  }

  function onSkip() {
    if (!L || L.state !== 'answer') return;
    const it = L.queue[L.pos];
    if (it.ex.t === 'write') { L.resolved++; next(); return; }
    grade(it, false, solutionOf(it.ex));
    // révèle la solution visuellement pour les QCM
    if (it.ex.t === 'qcm' || it.ex.t === 'vf') {
      const a = it.ex.t === 'vf' ? (it.ex.a ? 0 : 1) : it.ex.a;
      $$('.choice', $('#ex')).forEach(b => { if (+b.dataset.i === a) b.classList.add('right'); });
    }
  }

  function next() {
    L.pos++;
    if (L.pos >= L.queue.length) endLesson(); else showEx();
  }

  function endLesson() {
    const acc = L.total ? Math.round(L.firstOk / L.total * 100) : 100;
    const stars = acc >= 90 ? 3 : acc >= 70 ? 2 : 1;
    const cfg = L.cfg;
    let bonus = 10 + (cfg.bonus || 0);
    const prev = cfg.mode !== 'review' ? lessonState(cfg.key) : null;
    if (prev) bonus = 5; // rejouer rapporte moins
    L.xp += bonus;
    const before = level().n, goalBefore = todayXp() >= S.settings.goal;
    addXp(L.xp); markActive();
    S.stats.lessons++;
    if (cfg.mode !== 'review') S.lessons[cfg.key] = { stars: Math.max(stars, prev ? prev.stars : 0), at: TODAY };
    save();
    const lvUp = level().n > before, goalNow = !goalBefore && todayXp() >= S.settings.goal;
    const secs = Math.round((Date.now() - L.t0) / 1000);
    L.state = 'end';
    $('#progress-fill').style.width = '100%';
    $('#combo').hidden = true;
    const extra = [
      lvUp ? `🎖️ Nouveau niveau : <b>${esc(level().name)}</b>` : '',
      goalNow ? '🎯 Objectif du jour atteint !' : '',
      cfg.bonus && !prev ? `📰 +${cfg.bonus} XP bonus « édition du jour »` : ''
    ].filter(Boolean);
    $('#ex').className = 'ex anim';
    $('#ex').innerHTML = `<div class="end">
      <div class="end-emoji">${stars === 3 ? '🏆' : stars === 2 ? '🗞️' : '💪'}</div>
      <h2>${stars === 3 ? 'Une perfection !' : stars === 2 ? 'Leçon bouclée !' : 'Leçon terminée'}</h2>
      <p class="muted">${esc(cfg.title)} · ${esc(cfg.context)}</p>
      <div class="end-stars">${'★'.repeat(stars)}<span class="off">${'★'.repeat(3 - stars)}</span></div>
      <div class="tiles">
        <div class="tile-stat" style="--c:#D9A20F"><div class="ts-h">XP gagnés</div><div class="ts-v">+${L.xp}</div></div>
        <div class="tile-stat" style="--c:#2BA84A"><div class="ts-h">Précision</div><div class="ts-v">${acc}%</div></div>
        <div class="tile-stat" style="--c:#3A86FF"><div class="ts-h">Temps</div><div class="ts-v">${Math.floor(secs / 60)}:${pad(secs % 60)}</div></div>
      </div>
      ${extra.length ? `<div class="card" style="margin-top:16px;text-align:left;display:grid;gap:6px">${extra.map(x => `<div>${x}</div>`).join('')}</div>` : ''}
      <p class="muted" style="margin-top:16px">🔥 Série : ${streakNow()} jour${streakNow() > 1 ? 's' : ''}</p>
    </div>`;
    setBar('end');
    sfx.end();
    if (stars >= 2) confetti();
  }

  $('#check').addEventListener('click', onCheck);
  $('#override').addEventListener('click', overrideAnswer);
  $('#mode-toggle').addEventListener('click', toggleFreeMode);
  $('#skip').addEventListener('click', onSkip);
  $('#lesson-close').addEventListener('click', () => closeLesson(false));
  document.addEventListener('keydown', e => {
    if (!L) return;
    const tag = e.target.tagName;
    if (e.key === 'Escape') { closeLesson(false); return; }
    if (e.key === 'Enter') {
      if (tag === 'TEXTAREA' && !(e.ctrlKey || e.metaKey) && L.state === 'answer') return;
      // un bouton focalisé DANS la leçon agit normalement ; ailleurs (page derrière), on ignore
      if (tag === 'BUTTON' && e.target.closest('#lesson') && e.target.id !== 'check') return;
      e.preventDefault();
      if (!$('#check').disabled) onCheck();
      return;
    }
    if (L.state === 'answer' && /^[1-9]$/.test(e.key) && tag !== 'INPUT' && tag !== 'TEXTAREA') {
      const b = $$('.choice', $('#ex'))[+e.key - 1]; if (b) b.click();
    }
  });

  // ---------- Solutions (texte) ----------
  function solutionOf(ex) {
    switch (ex.t) {
      case 'qcm': return `Réponse : ${ex.c[ex.a]}`;
      case 'vf': return `Réponse : ${ex.a ? 'Vrai' : 'Faux'}`;
      case 'input': return `Réponse attendue : ${ex.a[0]}`;
      case 'order': return `Bon ordre : ${ex.items.map((s, i) => `${i + 1}. ${s}`).join(' · ')}`;
      case 'match': return `Paires : ${ex.pairs.map(p => `${p[0]} → ${p[1]}`).join(' · ')}`;
      default: return '';
    }
  }

  // ---------- Types d'exercices ----------
  // Chaque fonction affiche l'exercice et renvoie check() → {ok, sol} | {self:true,...} | null (pas prêt)
  function qcmCore(ex, el, ready, opts = {}) {
    const idx = opts.noShuffle ? ex.c.map((_, i) => i) : shuffle(ex.c.map((_, i) => i));
    el.innerHTML = `<div class="ex-type">${esc(opts.label || 'Choisis la bonne réponse')}</div>
      ${opts.statement ? `<h2 class="ex-q" style="margin-bottom:14px">Vrai ou faux ?</h2><div class="statement">${rich(ex.q)}</div>` : `<h2 class="ex-q">${rich(ex.q)}</h2>`}
      <div class="choices ${opts.two ? 'two' : ''}">${idx.map((ci, k) => `<button class="choice" data-i="${ci}">${opts.two ? '' : `<span class="key">${k + 1}</span>`}<span>${rich(ex.c[ci])}</span></button>`).join('')}</div>`;
    let sel = null;
    $$('.choice', el).forEach(b => b.addEventListener('click', () => {
      if (el.classList.contains('locked')) return;
      $$('.choice', el).forEach(x => x.classList.remove('sel'));
      b.classList.add('sel'); sel = +b.dataset.i; ready(true); sfx.tick();
    }));
    return () => {
      if (sel === null) return null;
      const ok = sel === ex.a;
      $$('.choice', el).forEach(b => { const i = +b.dataset.i; b.classList.remove('sel'); if (i === ex.a) b.classList.add('right'); else if (i === sel) b.classList.add('wrong'); });
      return { ok, sol: ok ? '' : `Réponse : ${ex.c[ex.a]}` };
    };
  }

  // ---------- Mode réponse libre : correction tolérante ----------
  function lev(a, b) {
    if (a === b) return 0; if (!a.length) return b.length; if (!b.length) return a.length;
    let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[b.length];
  }
  const simil = (a, b) => 1 - lev(a, b) / Math.max(a.length, b.length, 1);
  const FREE_STOP = new Set('le la les un une des du de au aux et ou en dans sur pour par avec sans sous son sa ses leur leurs qui que dont est sont plus pas'.split(' '));
  function answerOk(user, expected) {
    const u = norm(user), x = norm(expected);
    if (!u) return false;
    if (u === x) return true;
    // les nombres (dates, chiffres) doivent être exacts
    const dx = x.match(/\d+/g) || [], du = u.match(/\d+/g) || [];
    if (dx.length && !dx.every(d => du.includes(d))) return false;
    if (simil(u, x) >= 0.8) return true;                       // faute de frappe sur l'ensemble
    const keyX = x.split(' ').filter(w => (w.length >= 4 || /\d/.test(w)) && !FREE_STOP.has(w));
    const wordsU = u.split(' ');
    const hit = w => wordsU.some(v => v === w || (w.length >= 5 && v.length >= 4 && simil(v, w) >= 0.75));
    const hits = keyX.filter(hit);
    if (keyX.length && hits.length / keyX.length >= 0.6) return true; // l'essentiel des mots-clés
    // nom propre : le nom de famille suffit (« Lecornu » pour « Sébastien Lecornu »)
    const words = expected.trim().split(/\s+/);
    if (words.length >= 2 && words.length <= 3 && words.every(w => /^[A-ZÀ-Ý]/.test(w))) return hit(norm(words[words.length - 1]));
    return false;
  }
  function qcmFree(ex, el, ready) {
    const expected = ex.c[ex.a];
    el.innerHTML = `<div class="ex-type">⌨️ Réponse libre</div><h2 class="ex-q">${rich(ex.q)}</h2>
      <input class="text-in" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Tape ta réponse…" aria-label="Ta réponse">
      <p class="hint">💡 Pas besoin du mot pour mot : accents, majuscules et petites fautes sont tolérés. Pour un nom, le nom de famille suffit.</p>`;
    const inp = $('input', el);
    inp.addEventListener('input', () => ready(inp.value.trim().length > 0));
    setTimeout(() => inp.focus(), 60);
    return () => {
      const v = inp.value.trim(); if (!v) return null;
      const ok = answerOk(v, expected);
      inp.classList.add(ok ? 'right' : 'wrong'); inp.disabled = true;
      if (ok && norm(v) !== norm(expected)) el.insertAdjacentHTML('beforeend', `<p class="hint">Réponse complète : <b>${rich(expected)}</b></p>`);
      return { ok, sol: ok ? '' : `Réponse attendue : ${expected}`, free: true };
    };
  }

  const RENDER = {
    qcm: (ex, el, ready) => S.settings.freeText ? qcmFree(ex, el, ready) : qcmCore(ex, el, ready),

    vf: (ex, el, ready) => qcmCore({ q: ex.q, c: ['Vrai', 'Faux'], a: ex.a ? 0 : 1 }, el, ready, { noShuffle: true, statement: true, two: true, label: 'Vrai ou faux' }),

    input(ex, el, ready) {
      el.innerHTML = `<div class="ex-type">Réponds en quelques mots</div><h2 class="ex-q">${rich(ex.q)}</h2>
        <input class="text-in" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Ta réponse…" aria-label="Ta réponse">
        ${ex.hint ? `<p class="hint">💡 ${rich(ex.hint)}</p>` : ''}`;
      const inp = $('input', el);
      inp.addEventListener('input', () => ready(inp.value.trim().length > 0));
      setTimeout(() => inp.focus(), 60);
      return () => {
        const v = norm(inp.value); if (!v) return null;
        const ok = ex.a.some(a => norm(a) === v);
        inp.classList.add(ok ? 'right' : 'wrong'); inp.disabled = true;
        return { ok, sol: ok ? '' : `Réponse attendue : ${ex.a[0]}` };
      };
    },

    order(ex, el, ready) {
      const n = ex.items.length;
      let bank = shuffle([...Array(n).keys()]);
      for (let t = 0; t < 5 && bank.every((v, i) => v === i); t++) bank = shuffle(bank);
      const ans = [];
      el.innerHTML = `<div class="ex-type">Remets dans l'ordre</div><h2 class="ex-q">${rich(ex.q)}</h2><ol class="order-ans"></ol><div class="order-bank"></div>`;
      const ansEl = $('.order-ans', el), bankEl = $('.order-bank', el);
      const draw = () => {
        ansEl.innerHTML = ans.length ? ans.map(i => `<li><button class="chip" data-a="${i}">${rich(ex.items[i])}</button></li>`).join('') : `<li class="placeholder">Touche les éléments dans le bon ordre</li>`;
        bankEl.innerHTML = bank.map(i => `<button class="chip ${ans.includes(i) ? 'used' : ''}" data-b="${i}" ${ans.includes(i) ? 'tabindex="-1"' : ''}>${rich(ex.items[i])}</button>`).join('');
        ready(ans.length === n);
      };
      el.addEventListener('click', e => {
        if (el.classList.contains('locked')) return;
        const b = e.target.closest('[data-b]'), a = e.target.closest('[data-a]');
        if (b && !ans.includes(+b.dataset.b)) { ans.push(+b.dataset.b); sfx.tick(); draw(); }
        else if (a) { ans.splice(ans.indexOf(+a.dataset.a), 1); draw(); }
      });
      draw();
      return () => {
        if (ans.length !== n) return null;
        const ok = ans.every((v, k) => v === k);
        $$('li', ansEl).forEach((li, k) => li.classList.add(ans[k] === k ? 'right' : 'wrong'));
        return { ok, sol: ok ? '' : `Bon ordre : ${ex.items.map((s, i) => `${i + 1}. ${s}`).join(' · ')}` };
      };
    },

    match(ex, el, ready) {
      const n = ex.pairs.length, Ls = shuffle([...Array(n).keys()]), Rs = shuffle([...Array(n).keys()]);
      el.innerHTML = `<div class="ex-type">Associe les paires</div><h2 class="ex-q">${rich(ex.q || 'Relie chaque élément à sa correspondance')}</h2>
        <div class="match"><div class="col">${Ls.map(i => `<button class="tile" data-s="l" data-i="${i}">${rich(ex.pairs[i][0])}</button>`).join('')}</div>
        <div class="col">${Rs.map(i => `<button class="tile" data-s="r" data-i="${i}">${rich(ex.pairs[i][1])}</button>`).join('')}</div></div>`;
      let sl = null, sr = null, errors = 0, matched = 0, busy = false;
      el.addEventListener('click', e => {
        const t = e.target.closest('.tile'); if (!t || busy || t.classList.contains('ok') || el.classList.contains('locked')) return;
        if (t.dataset.s === 'l') { if (sl) sl.classList.remove('sel'); sl = sl === t ? null : t; }
        else { if (sr) sr.classList.remove('sel'); sr = sr === t ? null : t; }
        if (sl) sl.classList.add('sel'); if (sr) sr.classList.add('sel');
        if (sl && sr) {
          const a = sl, b = sr; sl = sr = null;
          a.classList.remove('sel'); b.classList.remove('sel');
          if (a.dataset.i === b.dataset.i) { a.classList.add('ok'); b.classList.add('ok'); matched++; sfx.pair(); if (matched === n) ready(true); }
          else { errors++; busy = true; a.classList.add('bad'); b.classList.add('bad'); sfx.ko(); setTimeout(() => { a.classList.remove('bad'); b.classList.remove('bad'); busy = false; }, 450); }
        }
      });
      return () => matched === n ? { ok: errors === 0, sol: errors ? `${errors} erreur${errors > 1 ? 's' : ''} d'association en cours de route.` : '' } : null;
    },

    write(ex, el, ready) {
      el.innerHTML = `<div class="ex-type">✍️ Atelier d'écriture</div><h2 class="ex-q">${rich(ex.q)}</h2>
        ${ex.src ? `<blockquote class="src">${rich(ex.src)}</blockquote>` : ''}
        <textarea class="text-area" rows="3" placeholder="Écris ta proposition… (Ctrl+Entrée pour valider)" aria-label="Ta proposition"></textarea>
        <div class="self"></div>`;
      const ta = $('textarea', el), selfEl = $('.self', el);
      ta.addEventListener('input', () => ready(ta.value.trim().length >= 3));
      setTimeout(() => ta.focus(), 60);
      return () => {
        if (ta.value.trim().length < 3) return null;
        ta.disabled = true;
        selfEl.innerHTML = `<div class="model"><div class="model-label">Proposition de la rédaction</div><p>${rich(ex.model)}</p></div>
          <div class="crit-label">Ta version respecte-t-elle…</div>
          ${ex.crit.map(c => `<label class="crit"><input type="checkbox"><span>${rich(c)}</span></label>`).join('')}`;
        selfEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return { self: true, count: () => $$('input:checked', selfEl).length, total: ex.crit.length };
      };
    }
  };

  // =========================================================
  //   LE FIL : format vertical type Shorts
  //   vidéos de rédactions + cartes infos + questions flash
  // =========================================================
  let F = null, feedObs = null, feedSoundPref = false;
  const YT_ID = /^[\w-]{6,20}$/;
  const ytThumb = id => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  const savedKey = (date, i) => `${date}:${i}`;
  const isSaved = (date, i) => S.saved.some(s => s.key === savedKey(date, i));

  // ---------- Mémoire de ce qui a déjà été vu dans le fil ----------
  // S.seen = { v: {idVidéo: date}, s: {"date:index": date}, q: {idQuestion: date} } — purgé après 14 jours
  function seenStore() {
    S.seen = S.seen || {}; ['v', 's', 'q', 'vt'].forEach(k => { S.seen[k] = S.seen[k] || {}; });
    return S.seen;
  }
  (function pruneSeen() {
    const st = seenStore(), limit = Date.now() - 14 * 864e5;
    ['v', 's', 'q'].forEach(k => Object.keys(st[k]).forEach(id => { if (st[k][id] < limit) { delete st[k][id]; if (k === 'v') delete st.vt[id]; } }));
  })();

  // Mots-clés d'un titre, pour repérer deux vidéos sur le même sujet
  const FEED_STOP = new Set('le la les un une des du de au aux et ou en dans sur pour par avec sans sous chez apres avant ce cette ces son sa ses leur leurs qui que dont est sont ont fait plus moins pas ne se il elle ils elles on comme mais aussi tres tout tous entre contre vers selon depuis encore deja alors quand comment pourquoi quel quelle voici video'.split(' '));
  const feedTok = s => new Set(String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length >= 4 && !FEED_STOP.has(w)));
  const sameTopic = (a, b) => { let n = 0; for (const x of a) if (b.has(x)) n++; return n >= 2; };

  // Toutes les vidéos disponibles : celles choisies par la rédaction le matin, puis le flux mis à jour toutes les 30 min
  function feedVideoPool(date, day, live) {
    const out = [], ids = new Set();
    const add = (v, story) => {
      if (!v || !YT_ID.test(v.id || '') || ids.has(v.id)) return;
      ids.add(v.id); out.push({ id: v.id, source: v.source, title: v.title, published: v.published || null, story: Number.isInteger(story) && day.stories[story] ? story : null });
    };
    (day.shorts || []).forEach(v => add(v, v && v.story));
    if (live && Array.isArray(live.videos)) live.videos.forEach(v => add(v, live.date === date ? v.story : null));
    return out;
  }

  // Un sujet = une carte. Une info avec vidéo devient une carte unique « vidéo + l'essentiel » ;
  // ce qui a déjà été vu n'est plus montré (sauf « Revoir tout »).
  function buildFeed(date, day, live, showAll) {
    const seen = seenStore(), colors = day.tagColors || {};
    const color = s => s.color || colors[s.tag] || '#E63946';
    const pool = feedVideoPool(date, day, live);
    const isNewV = v => showAll || !seen.v[v.id];
    const storyTok = day.stories.map(s => feedTok(s.title + ' ' + s.text));

    // vidéos reliées à une info : une seule par info (la première non vue)
    const byStory = {};
    pool.filter(v => v.story != null).forEach(v => { (byStory[v.story] = byStory[v.story] || []).push(v); });
    // vidéos hors édition : une seule par sujet, et pas sur un sujet déjà couvert par une info
    // sujets déjà vus (mots-clés des vidéos regardées) : une nouvelle vidéo sur le même sujet est ignorée
    const seenTopics = showAll ? [] : Object.values(seen.vt).map(s => new Set(String(s).split(' ')));
    const loose = [];
    pool.filter(v => v.story == null).forEach(v => {
      v.tok = feedTok(v.title);
      if (storyTok.some(t => sameTopic(t, v.tok))) return;
      if (loose.some(l => sameTopic(l.tok, v.tok))) return;
      if (!seen.v[v.id] && seenTopics.some(t => sameTopic(t, v.tok))) return;
      loose.push(v);
    });

    const items = [];
    day.stories.forEach((s, i) => {
      // une info déjà vue (en carte ou en vidéo) ne revient pas, même avec une autre vidéo
      if (!showAll && seen.s[`${date}:${i}`]) return;
      const v = (byStory[i] || []).find(isNewV);
      if (v) items.push({ type: 'video', v, story: i, s, color: color(s) });
      else items.push({ type: 'story', s, i, color: color(s) });
    });
    const extras = loose.filter(isNewV).slice(0, 15).map(v => ({ type: 'video', v, story: null }));

    // questions flash du jour pas encore répondues
    const qpool = [];
    day.lessons.forEach((l, li) => l.exercises.forEach((ex, ei) => {
      const id = `day:${date}:${li}:${ei}`;
      if (((ex.t === 'qcm' && ex.c.length <= 4) || ex.t === 'vf') && (showAll || !seen.q[id])) qpool.push({ type: 'quiz', ex, id });
    }));
    const quiz = shuffle(qpool).slice(0, 8);

    // assemblage : infos du jour d'abord, vidéos hors édition ensuite, une question toutes les 2 cartes
    const seq = [{ type: 'intro' }];
    [...items, ...extras].forEach((it, n) => {
      seq.push(it);
      if (n % 2 === 1 && quiz.length) seq.push(quiz.shift());
    });
    if (seq.length > 1) seq.push(...quiz.splice(0, 2));
    seq.push({ type: 'end' });
    return seq;
  }

  // Nombre de vidéos pas encore vues (pour l'accroche de l'accueil)
  function newFeedVideos(date, day) {
    return buildFeed(date, day, window.SCOOP_LIVE, false).filter(x => x.type === 'video').map(x => x.v);
  }
  const ago = iso => {
    const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
    if (!isFinite(m) || m < 0) return '';
    return m < 2 ? 'à l\'instant' : m < 60 ? `il y a ${m} min` : m < 1440 ? `il y a ${Math.round(m / 60)} h` : `il y a ${Math.round(m / 1440)} j`;
  };

  function feedCard(it, k, date, day) {
    if (it.type === 'intro') {
      const vids = F.seq.filter(x => x.type === 'video'), srcs = [...new Set(vids.map(x => x.v.source))];
      const subjects = F.seq.filter(x => x.type === 'video' || x.type === 'story').length;
      const nq = F.seq.filter(x => x.type === 'quiz').length;
      const live = window.SCOOP_LIVE, upd = live && live.updated ? ago(live.updated) : '';
      if (!subjects && !nq) {
        return `<section class="fcard f-intro" data-k="${k}"><div class="f-inner">
          <div class="f-kick">Le fil du ${esc(frDate(date))}</div>
          <h1>Tu es à jour 🎉</h1>
          <p class="f-sources" style="font-size:16px;margin-top:14px">Tu as déjà vu toutes les vidéos et les infos du moment. Les vidéos sont mises à jour toutes les 30 minutes${upd ? ` (dernière mise à jour ${esc(upd)})` : ''}. Reviens un peu plus tard !</p>
          <div class="f-endbtns" style="margin-top:24px"><button class="btn primary" data-feed-replay>↺ Revoir tout le fil</button><button class="btn ghost f-ghost" data-feed-close>Retour à l'accueil</button></div>
        </div></section>`;
      }
      return `<section class="fcard f-intro" data-k="${k}"><div class="f-inner">
        <div class="f-kick">Le fil du ${esc(frDate(date))}${F.all ? ' · tout revoir' : ''}</div>
        <h1>${subjects} sujet${subjects > 1 ? 's' : ''} ${F.all ? 'au total' : 'pour toi'}</h1>
        <ul class="f-counts">
          ${vids.length ? `<li><b>${vids.length}</b> vidéo${vids.length > 1 ? 's' : ''} ${F.all ? '' : 'pas encore vue' + (vids.length > 1 ? 's' : '')}, de ${srcs.length} rédaction${srcs.length > 1 ? 's' : ''}</li>` : ''}
          <li><b>1</b> carte par sujet, recoupé par plusieurs médias</li>
          ${nq ? `<li><b>${nq}</b> question${nq > 1 ? 's' : ''} flash (+5 XP chacune)</li>` : ''}
        </ul>
        ${upd ? `<p class="f-sources">🔄 Vidéos mises à jour ${esc(upd)} · toutes les 30 min</p>` : ''}
        ${srcs.length ? `<p class="f-sources">${srcs.map(esc).join(' · ')}</p>` : ''}
        <div class="f-hint"><span>↑</span>Swipe pour commencer</div>
      </div></section>`;
    }
    if (it.type === 'story') {
      const s = it.s, sv = isSaved(date, it.i);
      return `<section class="fcard f-story" data-k="${k}" style="--c:${esc(it.color)}">
        <div class="f-inner">
          <span class="f-tag">${esc(s.tag)}</span>${newBadge(F.day, it.i)}
          <h2>${esc(s.title)}</h2>
          <p>${rich(s.text)}</p>
          ${s.why ? `<div class="f-why">🎯 ${rich(s.why)}</div>` : ''}
          <div class="f-src">${(() => { const l = storySources(s); return l.length >= 2 ? `✓ Recoupé par ${l.length} sources : ${l.map(x => esc(x.name)).join(' · ')}` : `Source : ${esc(l.map(x => x.name).join(', '))}`; })()}</div>
        </div>
        <div class="f-rail">
          <button class="f-act ${sv ? 'on' : ''}" data-save="${it.i}" aria-pressed="${sv}"><span>🔖</span><small>${sv ? 'Gardée' : 'Garder'}</small></button>
          ${(() => { const u = (storySources(s).find(x => x.url) || {}).url; return u ? `<a class="f-act" href="${esc(u)}" target="_blank" rel="noopener"><span>↗</span><small>Source</small></a>` : ''; })()}
        </div>
      </section>`;
    }
    if (it.type === 'video') {
      const v = it.v, st = it.s || null;
      const srcList = st ? storySources(st) : [], sv = st ? isSaved(date, it.story) : false;
      return `<section class="fcard f-video ${st ? 'f-merged' : ''}" data-k="${k}" data-vid="${esc(v.id)}" ${st ? `style="--c:${esc(it.color)}"` : ''}>
        <div class="f-player"><img src="${ytThumb(v.id)}" alt="" loading="lazy"><div class="f-play" aria-hidden="true">▶</div>
          <!-- Calque tactile : garde le swipe vertical actif (sur iPhone, le lecteur YouTube « avale » les gestes) -->
          <button class="f-tap" data-tap aria-label="Mettre en pause ou relancer la vidéo (double-tap à gauche ou à droite : reculer ou avancer de 5 secondes)"><span class="f-tapicon" aria-hidden="true"></span></button>
          <span class="f-ripple" aria-hidden="true"></span>
        </div>
        <div class="f-meta">
          <!-- Commandes du lecteur : lecture, barre de progression à faire glisser, son, commandes YouTube -->
          <div class="f-ctrl">
            <button class="f-pp" data-pp aria-label="Lecture ou pause">⏸</button>
            <span class="f-time" data-cur>0:00</span>
            <input class="f-seek" type="range" min="0" max="60" step="0.1" value="0" data-seek aria-label="Se déplacer dans la vidéo">
            <span class="f-time" data-dur>–:––</span>
            <button class="f-sound" data-sound aria-label="Activer ou couper le son">${F && F.sound ? '🔊' : '🔇'}</button>
            <button class="f-native" data-native aria-pressed="false" aria-label="Utiliser les commandes du lecteur YouTube">🎛️</button>
          </div>
          <div class="f-meta-top"><span class="f-chan">▶ ${esc(v.source)}</span>
            <span class="f-tools"><a class="f-yt" href="https://www.youtube.com/shorts/${esc(v.id)}" target="_blank" rel="noopener">YouTube ↗</a></span></div>
          ${st ? `<h3 class="f-headline">${esc(st.title)}${newBadge(F.day, it.story)}</h3>
            <div class="f-row"><button class="f-ess" data-sheet>📰 L'essentiel ${srcList.length >= 2 ? `· ✓ ${srcList.length} sources` : ''}</button>
            <button class="f-mini ${sv ? 'on' : ''}" data-save="${it.story}" aria-pressed="${sv}" aria-label="Garder cette info"><span>🔖</span><small>${sv ? 'Gardée' : 'Garder'}</small></button></div>`
          : `<h3>${esc(v.title)}</h3>`}
          <div class="f-swipe">Touche : pause · double-tap ◀ ▶ : ±5 s · swipe ↑ : suite</div>
        </div>
        ${st ? `<div class="f-sheet" hidden>
          <div class="f-sheet-head"><span class="f-tag">${esc(st.tag)}</span><button class="f-sheet-x" data-sheet aria-label="Fermer">✕</button></div>
          <h2>${esc(st.title)}</h2>
          <p>${rich(st.text)}</p>
          ${st.why ? `<div class="f-why">🎯 ${rich(st.why)}</div>` : ''}
          <div class="f-src">${srcList.length >= 2 ? `✓ Recoupé par ${srcList.length} sources : ` : 'Source : '}${srcList.map(x => x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.name)}</a>` : esc(x.name)).join(' · ')}</div>
          <p class="f-vidsrc">Vidéo : ${esc(v.source)} — « ${esc(v.title)} »</p>
        </div>` : ''}
      </section>`;
    }
    if (it.type === 'quiz') {
      const ex = it.ex, vf = ex.t === 'vf';
      const choices = vf ? [['Vrai', 0], ['Faux', 1]] : shuffle(ex.c.map((c, i) => [c, i]));
      return `<section class="fcard f-quiz" data-k="${k}"><div class="f-inner">
        <div class="f-kick">⚡ Question flash · +5 XP</div>
        <h2>${vf ? 'Vrai ou faux ?' : rich(ex.q)}</h2>
        ${vf ? `<blockquote class="f-state">${rich(ex.q)}</blockquote>` : ''}
        <div class="f-choices ${vf ? 'two' : ''}">${choices.map(([c, i]) => `<button class="f-choice" data-c="${i}">${rich(c)}</button>`).join('')}</div>
        <div class="f-expl" hidden></div>
      </div></section>`;
    }
    return `<section class="fcard f-end" data-k="${k}"><div class="f-inner">
      <div class="f-big">🎉</div>
      <h1>Tu es à jour !</h1>
      <p class="f-endstats" id="f-endstats"></p>
      <div class="f-endbtns">
        <button class="btn primary" data-feed-test>▶ Faire le test du jour</button>
        <button class="btn ghost f-ghost" data-feed-replay>↺ Revoir tout le fil</button>
        <button class="btn ghost f-ghost" data-feed-close>Retour à l'accueil</button>
      </div>
      <p class="f-sources" style="margin-top:14px">Les vidéos se renouvellent toutes les 30 minutes : celles que tu as vues ne reviendront pas.</p>
    </div></section>`;
  }

  // Charge la liste de vidéos mise à jour toutes les 30 min (data/live/shorts.js)
  async function loadLive() {
    try { await loadScript(`data/live/shorts.js?t=${Date.now()}`); } catch (e) { /* pas encore de flux : on garde les vidéos du matin */ }
    return window.SCOOP_LIVE || null;
  }

  async function openFeed(date, showAll) {
    date = date && DATE_RE.test(date) ? date : CURRENT;
    const day = await getDay(date);
    if (!day) { location.hash = '#/home'; return; }
    if (F && F.date === date && !showAll) return;
    if (F) { $$('.fcard', $('#f-track')).forEach(stopVideo); }
    const live = await loadLive();
    F = { date, day, seq: [], xp: 0, answered: 0, right: 0, videos: new Set(), active: -1, done: false, sound: feedSoundPref, all: !!showAll };
    F.seq = buildFeed(date, day, live, !!showAll);
    const track = $('#f-track');
    track.innerHTML = F.seq.map((it, k) => feedCard(it, k, date, day)).join('');
    $('#feed').hidden = false;
    document.body.classList.add('in-lesson');
    $('#f-xp').textContent = '⚡ 0';
    track.scrollTop = 0;
    if (document.activeElement) document.activeElement.blur();
    if (feedObs) feedObs.disconnect();
    feedObs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) feedActivate(+e.target.dataset.k); });
    }, { root: track, threshold: 0.6 });
    $$('.fcard', track).forEach(c => feedObs.observe(c));
    feedActivate(0);
  }

  // Envoie une commande au lecteur YouTube intégré (API iframe)
  function ytCmd(card, func, args = []) {
    const ifr = card && $('iframe', card);
    if (!ifr || !ifr.contentWindow) return;
    try { ifr.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args }), '*'); } catch (e) { /* lecteur pas prêt */ }
  }

  // Monte le lecteur YouTube d'une carte. muted=false demande la lecture avec le son
  // (autorisé par le navigateur juste après un toucher sur la page). start = seconde de reprise.
  function mountVideo(card, v, { muted = true, start = 0 } = {}) {
    const old = $('iframe', card); if (old) old.remove();
    const id = v.id, origin = encodeURIComponent(location.origin);
    $('.f-player', card).insertAdjacentHTML('afterbegin',
      `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=${muted ? 1 : 0}&playsinline=1&loop=1&playlist=${id}&rel=0&modestbranding=1&enablejsapi=1&origin=${origin}${start > 0 ? `&start=${start}` : ''}" title="${esc(v.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`);
    const ifr = $('iframe', card);
    delete card.dataset.state; card.dataset.muted = muted ? '1' : '0';
    // demande au lecteur de nous envoyer son état (lecture, pause, muet, temps écoulé)
    const listen = () => { try { ifr.contentWindow.postMessage(JSON.stringify({ event: 'listening', id, channel: 'widget' }), '*'); } catch (e) { /* ignore */ } };
    ifr.addEventListener('load', () => { listen(); setTimeout(listen, 600); setTimeout(listen, 1500); }, { once: true });
    card.classList.add('playing');
    card.classList.remove('paused', 'needs-tap');
  }

  // Messages du lecteur YouTube → état réel de la vidéo sur la carte
  window.addEventListener('message', e => {
    if (!F || !/^https:\/\/www\.youtube(-nocookie)?\.com$/.test(e.origin)) return;
    let d; try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (err) { return; }
    if (!d || !d.event) return;
    const card = $$('.f-video.playing', $('#f-track')).find(c => { const f = $('iframe', c); return f && f.contentWindow === e.source; });
    if (!card) return;
    const info = d.info, setState = s => {
      card.dataset.state = s;
      if (+s === 1) card.classList.remove('paused', 'needs-tap', 'sound-loading');   // en lecture
      if (+s === 2) card.classList.add('paused');                  // en pause
      const pp = $('[data-pp]', card); if (pp) pp.textContent = +s === 1 ? '⏸' : '▶';
    };
    if (d.event === 'onStateChange') setState(info);
    if ((d.event === 'infoDelivery' || d.event === 'initialDelivery') && info && typeof info === 'object') {
      if ('playerState' in info) setState(info.playerState);
      if ('duration' in info && info.duration > 0) card.dataset.dur = info.duration;
      if ('currentTime' in info) { card.dataset.time = info.currentTime; updateSeek(card); }
      if ('muted' in info) {
        card.dataset.muted = info.muted ? '1' : '0';
        // son changé depuis le bouton haut-parleur de YouTube : notre bouton 🔊 suit
        const active = card.dataset.k === String(F.active), soundNow = !info.muted;
        if (active && card.dataset.state === '1' && soundNow !== F.sound) {
          F.sound = soundNow; feedSoundPref = soundNow;
          $$('[data-sound]', $('#f-track')).forEach(b => { b.textContent = soundNow ? '🔊' : '🔇'; });
          if (soundNow) card.classList.remove('needs-tap', 'sound-blocked');
        }
      }
    }
  });

  // ---------- Commandes du lecteur ----------
  const mmss = s => { s = Math.max(0, Math.floor(+s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  // met à jour la barre de progression (sauf pendant que tu la fais glisser)
  function updateSeek(card) {
    const seek = $('[data-seek]', card); if (!seek || card._dragging) return;
    const dur = +card.dataset.dur || 0, cur = +card.dataset.time || 0;
    if (dur > 0) { seek.max = dur; $('[data-dur]', card).textContent = mmss(dur); }
    seek.value = cur;
    $('[data-cur]', card).textContent = mmss(cur);
    seek.style.setProperty('--p', `${dur > 0 ? Math.min(100, cur / dur * 100) : 0}%`);
  }
  function seekTo(card, sec) {
    const dur = +card.dataset.dur || Infinity;
    sec = Math.max(0, Math.min(sec, dur - 0.5));
    ytCmd(card, 'seekTo', [sec, true]);
    card.dataset.time = sec; card._dragging = false; updateSeek(card);
  }
  function togglePlay(card) {
    if (!card || !card.classList.contains('playing')) return;
    const isPlaying = card.dataset.state ? card.dataset.state === '1' : !card.classList.contains('paused');
    card.classList.toggle('paused', isPlaying);
    const pp = $('[data-pp]', card); if (pp) pp.textContent = isPlaying ? '▶' : '⏸';
    ytCmd(card, isPlaying ? 'pauseVideo' : 'playVideo');
  }
  function ripple(card, txt, side) {
    const r = $('.f-ripple', card); if (!r) return;
    r.textContent = txt; r.className = `f-ripple show ${side < 0 ? 'left' : 'right'}`;
    clearTimeout(r._t); r._t = setTimeout(() => { r.className = 'f-ripple'; }, 650);
  }

  // Active le son sans mettre la vidéo en pause
  function soundOn(card) {
    if (!card || !card.classList.contains('playing')) return;
    const it = F.seq[+card.dataset.k]; if (!it) return;
    const t0 = Math.floor(+card.dataset.time || 0);
    // iPhone (Safari) : le son ne peut être activé QUE par un toucher dans le lecteur.
    // On ne touche donc pas à la vidéo (sinon Safari la met en pause) : on montre où toucher.
    if (document.documentElement.classList.contains('is-ios')) { card.classList.add('needs-tap'); return; }
    // 1. Voie rapide : remettre le son sans recharger (instantané quand le navigateur l'accepte)
    card.classList.add('sound-loading');
    ytCmd(card, 'unMute'); ytCmd(card, 'setVolume', [100]); ytCmd(card, 'playVideo');
    setTimeout(() => {
      if (!F || !card.isConnected || !card.classList.contains('playing')) return;
      if (card.dataset.state === '1' && card.dataset.muted === '0') { card.classList.remove('sound-loading'); return; }
      // 2. Le navigateur a mis en pause : on relance aussitôt avec le son, à la même seconde
      //    (ton toucher sur 🔊 vient d'autoriser la lecture sonore)
      mountVideo(card, it.v, { muted: false, start: t0 });
      const ifr = $('iframe', card);
      ifr.addEventListener('load', () => setTimeout(() => {
        if (F && card.isConnected && card.classList.contains('playing') && card.dataset.state !== '1') {
          card.classList.remove('sound-loading'); card.classList.add('needs-tap'); // dernier recours : toucher ▶
        }
      }, 3000), { once: true });
    }, 500);
  }

  function stopVideo(card) {
    const ifr = card && $('iframe', card);
    if (ifr) ifr.remove();
    if (card) card.classList.remove('playing');
  }

  function feedActivate(k) {
    if (!F || F.active === k) return;
    const track = $('#f-track');
    stopVideo($(`.fcard[data-k="${F.active}"]`, track));
    F.active = k;
    $('#f-prog').style.width = `${Math.round((k / Math.max(1, F.seq.length - 1)) * 100)}%`;
    const card = $(`.fcard[data-k="${k}"]`, track), it = F.seq[k];
    if (!card || !it) return;
    clearTimeout(F.seenTimer);
    if (it.type === 'story') { seenStore().s[`${F.date}:${it.i}`] = Date.now(); save(); }
    if (it.type === 'video') {
      const id = it.v.id;
      F.videos.add(id);
      // vue au bout de 3 secondes à l'écran : elle ne reviendra plus dans le fil
      F.seenTimer = setTimeout(() => {
        if (!F || F.active !== k) return;
        const st = seenStore(); st.v[id] = Date.now(); st.vt[id] = [...feedTok(it.v.title)].slice(0, 12).join(' ');
        if (it.story != null) st.s[`${F.date}:${it.story}`] = Date.now();
        save();
      }, 3000);
      // Lecture automatique en muet (règle des navigateurs, iPhone compris) ; le bouton 🔊 active le son.
      // enablejsapi permet de piloter le lecteur (pause, son) depuis notre calque tactile.
      // Son déjà activé : on tente la lecture directement avec le son (le swipe compte comme un geste).
      // Si le navigateur refuse, on repasse en muet pour que la vidéo démarre quand même.
      const ios = document.documentElement.classList.contains('is-ios');
      mountVideo(card, it.v, { muted: !F.sound || ios });
      if (F.sound && !ios) setTimeout(() => {
        if (!F || F.active !== k || !card.classList.contains('playing')) return;
        if (card.dataset.state !== '1') { mountVideo(card, it.v, { muted: true }); card.classList.add('sound-blocked'); }
      }, 2500);
    }
    if (it.type === 'end') finishFeed();
  }

  function finishFeed() {
    const key = `feed:${F.date}`;
    if (!F.done && !S.lessons[key]) {
      F.done = true; F.xp += 10; addXp(10); markActive();
      S.lessons[key] = { stars: 3, at: TODAY };
      save();
    }
    $('#f-xp').textContent = `⚡ ${F.xp}`;
    const nq = F.seq.filter(x => x.type === 'quiz').length;
    const el = $('#f-endstats');
    if (el) el.innerHTML = `${F.videos.size} vidéo${F.videos.size > 1 ? 's' : ''} vue${F.videos.size > 1 ? 's' : ''} · ${F.right}/${nq} bonnes réponses · <b>+${F.xp} XP</b><br>🔥 Série : ${streakNow()} jour${streakNow() > 1 ? 's' : ''}`;
    const next = F.day.lessons.findIndex((_, i) => !lessonState(`day:${F.date}:${i}`));
    const b = $('[data-feed-test]');
    if (b) { if (next < 0) b.textContent = '✓ Tests du jour bouclés'; b.dataset.next = next; b.disabled = next < 0; }
  }

  function closeFeed() {
    if (!F) return;
    $$('.fcard', $('#f-track')).forEach(stopVideo);
    if (feedObs) feedObs.disconnect();
    $('#f-track').innerHTML = '';
    $('#feed').hidden = true;
    if (!L) document.body.classList.remove('in-lesson');
    F = null;
    renderChrome();
  }

  function answerFlash(btn) {
    const card = btn.closest('.f-quiz'); if (!card || card.classList.contains('answered')) return;
    const it = F.seq[+card.dataset.k], ex = it.ex;
    const good = ex.t === 'vf' ? (ex.a ? 0 : 1) : ex.a, pick = +btn.dataset.c, ok = pick === good;
    card.classList.add('answered');
    $$('.f-choice', card).forEach(b => { const c = +b.dataset.c; if (c === good) b.classList.add('right'); else if (c === pick) b.classList.add('wrong'); });
    S.stats.answered++; F.answered++;
    seenStore().q[it.id] = Date.now();
    if (ok) { S.stats.correct++; F.right++; F.xp += 5; addXp(5); sfx.ok(); }
    else {
      sfx.ko();
      if (!S.review.some(r => r.id === it.id)) S.review.push({ id: it.id, ex, from: `Fil du ${frDate(F.date)}`, at: TODAY });
    }
    markActive(); save();
    $('#f-xp').textContent = `⚡ ${F.xp}`;
    const ex_ = $('.f-expl', card);
    ex_.innerHTML = `<b>${ok ? '✓ Bien vu !' : '✕ Raté, la question part dans « À revoir ».'}</b>${ex.x ? ' ' + rich(ex.x) : ''}`;
    ex_.hidden = false;
  }

  function toggleSave(i) {
    const s = F.day.stories[i], key = savedKey(F.date, i);
    const at = S.saved.findIndex(x => x.key === key);
    if (at >= 0) S.saved.splice(at, 1);
    else { const l = storySources(s); S.saved.push({ key, date: F.date, title: s.title, tag: s.tag, source: l.map(x => x.name).join(', '), link: (l.find(x => x.url) || {}).url || '' }); }
    save();
    const b = $(`[data-save="${i}"]`, $('#f-track')), on = at < 0;
    if (b) { b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); $('small', b).textContent = on ? 'Gardée' : 'Garder'; }
    if (on) sfx.pair();
  }

  $('#f-close').addEventListener('click', () => { location.hash = '#/home'; });
  // barre de progression : on suit le doigt, puis on saute à la position au relâchement
  $('#f-track').addEventListener('input', e => {
    const s = e.target.closest('[data-seek]'); if (!s) return;
    const card = s.closest('.f-video'); card._dragging = true;
    $('[data-cur]', card).textContent = mmss(s.value);
    s.style.setProperty('--p', `${+s.max > 0 ? s.value / s.max * 100 : 0}%`);
  });
  $('#f-track').addEventListener('change', e => {
    const s = e.target.closest('[data-seek]'); if (!s) return;
    seekTo(s.closest('.f-video'), +s.value);
  });
  $('#f-track').addEventListener('click', e => {
    const tap = e.target.closest('[data-tap]');
    if (tap) { // toucher : pause / lecture · double-tap sur un côté : -5 s / +5 s
      const card = tap.closest('.f-video'); if (!card || !card.classList.contains('playing')) return;
      const rect = tap.getBoundingClientRect(), x = e.clientX - rect.left, now = Date.now();
      const side = x < rect.width / 3 ? -1 : x > rect.width * 2 / 3 ? 1 : 0;
      const last = F.lastTap;
      if (side && last && last.k === card.dataset.k && last.side === side && now - last.t < 320) {
        clearTimeout(F.tapTimer); F.lastTap = null;
        seekTo(card, (+card.dataset.time || 0) + side * 5);
        ripple(card, side < 0 ? '⏪ 5 s' : '5 s ⏩', side);
        return;
      }
      F.lastTap = { t: now, side, k: card.dataset.k };
      clearTimeout(F.tapTimer);
      // sur les côtés, on attend un éventuel 2e toucher avant de mettre en pause
      F.tapTimer = setTimeout(() => togglePlay(card), side ? 300 : 0);
      return;
    }
    const pp = e.target.closest('[data-pp]');
    if (pp) { togglePlay(pp.closest('.f-video')); return; }
    const nat = e.target.closest('[data-native]');
    if (nat) { // libère le lecteur YouTube : toutes ses commandes deviennent touchables
      const card = nat.closest('.f-video'), on = !card.classList.contains('native');
      card.classList.toggle('native', on); nat.setAttribute('aria-pressed', on);
      return;
    }
    const snd = e.target.closest('[data-sound]');
    if (snd) { // son activé / coupé, mémorisé pour les vidéos suivantes
      F.sound = !F.sound; feedSoundPref = F.sound;
      $$('[data-sound]', $('#f-track')).forEach(b => { b.textContent = F.sound ? '🔊' : '🔇'; });
      const card = snd.closest('.f-video');
      if (card) card.classList.remove('sound-blocked');
      if (F.sound) soundOn(card);
      else ytCmd(card, 'mute');   // couper le son ne met jamais en pause
      return;
    }
    const sh = e.target.closest('[data-sheet]');
    if (sh) { // ouvre / ferme « L'essentiel » sur la carte vidéo
      const card = sh.closest('.f-video'), sheet = card && $('.f-sheet', card);
      if (sheet) { sheet.hidden = !sheet.hidden; card.classList.toggle('sheet-open', !sheet.hidden); }
      return;
    }
    if (e.target.closest('[data-feed-replay]')) { openFeed(F.date, true); return; }
    const c = e.target.closest('.f-choice'); if (c) { answerFlash(c); return; }
    const s = e.target.closest('[data-save]'); if (s) { toggleSave(+s.dataset.save); return; }
    if (e.target.closest('[data-feed-close]')) { location.hash = '#/home'; return; }
    const t = e.target.closest('[data-feed-test]');
    if (t && !t.disabled) { const k = `day:${F.date}:${t.dataset.next}`; location.hash = '#/home'; setTimeout(() => startLesson(k), 50); }
  });
  document.addEventListener('keydown', e => {
    if (!F || L) return;
    const track = $('#f-track');
    if (e.key === 'Escape') { location.hash = '#/home'; return; }
    if (['ArrowDown', 'PageDown', 'j', ' '].includes(e.key)) { e.preventDefault(); track.scrollBy({ top: track.clientHeight, behavior: 'smooth' }); }
    if (['ArrowUp', 'PageUp', 'k'].includes(e.key)) { e.preventDefault(); track.scrollBy({ top: -track.clientHeight, behavior: 'smooth' }); }
  });

  // ---------- Appli installable (PWA) ----------
  let installEvt = null;
  const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  // iPhone : marque l'appli installée pour réserver la place de l'encoche et de l'heure
  if (isStandalone()) document.documentElement.classList.add('is-standalone');
  if (isIOSDevice()) document.documentElement.classList.add('is-ios');
  function isIOSDevice() { return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; refreshInstall(); });
  window.addEventListener('appinstalled', () => { installEvt = null; refreshInstall(); });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {}));
  }
  function installCard() {
    if (isStandalone() || !location.protocol.startsWith('http')) return '';
    if (installEvt) return `<div class="card install"><div class="install-ico">📲</div><div><h4>Installe Scoop sur ton téléphone</h4><p class="muted" style="font-size:14px">Une icône sur l'écran d'accueil, plein écran, et ça marche hors ligne.</p></div><button class="btn small primary" id="b-install">Installer</button></div>`;
    if (isIOS()) return `<div class="card install"><div class="install-ico">📲</div><div><h4>Installe Scoop sur ton iPhone</h4><p class="muted" style="font-size:14px">Dans Safari, touche <b>Partager</b> <span aria-hidden="true">⬆️</span>, puis <b>« Sur l'écran d'accueil »</b>.</p></div></div>`;
    return '';
  }
  function refreshInstall() {
    $$('[data-install-slot]').forEach(el => { el.innerHTML = installCard(); });
  }
  document.addEventListener('click', async e => {
    if (!e.target.closest('#b-install') || !installEvt) return;
    installEvt.prompt();
    try { await installEvt.userChoice; } catch (_) { /* ignore */ }
    installEvt = null; refreshInstall();
  });

  // ---------- Démarrage ----------
  async function init() {
    try { await loadScript(`data/days/index.js?t=${Date.now()}`); } catch (e) { /* pas encore d'édition */ }
    INDEX = (window.SCOOP_DAYS_INDEX || [])
      .map(d => typeof d === 'string' ? { date: d } : d)
      .filter(d => d && DATE_RE.test(d.date))
      .sort((a, b) => b.date.localeCompare(a.date));
    CURRENT = (INDEX.find(d => d.date <= TODAY) || INDEX[INDEX.length - 1] || {}).date || null;
    if (CURRENT) await getDay(CURRENT);
    await loadLive();
    route();
  }
  init();
})();
