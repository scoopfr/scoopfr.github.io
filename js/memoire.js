/* =========================================================
   Scoop — Mémoire de l'actu
   - Noms, dates et chiffres : de VRAIES questions (QCM ou réponse libre, corrigées par l'app comme les quiz),
     tirées des infos, revues à intervalles croissants (cases de Leitner) et gardées en mémoire.
   - Rappel : questions des éditions précédentes.
   - Barre de maîtrise sur CHAQUE info : elle s'adapte aux résultats des quiz, du fil et des cartes liés à cette info.
   ========================================================= */
(window.SCOOP_MODULES = window.SCOOP_MODULES || []).push(ctx => {
  'use strict';
  const { esc, shuffle, TODAY, frDate } = ctx;
  const S = () => ctx.S;
  const plain = s => String(s || '').replace(/\*\*|\*/g, '');
  const nz = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'`]/g, '\'').replace(/\s+/g, ' ').trim();
  const MONTHS_ARR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const WD_ARR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const MONTHS = MONTHS_ARR.join('|'), WD = WD_ARR.join('|');
  let dirty = false;

  // =========================================================== CARTES (nom, date, chiffre)
  const DATE_RX = new RegExp(`(?:(?:${WD})\\s+)?\\d{1,2}(?:er)? (?:${MONTHS})(?: \\d{4})?`, 'i');
  const NUM_RX = /\b\d[\d\s  .,]*\d?\s?(?:milliards?|millions?|%|euros?|€|dollars?|morts?|victimes?|voix|députés|sièges|femmes)\b|\b\d{2,3}(?:[\s  ]\d{3})+\b/i;
  const NAME_RX = /[A-ZÉÈÀ][\p{L}'’-]+(?:\s+[A-ZÉÈÀ][\p{L}'’-]+){1,3}/gu;
  const BAD = new Set('Le La Les Un Une Des Du De Au Aux En Dans Sur Pour Par Avec Sans Selon Lundi Mardi Mercredi Jeudi Vendredi Samedi Dimanche Janvier Février Mars Avril Mai Juin Juillet Août Septembre Octobre Novembre Décembre Cette Ces Son Ses Leur Après Avant Depuis Alors Mais Donc Ainsi Cela Ils Elle Dès Monde Figaro Libération Guardian Times AFP Reuters Franceinfo Parisien Croix Express Europe France Nations Unies Cour Conseil Tribunal Assemblée Sénat Commission Parlement Union Banque Ministère Royaume États Salon Caisse Livret Horizons Nouvelle Parti Groupe Comité Cabinet Congrès Association République Fédération Agence New York Euronews Radio Canada Chambre Bourse Premier Première Présidence Président Ministre'.split(' '));
  const sentencesOf = t => (plain(t).match(/[^.!?]+[.!?]+/g) || []).map(s => s.trim()).filter(s => s.length >= 45 && s.length <= 250);
  const BLANK = '……';
  // un nom de personne : 2 ou 3 mots à majuscule, aucun mot d'institution ou de média, une seule fois dans la phrase
  const PREP = new Set(['de', 'du', 'des', 'à', 'au', 'aux', 'en', 'dans', 'sur', 'par', 'chez', 'vers', 'pour']);
  const PERSON_CUE = new RegExp('(?:\\b(?:président|présidente|ministre|maire|dirigeant|dirigeante|secrétaire général|secrétaire générale|candidat|candidate|député|députée|sénateur|sénatrice|juge|procureur|procureure|avocat|avocate|chanteur|chanteuse|guitariste|musicien|musicienne|acteur|actrice|comédien|comédienne|metteur en scène|metteuse en scène|écrivain|écrivaine|romancier|romancière|journaliste|réalisateur|réalisatrice|entraîneur|joueur|joueuse|patron|patronne|PDG|fondateur|fondatrice|porte-parole|chef|cheffe|leader|militant|militante|opposant|opposante|ancien|ancienne|épouse|époux|fils|fille|M\\.|Mme)\\b[^¤]{0,25}¤)'
    + '|(?:¤\\s*,\\s*(?:le |la |l’|l\')?(?:président|présidente|ministre|maire|dirigeant|dirigeante|secrétaire|candidat|candidate|député|sénateur|juge|avocat|chanteur|chanteuse|guitariste|acteur|actrice|comédien|comédienne|journaliste|réalisateur|réalisatrice|patron|fondateur|porte-parole|chef|leader|ancien|ancienne))'
    + '|(?:\\b(?:le|la|l’|l\')\\s+[A-ZÉ][a-zéè]+(?:ien|ienne|ais|aise|ain|aine|on|onne|ois|oise|ol|ole|and|ande)\\s+¤)', 'i');
  function personName(sen) {
    for (const m of sen.slice(1).matchAll(NAME_RX)) {
      let t = m[0].split(/\s+/);
      const before = sen.slice(0, m.index + 1).trim().split(/\s+/).pop().toLowerCase().replace(/[’']$/, '');
      // on retire en tête les mots qui ne sont pas un prénom : institution, média, lieu après « de », nationalité
      let first = true;
      while (t.length && (BAD.has(t[0]) || /(ien|ienne|ais|aise|ain|aine)$/i.test(t[0]) || (first && PREP.has(before)))) { t.shift(); first = false; }
      while (t.length && BAD.has(t[t.length - 1])) t.pop();
      if (t.length < 2 || t.length > 4 || t.some(w => w.length < 3)) continue;
      const name = t.join(' ');
      if (name.length < 6 || name.length > 34 || sen.split(name).length !== 2) continue;
      // « Qui ? » seulement si le texte dit que c'est une personne : une fonction ou un métier juste avant ou juste après le nom
      // (« le président américain Donald Trump », « Mark Rutte, secrétaire général », « le guitariste britannique Andy Taylor »).
      // Sans cet indice, on ne pose pas la question : « Le Med Emre, un navire… » avait été pris pour une personne.
      const at = sen.indexOf(name), around = `${sen.slice(Math.max(0, at - 45), at)} ¤ ${sen.slice(at + name.length, at + name.length + 30)}`;
      if (!PERSON_CUE.test(around)) continue;
      return name;
    }
    return null;
  }
  function cardsOf(day) {
    const out = [];
    day.stories.forEach((s, i) => {
      const done = { date: false, chiffre: false, nom: false };
      const mk = (k, sen, ans) => out.push({ id: `${day.date}:${i}:${k}`, k, f: sen.replace(ans, BLANK), b: ans, t: s.title, d: day.date, sid: i });
      for (const sen of sentencesOf(s.text)) {
        if (!done.date) { const m = sen.match(DATE_RX); if (m && sen.split(m[0]).length === 2) { mk('date', sen, m[0]); done.date = true; continue; } }
        if (!done.chiffre) { const m = sen.match(NUM_RX); if (m && m[0].replace(/\D/g, '').length >= 2 && !DATE_RX.test(m[0]) && sen.split(m[0].trim()).length === 2) { mk('chiffre', sen, m[0].trim()); done.chiffre = true; continue; } }
        if (!done.nom) { const nm = personName(sen); if (nm) { mk('nom', sen, nm); done.nom = true; } }
      }
    });
    return out;
  }
  const mem = () => {
    const s = S(); s.mem = s.mem || {};
    if (s.mem.v === 2 && s.mem.cards) {   // v3 : les fiches « Qui ? » créées avant le contrôle « c'est bien une personne » sont retirées (elles seront recréées si elles le méritent)
      Object.keys(s.mem.cards).forEach(id => { if (s.mem.cards[id].k === 'nom') delete s.mem.cards[id]; });
      s.mem.v = 3; dirty = true;
    }
    if (s.mem.v !== 3) { s.mem = { v: 3, cards: {} }; }
    s.mem.cards = s.mem.cards || {}; return s.mem;
  };
  const INTERVALS = [1, 2, 4, 8, 16, 32];
  function absorb(day) {
    const m = mem(); let added = 0;
    cardsOf(day).forEach(c => { if (!m.cards[c.id]) { m.cards[c.id] = { ...c, box: 0, due: TODAY, n: 0, ok: 0 }; added++; } });
    const ids = Object.keys(m.cards);
    if (ids.length > 600) ids.sort((a, b) => (m.cards[b].box - m.cards[a].box) || m.cards[a].d.localeCompare(m.cards[b].d)).slice(0, ids.length - 600).forEach(id => delete m.cards[id]);
    if (added) dirty = true;
  }

  // ----- fausses réponses plausibles
  const fmtNum = n => (n >= 1000 ? String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : String(Math.round(n * 10) / 10).replace('.', ','));
  const nice = n => { if (n < 10) return Math.round(n * 10) / 10; const p = Math.pow(10, Math.floor(Math.log10(n)) - 1); return Math.round(n / p) * p; };
  function distractors(c) {
    if (c.k === 'nom') {
      const pool = [...new Set(Object.values(mem().cards).filter(x => x.k === 'nom' && x.b !== c.b).map(x => x.b))];
      return pool.length >= 3 ? shuffle(pool).slice(0, 3) : null;
    }
    if (c.k === 'date') {
      const m = c.b.match(new RegExp(`^(?:(${WD})\\s+)?(\\d{1,2})(er)?\\s+(${MONTHS})(?:\\s+(\\d{4}))?$`, 'i'));
      if (!m) return null;
      const y = +(m[5] || c.d.slice(0, 4)), mo = MONTHS_ARR.indexOf(m[4].toLowerCase()), d = +m[2], out = new Set();
      for (const off of shuffle([-1, 1, -2, 2, -3, 3, 5, -5, 7, -7, 10, -10, 14, -14])) {
        const dt = new Date(y, mo, d + off);
        let lab = `${m[1] ? WD_ARR[dt.getDay()] + ' ' : ''}${dt.getDate() === 1 ? '1er' : dt.getDate()} ${MONTHS_ARR[dt.getMonth()]}${m[5] ? ' ' + dt.getFullYear() : ''}`;
        if (/^[A-ZÉÈÀ]/.test(c.b)) lab = lab[0].toUpperCase() + lab.slice(1);   // même majuscule que la bonne réponse : rien ne la trahit
        if (lab.toLowerCase() !== c.b.toLowerCase()) out.add(lab);
        if (out.size === 3) break;
      }
      return out.size === 3 ? [...out] : null;
    }
    const m = c.b.match(/^([\d\s  .,]+?)\s*(\D.*)?$/);
    if (!m) return null;
    const v = parseFloat(m[1].replace(/[\s  ]/g, '').replace(',', '.'));
    if (!isFinite(v) || v <= 0) return null;
    const out = new Set();
    for (const f of shuffle([0.5, 2, 1.5, 0.75, 3, 0.25, 4])) { const n = nice(v * f); if (n && n !== v) out.add(`${fmtNum(n)}${m[2] ? ' ' + m[2] : ''}`); if (out.size === 3) break; }
    return out.size === 3 ? [...out] : null;
  }
  const KQ = { nom: '👤 Qui ?', date: '📅 Quand ?', chiffre: '🔢 Combien ?' };
  function exOfCard(c) {
    const d = distractors(c); if (!d) return null;
    const choices = shuffle([c.b, ...d]);
    return { t: 'qcm', q: `${KQ[c.k]} « ${c.f} »`, c: choices, a: choices.indexOf(c.b), x: `Réponse : **${c.b}**. 📰 ${c.t} · ${frDate(c.d, { day: 'numeric', month: 'long' })}` };
  }

  // =========================================================== MAÎTRISE PAR INFO
  const know = () => { const s = S(); s.know = s.know || {}; s.know.story = s.know.story || {}; return s.know; };
  const STOP = new Set('dans pour avec sans sous chez apres avant cette ces leur leurs plus moins entre contre vers selon depuis encore deja alors aussi tres tout tous elle elles nous vous sont etre fait mais comme donc quand'.split(' '));
  const tok = s => new Set(nz(s).replace(/[^a-z0-9 ]/g, ' ').split(' ').filter(w => w.length >= 4 && !STOP.has(w)));
  const mapCache = {};
  // quelle info concerne chaque question des leçons du jour (rapprochement par mots rares, comme dans le fil)
  function exMap(date) {
    if (mapCache[date]) return mapCache[date];
    const day = ctx.DAYS[date], m = new Map();
    if (day) {
      const st = day.stories.map(s => tok(`${s.title} ${s.text} ${s.why || ''}`)), df = {};
      st.forEach(t => t.forEach(w => { df[w] = (df[w] || 0) + 1; }));
      day.lessons.forEach((l, li) => l.exercises.forEach((ex, ei) => {
        const t = tok(`${ex.q || ''} ${ex.t === 'qcm' ? (ex.c || [])[ex.a] : ''} ${ex.x || ''}`); let best = -1, bs = 0;
        st.forEach((s, i) => { let sc = 0; t.forEach(w => { if (s.has(w)) sc += 1 / df[w]; }); if (sc > bs) { bs = sc; best = i; } });
        if (best >= 0 && bs >= 1.5) m.set(`day:${date}:${li}:${ei}`, best);
      }));
    }
    return (mapCache[date] = m);
  }
  const storyKeyOf = id => {
    id = String(id || '');
    let m = id.match(/^mem:(\d{4}-\d{2}-\d{2}):(\d+):/); if (m) return `${m[1]}:${m[2]}`;
    m = id.match(/^auto:(\d{4}-\d{2}-\d{2}):(\d+)$/); if (m) return `${m[1]}:${m[2]}`;
    m = id.match(/^day:(\d{4}-\d{2}-\d{2}):(\d+):(\d+)$/); if (m) { const i = exMap(m[1]).get(id); return i == null ? null : `${m[1]}:${i}`; }
    return null;
  };
  ctx.onAnswer((ok, src, it) => {
    if (!it || !it.id || it.retry) return;   // seule la première tentative compte
    const k = storyKeyOf(it.id);
    if (k) { const a = (know().story[k] = know().story[k] || []); a.push(ok ? 1 : 0); if (a.length > 6) a.shift(); }
    if (String(it.id).startsWith('mem:')) {
      const c = mem().cards[String(it.id).slice(4)];
      if (c) { c.n++; if (ok) { c.ok++; c.due = ctx.addDays(TODAY, INTERVALS[Math.min(c.box, 5)]); c.box = Math.min(c.box + 1, 5); } else { c.box = 0; c.due = ctx.addDays(TODAY, 1); } }
    }
    ctx.save();
    const s = S(); s.recall = s.recall || {}; if (/^day:/.test(String(it.id))) s.recall[it.id] = (s.recall[it.id] || 0) + (ok ? 1 : -1);
  });
  const mastery = key => { const a = know().story[key]; return a && a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length * 100) : null; };
  // Sous chaque info : ton estimation à toi (curseur, dans l'app) ; ici seulement un petit test pour la vérifier, sans barre imposée
  ctx.setStoryBar((date, i, mini) => {
    const key = `${date}:${i}`, v = mastery(key), n = (know().story[key] || []).length;
    if (mini) return v == null ? '' : `<b class="toc-real" title="Résultat réel aux quiz">✓ ${v} %</b>`;
    return `<div class="real-line"><div class="real-main"><span>📊 Résultat réel aux quiz</span><b>${v == null ? 'pas encore testé' : v + ' %'}</b>${v == null ? '' : `<small>sur ${n} réponse${n > 1 ? 's' : ''}</small>`}</div>
      ${v == null ? '' : `<span class="real-gap" data-real="${v}"></span>`}<button class="m-test" data-start="story:${esc(date)}:${i}">${v == null ? 'Me tester' : 'Retester'}</button></div>`;
  });
  // « Ta prochaine action » de l'accueil : réviser les noms et dates quand il y en a à revoir
  ctx.addAction(() => { const n = memStats().due; return n >= 5 ? { ico: '🧩', title: 'Réviser noms et dates', sub: `${Math.min(n, 10)} questions · 2 min`, start: 'mem' } : null; });

  // Leçon « tester cette info » : questions du jour sur cette info + ses cartes nom/date/chiffre
  ctx.addLesson('story', (key, date, idx) => {
    const day = ctx.DAYS[date], i = +idx, s = day && day.stories[i]; if (!s) return null;
    const map = exMap(date), items = [];
    day.lessons.forEach((l, li) => l.exercises.forEach((ex, ei) => { const id = `day:${date}:${li}:${ei}`; if (map.get(id) === i && ((ex.t === 'qcm' && ex.c.length <= 4) || ex.t === 'vf')) items.push({ ex, id }); }));
    Object.values(mem().cards).filter(c => c.d === date && c.sid === i).forEach(c => { const ex = exOfCard(c); if (ex) items.push({ ex, id: 'mem:' + c.id }); });
    if (!items.length) {   // secours : reconnaître l'info à partir de son résumé
      const first = (plain(s.text).match(/^.*?[.!?](?=\s|$)/) || [plain(s.text)])[0].slice(0, 230);
      const others = shuffle(day.stories.filter((_, j) => j !== i)).slice(0, 3).map(x => x.title);
      if (others.length < 2) return null;
      const ch = shuffle([s.title, ...others]);
      items.push({ ex: { t: 'qcm', q: `Quelle info correspond à ce résumé ? « ${first} »`, c: ch, a: ch.indexOf(s.title), x: `C'était : ${s.title}.` }, id: `auto:${date}:${i}` });
    }
    const pick = shuffle(items).slice(0, 6);
    return { key, mode: 'drill', title: s.title.length > 46 ? s.title.slice(0, 44) + '…' : s.title, color: '#2BA84A', context: 'Tester cette info', exercises: pick.map(p => p.ex), ids: pick.map(p => p.id) };
  });

  // =========================================================== SÉANCE « NOMS, DATES, CHIFFRES »
  ctx.addLesson('mem', key => {
    const due = Object.values(mem().cards).filter(c => c.due <= TODAY);
    const seen = due.filter(c => c.n > 0).sort((a, b) => a.due.localeCompare(b.due)), fresh = shuffle(due.filter(c => c.n === 0)).slice(0, 6);
    const items = [];
    [...seen.slice(0, 8), ...fresh].forEach(c => { const ex = exOfCard(c); if (ex) items.push({ ex, id: 'mem:' + c.id }); });
    if (!items.length) return null;
    const pick = shuffle(items).slice(0, 10);
    return { key, mode: 'drill', title: 'Noms, dates et chiffres', color: '#9D4EDD', context: 'Mémoire de l\'actu', exercises: pick.map(p => p.ex), ids: pick.map(p => p.id) };
  });
  const memStats = () => { const cs = Object.values(mem().cards), quiz = cs.filter(c => distractorsOk(c)); return { total: cs.length, due: quiz.filter(c => c.due <= TODAY).length, mastered: cs.filter(c => c.box >= 4).length }; };
  const distractorsOk = c => { try { return !!distractors(c); } catch (e) { return false; } };
  ctx.addRoute('memoire', () => {
    const st = memStats();
    return `<div class="kicker">Mémoire</div><h1 style="font-size:34px;margin:8px 0 6px">Noms, dates et chiffres</h1>
      <p class="muted">Les infos de l'actu deviennent de vraies questions : un nom, une date ou un chiffre à retrouver. L'app corrige chaque réponse. Ce que tu rates revient le lendemain, ce que tu réussis revient de plus en plus tard.</p>
      <div class="mem-hero"><div class="mem-num"><b>${st.due}</b><span>question${st.due > 1 ? 's' : ''} à réviser aujourd'hui</span></div>
        ${st.due ? `<button class="btn primary" data-start="mem">▶ Réviser</button>` : `<span class="muted">${st.total ? 'Tout est à jour 👏 Reviens demain.' : 'Les questions arrivent avec les éditions.'}</span>`}</div>
      <p class="mem-line">${st.total} carte${st.total > 1 ? 's' : ''} en mémoire · ${st.mastered} bien maîtrisée${st.mastered > 1 ? 's' : ''}</p>
      <p class="muted" style="font-size:13px;margin-top:18px">Astuce : chaque info de l'Actu a sa barre de maîtrise et un bouton « Me tester » pour réviser une seule info.</p>`;
  });

  // =========================================================== RAPPEL (questions des éditions précédentes)
  let prevQs = [];
  ctx.addLesson('rappel', key => {
    if (!prevQs.length) return null;
    const rv = new Set(S().review.map(r => r.id)), rec = S().recall || {};
    const pool = shuffle(prevQs).sort((a, b) => ((rv.has(b.id) ? 2 : 0) - (rv.has(a.id) ? 2 : 0)) + ((rec[a.id] || 0) - (rec[b.id] || 0)) * 0.5).slice(0, 8);
    return { key, mode: 'review', title: 'Rappel des jours précédents', color: '#2BA84A', exercises: pool.map(p => p.ex), ids: pool.map(p => p.id), context: 'Actu des éditions précédentes' };
  });

  // cartes d'entraînement (page « S'entraîner » et sous les quiz de l'actu)
  ctx.addTrainItem(() => {
    const n = memStats().due;
    return n ? { k: 'mem', o: 3, hot: true, ico: '🧩', title: 'Noms, dates et chiffres', sub: `${Math.min(n, 10)} questions à réviser · 2 min`, start: 'mem' }
      : { k: 'mem', o: 3, ico: '🧩', title: 'Noms, dates et chiffres', sub: 'Tout est à jour · reviens demain', href: '#/memoire' };
  });
  ctx.addTrainItem(() => prevQs.length ? { k: 'rappel', o: 4, ico: '🔁', title: 'Rappel des jours passés', sub: '8 questions des éditions précédentes', start: 'rappel' } : null);

  ctx.onReady(async () => {
    const days = await ctx.loadDays(60);
    days.slice().reverse().forEach(absorb);
    prevQs = [];
    days.filter(d => d.date < (ctx.CURRENT || TODAY)).forEach(d => d.lessons.forEach((l, li) => l.exercises.forEach((ex, ei) => {
      if ((ex.t === 'qcm' && ex.c && ex.c.length <= 4) || ex.t === 'vf') prevQs.push({ id: `day:${d.date}:${li}:${ei}`, ex, date: d.date });
    })));
    if (dirty) { ctx.save(); dirty = false; }
    if (!document.body.classList.contains('in-lesson') && !document.body.classList.contains('in-welcome') && /^(#\/(home|memoire))?$/.test(location.hash || '')) ctx.route();
  });
});
