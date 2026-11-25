/* =========================================================
   Scoop — Atelier d'écriture journalistique : titre, chapô, attaque, brève, pyramide, angle, style
   Chaque série mélange :
   - des exercices de règles (QCM, vrai/faux, association, ordre) rédigés pour Scoop (exemples FICTIFS, signalés),
   - des exercices « du jour » bâtis sur les infos factuelles et recoupées de l'édition, avec repérage des faits clés.
   ========================================================= */
(window.SCOOP_MODULES = window.SCOOP_MODULES || []).push(ctx => {
  'use strict';
  const { esc, rich, shuffle } = ctx;
  const H = ctx.helpers;
  if (!H) return;
  const { keyFacts, firstSentence, clip, plain } = H;
  const pick = (a, n) => shuffle(a).slice(0, n);
  const COL = '#E63946';
  const stories = () => { const d = ctx.currentDay(); return d ? d.stories.slice(0, 12) : []; };
  const sents = t => (plain(t).match(/[^.!?]+[.!?]+/g) || [plain(t)]).map(s => s.trim()).filter(Boolean);

  // ------------------------------------------------------------------ règles (exemples fictifs)
  const RULES = {
    chapo: [
      { t: 'qcm', q: 'Qu\'est-ce que le chapô d\'un article ?', c: ['Le court texte placé sous le titre, qui donne l\'essentiel ou l\'angle', 'La dernière phrase de l\'article', 'La légende de la photo', 'La signature du journaliste'], a: 0, x: 'Le **chapô** (ou chapeau) introduit l\'article : en 1 à 3 phrases, il donne l\'essentiel ou donne envie de lire.' },
      { t: 'qcm', q: 'Que doit contenir en priorité un chapô d\'information ?', c: ['L\'essentiel : qui, quoi, où, quand', 'Une opinion personnelle', 'Une citation longue', 'Le plan de l\'article'], a: 0, x: 'En information, le chapô répond aux questions de base : **qui, quoi, où, quand** (et si possible pourquoi).' },
      { t: 'vf', q: 'Un bon chapô répète mot pour mot le titre.', a: false, x: 'Le chapô **complète** le titre : il ajoute des précisions, il ne le recopie pas.' },
      { t: 'vf', q: 'Un chapô d\'information tient généralement en deux ou trois lignes, soit environ 200 à 300 signes.', a: true, x: 'Ordre de grandeur courant : concis, une à trois phrases. Chaque école ou média impose sa limite exacte.' },
      { t: 'qcm', q: 'Parmi ces chapôs (exemples fictifs), lequel est le meilleur pour une information ?', c: ['Le conseil municipal de Valmont a voté mardi la fermeture de l\'école du hameau, à la rentrée 2027, malgré la mobilisation de 200 parents.', 'Une décision très importante a été prise ce mardi, et elle va faire beaucoup parler dans la commune.', 'Valmont : on vous explique tout ce qu\'il faut savoir sur le conseil municipal.', 'Pourquoi les élus de Valmont ont-ils fait cela ? La réponse va vous surprendre.'], a: 0, x: 'Le premier est précis (qui, quoi, quand, où, combien). Les autres sont vagues ou accrocheurs sans information.' },
      { t: 'order', q: 'Remets ces éléments dans l\'ordre d\'un article d\'information (exemple fictif)', items: ['Titre : Valmont ferme son école du hameau', 'Chapô : le conseil municipal a voté mardi la fermeture, malgré 200 parents mobilisés', 'Attaque : mardi soir, la salle du conseil était pleine', 'Détails, citations et contexte', 'Chute ou prolongement'], x: 'Titre, chapô, attaque, corps de l\'article (du plus important au moins important), puis chute.' }
    ],
    attaque: [
      { t: 'qcm', q: 'Qu\'est-ce que l\'attaque d\'un article ?', c: ['Sa première phrase, celle qui accroche et lance le sujet', 'Une critique violente du sujet', 'Son titre', 'Son dernier paragraphe'], a: 0, x: 'L\'**attaque** (ou « lead ») est la phrase d\'ouverture : elle doit donner envie de poursuivre.' },
      { t: 'match', q: 'Associe chaque type d\'attaque à son exemple (exemples fictifs)', pairs: [['Attaque factuelle', 'Le Parlement a adopté mardi soir le budget, par 312 voix contre 241.'], ['Attaque en scène', 'À Valmont, 312 habitants, la dernière boulangerie baissera le rideau vendredi.'], ['Attaque par citation', '« On a tout perdu en dix minutes », souffle Léa, devant sa maison inondée.'], ['Attaque par contraste', 'Ils étaient 4 000 il y a dix ans. Ils sont 600 aujourd\'hui.']], x: 'Choisis l\'attaque selon le sujet : factuelle pour l\'info chaude, en scène ou par citation pour le reportage.' },
      { t: 'qcm', q: 'Pour une brève d\'actualité chaude (un vote, un accident, un résultat), quelle attaque est la plus adaptée ?', c: ['L\'attaque factuelle, directe', 'Une longue description de décor', 'Une question au lecteur', 'Une citation sans contexte'], a: 0, x: 'L\'info chaude se livre **tout de suite** : on va à l\'essentiel dans la première phrase.' },
      { t: 'vf', q: 'Commencer son article par une question au lecteur est toujours le meilleur choix.', a: false, x: 'La question d\'attaque est souvent artificielle. Un fait précis ou une scène accroche mieux.' },
      { t: 'qcm', q: 'Quelle attaque est la plus efficace pour un reportage (exemple fictif) ?', c: ['Il est 5 h à la criée de Port-Sud. Marc compte les caisses vides en silence.', 'La pêche est un secteur qui connaît actuellement de grandes difficultés.', 'Beaucoup de choses ont changé dans la pêche ces dernières années.', 'La pêche, un métier d\'avenir ? Pas si sûr.'], a: 0, x: 'Une scène concrète (heure, lieu, personnage, geste) vaut mieux qu\'une généralité.' },
      { t: 'vf', q: 'Dans une attaque, il vaut mieux préférer des détails concrets (lieu, chiffre, geste) à des adjectifs généraux.', a: true, x: '« Montrer » plutôt que « dire » : le concret crédibilise et accroche.' }
    ],
    titre: [
      { t: 'qcm', q: 'Quel titre est le meilleur pour une information (exemple fictif) ?', c: ['Valmont : le conseil vote la fermeture de l\'école du hameau', 'Une décision qui fait polémique', 'École : ce qui s\'est passé hier va vous étonner', 'Fermeture ?'], a: 0, x: 'Un bon titre est **informatif** : il dit quoi, où, avec un verbe. Les autres sont vagues ou racoleurs.' },
      { t: 'vf', q: 'En presse d\'information, un titre contient en général un verbe conjugué.', a: true, x: 'Le verbe donne l\'action et rend le titre clair (ex. « Le conseil vote… »).' },
      { t: 'vf', q: 'Un titre doit promettre quelque chose que l\'article ne contient pas, pour faire cliquer.', a: false, x: 'C\'est du « piège à clics » : contraire à la déontologie (le titre doit refléter le contenu).' },
      { t: 'qcm', q: 'Quelle est la longueur courante d\'un titre d\'information ?', c: ['Courte : souvent moins de 80 signes', 'Au moins 200 signes', 'Un seul mot', 'Une page entière'], a: 0, x: 'Ordre de grandeur : court et lisible. Chaque média a ses règles précises.' },
      { t: 'match', q: 'Associe chaque défaut à son exemple de titre (fictifs)', pairs: [['Trop vague', 'Une décision importante a été prise'], ['Racoleur', 'Ce que le maire a fait va vous choquer'], ['Trop long', 'Le conseil municipal de la commune de Valmont a décidé à la majorité de ses membres lors de la séance de mardi de fermer'], ['Bon titre', 'Valmont ferme l\'école du hameau à la rentrée 2027']], x: 'Un titre doit être précis, honnête, concis.' }
    ],
    breve: [
      { t: 'qcm', q: 'Quelles questions doit couvrir une brève d\'information ?', c: ['Qui, quoi, où, quand (et pourquoi, comment)', 'Seulement « pourquoi »', 'Uniquement l\'avis des témoins', 'Le parcours du journaliste'], a: 0, x: 'La règle des **5 W** (Who, What, Where, When, Why) : l\'essentiel en quelques lignes.' },
      { t: 'vf', q: 'Dans une brève, on place l\'information la plus importante au début.', a: true, x: 'C\'est la **pyramide inversée** : l\'essentiel d\'abord, les détails ensuite. Le lecteur ou l\'éditeur peut couper la fin.' },
      { t: 'qcm', q: 'Pourquoi écrit-on en pyramide inversée ?', c: ['Pour que l\'essentiel soit lu même si l\'article est coupé', 'Pour faire plus long', 'Pour cacher la conclusion', 'Pour suivre l\'ordre chronologique'], a: 0, x: 'On classe par **importance décroissante**, pas par chronologie.' },
      { t: 'vf', q: 'Une brève doit contenir l\'opinion du journaliste.', a: false, x: 'Une brève rapporte des **faits** vérifiés, attribués à leurs sources, sans commentaire.' }
    ],
    angle: [
      { t: 'match', q: 'Associe chaque sujet à un angle précis (exemples fictifs)', pairs: [['La cantine scolaire', 'Que change la cantine à 1 € pour les familles d\'un quartier ?'], ['Les transports', 'Que devient un village quand le dernier bus est supprimé ?'], ['La vieillesse', 'Comment des seniors apprennent-ils les démarches en ligne ?'], ['Le sport amateur', 'Comment un club de village survit-il sans bénévoles ?']], x: 'Un **sujet** est large ; un **angle** est une question précise à laquelle l\'article répond.' },
      { t: 'qcm', q: 'Qu\'est-ce qu\'un angle journalistique ?', c: ['La question précise à laquelle l\'article va répondre', 'Le thème général', 'La photo choisie', 'La longueur de l\'article'], a: 0, x: 'L\'angle, c\'est le **point de vue choisi** sur un sujet, formulé comme une question de départ.' },
      { t: 'vf', q: '« Le chômage » est un angle.', a: false, x: 'C\'est un **sujet**. « Pourquoi les jeunes diplômés de Valmont mettent-ils un an à trouver un emploi ? » serait un angle (exemple fictif).' }
    ],
    style: [
      { t: 'qcm', q: 'Quelle phrase respecte le mieux la neutralité d\'une information ? (exemples fictifs)', c: ['Le maire a annoncé la fermeture de l\'école, selon la mairie.', 'Le maire a honteusement sacrifié l\'école.', 'Le maire, comme toujours, n\'a écouté personne.', 'Une fermeture scandaleuse a eu lieu.'], a: 0, x: 'On rapporte un fait **attribué à sa source**, sans adjectif de jugement.' },
      { t: 'vf', q: 'Il faut toujours attribuer une affirmation contestable à sa source (« selon… », « d\'après… »).', a: true, x: 'L\'attribution protège le journaliste et informe le lecteur sur l\'origine de l\'information.' },
      { t: 'qcm', q: 'Laquelle de ces phrases est un cliché à éviter ?', c: ['« Une page se tourne »', '« Le maire a annoncé sa démission mardi »', '« 312 voix contre 241 »', '« Selon la préfecture »'], a: 0, x: 'Les formules toutes faites (« une page se tourne », « sans précédent ») sonnent creux : privilégie le fait précis.' },
      { t: 'qcm', q: 'Quelle phrase est la mieux écrite ? (exemples fictifs)', c: ['Le conseil a voté la fermeture mardi.', 'La fermeture a été votée par le conseil mardi.', 'Il a été procédé mardi, par le conseil, au vote de la fermeture.', 'Mardi a eu lieu le vote de la fermeture par le conseil.'], a: 0, x: 'Préfère la **voix active** et la phrase courte : sujet, verbe, complément.' },
      { t: 'vf', q: 'On met un chiffre précis plutôt que « beaucoup » ou « de nombreux » quand on le connaît.', a: true, x: 'Le chiffre précis (et sa source) est plus fiable et plus convaincant.' }
    ]
  };

  // ------------------------------------------------------------------ exercices « du jour »
  const dailyChapo = s => ({ t: 'write', max: 300, q: `✍️ Chapô · « ${s.title} »`, src: 'Voici la dépêche. Rédige un **chapô** (300 signes maximum) : l\'essentiel (qui, quoi, où, quand), sans recopier le titre.\n\n' + plain(s.text),
    model: `**Chapô possible :** ${clip(sents(s.text).slice(0, 2).join(' '), 295)}`, crit: ['Il donne l\'essentiel (qui, quoi, où, quand)', 'Il fait moins de 300 signes', 'Il ne recopie pas le titre', 'Tout ce qui est écrit figure dans la dépêche'], facts: keyFacts(s, 4) });
  const dailyTitre = s => ({ t: 'write', max: 80, q: '🏷️ Titre : trouve le meilleur titre', src: 'Dépêche :\n\n' + plain(s.text) + '\n\nÉcris un **titre informatif** de 80 signes maximum, avec un verbe.',
    model: `**Titre de la rédaction :** ${s.title}`, crit: ['Il est informatif (on comprend le fait)', 'Il contient un verbe et reste sous 80 signes', 'Il ne promet rien que le texte ne donne pas', 'Il évite les adjectifs de jugement'], facts: keyFacts(s, 3) });
  const dailyAttaque = s => ({ t: 'write', max: 280, q: `🎯 Attaque · « ${s.title} »`, src: 'Dépêche :\n\n' + plain(s.text) + '\n\nRédige l\'**attaque** de l\'article (la première phrase, ou deux), 280 signes maximum. Pour une info chaude, va droit au fait.',
    model: `**Attaque factuelle possible :** ${firstSentence(s.text, 260)}`, crit: ['Elle donne le fait principal d\'emblée', 'Elle est concrète (nom, lieu, chiffre)', 'Elle tient en une ou deux phrases courtes', 'Elle n\'invente rien'], facts: keyFacts(s, 3) });
  const dailyBreve = s => ({ t: 'write', max: 600, q: `📰 Brève · « ${s.title} »`, src: 'Notes du reporter :\n\n' + sents(s.text).map(x => '• ' + x).join('\n') + '\n\nRédige une **brève** de 600 signes maximum, en **pyramide inversée** : l\'essentiel d\'abord, puis le contexte.',
    model: `**Brève possible :** ${clip(sents(s.text).slice(0, 4).join(' '), 590)}`, crit: ['L\'essentiel est dans la première phrase', 'Les faits sont dans l\'ordre d\'importance, pas chronologique', 'Les affirmations sont attribuées à leurs sources', 'Aucun jugement personnel, rien d\'inventé'], facts: keyFacts(s, 5) });
  const dailyPyramide = s => { const x = sents(s.text); if (x.length < 4) return null; const items = x.slice(0, 4).map(v => clip(v, 150)); return { t: 'order', q: `🔺 Pyramide inversée : remets les phrases de la dépêche « ${clip(s.title, 60)} » dans le bon ordre`, items, x: 'Dans une dépêche, la **première phrase** donne l\'essentiel ; les suivantes précisent le contexte et les détails.' }; };

  const dailyResume = s => ({ t: 'write', max: 250, q: `📝 Résumé · « ${clip(s.title, 70)} »`, src: plain(s.text) + '\n\nRésume cette dépêche en **deux phrases** (250 signes maximum) pour un lecteur pressé : le fait, puis ce qu\'il faut en retenir.',
    model: `**Résumé possible :** ${clip(sents(s.text).slice(0, 2).join(' '), 245)}`, crit: ['Le fait principal est dans la première phrase', 'Il fait deux phrases et moins de 250 signes', 'Chaque élément figure dans la dépêche', 'Je n\'ai recopié aucune phrase telle quelle'], facts: keyFacts(s, 4) });
  const dailyQuestions = s => ({ t: 'write', q: `🎙️ Les bonnes questions · « ${clip(s.title, 70)} »`, src: plain(s.text) + '\n\nTu dois interviewer la personne la mieux placée pour en parler. Écris **3 questions** ouvertes (pas de réponse par oui ou non), de la plus factuelle à la plus incisive.',
    model: '**Pistes :** « Que s\'est-il passé exactement, et depuis quand ? » · « Qui est concerné concrètement, et combien de personnes ? » · « Qu\'est-ce qui pourrait changer dans les prochains mois, et pour qui ? »', crit: ['Mes 3 questions sont ouvertes (« comment », « pourquoi », « qu\'est-ce que »)', 'Elles vont du factuel vers le plus incisif', 'Aucune ne contient déjà la réponse ni un jugement', 'Elles portent sur cette info, pas sur le sujet en général'] });
  const dailyAngle = s => ({ t: 'write', q: `🧭 Trouve un angle · « ${clip(s.title, 70)} »`, src: plain(s.text) + '\n\nLe sujet est posé. Propose **un angle** de reportage sous forme de question précise, puis dis en une phrase qui tu irais voir.',
    model: '**Exemple de démarche :** partir du fait, choisir une personne ou un lieu touché concrètement, et formuler une question à laquelle le reportage répond (par exemple « Que change ce fait pour les habitants d\'une commune précise ? »).', crit: ['Mon angle est une question précise, pas un thème', 'Il s\'appuie sur un fait de la dépêche', 'Je sais qui je verrais ou où j\'irais', 'Il apporte quelque chose que la dépêche ne dit pas'] });

  // exercice d'écriture ajouté automatiquement à chaque leçon du jour (format et info tirés au hasard ; les « Flash » portent sur les infos ajoutées)
  ctx.setDayWriter((day, li) => {
    let pool = (day.stories || []).map((s, i) => ({ s, i }));
    if (li >= 3) { const u = (day.updates || [])[li - 3]; if (u && Array.isArray(u.stories)) pool = pool.filter(x => u.stories.includes(x.i)); }
    if (!pool.length) return [];
    const f = pick([dailyTitre, dailyChapo, dailyAttaque, dailyBreve, dailyResume, dailyQuestions, dailyAngle], 1)[0];
    return [f(pick(pool, 1)[0].s)];
  });

  const need = () => stories().length >= 3;
  const build = (key, title, rules, dailies, n = 3) => {
    const ss = stories(), exs = [...pick(RULES[rules[0]].concat(rules[1] ? RULES[rules[1]] : []), 5)];
    if (need()) dailies.forEach(f => pick(ss, n).forEach(s => { const e = f(s); if (e) exs.push(e); }));
    return { key, mode: 'drill', title, color: COL, context: 'Atelier d\'écriture', exercises: exs };
  };

  ctx.addLesson('ecr', (key, kind) => {
    if (kind === 'chapo') return build(key, 'Le chapô', ['chapo'], [dailyChapo], 3);
    if (kind === 'attaque') return build(key, 'L\'attaque', ['attaque'], [dailyAttaque], 3);
    if (kind === 'titre') return build(key, 'Le titre', ['titre'], [dailyTitre], 3);
    if (kind === 'breve') return build(key, 'La brève et la pyramide inversée', ['breve'], [dailyBreve, dailyPyramide], 2);
    if (kind === 'resume') return build(key, 'Résumer en deux phrases', ['breve'], [dailyResume], 4);
    if (kind === 'questions') return build(key, 'Les bonnes questions', ['angle'], [dailyQuestions, dailyAngle], 2);
    if (kind === 'angle') return { key, mode: 'drill', title: 'Sujet et angle', color: COL, context: 'Atelier d\'écriture', exercises: pick(RULES.angle, 3).concat(pick(RULES.style, 3)) };
    if (kind === 'style') return { key, mode: 'drill', title: 'Style et neutralité', color: COL, context: 'Atelier d\'écriture', exercises: pick(RULES.style, 5).concat(pick(RULES.angle, 1)) };
    if (kind === 'complet') {   // une info, tous les formats : l'épreuve type « rédige titre, chapô et attaque »
      const s = stories()[0]; if (!s) return null;
      return { key, mode: 'drill', title: 'Titre + chapô + attaque', color: COL, context: 'Atelier d\'écriture', exercises: [dailyTitre(s), dailyChapo(s), dailyAttaque(s), dailyBreve(s)] };
    }
    return null;
  });

  const ITEMS = [
    ['titre', '🏷️', 'Le titre', 'informatif, court, honnête', true], ['chapo', '✍️', 'Le chapô', 'l\'essentiel en 300 signes', true],
    ['attaque', '🎯', 'L\'attaque', 'la phrase qui accroche', true], ['breve', '📰', 'Brève et pyramide inversée', 'l\'essentiel d\'abord', true],
    ['complet', '🧩', 'Titre + chapô + attaque + brève', 'la même info, tous les formats', true], ['angle', '🧭', 'Sujet et angle', 'une question, pas un thème', false],
    ['resume', '📝', 'Résumer une dépêche', 'deux phrases pour un lecteur pressé', true], ['questions', '🎙️', 'Les bonnes questions et l\'angle', 'interviewer, choisir son angle', true],
    ['style', '🖋️', 'Style et neutralité', 'attribuer, être précis, éviter les clichés', false]
  ];
  ctx.addPrepaTab('ecriture', '✍️', 'Écriture', () => `<div class="card an-intro"><h3>✍️ L'atelier d'écriture journalistique</h3>
      <p>Titre, chapô, attaque, brève, angle, style : des séries de <b>règles</b> (exemples fictifs signalés) et des exercices <b>du jour</b> sur les infos factuelles de l'édition, avec compteur de signes et repérage des faits clés. Tu gagnes des XP comme pour les leçons.</p></div>
    <div class="an-tests">${ITEMS.map(([k, ico, t, d, daily]) => `<button class="an-test" data-start="ecr:${k}" ${daily && !need() ? 'disabled' : ''}><span class="an-ico">${ico}</span><span><b>${t}</b>${daily ? ' <small class="an-daily">du jour</small>' : ''}<br><small>${d}</small></span><span class="an-go">▶</span></button>`).join('')}</div>
    <details class="card p-guide" style="margin-top:14px" open><summary><span class="p-gico">📌</span>Le mémo en 6 lignes</summary><ul>
      <li>**Titre** : informatif, avec un verbe, court (souvent moins de 80 signes), sans promesse mensongère.</li>
      <li>**Chapô** : 1 à 3 phrases (environ 200 à 300 signes) qui donnent l'essentiel : qui, quoi, où, quand. Il complète le titre, il ne le répète pas.</li>
      <li>**Attaque** : la première phrase. Info chaude : le fait. Reportage : une scène ou une citation concrète.</li>
      <li>**Pyramide inversée** : l'essentiel d'abord, puis le contexte, puis les détails. Jamais dans l'ordre chronologique par défaut.</li>
      <li>**Angle** : une question précise, pas un thème. « La cantine » est un sujet ; « Que change la cantine à 1 € pour les familles ? » est un angle (exemple fictif).</li>
      <li>**Style** : phrases courtes à la voix active, faits attribués (« selon… »), chiffres précis, pas d'adjectifs de jugement ni de clichés.</li></ul></details>`, 'annales');
});
