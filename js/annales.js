/* =========================================================
   Scoop — Annales + entraînements aux écrits et aux oraux
   Onglet Prépa « Annales » : épreuves réelles (data/annales.js) + 6 entraînements :
   - synthèse de dépêches, oral d'actualité : bâtis chaque jour sur les infos FACTUELLES et recoupées de l'édition
   - collecte et angle, actualité et créativité, parcours et motivation : sujets des annales du CFJ 2020-2024
   - savoirs de l'oral : questions factuelles sur ce que les jurys ont réellement demandé
   ========================================================= */
(window.SCOOP_MODULES = window.SCOOP_MODULES || []).push(ctx => {
  'use strict';
  const { $, esc, rich, shuffle } = ctx;
  const A = window.SCOOP_ANNALES;
  if (!A) return;
  const plain = s => String(s || '').replace(/\*\*|\*/g, '');
  const nz = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'`\-–—_.,;:!?«»"()]/g, ' ').replace(/\s+/g, ' ').trim();
  const firstSentence = (t, n = 260) => { const x = plain(t), m = x.match(/^.*?[.!?](?=\s|$)/); return (m ? m[0] : x).slice(0, n); };
  const clip = (s, n) => s.length <= n ? s : s.slice(0, n).replace(/\s+\S*$/, '') + '…';
  const sentences = (t, k) => (plain(t).match(/[^.!?]+[.!?]+/g) || [plain(t)]).slice(0, k).join(' ').trim();
  const pick = (a, n) => shuffle(a).slice(0, n);

  // ---------- éléments clés d'une info (chiffres et noms propres) pour le repérage automatique ----------
  const NOPE = new Set('Le La Les Un Une Des Du De Au Aux En Dans Sur Pour Par Avec Sans Selon Lundi Mardi Mercredi Jeudi Vendredi Samedi Dimanche Janvier Février Mars Avril Mai Juin Juillet Août Septembre Octobre Novembre Décembre Cette Ces Son Ses Leur Après Avant Depuis Alors Mais Donc Ainsi Cela Ils Elle Dès Pour Monde Figaro Libération Guardian Times AFP Reuters Franceinfo Selon Parisien Croix Express'.split(' '));
  function keyFacts(s, max = 5) {
    const t = plain(s.text), out = [], seen = new Set();
    const add = (label, test) => { const k = nz(label); if (k && !seen.has(k) && out.length < max) { seen.add(k); out.push({ l: label, test }); } };
    // noms propres d'abord (ce qu'un candidat doit retenir), puis un chiffre significatif (3 chiffres ou une unité)
    const names = t.match(/[A-ZÀÈÉ][\p{L}'’-]{2,}(?:\s+[A-ZÀÈÉ][\p{L}'’-]{2,})*/gu) || [];
    let nNames = 0;
    names.map(x => x.split(/\s+/).filter(w => !NOPE.has(w)).join(' ')).filter(x => x.length >= 4).forEach(name => {
      const last = nz(name).split(' ').pop(); if (last.length < 4 || nNames >= 3) return;
      const before = out.length; add(name, u => u.includes(last)); if (out.length > before) nNames++;
    });
    (t.match(/\d[\d\s  .,]*\d(?:\s?(?:%|millions?|milliards?|euros?|€|dollars?))?|\d(?:\s?(?:%|millions?|milliards?|euros?|€|dollars?))/g) || [])
      .filter(n => n.replace(/\D/g, '').length >= 3 || /%|million|milliard|euro|€|dollar/.test(n)).slice(0, 1)
      .forEach(n => { const d = n.replace(/\D/g, ''); add(`le chiffre « ${n.trim()} »`, u => u.includes(d)); });
    return out;
  }

  // ---------- leçons ----------
  const COL = '#9D4EDD';
  const todayStories = () => { const d = ctx.currentDay(); return d ? d.stories.slice(0, 12) : []; };
  const need = () => todayStories().length >= 3;

  // Synthèse de dépêches : 2 dossiers (une rubrique chacun) tirés de l'édition du jour
  ctx.addLesson('train', (key, kind) => {
    const day = ctx.currentDay(), stories = todayStories();
    const mk = (exs, title, context) => exs.length ? { key, mode: 'drill', title, color: COL, context, exercises: exs } : null;
    if (kind === 'synth') {
      if (!need()) return null;
      const byTag = {}; stories.forEach(s => { (byTag[s.tag] = byTag[s.tag] || []).push(s); });
      let groups = Object.values(byTag).filter(g => g.length >= 2).sort((a, b) => b.length - a.length).slice(0, 2).map(g => g.slice(0, 3));
      if (!groups.length) groups = [stories.slice(0, 3)];
      const exs = groups.map((g, i) => ({
        t: 'write', max: 300,
        q: `🧩 Synthèse de dépêches n°${i + 1} · rubrique ${g[0].tag}`,
        src: `Écris un **titre** (80 signes max) puis un **chapô** de 300 signes maximum qui relie ces dépêches, sans rien ajouter qui n'y figure pas.\n\n` + g.map((s, k) => `**Dépêche ${k + 1} : ${s.title}**\n${plain(s.text)}`).join('\n\n'),
        model: `**Titre :** ${g[0].title}\n**Chapô :** ${g.map(s => clip(firstSentence(s.text, 400), 95)).join(' ')}`,
        crit: ['Le titre est informatif et fait moins de 80 signes', 'Le chapô donne l\'essentiel (qui, quoi, où, quand) en moins de 300 signes', 'Tout ce que tu écris figure dans les dépêches (rien d\'inventé)', 'Les dépêches sont reliées entre elles, pas simplement juxtaposées'],
        facts: g.flatMap(s => keyFacts(s, 2)).slice(0, 6)
      }));
      return mk(exs, 'Synthèse de dépêches', `Édition du jour · ${day ? day.date : ''}`);
    }
    if (kind === 'oral') {
      if (!need()) return null;
      const exs = pick(stories, 5).map(s => ({
        t: 'write',
        q: `🎤 Le jury : « Que pouvez-vous nous dire de cette information : ${s.title} ? »`,
        src: 'Réponds d\'abord à voix haute (2 minutes maximum, dictée possible), puis écris les grandes lignes ici : les faits, le contexte, l\'enjeu, ta source.',
        model: `${sentences(s.text, 4)}${s.why ? ' **Pourquoi c\'est important :** ' + plain(s.why) : ''} (Sources : ${(s.sources || []).map(x => x.name).join(', ') || s.source || '—'}.)`,
        crit: ['Les faits essentiels : qui, quoi, où, quand', 'Le contexte ou l\'enjeu : pourquoi cela compte', 'Ta source, et si l\'info est recoupée', 'Un avis argumenté, distinct des faits'],
        facts: keyFacts(s, 4)
      }));
      return mk(exs, 'Oral d\'actualité', 'Édition du jour');
    }
    if (kind === 'collecte') {
      const MODELS = {
        'Aimer': ['« Aimer à 80 ans : l\'intimité des couples en Ehpad »', 'Comment les résidents vivent-ils l\'amour quand l\'établissement encadre leur intimité ?', 'une directrice d\'Ehpad, deux résidents en couple, un sociologue du vieillissement'],
        'Manger': ['« Cantine à 1 € : ce que mangent vraiment les enfants »', 'Que change la tarification sociale à la cantine pour les familles et pour le menu ?', 'la cuisinière d\'une cantine, un parent, l\'élu chargé des écoles'],
        'Transports': ['« Le bus qui ne passe plus : la vie sans transport en zone rurale »', 'Que devient le quotidien d\'un village quand la ligne de bus est supprimée ?', 'un habitant sans voiture, le maire, le transporteur ou la région'],
        'Territoires': ['« Ici, c\'est chez nous : la fierté d\'un petit village »', 'Qu\'est-ce qui retient les habitants dans un territoire qui perd des services ?', 'un commerçant, le maire, une jeune actrice locale de l\'association du village'],
        'Vieillesse': ['« À 75 ans, il apprend le numérique »', 'Comment les seniors s\'approprient-ils des démarches désormais dématérialisées ?', 'un senior en atelier, l\'animateur, une assistante sociale']
      };
      const exs = pick(A.cfj, 4).map(y => {
        const m = MODELS[y.collecte] || ['« … »', '…', '…'];
        return {
          t: 'write',
          q: `📝 Annale CFJ ${y.year} · Collecte d'informations : « ${y.collecte} »`,
          src: 'Consigne d\'origine : collecter des informations **au contact direct de tes sources** et rédiger 3 500 signes maximum, avec un titre, ton angle (ta question de départ) et tes sources citées. Ici : écris **un titre**, **ton angle** en une phrase et **3 sources** que tu irais interroger.',
          model: `Exemple d'angle (une piste parmi d'autres) : **Titre** ${m[0]} · **Angle** ${m[1]} · **Sources** ${m[2]}.`,
          crit: ['Ton titre est précis et informatif (pas un simple thème)', 'Ton angle est une vraie question de départ, pas un thème général', 'Tes sources sont variées et accessibles (terrain, institution, expert)', 'Tu peux réellement les contacter en quelques jours']
        };
      });
      return mk(exs, 'Collecte et angle', 'Annales CFJ');
    }
    if (kind === 'creat') {
      const HINTS = {
        'Un écolo à l\'Élysée': 'élection au suffrage universel en deux tours, nomination du Premier ministre, majorité à l\'Assemblée nationale',
        'L\'IA accusée d\'homicide': 'responsabilité pénale des personnes (pas des algorithmes), enquête du parquet, règlement européen sur l\'IA',
        'La paix au Proche-Orient': 'les parties, les médiateurs, le rôle de l\'ONU, ce qu\'un accord doit régler (frontières, sécurité, réfugiés)',
        'Les héros des JO': 'Paris 2024 (du 26 juillet au 11 août 2024), les athlètes, les bénévoles, l\'héritage de l\'événement',
        'Internet, le grand black-out': 'câbles sous-marins, centres de données, services essentiels (banques, hôpitaux), plan de crise de l\'État',
        'Le baril à 200 dollars': 'pays producteurs et l\'OPEP+, prix des carburants, inflation, réaction des banques centrales',
        'Xi Jinping fait sa révolution': 'Parti communiste chinois, économie, relations avec les États-Unis et Taïwan',
        'La fermeture des centrales nucléaires en France': 'EDF, mix électrique, emplois locaux, importations d\'électricité, programmation énergétique',
        'La France un an après la prochaine élection présidentielle': 'calendrier électoral, Constitution, ce que le nouveau pouvoir a promis',
        'Internet, le grand black-out ': ''
      };
      const themes = pick(A.cfj.flatMap(y => y.themes.map(t => ({ t, y: y.year }))).filter(x => HINTS[x.t]), 4);
      const exs = themes.map(({ t, y }) => ({
        t: 'write', max: 1200,
        q: `🌍 Annale CFJ ${y} · Connaissance de l'actualité et créativité : « ${t} »`,
        src: `Consigne d'origine : un texte qui, **sans être une production journalistique**, est **ancré dans la réalité** et montre ta compréhension des faits et ta créativité. Ici : écris l'**ouverture** (1 200 signes max). **Faits réels à mobiliser** : ${HINTS[t]}.`,
        model: '**Structure possible :** une scène datée et située (lieu, heure, personnage) ; deux ou trois **faits réels vérifiables** (institution, procédure, acteur) qui rendent la situation crédible ; une réaction vraisemblable des acteurs ; une conséquence concrète pour des gens ordinaires. La fiction se glisse **dans** le réel, jamais contre lui.',
        crit: ['Au moins deux faits réels exacts sont mobilisés (institutions, procédures, acteurs)', 'Le scénario est vraisemblable : aucune règle du réel n\'est violée', 'Il y a une scène concrète (lieu, personnage, détail) et pas seulement un exposé', 'Le style est soigné, sans fautes, avec une accroche']
      }));
      return mk(exs, 'Actualité et créativité', 'Annales CFJ');
    }
    if (kind === 'parcours') {
      const Q = A.cfjQuestions, pool = [...Q.motivation.map(q => ({ q, c: 'm' })), ...Q.personnalite.map(q => ({ q, c: 'p' }))];
      const exs = pick(pool, 6).map(({ q, c }) => ({
        t: 'write',
        q: `📋 Dossier CFJ (2023-2024) · « ${q} »`,
        src: 'Réponds comme dans le dossier en ligne : concret, personnel, avec un exemple précis. Vise 4 à 6 phrases.',
        model: c === 'm'
          ? '**Structure :** 1) ta réponse en une phrase ; 2) une situation précise qui l\'illustre (où, quand, qui) ; 3) ce que tu en as compris ; 4) ce que tu feras de cela dans ton projet de journaliste. Remplace chaque [crochet] par ton vécu : [réponse] · [situation] · [leçon] · [projet].'
          : '**Structure :** 1) un fait, pas un adjectif ; 2) un détail concret et surprenant ; 3) ce que cela dit de toi ; 4) en quoi cela sert le métier de journaliste (curiosité, écoute, rigueur). Remplace [crochets] par ton vécu.',
        crit: ['Ta réponse est personnelle : personne d\'autre ne pourrait l\'écrire', 'Elle contient un exemple précis (fait, lieu, chiffre, nom)', 'Elle est structurée et va à l\'essentiel', 'Elle montre ce qui fait de toi un·e futur·e journaliste']
      }));
      return mk(exs, 'Parcours et motivation', 'Annales CFJ');
    }
    if (kind === 'savoirs') {
      const exs = [
        { t: 'qcm', q: 'Quel journal a révélé le scandale du Watergate (question rapportée à l\'oral du CUEJ) ?', c: ['The Washington Post', 'The New York Times', 'The Wall Street Journal', 'Los Angeles Times'], a: 0, x: 'Les journalistes **Bob Woodward et Carl Bernstein**, du Washington Post, ont enquêté sur le cambriolage de 1972.' },
        { t: 'qcm', q: 'Quel président américain a démissionné à cause du Watergate ?', c: ['Richard Nixon', 'Gerald Ford', 'Lyndon Johnson', 'Jimmy Carter'], a: 0, x: '**Richard Nixon** a démissionné le 9 août 1974, avant une probable destitution.' },
        { t: 'qcm', q: 'Quel journal a commencé à publier les « Pentagon Papers » en 1971 ?', c: ['The New York Times', 'The Washington Post', 'Le Monde', 'The Guardian'], a: 0, x: 'Le **New York Times** a publié les premiers extraits en juin 1971 ; la Cour suprême a ensuite protégé la publication.' },
        { t: 'vf', q: 'La Charte de Munich, texte de référence sur les devoirs et droits des journalistes, date de 1971.', a: true, x: 'Elle a été adoptée à **Munich en novembre 1971**.' },
        { t: 'qcm', q: 'En quelle année a été votée la grande loi française sur la liberté de la presse ?', c: ['1881', '1789', '1944', '1986'], a: 0, x: 'La **loi du 29 juillet 1881** fonde la liberté de la presse, avec ses limites (diffamation, injure).' },
        { t: 'qcm', q: 'Que signifie LCP, chaîne citée dans une question piège posée à l\'oral de l\'ESJ Lille ?', c: ['La Chaîne parlementaire', 'La Chaîne publique', 'La Chaîne de la presse', 'La Chaîne du Parlement européen'], a: 0, x: '**LCP** est la chaîne parlementaire (LCP-Assemblée nationale). La question testait l\'indépendance : peut-on être journaliste pour une institution ?' },
        { t: 'match', q: 'Associe chaque notion de déontologie à sa définition', pairs: [['Objectivité', 'Rendre compte des faits sans les déformer'], ['Impartialité', 'Ne favoriser aucun camp'], ['Pluralisme', 'Faire entendre des points de vue variés'], ['Recoupement', 'Confirmer une info par plusieurs sources indépendantes']], x: 'Distinguer ces notions est la base de la question « un journaliste doit-il être neutre ? » (IJBA, 2016).' },
        { t: 'qcm', q: 'Qu\'est-ce qu\'une source primaire ?', c: ['Le document ou l\'acteur d\'origine (décision, texte, communiqué, données)', 'L\'article le plus lu sur le sujet', 'Le premier média à avoir publié l\'info', 'Une source qui a demandé l\'anonymat'], a: 0, x: 'Un article qui commente un document est une **source secondaire**.' }
      ];
      return mk(shuffle(exs).slice(0, 7), 'Savoirs de l\'oral', 'Questions réellement posées');
    }
    return null;
  });

  // ---------- onglet « Annales » ----------
  const link = s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)} ↗</a>`;
  function view() {
    const ok = need();
    const tests = [
      ['synth', '🧩', 'Synthèse de dépêches', 'titre et chapô sur les infos du jour, avec repérage des faits clés', true],
      ['oral', '🎤', 'Oral d\'actualité', '5 infos du jour à restituer comme devant le jury', true],
      ['collecte', '📝', 'Collecte et angle', 'sujets des annales CFJ : Aimer, Manger, Transports…', false],
      ['creat', '🌍', 'Actualité et créativité', 'textes ancrés dans le réel (annales CFJ)', false],
      ['parcours', '📋', 'Parcours et motivation', 'les vraies questions du dossier CFJ', false],
      ['savoirs', '🧠', 'Savoirs de l\'oral', 'Watergate, Charte de Munich, déontologie…', false]
    ];
    return `<div class="card an-intro"><h3>📚 Les annales et les entraînements</h3>
        <p>Les consignes viennent des <b>annales publiques du CFJ (2020-2024)</b> et des épreuves publiées par les écoles. Les entraînements « du jour » sont bâtis sur les <b>infos factuelles et recoupées</b> de l'édition : tu travailles sur du réel, pas sur du vent.</p></div>
      <div class="an-tests">${tests.map(([k, ico, t, d, daily]) => `<button class="an-test" data-start="train:${k}" ${daily && !ok ? 'disabled' : ''}><span class="an-ico">${ico}</span><span><b>${t}</b>${daily ? ' <small class="an-daily">du jour</small>' : ''}<br><small>${d}</small></span><span class="an-go">▶</span></button>`).join('')}</div>
      <h3 class="cc-h">📅 CFJ : les sujets d'admissibilité, de 2020 à 2024</h3>
      <p class="muted" style="font-size:13px">Collecte d'informations (3 500 signes, au contact de tes sources) puis texte « actualité et créativité » sur l'un de 4 thèmes. <a href="${esc(A.cfjPdf)}" target="_blank" rel="noopener">PDF du CFJ ↗</a></p>
      <div class="an-years">${A.cfj.map(y => `<div class="card an-year"><div class="an-y">${y.year}</div><div><div class="an-c">Collecte : <b>« ${esc(y.collecte)} »</b></div><ul>${y.themes.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div></div>`).join('')}</div>
      <h3 class="cc-h">🧾 Les épreuves, école par école</h3>
      ${A.formats.map(f => `<details class="card p-guide"><summary><span class="p-gico">🏫</span>${esc(f.school)}</summary><ul>${f.points.map(p => `<li>${rich(p)}</li>`).join('')}</ul><div class="p-src">Source : ${link(f.source)}</div></details>`).join('')}
      <h3 class="cc-h">🎙️ Ce que les jurys ont réellement demandé</h3>
      <div class="list">${A.oralReported.map(o => `<div class="card p-voice"><div class="p-vwho">${esc(o.school)} · ${o.year}</div><p style="margin-top:6px;font-size:14px">${esc(o.q)}</p></div>`).join('')}</div>
      <div class="p-src" style="margin-top:8px">Sources : ${A.oralSources.map(link).join(' · ')}</div>
      <details class="card p-guide" style="margin-top:16px"><summary><span class="p-gico">❓</span>Les 16 questions du dossier CFJ (2023-2024)</summary>
        <ul>${[...A.cfjQuestions.motivation, ...A.cfjQuestions.personnalite].map(q => `<li>${esc(q)}</li>`).join('')}</ul><div class="p-src">Source : <a href="${esc(A.cfjPdf)}" target="_blank" rel="noopener">annales CFJ ↗</a></div></details>
      <p class="muted" style="font-size:12.5px;margin-top:14px">Les annales complètes des autres écoles ne sont pas toujours publiques : demande-les à l'école ou à des candidats des années précédentes. Mise à jour : ${esc(A.updated)}.</p>`;
  }
  ctx.addPrepaTab('annales', '📚', 'Annales', view, 'ecoles');
});
