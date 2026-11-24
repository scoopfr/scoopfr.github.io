/* =========================================================
   Scoop — JURY AUTOMATIQUE (gratuit, hors ligne, sans clé ni compte)
   Un moteur à règles qui reproduit le déroulé d'un vrai oral de concours :
   questions dans l'ordre d'un entretien, trois jurés, relances selon ta réponse
   (réponse trop courte, pas d'exemple, mot-clé repéré…), gestion du temps, clôture,
   puis bilan chiffré avec réponses attendues.
   Il n'« comprend » pas le sens comme une IA : il repère des éléments attendus (mots-clés,
   exemples concrets, structure, longueur). C'est un entraîneur honnête, pas un oracle.
   ========================================================= */
(window.SCOOP_MODULES = window.SCOOP_MODULES || []).push(ctx => {
  'use strict';
  const JURY = [
    { who: 'Claire Marchand', role: 'rédactrice en cheffe, présidente du jury' },
    { who: 'Karim Benali', role: 'enseignant, ancien grand reporter' },
    { who: 'Hélène Rousseau', role: 'journaliste radio, ancienne élève de l\'école' }
  ];
  // normalisation : minuscules, sans accents (toutes les expressions ci-dessous sont écrites sans accents)
  const nz = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’`]/g, '\'');
  const plain = s => String(s || '').replace(/\*\*|\*/g, '');
  const words = t => (String(t).trim().match(/\S+/g) || []).length;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const STOP = new Set('dans pour avec sans sous chez apres avant cette ces leur leurs plus moins entre contre vers selon depuis encore deja alors aussi tres tout tous elle elles nous vous sont etre fait mais comme donc quand'.split(' '));
  const stems = s => [...new Set(nz(s).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length >= 5 && !STOP.has(w)).map(w => w.slice(0, 6)))];

  // ------------------------------------------------------------------ banque de questions
  // keys : éléments attendus (rx sur texte normalisé) ; f : relance si l'élément manque
  const BANK = {
    intro: { who: 0, min: 40, say: c => `Bonjour${c.name ? ' ' + c.name : ''}, installez-vous. Nous avons environ ${c.minutes} minutes ensemble. Pour commencer, pouvez-vous vous présenter : votre parcours, et ce qui vous amène devant nous aujourd'hui ?`,
      keys: [{ l: 'ton parcours (études, expériences)', rx: /etud|licence|bac|master|formation|parcours|j'ai (fait|suivi|etudie)|diplom/ }, { l: 'ton lien avec le journalisme', rx: /journalis|reporter|media|presse|radio|ecrire|ecriture|actualite|information/ }, { l: 'une expérience concrète', rx: /stage|radio|journal|blog|reportage|association|benevol|podcast|video|article|service civique/, f: 'Vous évoquez votre parcours : quelle expérience concrète vous a le plus appris ?' }],
      model: 'Je m\'appelle [prénom], j\'ai [âge] ans et j\'ai fait [études]. Ce qui m\'a conduit vers le journalisme, c\'est [expérience concrète : radio étudiante, stage, reportage…]. J\'y ai appris [compétence]. Aujourd\'hui je veux [projet] et c\'est pour cela que je suis devant vous.' },
    motiv: { who: 0, min: 50, say: () => pick(['Pourquoi voulez-vous devenir journaliste ?', 'Qu\'est-ce qui vous donne envie de faire ce métier, précisément ?']),
      keys: [{ l: 'un déclic ou une expérience précise', rx: /declic|rencontre|un jour|j'ai (decouvert|compris|realise)|a ce moment|reportage|premiere fois|experience/, f: 'Y a-t-il eu un moment précis, un déclic, qui vous a fait choisir ce métier ?' }, { l: 'ce que tu veux apporter', rx: /apporter|informer|expliquer|donner la parole|comprendre|verifier|utile|public|citoyen|democrat|enquete|raconter/, f: 'Et concrètement, qu\'est-ce que vous voudriez apporter au public ?' }, { l: 'une action déjà menée', rx: /stage|radio|journal|blog|article|podcast|video|association|j'ai (ecrit|realise|couvert|interview)/ }],
      cliche: /(depuis (toujours|tout petit|l'enfance|mon plus jeune age))|(j'ai toujours (voulu|aime|reve))|(passion(ne)? (de|pour) l'ecriture)/,
      model: 'Mon déclic, c\'est [moment précis : un reportage vu, une rencontre, un événement que j\'ai couvert]. J\'ai compris que [ce que le journalisme permet]. Depuis, j\'ai [action concrète : stage, radio, journal]. Ce que je veux apporter, c\'est [apport précis au public].' },
    projet: { who: 0, min: 45, say: () => pick(['Quel journalisme voulez-vous pratiquer ?', 'Dans quel type de journalisme vous projetez-vous, et pourquoi celui-là ?']),
      keys: [{ l: 'un type de journalisme précis', rx: /local|regional|international|enquete|data|donnees|radio|audio|video|reportage|presse ecrite|television|numerique|investigation|sport|culture|politique|economie|environnement|societe/, f: 'Vous restez général : quel type de journalisme, précisément ?' }, { l: 'un média ou un travail qui t\'inspire', rx: /le monde|liberation|franceinfo|france inter|mediapart|arte|brut|hugo|envoye special|complement d'enquete|the guardian|new york times|ouest-france|revue xxi|le figaro|l'equipe|rfi|france 24|bbc|bfm|cnews|le parisien/, f: 'Un média ou un journaliste vous inspire-t-il dans ce domaine ? Lequel, et pourquoi ?' }, { l: 'pourquoi ce choix', rx: /parce que|car |c'est pourquoi|ce qui m'attire|ce qui me plait|raison/ }],
      model: 'Je veux faire [type précis : reportage de terrain, journalisme audio, data…]. Je m\'inspire de [média / journaliste précis] pour [ce que j\'admire : méthode, angle, format]. Ce choix vient de [expérience personnelle]. À terme, je me vois [rôle].' },
    terrain: { who: 2, min: 60, say: () => pick(['Racontez-nous une expérience de terrain dont vous êtes fier·e.', 'Parlez-nous d\'une situation où vous avez dû vous débrouiller, au contact des gens, pour obtenir une information ou réaliser un projet.']),
      keys: [{ l: 'une situation claire (où, quand, quoi)', rx: /\d|lors|un jour|pendant|durant|en (janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)|l'annee derniere|cet ete/ }, { l: 'ton action personnelle', rx: /j'ai (decide|propose|contacte|interview|organise|ecrit|monte|realise|appele|contacte|couvert|mene)|mon role|ma mission/, f: 'Quel a été précisément votre rôle dans cette histoire ?' }, { l: 'le résultat et ce que tu en as appris', rx: /resultat|appris|retenu|leçon|lecon|grace a|au final|finalement|publie|diffuse|compris/, f: 'Qu\'en avez-vous retiré, avec le recul ?' }],
      model: 'Situation : [où, quand, contexte]. Mon action : [ce que j\'ai personnellement fait, avec des détails : personnes contactées, difficultés]. Résultat : [ce qui a été publié / obtenu, chiffres]. Leçon : [ce que j\'ai appris et ferais autrement].' },
    ecole: { who: 2, min: 45, say: c => `Pourquoi ${c.school ? 'notre école, ' + c.school.short + ',' : 'notre école'} plutôt qu'une autre ?`,
      keys: [{ l: 'au moins 2 éléments propres à l\'école', rx: /media ecole|journal de l'ecole|radio|alternance|partenariat|ancien|anciens|specialite|master|master|pedagogie|promotion|stage|reseau|ville|atelier|projet|reconnu|cpnej/, f: 'Qu\'avez-vous trouvé dans notre formation que vous ne trouvez pas ailleurs ?' }, { l: 'le lien avec ton projet', rx: /mon projet|mon objectif|me permettra|pour (devenir|realiser|apprendre)|correspond|coherent/ }, { l: 'une connaissance précise de la formation', rx: /\d|diplome|deux ans|2 ans|semestre|enseignant|intervenant|journaliste|programme/ }],
      model: 'J\'ai choisi votre école pour [2 éléments précis : média école, spécialité, stages, anciens, ville]. Cela correspond à mon projet de [projet] car [lien]. J\'ai notamment été marqué·e par [détail vérifié sur le site / un échange avec un ancien].' },
    actu_open: { who: 1, min: 60, say: () => pick(['Parlons actualité. Qu\'est-ce qui vous a marqué dans l\'actualité ces derniers jours ?', 'Quelle information avez-vous retenue ce matin, et pourquoi ?']),
      keys: [{ l: 'une info précise (qui, quoi, où, quand)', rx: /\d|ce matin|hier|cette semaine|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|president|ministre|gouvernement|assemblee|tribunal|guerre|election|cop|bourse/ }, { l: 'pourquoi elle compte', rx: /important|enjeu|montre|illustr|consequen|signifi|parce que|car |cela veut dire|impact|risque/, f: 'Pourquoi cette information compte-t-elle selon vous ?' }, { l: 'ta source', rx: /selon|d'apres|j'ai lu|j'ai vu|j'ai entendu|franceinfo|le monde|liberation|figaro|france inter|afp|reuters|ouest-france|source/, f: 'Où avez-vous trouvé cette information ? Était-elle recoupée ?' }],
      model: 'Ce qui m\'a marqué, c\'est [fait précis : qui, quoi, où, quand]. J\'en ai eu connaissance via [source], recoupée avec [2e source]. Elle compte car [enjeu : pour la France, l\'Europe, le public]. Si je devais la traiter, je choisirais l\'angle [angle précis].' },
    medias: { who: 2, min: 45, say: () => pick(['Quels médias lisez-vous, écoutez-vous, regardez-vous régulièrement ?', 'Comment vous informez-vous au quotidien ?']),
      keys: [{ l: 'au moins 3 types de médias', rx: /(presse|journal|quotidien|le monde|liberation|figaro).*(radio|france inter|franceinfo|rfi|podcast|television|tv|arte|youtube|newsletter)|(radio|podcast|france inter|franceinfo).*(presse|journal|quotidien|le monde|liberation|figaro)/ }, { l: 'un média étranger ou différent', rx: /guardian|new york times|bbc|al jazeera|courrier international|der spiegel|el pais|etranger|anglophone|international/, f: 'Lisez-vous des médias étrangers ? Lesquels, et pour quoi faire ?' }, { l: 'un regard critique', rx: /mais|cependant|en revanche|regrette|manque|critique|biais|ligne editoriale|recoup|verifie|j'apprecie/, f: 'Qu\'est-ce qui vous manque ou vous gêne dans le traitement de l\'actualité aujourd\'hui ?' }],
      model: 'Le matin, j\'écoute [radio / podcast] ; je lis [quotidien] et [hebdo] ; je regarde [format vidéo]. Je lis aussi [média étranger] pour comparer. J\'apprécie [qualité précise], mais je regrette [limite : angle, rythme, biais]. Je recoupe toujours [méthode].' },
    deonto: { who: 1, min: 55, pool: [
      { say: 'Un journaliste doit-il être neutre ?', keys: [{ l: 'distinction neutralité / objectivité / honnêteté', rx: /neutralite|objectivite|honnetete|impartial|subjectiv/, f: 'Vous employez « neutre » : quelle différence faites-vous avec l\'objectivité ou l\'honnêteté ?' }, { l: 'une référence (charte de Munich, déontologie)', rx: /charte|munich|deontologie|cpji|code|serment/ }, { l: 'un exemple', rx: /par exemple|exemple|ainsi|notamment|cas de|affaire/ }], model: 'La neutralité totale n\'existe pas : un journaliste choisit un sujet, un angle. Ce qui compte, c\'est l\'honnêteté et la vérification des faits, comme le rappelle la Charte de Munich (respect de la vérité, rectification des erreurs). Par exemple [cas concret]. Il faut distinguer information et commentaire, et le dire clairement au public.' },
      { say: 'Que pensez-vous de l\'usage de l\'intelligence artificielle dans les rédactions ?', keys: [{ l: 'des faits précis (chartes, usages réels)', rx: /charte|accord|licence|traduction|transcription|resume|openai|google|chatgpt|rediger|verif/ }, { l: 'les risques', rx: /risque|erreur|hallucination|deepfake|droit d'auteur|desinformation|confiance|biais|fiabilite/, f: 'Quels risques voyez-vous concrètement pour la fiabilité de l\'information ?' }, { l: 'les opportunités ou garde-fous', rx: /opportunite|gagner du temps|outil|garde-fou|supervis|validation|humain|controle|transparence/, f: 'À quelles conditions l\'utiliseriez-vous ?' }], model: 'L\'IA est déjà utilisée pour [usages réels : transcription, traduction, veille]. Les risques : [erreurs, deepfakes, droits d\'auteur, perte de confiance]. Pour moi, la règle est [validation humaine, transparence envers le public]. Je l\'utiliserais pour [tâche précise], jamais pour [ligne rouge].' },
      { say: 'Comment un média peut-il regagner la confiance du public ?', keys: [{ l: 'un chiffre ou un constat précis', rx: /\d|%|pour cent|reuters|baro|la croix|kantar|enquete|etude/ }, { l: 'des pistes concrètes', rx: /transparence|corriger|erreur|proximite|pedagogie|verification|sources|explique|methode|coulisses|terrain/, f: 'Quelles mesures concrètes un média pourrait-il prendre dès demain ?' }, { l: 'un exemple', rx: /par exemple|exemple|ainsi|notamment|decodeurs|check|factcheck|afp factuel/ }], model: 'Le constat : [chiffre précis, source], la confiance reste fragile. Pistes : transparence sur les méthodes et les sources, correction visible des erreurs, proximité avec le terrain, pédagogie. Par exemple [initiative concrète d\'un média]. Je commencerais par [action précise].' },
      { say: 'Une information circule : un ministère aurait pris une décision. Comment la vérifiez-vous avant de la publier ?', keys: [{ l: 'remonter à la source primaire (texte, communiqué, décision)', rx: /source primaire|document|communique|texte officiel|decision|journal officiel|legifrance|rapport|original|a la source|directement/, f: 'Iriez-vous chercher le texte lui-même ? Où le trouveriez-vous ?' }, { l: 'recouper avec une autre source indépendante', rx: /recoup|deuxieme source|autre source|plusieurs sources|confirm|independant|contre-verif/ }, { l: 'contacter les personnes concernées', rx: /contact|appel|interrog|demand|reaction|droit de reponse|cabinet|porte-parole|service de presse/, f: 'Contacteriez-vous quelqu\'un ? Qui, et pourquoi ?' }], model: 'Je remonte à la source primaire : le communiqué ou le texte officiel (Journal officiel, site du ministère), pour voir ce qu\'il dit réellement. Je recoupe avec [une 2e source indépendante]. Je demande sa réaction au [cabinet / porte-parole] et à [une personne concernée]. Tant que ce n\'est pas vérifié, je ne publie pas, ou je précise « selon… ».' },
      { say: 'Les réseaux sociaux sont-ils une menace pour le journalisme ?', keys: [{ l: 'une position nuancée', rx: /mais|cependant|en revanche|a la fois|d'un cote|d'une part|nuance|ni .* ni/ }, { l: 'des faits ou chiffres', rx: /\d|%|premiere source|jeunes|tiktok|instagram|youtube|x |twitter|algorithme/ }, { l: 'des risques et des opportunités', rx: /desinformation|rumeur|concurrence|audience|opportunite|toucher|jeunes|format court|verification/, f: 'Et à l\'inverse, qu\'est-ce que les réseaux apportent au journalisme ?' }], model: 'Ni menace pure ni solution. Constat : [chiffre sur la place des réseaux dans l\'info]. Risques : [désinformation, concurrence de l\'attention]. Opportunités : [toucher les jeunes, nouveaux formats, sources]. Ma position : [avis argumenté], avec [exemple].' }
    ] },
    reportage: { who: 1, min: 55, say: c => `Proposez-nous un sujet de reportage ${c.school ? 'à ' + c.school.city : 'dans la ville où vous habitez'}.`,
      keys: [{ l: 'un angle précis (pas un thème)', rx: /angle|comment|pourquoi|depuis que|alors que|face a|face au|a travers|le cas de|l'histoire de/, f: 'Vous donnez un thème : quel est votre angle, concrètement ?' }, { l: 'des interlocuteurs identifiés', rx: /interview|rencontr|temoign|habitant|elu|maire|associat|commerc|professeur|chercheur|medecin|je (irais|verrais|contacterais)/, f: 'Qui iriez-vous voir en premier ?' }, { l: 'un format et un « pourquoi maintenant »', rx: /reportage|portrait|enquete|podcast|video|radio|texte|format|actualite|en ce moment|cette annee|aujourd'hui|calendrier/ }],
      model: 'Mon angle : [angle précis, une question à laquelle le sujet répond]. J\'irais voir [3 interlocuteurs : une personne concernée, un décideur, un expert]. Format : [texte / son / vidéo] parce que [raison]. Pourquoi maintenant : [actualité, date, événement].' },
    defaut: { who: 1, min: 35, say: () => pick(['Quel est votre plus grand défaut ?', 'Quel défaut vous a déjà posé problème dans un travail de groupe ou un projet ?']),
      keys: [{ l: 'un vrai défaut (pas « perfectionniste »)', rx: /defaut|j'ai tendance|je suis (parfois|souvent|trop)|je manque|je procrastine|je doute|je m'eparpille|timide|impatient/ }, { l: 'un exemple', rx: /par exemple|un jour|lors|une fois|ainsi|notamment|\d/, f: 'Pouvez-vous me donner une situation où cela vous a posé problème ?' }, { l: 'ce que tu fais pour le corriger', rx: /pour (corriger|progresser|m'ameliorer)|j'ai (mis en place|appris|decide)|desormais|je m'efforce|je travaille|je me force|methode/, f: 'Et que faites-vous concrètement pour le corriger ?' }],
      cliche: /perfectionnis|trop (investi|travailleur|exigeant avec moi)/,
      model: 'Mon vrai défaut : [défaut réel]. Cela m\'a posé problème quand [situation concrète]. Pour y remédier, j\'ai [action précise : méthode, habitude, retour demandé]. Depuis, [amélioration observée].' },
    dix: { who: 0, min: 35, say: () => pick(['Où vous voyez-vous dans dix ans ?', 'Concrètement, quel journaliste serez-vous dans dix ans ?']),
      keys: [{ l: 'un domaine ou un rôle précis', rx: /reporter|redact|chef|grand reporter|correspondant|enquete|presentateur|editeur|fondateur|pigiste|radio|presse|video|international/ }, { l: 'de la lucidité sur le métier', rx: /pige|precarite|polyvalen|concurren|evolution|numerique|difficile|realite|metier change/, f: 'Comment imaginez-vous la réalité du métier à vos débuts ?' }, { l: 'une ambition crédible', rx: /ambition|objectif|je veux|je souhaite|j'aimerais|etape|d'abord|ensuite|progress/ }],
      model: 'Dans dix ans, je me vois [rôle précis] dans [type de média]. Je sais que les débuts passent par [pige, polyvalence, précarité possible]. Mes étapes : [d\'abord…, ensuite…]. Ce qui ne changera pas : [valeur professionnelle].' },
    ouv: { who: 2, min: 12, say: () => 'Nous arrivons à la fin. Avez-vous des questions à nous poser ?',
      keys: [{ l: 'une vraie question', rx: /\?|comment|quel|quelle|combien|est-ce que|pourriez/ }, { l: 'une question propre à l\'école', rx: /ecole|formation|promotion|stage|alternance|media ecole|ancien|insertion|enseignant|pedagogie|projet/ }, { l: 'une question qui montre ta préparation', rx: /j'ai (lu|vu|remarque)|sur votre site|dans votre|suite a/ }],
      model: 'Toujours oui. Par exemple : « J\'ai vu que [élément précis de l\'école] : comment cela se passe-t-il concrètement pour les étudiants ? » ou « Quel est le profil des anciens ? Où travaillent-ils à la sortie ? »' }
  };

  // relances déclenchées par un mot-clé dans ta réponse (une seule fois chacune)
  const TRIGGERS = [
    [/radio|podcast|audio/, 'Vous parlez de radio : quelle émission ou quel intervenant vous inspire, et pourquoi ?'],
    [/enquete|investigation/, 'Vous évoquez l\'enquête : quelle enquête récente vous a marqué·e, et pour quelle raison ?'],
    [/reseaux sociaux|tiktok|instagram|youtube/, 'Vous citez les réseaux sociaux : comment vérifieriez-vous une information qui circule sur ces plateformes ?'],
    [/intelligence artificielle|\bia\b|chatgpt/, 'Vous mentionnez l\'intelligence artificielle : où placeriez-vous la limite dans une rédaction ?'],
    [/data|donnees|chiffres/, 'Vous parlez de données : avez-vous déjà travaillé avec des chiffres, et lesquels ?'],
    [/international|etranger|monde/, 'Vous évoquez l\'international : quelle région du monde suivez-vous le mieux, et comment ?'],
    [/local|region|proximite/, 'Vous parlez du local : pourquoi est-ce important selon vous ?'],
    [/sport/, 'Vous évoquez le sport : comment éviter de ne faire que du commentaire ?'],
    [/politique|elu|gouvernement/, 'Vous touchez à la politique : comment gardez-vous votre distance avec les personnalités que vous interrogez ?'],
    [/environnement|climat|ecolog/, 'Vous parlez du climat : comment éviter le militantisme quand on couvre ce sujet ?']
  ];
  const REACT = { neutral: ['Bien.', 'D\'accord.', 'Je vois.', 'Merci.', 'Très bien.'], kind: ['Très bien, merci.', 'D\'accord, c\'est clair.', 'Merci pour cette réponse.', 'Bien, je vois.'], hard: ['Hum.', 'Bon.', 'D\'accord.', 'Je note.'] };

  // ------------------------------------------------------------------ plan de l'entretien
  const ORDER = ['intro', 'motiv', 'projet', 'terrain', 'ecole', 'actu_open', 'actu_cible', 'medias', 'deonto', 'reportage', 'defaut', 'dix', 'ouv'];
  function makePlan(minutes, hasSchool) {
    const N = Math.max(5, Math.min(13, Math.round(minutes / 2.2)));
    const must = ['intro', 'motiv', 'projet', 'actu_open', 'ouv'];
    if (hasSchool) must.push('ecole');
    if (N >= 7) must.push('actu_cible');
    const opt = ['terrain', 'deonto', 'medias', 'defaut', 'reportage', 'dix'];
    const set = new Set(must);
    for (const q of opt) if (set.size < N) set.add(q);
    const plan = ORDER.filter(q => set.has(q));
    if (N >= 12) plan.splice(plan.indexOf('actu_cible') + 1, 0, 'actu_cible2');
    return plan;
  }

  // question « actu » ciblée sur une info du brief du jour
  function storyQuestion(c, used) {
    const day = ctx.currentDay(); if (!day) return null;
    const list = day.stories.slice(0, 10).map((s, i) => ({ s, i })).filter(x => !used.has(x.i));
    if (!list.length) return null;
    const { s, i } = pick(list); used.add(i);
    const t = stems(s.title), body = stems(plain(s.text) + ' ' + plain(s.why || ''));
    const first = (plain(s.text).match(/^(.*?[.!?])(\s|$)(.*?[.!?])?/) || [plain(s.text)]).slice(0, 1)[0];
    return { id: 'story' + i, who: 1, min: 55, say: `Une information a fait l'actualité : « ${s.title} ». Que pouvez-vous nous en dire ?`,
      keys: [
        { l: 'les faits essentiels (qui, quoi, où, quand)', rx: new RegExp(t.slice(0, 6).join('|') || 'zzzz'), f: 'Pouvez-vous reprendre les faits : qui, quoi, où, quand ?' },
        { l: 'le contexte ou les enjeux', rx: new RegExp(body.filter(b => !t.includes(b)).slice(0, 12).join('|') || 'zzzz'), f: 'Quel est le contexte ? Qu\'est-ce qui est en jeu ?' },
        { l: 'ton regard (pourquoi ça compte)', rx: /important|enjeu|montre|illustr|consequen|signifi|parce que|a mon avis|selon moi|je pense|cela veut dire/, f: 'Et selon vous, pourquoi cette information compte-t-elle ?' }],
      model: `Les faits : ${first}${s.why ? ' Le contexte : ' + plain(s.why) : ''} À mon sens, cela compte car [ton analyse : enjeu pour le public, pour la France, pour les médias]. Pour le traiter, j'irais chercher [2 sources différentes].` };
  }

  // ------------------------------------------------------------------ analyse d'une réponse
  const CONNECT = /d'abord|ensuite|enfin|premierement|deuxiemement|d'une part|d'autre part|en effet|donc|parce que|car |cependant|en revanche|par ailleurs|c'est pourquoi|ainsi/g;
  const FILLER = /\b(euh+|ben|bah|genre|du coup|en fait|voila|quoi|tu vois|on va dire|enfin bref)\b/g;
  const CONCRETE = /\d|par exemple|notamment|ainsi|c'est le cas|j'ai (ecrit|realise|couvert|interviewe|organise|monte|fait un stage|travaille)|lors de|en (janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre|20\d\d)/;
  function analyse(q, text, dur) {
    const t = nz(text), w = words(text);
    const hit = q.keys.filter(k => k.rx.test(t)), miss = q.keys.filter(k => !k.rx.test(t));
    const concrete = CONCRETE.test(t) || (text.match(/\b[A-ZÉÈÀ][a-zéèêàâîôûç]{2,}/g) || []).length >= 3;
    const connect = (t.match(CONNECT) || []).length, fillers = (t.match(FILLER) || []).length;
    const cliche = !!(q.cliche && q.cliche.test(t));
    const lenScore = Math.min(1, w / (q.min || 50));
    let s = 3 * (hit.length / q.keys.length) + (concrete ? 1 : 0) + lenScore * 0.6 + (connect >= 2 ? 0.4 : 0) - (cliche ? 0.5 : 0) - (w > 320 ? 0.5 : 0);
    s = Math.max(0, Math.min(5, Math.round(s * 2) / 2));
    return { hit, miss, concrete, connect, fillers, cliche, w, dur: dur || 0, score: s };
  }

  // ------------------------------------------------------------------ moteur
  function create(I) {
    const o = I.o, sc = ctx.PREPA.schools.find(s => s.short === o.school) || null;
    const prof = ctx.concours ? ctx.concours.profile() : {};
    const c = { name: (ctx.S.settings.name || '').trim(), school: sc, minutes: o.minutes };
    const L = { plan: makePlan(o.minutes, !!sc), idx: -1, cur: null, fu: 0, usedTrig: new Set(), usedStories: new Set(), log: [], fuBudget: Math.round(makePlan(o.minutes, !!sc).length * ({ kind: 0.25, standard: 0.5, hard: 0.8 }[o.tough] || 0.5)), fuUsed: 0, deonto: null, closed: false, c, prof };
    return { L, JURY };
  }
  function resolve(L, id) {
    if (id === 'actu_cible' || id === 'actu_cible2') { const q = storyQuestion(L.c, L.usedStories); return q || Object.assign({ id: 'actu_open2' }, BANK.actu_open, { say: BANK.actu_open.say }); }
    if (id === 'deonto') { const p = pick(BANK.deonto.pool); return { id: 'deonto', who: 1, min: BANK.deonto.min, say: p.say, keys: p.keys, model: p.model }; }
    const b = BANK[id];
    return Object.assign({ id }, b, { say: typeof b.say === 'function' ? b.say(L.c) : b.say });
  }
  const say = (q) => (typeof q.say === 'function' ? q.say() : q.say);

  function nextMain(E, I, prefix) {
    const L = E.L, remaining = I.o.minutes - (Date.now() - I.t0) / 60000;
    L.idx++;
    // peu de temps : on saute directement aux questions finales
    if (remaining < 2 && L.plan[L.idx] !== 'ouv' && L.plan.includes('ouv') && L.plan.indexOf('ouv') > L.idx && L.log.length >= 3) L.idx = L.plan.indexOf('ouv');
    const id = L.plan[L.idx];
    if (!id) return close(E, I, prefix);
    const q = resolve(L, id); L.cur = q; L.fu = 0;
    L.log.push({ qid: q.id, q, kind: 'main', ask: say(q), text: '', dur: 0 });
    const who = JURY[q.who];
    return { who: who.who, say: (prefix ? prefix + ' ' : '') + say(q), end: false };
  }
  function close(E, I, prefix) {
    E.L.closed = true;
    return { who: JURY[0].who, say: `${prefix ? prefix + ' ' : ''}Merci${E.L.c.name ? ' ' + E.L.c.name : ''}, nous en avons terminé. Nous allons délibérer et vous serez informé·e des résultats par l'école. Je vous remercie pour cet échange, et bonne continuation.`, end: true };
  }
  const react = o => (Math.random() < (o.tough === 'kind' ? 0.7 : o.tough === 'hard' ? 0.3 : 0.5)) ? pick(REACT[o.tough === 'kind' ? 'kind' : o.tough === 'hard' ? 'hard' : 'neutral']) : '';

  // premier tour : accueil + question d'introduction
  function start(E, I) { return nextMain(E, I, ''); }

  // réponse du candidat → prochaine parole du jury
  function reply(E, I, txt, dur) {
    const L = E.L, o = I.o, entry = L.log[L.log.length - 1];
    entry.text = (entry.text ? entry.text + ' ' : '') + txt; entry.dur += dur || 0;
    const mainEntry = L.log.filter(e => e.qid === L.cur.id && e.kind === 'main').pop();
    mainEntry.all = (mainEntry.all ? mainEntry.all + ' ' : '') + txt; mainEntry.alldur = (mainEntry.alldur || 0) + (dur || 0);
    const q = L.cur, a = analyse(q, mainEntry.all, mainEntry.alldur);
    const over = (Date.now() - I.t0) / 60000 >= o.minutes;
    // coach (mode entraînement) : retour immédiat sur la réponse
    let coach = '';
    if (o.mode === 'training') coach = coachText(q, a);
    // question de clôture : le jury répond brièvement puis conclut
    if (q.id === 'ouv') return Object.assign(close(E, I, 'Merci pour ces questions, nous y reviendrons plus en détail pendant la formation.'), { coach });
    if (over && L.log.length >= 3) return Object.assign(close(E, I, 'Le temps qui nous était imparti est écoulé.'), { coach });

    // relance ?
    let fu = null;
    if (L.fu < 1 && L.fuUsed < L.fuBudget && !over) {
      if (a.w < Math.max(15, (q.min || 40) * 0.5)) fu = pick(['Pouvez-vous développer ? Votre réponse est un peu brève.', 'Je vous laisse approfondir : qu\'entendez-vous exactement par là ?']);
      if (!fu) { const k = a.miss.find(k => k.f); if (k && a.hit.length < q.keys.length) fu = k.f; }
      if (!fu) { const tr = TRIGGERS.find(([rx, f]) => rx.test(nz(txt)) && !L.usedTrig.has(f)); if (tr && Math.random() < 0.6) { fu = tr[1]; L.usedTrig.add(tr[1]); } }
      if (!fu && !a.concrete && o.tough !== 'kind') fu = 'Auriez-vous un exemple précis pour illustrer ?';
    }
    if (fu) {
      L.fu++; L.fuUsed++;
      L.log.push({ qid: q.id, q, kind: 'fu', ask: fu, text: '', dur: 0 });
      return { who: JURY[(q.who + (Math.random() < 0.5 ? 1 : 0)) % 3].who, say: (react(o) ? react(o) + ' ' : '') + fu, end: false, coach };
    }
    const r = nextMain(E, I, react(o));
    return Object.assign(r, { coach });
  }

  function coachText(q, a) {
    const bits = [];
    if (a.hit.length) bits.push(`✓ Tu as abordé : ${a.hit.slice(0, 2).map(k => k.l).join(' ; ')}.`);
    if (a.miss.length) bits.push(`À ajouter : ${a.miss[0].l}.`);
    if (a.cliche) bits.push('Évite le cliché « j\'ai toujours voulu » : raconte un moment précis.');
    else if (!a.concrete) bits.push('Donne un exemple chiffré ou daté.');
    if (a.w < (q.min || 40) * 0.5) bits.push('Réponse trop courte : vise ' + (q.min || 40) + ' mots ou plus.');
    return bits.slice(0, 3).join(' ') + (q.model ? `\n**Réponse attendue :** ${q.model}` : '');
  }

  // ------------------------------------------------------------------ bilan
  function debrief(E, I) {
    const L = E.L;
    const mains = L.log.filter(e => e.kind === 'main' && (e.all || '').trim());
    const rows = mains.map(m => ({ m, a: analyse(m.q, m.all, m.alldur) }));
    const avg = f => rows.length ? rows.reduce((n, r) => n + f(r), 0) / rows.length : 0;
    const ofIds = ids => rows.filter(r => ids.some(i => r.m.q.id.startsWith(i)));
    const sc5 = (ids, fallback) => { const rs = ofIds(ids); return rs.length ? Math.round(rs.reduce((n, r) => n + r.a.score, 0) / rs.length * 10) / 10 : fallback; };
    const overall = avg(r => r.a.score);
    const conn = avg(r => Math.min(1, r.a.connect / 2)), len = avg(r => Math.min(1, r.a.w / (r.m.q.min || 50)));
    const fill = avg(r => r.a.fillers / Math.max(1, r.a.w / 100));
    const durOk = rows.filter(r => r.a.dur === 0 || (r.a.dur >= 25 && r.a.dur <= 200)).length / Math.max(1, rows.length);
    const concr = avg(r => r.a.concrete ? 1 : 0);
    const crit = [
      { name: 'Motivation et projet', score: sc5(['motiv', 'projet', 'ecole', 'dix', 'intro'], overall), c: 'Déclic précis, projet net, lien avec l\'école.' },
      { name: 'Culture générale et actualité', score: sc5(['story', 'actu', 'medias', 'deonto'], overall), c: 'Infos précises, contexte, sources, références professionnelles.' },
      { name: 'Clarté et structure', score: Math.round((1 + conn * 2 + len * 2) * 10) / 10, c: 'Connecteurs logiques et réponses développées.' },
      { name: 'Aisance à l\'oral et présence', score: Math.round(Math.max(0, 5 - fill * 1.2 - (1 - durOk) * 2) * 10) / 10, c: 'Durées de réponse tenues, peu de tics de langage.' },
      { name: 'Esprit journalistique', score: Math.round((1 + concr * 2.5 + sc5(['reportage', 'terrain', 'ouv'], overall) * 0.3) * 10) / 10, c: 'Exemples concrets, angles précis, curiosité.' }
    ].map(x => Object.assign(x, { score: Math.max(0, Math.min(5, x.score)), comment: x.c }));
    const score = Math.max(0, Math.min(20, Math.round(overall * 4 * 0.8 + crit.reduce((n, x) => n + x.score, 0) / 5 * 4 * 0.2)));
    const best = crit.slice().sort((a, b) => b.score - a.score), worst = crit.slice().sort((a, b) => a.score - b.score);
    const strengths = best.slice(0, 3).filter(x => x.score >= 2.5).map(x => `${x.name} : ${x.comment}`);
    if (!strengths.length) strengths.push('Tu es allé·e au bout de l\'entretien : c\'est le premier pas, il y en aura d\'autres.');
    const improve = worst.slice(0, 3).filter(x => x.score < 4).map(x => `${x.name} : ${x.comment}`);
    const advice = [];
    if (rows.some(r => r.a.w < (r.m.q.min || 40) * 0.6)) advice.push('Développe tes réponses : vise 1 à 2 minutes avec une idée, un exemple, une conclusion.');
    if (concr < 0.6) advice.push('Ajoute à chaque réponse un exemple daté ou chiffré (« en mars, lors d\'un reportage à… »). Les jurys retiennent les faits, pas les adjectifs.');
    if (rows.some(r => r.a.cliche)) advice.push('Bannis « j\'ai toujours voulu » : raconte un déclic précis (une scène, une rencontre).');
    if (sc5(['story', 'actu'], 5) < 3) advice.push('Actualité : fais l\'édition Scoop chaque matin et prépare 3 infos que tu sais résumer en 3 phrases (qui, quoi, où, quand) + pourquoi elles comptent.');
    if (fill > 3) advice.push('Tics de langage repérés (« du coup », « genre », « euh ») : enregistre-toi, et remplace-les par un silence.');
    if (conn < 0.5) advice.push('Structure tes réponses à voix haute : « d\'abord… ensuite… enfin… », ou situation, action, résultat, leçon.');
    if (durOk < 0.7) advice.push('Tiens le temps : une réponse dure en moyenne 1 à 2 minutes, jamais plus de 3.');
    advice.push('Refais un entretien en mode concours dans quelques jours, puis un autre filmé, pour comparer.');
    const answers = rows.map(({ m, a }) => ({
      question: m.ask, summary: plain(m.all).slice(0, 160) + (m.all.length > 160 ? '…' : ''), score: a.score,
      good: a.hit.length ? `Tu as abordé : ${a.hit.map(k => k.l).join(' ; ')}.${a.concrete ? ' Et tu as donné du concret.' : ''}` : (a.concrete ? 'Du concret, c\'est bien.' : 'Tu as répondu, mais sans élément attendu repéré.'),
      missing: [a.miss.length ? `Il manquait : ${a.miss.map(k => k.l).join(' ; ')}.` : '', a.cliche ? 'Cliché à éviter (« j\'ai toujours voulu »).' : '', !a.concrete ? 'Pas d\'exemple précis (date, chiffre, nom).' : '', a.w < (m.q.min || 40) * 0.6 ? 'Réponse trop courte.' : ''].filter(Boolean).join(' ') || 'Rien de majeur : continue ainsi.',
      expected: m.q.model || ''
    }));
    const verdict = score >= 16 ? 'Très bon oral : réponses développées, concrètes et structurées.' : score >= 13 ? 'Bon oral : les bases y sont, il manque surtout de la précision et des exemples sur certaines réponses.' : score >= 10 ? 'Oral encore juste : tu as des idées, mais elles restent trop générales ou trop courtes.' : 'Oral à retravailler : réponses brèves ou peu précises. Les réponses attendues ci-dessous te donnent un modèle pour chaque question.';
    return { score, verdict: verdict + ' (Bilan du jury automatique : repérage de mots-clés, d\'exemples et de structure, sans compréhension fine du sens.)', criteria: crit, strengths, improve: improve.length ? improve : ['Continue à t\'entraîner : rien de critique à signaler.'], answers, advice };
  }

  ctx.localJury = { create, start, reply, debrief, JURY };
});
