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

  /* ---------- Démarches école par école (pages officielles lues ou trouvées le 24/11/2026) ----------
     annales : ce qui est PUBLIC (la plupart des écoles ne publient pas leurs sujets passés).
     todo    : ce que tu fais, dans l'ordre. verified : true si la page a été ouverte et lue ; false si le lien vient d'une recherche. */
  cej: { name: 'Plateforme de la Conférence des écoles de journalisme (CEJ)', url: 'https://concoursjournalisme.fr/', note: 'Sert à s\'inscrire au CELSA, au CUEJ et à l\'EJCAM (indiqué par ces écoles) ; l\'IPJ Dauphine l\'utilise aussi selon Diplomeo.' },
  schoolsGuide: [
    { short: 'Sciences Po', urgent: true, verified: true, links: [{ name: 'Admission à l\'École de journalisme', url: 'https://www.sciencespo.fr/ecole-journalisme/fr/admissions/procedures-d-admission/' }, { name: 'Procédure et dates (rentrée 2027)', url: 'https://www.sciencespo.fr/admissions/fr/master/procedure-francaise/' }, { name: 'Portail de candidature', url: 'https://admission.sciencespo.fr/applicants/login' }],
      annales: 'Pas d\'épreuve écrite propre au journalisme : sélection sur dossier puis entretien à distance. Aucune annale publique.',
      dates: 'Rentrée 2027 : créer le dossier et choisir le programme avant le 16 décembre 2026 ; dossier complet validé le 8 janvier 2027 ; entretiens fin avril / début mai ; résultats mi-mai.',
      todo: ['Crée ton compte sur le portail de candidature Sciences Po (lien ci-dessus) **avant le 16 décembre 2026**.', 'Prépare : CV, relevés de notes, lettre de motivation (dans la langue du programme), recommandations obligatoires, preuve de niveau d\'anglais.', 'Valide ton dossier complet **avant le 8 janvier 2027**. Frais : 150 € (exonération boursiers CROUS).'] },
    { short: 'ESJ Lille', urgent: true, verified: true, links: [{ name: 'Inscriptions 2026-2027', url: 'https://esj-lille.fr/2026/11/09/inscriptions-2026-2027/' }, { name: 'Inscription en ligne', url: 'https://inscriptions.esj-lille.fr/' }, { name: 'Conseils de l\'école', url: 'https://esj-lille.fr/conseils/' }],
      annales: 'Aucune annale publique trouvée. Format publié : 3 épreuves sur table (actualité, français, narration, environ 2 h), épreuve collective non notée, oral d\'anglais en binôme (environ 20 min), oral de motivation (environ 30 min, coefficient 50 %).',
      dates: 'Inscriptions du 16 novembre 2026 au 4 février 2027 ; dossier pédagogique en ligne les 18 et 25 février 2027 ; épreuves en présentiel en mai 2027.',
      todo: ['Inscris-toi sur inscriptions.esj-lille.fr (**ouvert maintenant**, jusqu\'au 4 février 2027). Frais selon l\'échelon de bourse : de 0 € à 290 €.', 'Bloque les 18 et 25 février 2027 pour le dossier pédagogique en ligne.', 'Si tu es boursier·ère en L3, regarde la prépa égalité des chances gratuite de l\'école.'] },
    { short: 'CFJ', verified: true, links: [{ name: 'Inscriptions et calendrier', url: 'https://cfjparis.com/admission/concours/inscriptions-calendrier/' }, { name: 'Épreuves d\'admission', url: 'https://cfjparis.com/admission/concours/les-epreuves-dadmission/' }, { name: 'Annales 2020-2024 (PDF)', url: 'https://cfjparis.com/wp-content/uploads/2026/02/Epreuves-dadmissibilite-du-CFJ-Annales-2020-2021-2022-2023-2024-Google-Docs.pdf' }, { name: 'Règlement', url: 'https://cfjparis.com/admission/concours/le-reglement/' }],
      annales: '**Seule école avec des annales publiques** : le PDF 2020-2024 (déjà repris dans cet onglet). Aucun rapport de jury publié.',
      dates: 'Session 2026 : candidatures du 10 décembre 2025 au 2 mars 2026. Les pages du CFJ se contredisent sur l\'ouverture 2026/27 : écris à concourscfj@cfjparis.com pour confirmer.',
      todo: ['Lis le PDF des annales et fais les entraînements « Parcours et motivation » et « Collecte et angle » de Scoop.', 'Surveille la page « Inscriptions et calendrier » : ouverture attendue début décembre (10 décembre en 2025).', 'Frais : 299 € (réduction de 50 % pour les boursiers).'] },
    { short: 'CELSA', verified: true, links: [{ name: 'Master Journalisme : admission', url: 'https://www.celsa.fr/nos-formations/master-journalisme/' }, { name: 'Bibliographie conseillée (PDF)', url: 'https://www.celsa.fr/assets/uploads/2026/01/Bibliographie-Master-journalisme.pdf' }, { name: 'Plateforme CEJ', url: 'https://concoursjournalisme.fr/' }],
      annales: 'Aucune annale publique. Épreuves 2026 : synthèse sur un dossier d\'actualité (8 pts), essai sur le journalisme (6 pts), épreuve de créativité / réflexion (6 pts) ; puis entretien à distance.',
      dates: 'Session 2026 : inscription CEJ du 6 janvier au 2 février, écrits les 11 et 12 mars, oraux du 4 au 29 mai.',
      todo: ['Télécharge la **bibliographie** du CELSA et lis-la : le jury la cite lui-même.', 'Entraîne-toi à la **synthèse de dépêches** (entraînement du jour de Scoop).', 'Inscription sur la plateforme CEJ à l\'ouverture (début janvier). Frais : 70 € (30 € boursiers).'] },
    { short: 'CUEJ', verified: true, links: [{ name: 'Modalités du concours', url: 'https://cuej.unistra.fr/formation/modalites-du-concours/' }, { name: 'Règlement 2026-27 (PDF)', url: 'https://cuej.unistra.fr/websites/cuej/Fichiers/Modalites-admission-master-Cuej-2026-27.pdf' }, { name: 'Plateforme CEJ', url: 'https://concoursjournalisme.fr/' }],
      annales: 'Aucune annale publique (seulement la liste des admissibles). Épreuve en ligne, puis dossier en ligne, puis oral.',
      dates: 'Session 2026 : inscriptions du 6 au 29 janvier (**très tôt**) ; épreuve en ligne le 17 février. Journée portes ouvertes le 13 février 2027 (11h-16h) où le concours est présenté.',
      todo: ['Lis le règlement PDF 2026-27.', 'Inscris-toi sur la plateforme CEJ dès l\'ouverture : la fenêtre est courte (3 semaines en 2026).'] },
    { short: 'EJCAM', verified: false, links: [{ name: 'Candidater au master Journalisme', url: 'https://ejcam.univ-amu.fr/en/candidature-inscription/candidater-master-journalisme' }, { name: 'Règlement du concours (PDF)', url: 'https://ejcam.univ-amu.fr/sites/default/files/media-ressource/REGLEMENT%20DU%20CONCOURS%20C.A.%20du%2003-03-26.pdf' }, { name: 'Brochure 2025 (PDF)', url: 'https://ejcam.univ-amu.fr/sites/default/files/media-ressource/EJCAM-BROCHURE-2025.pdf' }],
      annales: 'Aucune annale publique trouvée : règlement et brochure seulement. 30 places en 2026 ; inscription sur la plateforme CEJ.',
      dates: 'Session 2026 : inscriptions ouvertes le 12 janvier ; résultats le 22 mai 2026.',
      todo: ['Lis le règlement du concours (PDF) : il décrit les épreuves.', 'Inscription sur la plateforme CEJ à l\'ouverture (mi-janvier). Frais indicatifs : 76 €.'] },
    { short: 'EJDG', verified: false, links: [{ name: 'Candidater à l\'École de journalisme de Grenoble', url: 'https://llasic.univ-grenoble-alpes.fr/en/school/applications/application-procedures/ecole-de-journalisme-de-grenoble/' }],
      annales: 'Aucune annale publique trouvée. Concours à écrits (admissibilité) puis oral (admission) ; double diplôme master UGA + diplôme de Sciences Po Grenoble.',
      dates: 'Dates 2027 non publiées dans ce que j\'ai pu lire (2026 : 14 janvier → 5 mars).',
      todo: ['Écris à contact-concours-ejdg@sciencespo-grenoble.fr pour obtenir le calendrier 2027 et les sujets passés éventuels.', 'Note : scolarité d\'environ 1 300 € par an (Onisep).'] },
    { short: 'EJT', verified: false, links: [{ name: 'Fiche Onisep « Journaliste plurimédia »', url: 'https://www.onisep.fr/ressources/structures-enseignement/occitanie/haute-garonne/ecole-de-journalisme-de-toulouse-ejt/journaliste-plurimedia-ejt' }, { name: 'Chercher le site officiel de l\'EJT', url: 'https://www.google.com/search?q=%C3%89cole+de+journalisme+de+Toulouse+concours+2027' }],
      annales: 'Aucune annale publique trouvée. L\'EJT est accessible dès bac+2 (formation de 3 ans).',
      dates: 'Session 2026 : 19 janvier → 27 mars (L\'Etudiant). Site officiel non trouvé : à confirmer.',
      todo: ['Ouvre la recherche « site officiel » ci-dessus, repère la page concours et note la date d\'ouverture.'] },
    { short: 'EPJT', verified: false, links: [{ name: 'Master Journalisme (Université de Tours)', url: 'https://www.univ-tours.fr/formations/master-arts-lettres-langues-mention-journalisme' }],
      annales: 'Aucune annale publique trouvée. Admissibilité sur dossier, puis oraux pour les 200 meilleurs dossiers. Contact : contact@epjt.fr',
      dates: 'Session 2026 : 5 janvier → 13 février. Le site epjt.fr était en erreur lors de ma vérification.',
      todo: ['Lis la fiche de l\'Université de Tours.', 'Écris à contact@epjt.fr pour le calendrier 2027. Tarif boursier indiqué : 25 €.'] },
    { short: 'IFP', verified: false, links: [{ name: 'Master Journalisme : FAQ (PDF)', url: 'https://ifp.assas-universite.fr/sites/default/files/agorassas/master_journalisme_-_faq.pdf' }, { name: 'Plateforme de candidature (eMundus)', url: 'https://candidatures.u-paris2.fr.emundus.fr/' }],
      annales: 'Aucune annale publique. Le dossier comprend un **autoportrait**, une réflexion sur une question contemporaine et un travail préparatoire à un reportage fictif, puis un entretien.',
      dates: 'Dates 2027 non trouvées (clôture 2025 : 4 mars). Un stage d\'un mois en rédaction avant l\'inscription est évoqué par l\'Onisep : confirme-le avec l\'école.',
      todo: ['Lis la FAQ du master (PDF).', 'Prépare ton autoportrait et ton projet de reportage fictif (entraînement « Collecte et angle » de Scoop).'] },
    { short: 'IJBA', verified: false, links: [{ name: 'Dossier concours 2026 (PDF)', url: 'https://www.ijba.u-bordeaux-montaigne.fr/uploads/dossier-concours-2026.pdf' }],
      annales: 'Pas d\'annale publique, mais le **dossier de concours 2026** (PDF) décrit les épreuves. Inscription en deux temps : documents par courrier + inscription en ligne.',
      dates: 'Session 2026 : ouverture le 12 janvier, clôture le 2 mars ; écrits en mars. Contact : journalisme@ijba.u-bordeaux-montaigne.fr',
      todo: ['Lis le dossier concours 2026 (PDF) en entier : c\'est le document le plus complet disponible.', 'Écris à l\'adresse de l\'école pour le calendrier 2027.'] },
    { short: 'IPJ', verified: false, links: [{ name: 'Master Journalisme IPJ : admissions', url: 'https://dauphine.psl.eu/formations/masters/journalisme-ipj-dauphine/m1/admissions' }],
      annales: 'Aucune annale publique trouvée. Candidatures 2026 closes ; le calendrier 2027-2028 « sera publié prochainement ».',
      dates: 'Ouverture attendue en décembre sur la plateforme CEJ (selon Diplomeo) : à confirmer sur la page admissions.',
      todo: ['Ajoute la page admissions à tes favoris et regarde-la début décembre.', 'Frais indicatifs : 256 €.'] },
    { short: 'Metz', verified: true, links: [{ name: 'Fiche du master Journalisme (Université de Lorraine)', url: 'https://formations.univ-lorraine.fr/fr/diplomes-et-formations/bac4-bac5/master/1765-master-journalisme.html' }, { name: 'Mon Master (plateforme)', url: 'https://www.monmaster.gouv.fr/' }],
      annales: 'Aucune annale publique. Candidature via Mon Master, calendrier « à venir ».',
      dates: 'Session 2026 : du 17 février au 16 mars sur Mon Master. Dates 2027 non publiées.',
      todo: ['Surveille monmaster.gouv.fr (ouverture habituelle en février).', 'Contact : shs-metz-infocom-contact@univ-lorraine.fr'] },
    { short: 'CY Cergy', verified: true, links: [{ name: 'Master Journalisme (CY Cergy Paris Université)', url: 'https://formation.cyu.fr/fr/offre-de-formation/master-grade-master-XB/master-journalisme-MCEHOSQ2.html' }, { name: 'Fiche CEJ', url: 'https://cej.education/ecole-de-journalisme-de-cergy/' }],
      annales: 'Aucune annale publique. Écrits 2026 : sujet d\'invention à partir d\'un document iconographique, et article à partir d\'un dossier de presse (3 h). Oral de 20 min (culture générale, motivation, projet).',
      dates: 'Session 2026 : dépôt de fin janvier au 1er mars (eCandidat) ; écrits le 14 avril ; oraux les 20-22 mai. 18 places.',
      todo: ['Prépare CV, lettre de motivation et projet professionnel (1 page chacun).', 'Candidature sur eCandidat à l\'ouverture (fin janvier). Frais : 30 €.'] },
    { short: 'EJC Cannes', verified: false, links: [{ name: 'BUT Info-com parcours Journalisme (Université Côte d\'Azur)', url: 'https://univ-cotedazur.fr/formation/offre-de-formation/bachelor-universitaire-de-technologie-information-communication-parcours-journalisme' }, { name: 'Fiche Onisep', url: 'https://www.onisep.fr/ressources/univers-formation/formations/post-bac/but-information-communication-parcours-journalisme' }],
      annales: 'Pas d\'épreuve de concours : sélection sur dossier Parcoursup (bac général ou technologique) puis entretien avec un jury.',
      dates: 'Candidatures via Parcoursup (en 2026 : 19 janvier → 12 mars).',
      todo: ['Crée ou prépare ton dossier Parcoursup. Mets en avant ton blog, tes articles de journal lycéen ou tes contenus en ligne.'] },
    { short: 'IUT Lannion', verified: false, links: [{ name: 'Fiche Diplomeo : BUT Info-com journalisme, Lannion', url: 'https://diplomeo.com/diplomes/194085' }, { name: 'Chercher la fiche Parcoursup', url: 'https://www.google.com/search?q=parcoursup+BUT+information-communication+journalisme+IUT+de+Lannion' }],
      annales: 'Pas d\'épreuve de concours : sélection sur dossier via Parcoursup.',
      dates: 'Candidatures via Parcoursup (en 2026 : 19 janvier → 12 mars).',
      todo: ['Même démarche que Cannes : dossier Parcoursup, avec tes productions (blog, journal lycéen, vidéos).'] }
  ],
  // Formations non reconnues par la profession (hors des 16) : moins sélectives, souvent plus chères
  nonRecognized: { name: 'L\'Etudiant : les formations non reconnues, moins sélectives mais plus coûteuses', url: 'https://www.letudiant.fr/etudes/ecoles-specialisees/ecoles-de-journalisme-les-formations-non-reconnues-moins-selectives-mais-plus-couteuses.html', note: 'À regarder comme filet de sécurité seulement : elles ne figurent pas sur la liste de la CPNEJ. Vérifie le coût et les débouchés avant de t\'engager.' },

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
        'Page officielle (session 2026) : **synthèse sur un dossier d\'actualité** (8 points), **essai sur le journalisme** (6 points) et **épreuve de créativité / réflexion** (6 points), rédigés en ligne sur la plateforme CEJ ; puis un **entretien à distance** (motivation, aptitudes, aisance en anglais : « on n\'attend pas un niveau bilingue, mais une capacité à réagir dans cette langue », selon L\'Etudiant).',
        'Le jury cite lui-même la **bibliographie** publiée par l\'école : lis-la. Durées des épreuves non indiquées : vérifie à l\'ouverture de la session.'
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
