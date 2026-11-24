/* =========================================================
   Scoop — Annales et épreuves réelles des concours
   Tout est repris de documents PUBLICS, avec leur lien. Rien d'inventé.
   - Annales CFJ 2020-2024 : PDF publié par le CFJ (consignes et thèmes seulement, pas les dossiers).
   - Formats d'épreuves : pages officielles du CFJ, Diplomeo, L'Etudiant.
   - Questions d'oral : témoignages rapportés par L'Etudiant (année indiquée).
   Les annales complètes d'autres écoles ne sont pas toujours publiques : vérifie sur le site de chaque école.
   ========================================================= */
window.SCOOP_ANNALES = {
  updated: '24 novembre 2026',
  cfjPdf: 'https://cfjparis.com/wp-content/uploads/2026/02/Epreuves-dadmissibilite-du-CFJ-Annales-2020-2021-2022-2023-2024-Google-Docs.pdf',
  cfjPage: 'https://cfjparis.com/admission/concours/nos-conseils/',

  /* ---------- CFJ : épreuves d'admissibilité 2020-2024 (consignes du PDF public) ---------- */
  cfj: [
    { year: 2024, collecte: 'Aimer', themes: ['Un écolo à l\'Élysée', 'L\'IA accusée d\'homicide', 'La paix au Proche-Orient', 'Les héros des JO'] },
    { year: 2023, collecte: 'Manger', themes: ['La mort de Poutine', '2027, une cohabitation inattendue', 'Internet, le grand black-out', 'Le PSG en ligue 2'] },
    { year: 2022, collecte: 'Transports', themes: ['2024, des Jeux Olympiques vraiment historiques !', 'Le baril à 200 dollars', 'Xi Jinping fait sa révolution', 'La France un an après la prochaine élection présidentielle'] },
    { year: 2021, collecte: 'Territoires', themes: ['Donald Trump en octobre 2024', '2022, une femme au second tour', 'Jeff Bezos en janvier 2023', 'Greta Thunberg en mai 2025'] },
    { year: 2020, collecte: 'Vieillesse', themes: ['La fermeture des centrales nucléaires en France', 'Une présidentielle 2022 sans second tour', 'La fin de Google en Europe', 'Les dernières heures du Royaume-Uni'] }
  ],
  // Questions du dossier en ligne 2023 et 2024 (parcours, motivation, personnalité)
  cfjQuestions: {
    motivation: [
      'Trois ans après avoir obtenu votre diplôme du CFJ, quel journaliste serez-vous ? Où travaillerez-vous ? Sur quels genres de sujets ?',
      'Quel(le) journaliste aimeriez-vous être ? Et ne pas être ?',
      'Quelle est votre principale préoccupation concernant l\'avenir du journalisme en France ?',
      'Y a-t-il une situation, un événement ou une personne qui a conforté votre envie de devenir journaliste ? Racontez.',
      'Quelles sont vos trois principales sources d\'information ? Pourquoi ? Citez une production, purement journalistique, qui vous a marqué(e) ces derniers mois. Pourquoi ?',
      'De quelle personne anonyme aimeriez-vous raconter l\'histoire ? Pourquoi ?',
      'Quelle personnalité voudriez-vous interviewer aujourd\'hui ? Quelle est LA question que vous lui poseriez ? Argumentez.',
      'Sur quel sujet rêveriez-vous d\'enquêter ? Argumentez.'
    ],
    personnalite: [
      'Quel réseau social utilisez-vous le plus ? Pourquoi et comment ?',
      'Lorsque vous êtes fatigué(e) de vous informer, quel(s) contenu(s) consommez-vous sur YouTube pour vous divertir ?',
      'Quel(le) livre, film, série, podcast, magazine, émission, jeu vidéo, bande dessinée ou autre contenu non journalistique nous conseillez-vous ? Pourquoi ?',
      'Décrivez un projet auquel vous avez participé et dont vous êtes particulièrement fier/fière.',
      'Quel échec personnel (ou quelle expérience personnelle) vous a le plus appris ?',
      'Votre autoportrait en 140 signes (un tweet)…',
      'Que ne peut-on deviner de vous au premier abord ?',
      'Vous avez vécu une situation peu ordinaire dont vous avez été acteur ou témoin et qui vous a marqué(e) ? Racontez.'
    ]
  },

  /* ---------- Formats d'épreuves documentés (session 2026-2027) ---------- */
  formats: [
    { school: 'CFJ (Paris)', source: { name: 'CFJ : épreuves d\'admission', url: 'https://cfjparis.com/admission/concours/les-epreuves-dadmission/' },
      points: [
        '**Admissibilité** : dossier en ligne noté sur 100 : motivation (30), personnalité et prédisposition au métier (30), recherche d\'informations et rédaction (30), style et maîtrise du français (10).',
        '**Recherche d\'informations et rédaction** : le thème est tiré au hasard ; **72 h** pour rendre un article de **3 000 signes**, avec une note sur ta démarche et les coordonnées des personnes interrogées.',
        '**QCM en ligne chronométré** (nouveauté 2026) : actualité, culture générale et français, avant l\'oral.',
        '**Admission (oral, environ 60 min)** : entretien de motivation et culture des médias ; réflexes journalistiques ; actualité, culture générale et anglais (une partie en anglais). Barème sur 100 : motivation 30, réflexes journalistiques 30, actualité et anglais 20, français 5, QCM 15.'
      ] },
    { school: 'ESJ Lille', source: { name: 'Diplomeo : concours 2027', url: 'https://diplomeo.com/actualite-concours_ecoles_journalisme' },
      points: [
        '**Écrits** : environ 2 h sur table : compréhension de l\'actualité, français, narration.',
        '**Journée d\'épreuves** pour les admissibles : écrits, **épreuve collective non notée**, **oral d\'anglais en binôme**, **oral de motivation** (en présentiel en mai 2027).'
      ] },
    { school: 'CELSA', source: { name: 'CELSA : concours master journalisme', url: 'https://celsa.fr/' },
      points: [
        '**Synthèse de dépêches** (titre et chapô) et **essai sur le journalisme**, puis un **entretien** devant le jury d\'admission, avec une question en anglais (« on n\'attend pas un niveau bilingue, mais une capacité à réagir dans cette langue », selon L\'Etudiant).',
        'Format indiqué par le CELSA en 2024 et par une prépa : **vérifie** le barème et la bibliographie de la session en cours sur le site de l\'école.'
      ] }
  ],

  /* ---------- Questions d'oral réellement rapportées (L'Etudiant) ---------- */
  oralReported: [
    { school: 'CUEJ (Strasbourg)', year: 2026, q: 'Questions sur le Watergate, la réforme des retraites et le plan social du Washington Post (premier oral d\'une candidate).' },
    { school: 'CELSA', year: 2016, q: 'Une candidate a été interrogée sur « ce qu\'elle pensait du journalisme en Chine », parce qu\'elle avait indiqué parler chinois sur son CV.' },
    { school: 'IJBA (Bordeaux)', year: 2016, q: 'Un candidat a été interrogé sur l\'objectivité journalistique.' },
    { school: 'ESJ Lille', year: 2016, q: 'Question piège : accepteriez-vous un poste à LCP si c\'était une condition pour entrer à l\'école ?' },
    { school: 'CFJ', year: 2016, q: 'Thèmes à préparer cités par la directrice : l\'industrie des médias, les différents métiers, les enjeux des fusions, les nouveaux médias (thèmes conseillés, pas des questions posées).' }
  ],
  oralSources: [
    { name: 'L\'Etudiant : conseils pour les épreuves (2026)', url: 'https://www.letudiant.fr/etudes/3es-cycles-et-masters/concours-d-entree-aux-formations-en-journalisme-les-conseils-pour-bien-preparer-les-epreuves.html' },
    { name: 'L\'Etudiant : l\'oral de motivation (2016)', url: 'https://www.letudiant.fr/etudes/ecoles-specialisees/ecoles-de-journalisme-comment-reussir-son-oral-de-motivation.html' },
    { name: 'L\'Etudiant : témoignages (2026)', url: 'https://www.letudiant.fr/etudes/ecoles-specialisees/concours-des-ecoles-de-journalisme-entre-stress-actualite-et-oraux-des-etudiants-temoignent.html' }
  ]
};
