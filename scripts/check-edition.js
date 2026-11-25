/* Scoop — vérificateur d'édition quotidienne.
   Usage (routine cloud) : node scripts/check-edition.js data/days/AAAA-MM-JJ.js
   Usage (navigateur)    : ScoopCheck(window.SCOOP_DAYS['AAAA-MM-JJ'])
   Renvoie des ERREURS (bloquantes) et des AVERTISSEMENTS.

   Règles :
   1. Chaque info (story) est recoupée : `sources` liste au moins 2 rédactions DIFFÉRENTES, chacune avec une URL.
   2. Chaque question des leçons doit pouvoir se résoudre avec le brief (titres, textes, « Pour le concours »,
      mémo, mot du jour) : les mots-clés de la bonne réponse doivent y figurer.
   3. Structure : 8 à 10 infos, 3 leçons, exercices bien formés, vidéos valides. */
(function (root) {
  'use strict';
  const STOP = new Set(('le la les un une des du de au aux et ou en dans sur pour par avec sans sous chez apres avant ce cette ces son sa ses leur leurs qui que dont est sont etre ont fait plus moins pas ne se il elle ils elles on nous vous comme mais aussi tres tout tous toute toutes entre contre vers selon lors depuis encore deja alors ainsi quand comment pourquoi quel quelle quels quelles vrai faux the and with from that this').split(' '));
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\*\*|\*/g, '').replace(/[’'`«»"“”()\[\],.;:!?…\/]/g, ' ').replace(/\s+/g, ' ').trim();
  const keyTokens = s => norm(s).split(' ').filter(w => (w.length >= 4 && !STOP.has(w)) || /^\d+([.,]\d+)?%?$/.test(w));
  const mediaBase = n => norm(n).replace(/\b(international|economie|medias|culture|flash|english|depeches afp|depeche afp|afp)\b/g, '').replace(/\s+/g, ' ').trim();

  function coverage(corpus, text) {
    const toks = [...new Set(keyTokens(text))];
    if (!toks.length) return 1;
    const hit = toks.filter(t => corpus.includes(' ' + t) || corpus.includes(t + ' ') || corpus.includes(t));
    return hit.length / toks.length;
  }

  function check(day) {
    const errors = [], warnings = [];
    const E = m => errors.push(m), W = m => warnings.push(m);
    if (!day || typeof day !== 'object') return { ok: false, errors: ['Édition introuvable ou invalide'], warnings };
    if (!day.title) E('Titre d\'édition manquant');
    if (!day.word || !day.word.term || !day.word.def) E('Mot du jour manquant');
    // glossaire nourri par l'actu : termes absents de data/glossaire.js (peut être vide), bien formés, présents dans les textes
    if (Array.isArray(day.glossary)) day.glossary.forEach((g, i) => {
      if (!g || !g.term || !g.def) E(`Glossaire ${i} : « term » et « def » obligatoires`);
      else if (!((day.stories || []).some(s => norm(s.text + ' ' + (s.why || '')).includes(norm(g.term))))) W(`Glossaire « ${g.term} » : le terme n'apparaît dans aucune info (pas de lien possible)`);
    });
    if (!Array.isArray(day.memo) || day.memo.length < 3) W('Mémo : moins de 3 éléments');
    const stories = Array.isArray(day.stories) ? day.stories : [];
    // 8 à 10 infos le matin, jusqu'à 20 avec les mises à jour de la journée
    if (stories.length < 8 || stories.length > 20) E(`Il faut 8 à 20 infos (actuellement ${stories.length})`);
    (day.updates || []).forEach((u, i) => {
      if (!u || !/^\d{2}:\d{2}$/.test(u.at || '') || !Array.isArray(u.stories) || !u.stories.length) E(`Mise à jour ${i} : format attendu { at: 'HH:MM', stories: [index…] }`);
      else u.stories.forEach(k => { if (!Number.isInteger(k) || !stories[k]) E(`Mise à jour ${u.at} : l'info ${k} n'existe pas`); });
    });

    // Recommandation culturelle (film, série, docu, podcast) en écho à l'actu : ajoutée à la mise à jour de 17 h
    [].concat(day.reco || []).forEach((r, i) => {
      if (!r || !r.title || !r.why || !['film', 'série', 'docu', 'podcast'].includes(r.type)) E(`Reco ${i} : « type » (film, série, docu ou podcast), « title » et « why » obligatoires`);
      else if (r.story !== undefined && !(Number.isInteger(r.story) && stories[r.story])) E(`Reco « ${r.title} » : « story » pointe vers une info inexistante`);
      else if (!r.by) W(`Reco « ${r.title} » : auteur ou réalisateur (« by ») manquant`);
    });

    // 1. Recoupement des sources
    stories.forEach((s, i) => {
      const where = `Info ${i} « ${String(s.title || '').slice(0, 50)} »`;
      if (!s.title || !s.text || !s.tag) E(`${where} : titre, texte ou rubrique manquant`);
      const src = Array.isArray(s.sources) ? s.sources : [];
      const bases = new Set(src.map(x => mediaBase(x && x.name)));
      if (bases.size < 2) E(`${where} : recoupement insuffisant (${bases.size} rédaction${bases.size > 1 ? 's' : ''} ; il en faut au moins 2 différentes dans « sources »)`);
      src.forEach(x => { if (!x || !x.name || !/^https?:\/\//.test(x.url || '')) E(`${where} : chaque source doit avoir un nom et une URL`); });
      // sources primaires (facultatives) : documents ou institutions d'origine, avec une URL valide
      if (s.primary !== undefined) {
        if (!Array.isArray(s.primary)) E(`${where} : « primary » doit être une liste`);
        else s.primary.forEach(x => { if (!x || !x.name || !/^https?:\/\//.test(x.url || '')) E(`${where} : chaque source primaire doit avoir un nom et une URL`); });
      }
    });

    // Corpus du brief
    const corpus = ' ' + norm([
      ...stories.map(s => [s.title, s.text, s.why].join(' ')),
      ...(day.memo || []),
      day.word ? day.word.term + ' ' + day.word.def : ''
    ].join(' ')) + ' ';

    // 2. Leçons
    const lessons = Array.isArray(day.lessons) ? day.lessons : [];
    // 3 leçons le matin, puis une leçon « Flash » par mise à jour
    if (lessons.length < 3 || lessons.length > 9) E(`Il faut 3 leçons, plus une par mise à jour (actuellement ${lessons.length})`);
    if (lessons.length > 3 && (day.updates || []).length !== lessons.length - 3) W(`${lessons.length - 3} leçon(s) Flash pour ${(day.updates || []).length} mise(s) à jour`);
    lessons.forEach((l, li) => {
      const exs = Array.isArray(l.exercises) ? l.exercises : [];
      if (exs.length < (li >= 3 ? 4 : 6)) W(`Leçon ${li} : seulement ${exs.length} exercices`);
      exs.forEach((ex, ei) => {
        const where = `Leçon ${li}, exercice ${ei} (${ex.t}) « ${String(ex.q || '').slice(0, 60)} »`;
        let answer = '';
        switch (ex.t) {
          case 'qcm':
            if (!Array.isArray(ex.c) || ex.c.length < 3 || ex.c.length > 4) E(`${where} : 3 ou 4 choix attendus`);
            else if (!Number.isInteger(ex.a) || ex.a < 0 || ex.a >= ex.c.length) E(`${where} : index de bonne réponse invalide`);
            else answer = ex.c[ex.a];
            break;
          case 'vf':
            if (typeof ex.a !== 'boolean') E(`${where} : a doit valoir true ou false`);
            answer = ex.q; // l'affirmation elle-même doit porter sur le brief
            break;
          case 'input':
            if (!Array.isArray(ex.a) || !ex.a.length) E(`${where} : liste de réponses acceptées manquante`);
            else answer = ex.a[0];
            break;
          case 'order':
            if (!Array.isArray(ex.items) || ex.items.length < 3) E(`${where} : au moins 3 éléments à ordonner`);
            else answer = ex.items.join(' ');
            break;
          case 'match':
            if (!Array.isArray(ex.pairs) || ex.pairs.length < 3 || ex.pairs.some(p => !Array.isArray(p) || p.length !== 2 || !p[0] || !p[1])) E(`${where} : au moins 3 paires [gauche, droite] attendues`);
            else {
              const lefts = new Set(ex.pairs.map(p => norm(p[0]))), rights = new Set(ex.pairs.map(p => norm(p[1])));
              if (lefts.size !== ex.pairs.length || rights.size !== ex.pairs.length) E(`${where} : deux paires ont le même texte (impossible à départager)`);
              answer = ex.pairs.map(p => p[0] + ' ' + p[1]).join(' ');
            }
            break;
          case 'write':
            if (!ex.model || !Array.isArray(ex.crit) || ex.crit.length < 3) E(`${where} : modèle ou critères manquants`);
            return; // exercice d'écriture : pas de vérification de réponse
          default:
            E(`${where} : type d'exercice inconnu`);
            return;
        }
        if (!ex.x) W(`${where} : pas d'explication`);
        if (answer) {
          const cov = coverage(corpus, answer);
          if (cov < 0.6) E(`${where} : la réponse ne se trouve pas dans le brief (${Math.round(cov * 100)} % des mots-clés trouvés) → ajoute l'info dans le texte ou le « Pour le concours » d'une story, ou change la question`);
        }
      });
    });

    // 3. Vidéos
    (day.shorts || []).forEach((v, i) => {
      if (!v || !/^[\w-]{6,20}$/.test(v.id || '')) E(`Vidéo ${i} : identifiant YouTube invalide`);
      if (!v || !v.source || !v.title) E(`Vidéo ${i} : source ou titre manquant`);
      if (v && v.story != null && !(Number.isInteger(v.story) && stories[v.story])) E(`Vidéo ${i} : « story » pointe vers une info inexistante`);
    });
    // Un sujet = une vidéo : pas deux vidéos reliées à la même info
    const perStory = {};
    (day.shorts || []).forEach((v, i) => { if (v && Number.isInteger(v.story)) (perStory[v.story] = perStory[v.story] || []).push(i); });
    Object.keys(perStory).forEach(k => { if (perStory[k].length > 1) E(`Vidéos ${perStory[k].join(' et ')} : plusieurs vidéos pour la même info (${k}). Garde-n'en qu'une.`); });
    const vSrc = new Set((day.shorts || []).map(v => v && v.source));
    if ((day.shorts || []).length && vSrc.size < 5) W(`Vidéos : seulement ${vSrc.size} rédactions différentes (5 minimum conseillé)`);

    return { ok: errors.length === 0, errors, warnings };
  }

  root.ScoopCheck = check;

  // --- Mode ligne de commande (Node)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = check;
    if (require.main === module) {
      const fs = require('fs'), vm = require('vm'), path = require('path');
      const file = process.argv[2];
      if (!file) { console.error('Usage : node scripts/check-edition.js data/days/AAAA-MM-JJ.js'); process.exit(2); }
      const sandbox = { window: {} };
      try { vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file }); }
      catch (e) { console.error('ERREUR DE SYNTAXE : ' + e.message); process.exit(1); }
      const date = path.basename(file, '.js');
      const day = (sandbox.window.SCOOP_DAYS || {})[date];
      const r = check(day);
      r.warnings.forEach(w => console.log('AVERTISSEMENT : ' + w));
      r.errors.forEach(e => console.log('ERREUR : ' + e));
      console.log(r.ok ? `OK : édition ${date} valide (${r.warnings.length} avertissement(s))` : `ÉCHEC : ${r.errors.length} erreur(s) à corriger avant publication`);
      process.exit(r.ok ? 0 : 1);
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
