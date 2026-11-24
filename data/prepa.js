/* =========================================================
   Scoop — Prépa concours (contenu permanent)
   Sources vérifiées le 24/11/2026 (liens dans chaque bloc).
   Aucun témoignage inventé : la rubrique « Ils le disent » résume
   des conseils PUBLIÉS par des écoles, prépas et médias, avec leur lien.
   ========================================================= */
window.SCOOP_PREPA = {
  updated: '24 novembre 2026',

  /* ---------- Les 16 cursus reconnus (CPNEJ, janvier 2026) + session 2026 (L'Etudiant) ---------- */
  schoolsNote: 'Liste officielle : 16 cursus reconnus par la CPNEJ (commission paritaire de la profession) en janvier 2026. La reconnaissance vaut 4 ans, renouvelables. Dates et frais : **session 2026**, d\'après L\'Etudiant (mise à jour du 16 mars 2026). Ils changent chaque année, alors vérifie la session 2027 sur le site de chaque école.',
  schoolsSources: [
    { name: 'CPNEJ : cursus reconnus', url: 'https://cpnej.fr/les-cursus-de-journalisme-reconnus-par-le-cpnej/' },
    { name: 'L\'Etudiant : calendrier des concours', url: 'https://www.letudiant.fr/etudes/ecoles-specialisees/le-calendrier-detaille-des-concours-aux-14-ecoles-de-journalisme-reconnues-par-la-profession.html' }
  ],
  schools: [
    { short: 'CELSA', name: 'CELSA (Sorbonne Université)', city: 'Neuilly-sur-Seine', diploma: 'Master journalisme, 2 ans', level: 'Bac+3', fee: '70 €', reg: '6 janvier → 2 février', written: 'Écrits les 11 et 12 mars', oral: '4 → 29 mai', note: 'Épreuve emblématique : la **synthèse de dépêches**.' },
    { short: 'CY Cergy', name: 'École de journalisme de CY Cergy Paris Université', city: 'Gennevilliers', diploma: 'Master journalisme, 2 ans', level: 'Bac+3', fee: '30 €', reg: 'Fin janvier → 1er mars', written: 'Écrits le 14 avril', oral: '20 → 22 mai', note: 'L\'un des concours les moins chers.' },
    { short: 'CFJ', name: 'Centre de formation des journalistes', city: 'Paris', diploma: 'Diplôme du CFJ, 2 ans', level: 'Bac+3', fee: '299 €', reg: '10 décembre → 2 mars', written: 'Dossier à rendre le 5 mars', oral: 'Fin avril → fin mai', note: 'Annales 2020-2024 en ligne sur le site du CFJ.' },
    { short: 'CUEJ', name: 'Centre universitaire d\'enseignement du journalisme', city: 'Strasbourg', diploma: 'Master journalisme, 2 ans', level: 'Bac+3', fee: '99 €', reg: '6 → 29 janvier', written: '1re épreuve en ligne le 17 février, puis dossier', oral: 'Mi-avril → début juin', note: 'Inscriptions très tôt : à ne pas rater.' },
    { short: 'EJC Cannes', name: 'École de journalisme de Cannes (IUT Nice Côte d\'Azur)', city: 'Cannes', diploma: 'BUT Information-communication, parcours journalisme, 3 ans', level: 'Post-bac (Parcoursup)', fee: 'Gratuit', reg: '19 janvier → 12 mars (Parcoursup)', written: 'Étude de dossier', oral: '6 → 20 mai', note: 'Accessible **dès le bac**.' },
    { short: 'EJCAM', name: 'École de journalisme et de communication d\'Aix-Marseille', city: 'Marseille', diploma: 'Master journalisme, 2 ans', level: 'Bac+3', fee: '76 €', reg: '12 janvier → 9 février', written: '25 février → 17 mars : lettre de motivation et question sur le projet professionnel', oral: '19 → 21 mai', note: '' },
    { short: 'EJDG', name: 'École de journalisme de Grenoble', city: 'Grenoble', diploma: 'Double diplôme : master UGA et diplôme de l\'IEP de Grenoble, 2 ans', level: 'Bac+3', fee: '50 €', reg: '14 janvier → 5 mars', written: 'Dossier et écrits jusqu\'au 5 mars', oral: '1er → 3 juin', note: '' },
    { short: 'EJT', name: 'École de journalisme de Toulouse', city: 'Toulouse', diploma: '« Journaliste plurimédia », 3 ans', level: 'Bac+2 accepté', fee: '100 €', reg: '19 janvier → 27 mars', written: 'Dossier et écrits jusqu\'au 27 mars', oral: '27 avril → 4 juin', note: 'Tous les candidats passent l\'oral (session 2026).' },
    { short: 'EPJT', name: 'École publique de journalisme de Tours', city: 'Tours', diploma: 'Master journalisme, 2 ans', level: 'Bac+3', fee: 'Gratuit', reg: '5 janvier → 13 février', written: 'Dossier avant le 13 février', oral: '27 avril → 22 mai', note: '' },
    { short: 'ESJ Lille', name: 'École supérieure de journalisme de Lille', city: 'Lille', diploma: 'Diplôme de l\'ESJ, 2 ans', level: 'Bac+3', fee: '290 €', reg: '15 novembre → 3 février', written: 'Dossier du 17 au 25 février', oral: '4 → 29 mai', note: 'Inscriptions dès la mi-novembre. École payante : anticipe le budget.' },
    { short: 'IFP', name: 'Institut français de presse (Paris-Panthéon-Assas)', city: 'Paris', diploma: 'Master information-communication, parcours journalisme, 2 ans', level: 'Bac+3', fee: '80 €', reg: '12 janvier → 25 février', written: 'Dossier et écrits jusqu\'au 25 février', oral: 'Fin mai', note: 'Épreuve emblématique : l\'**autoportrait**.' },
    { short: 'IJBA', name: 'Institut de journalisme Bordeaux Aquitaine', city: 'Bordeaux', diploma: 'Master journalisme, 2 ans', level: 'Bac+3', fee: '75 €', reg: '12 janvier → 2 mars', written: 'Écrits du 20 au 31 mars', oral: '27 → 29 mai', note: 'Épreuve emblématique : le **photojournalisme**.' },
    { short: 'IPJ', name: 'Institut pratique du journalisme (Paris-Dauphine)', city: 'Paris', diploma: 'Diplôme d\'établissement, grade master, 2 ans', level: 'Bac+3', fee: '256 €', reg: '15 décembre → 23 février', written: 'Dossier et écrits avant le 25 février', oral: '27 avril → 7 mai', note: '' },
    { short: 'IUT Lannion', name: 'IUT de Lannion', city: 'Lannion', diploma: 'BUT Information-communication, parcours journalisme, 3 ans', level: 'Post-bac (Parcoursup)', fee: 'Gratuit', reg: '19 janvier → 12 mars (Parcoursup)', written: 'Étude de dossier', oral: '1er → 18 mai', note: 'Accessible **dès le bac**.' },
    { short: 'Sciences Po', name: 'École de journalisme de Sciences Po', city: 'Paris', diploma: 'Master journalisme, ou journalisme et affaires internationales, 2 ans', level: 'Bac+3', fee: '150 €', reg: 'Jusqu\'au 11 janvier', written: 'Dossier avant le 11 janvier', oral: '16 → 30 avril', note: 'Calendrier **le plus précoce** : tout se joue en décembre et janvier.' },
    { short: 'Metz', name: 'Master journalisme & médias numériques (Université de Lorraine)', city: 'Metz', diploma: 'Master journalisme, 2 ans', level: 'Bac+3 (plateforme Mon Master)', fee: 'Gratuit', reg: '17 février → 16 mars (Mon Master)', written: 'Étude de dossier', oral: '19 → 20 mai', note: 'Nouveau cursus reconnu en 2026.' }
  ],

  /* ---------- Fiches méthode ---------- */
  guides: [
    {
      id: 'comprendre', icon: '🧭', title: 'Comprendre les concours',
      points: [
        '**Pas de concours commun** : chaque école organise le sien, avec ses épreuves, ses dates et ses frais. Il faut donc préparer plusieurs formats en parallèle.',
        'Le schéma général compte **deux temps**. L\'**admissibilité** se joue sur dossier (CV, relevés de notes, lettre) et souvent sur des écrits. L\'**admission** se joue à l\'oral : un entretien d\'au moins 20 minutes sur ta motivation, ta personnalité, ta culture générale et l\'actualité.',
        'Beaucoup d\'épreuves se passent **à distance**. Prévois un ordinateur fiable, une pièce calme et une bonne connexion.',
        'La plupart des cursus se font **après une licence (bac+3)**, en 2 ans. Exceptions : l\'EJT à Toulouse (3 ans, ouverte aux bac+2) et les deux BUT (Cannes et Lannion), accessibles dès le bac via Parcoursup.',
        'Les **frais de concours** vont de 0 à 300 € selon les écoles, avec souvent un tarif réduit pour les boursiers. Si tu tentes 6 écoles, prévois un budget d\'environ 500 à 900 €.',
        'C\'est **très sélectif**. Les estimations publiées tournent autour de 4 à 10 % de reçus selon les sources. Ce sont des ordres de grandeur, pas des statistiques officielles. Conséquence pratique : tente plusieurs écoles.'
      ],
      sources: [
        { name: 'L\'Etudiant', url: 'https://www.letudiant.fr/etudes/ecoles-specialisees/le-calendrier-detaille-des-concours-aux-14-ecoles-de-journalisme-reconnues-par-la-profession.html' },
        { name: 'La Fabrique du journalisme', url: 'https://www.lafabriquedujournalisme.fr/preparer-concours-journalisme/' }
      ]
    },
    {
      id: 'planning', icon: '🗓️', title: 'Le rétroplanning (session de printemps)',
      points: [
        '**Été (juin → août)** : décroche un **stage** ou une expérience concrète, par exemple en presse quotidienne régionale, un service civique dans un média associatif, une radio étudiante ou un journal d\'école. C\'est la matière première de ton dossier et de ton oral.',
        '**Septembre → octobre** : choisis tes écoles (valeurs, spécialités, coût, ville). Lance ta **veille quotidienne** : l\'édition Scoop du jour, un quotidien, une radio du matin, et un hebdomadaire le week-end. Ouvre un carnet de fiches d\'actualité.',
        '**Novembre → décembre** : premières inscriptions. L\'**ESJ Lille ouvre mi-novembre**, **Sciences Po ferme le 11 janvier** (session 2026). Rédige ton CV et une base de lettre de motivation, puis personnalise-la pour chaque école.',
        '**Janvier → mars** : la majorité des inscriptions et des dossiers. Entraîne-toi sur **les annales** (synthèse, écriture, QCM). Fais un tableau des dates : certaines épreuves se chevauchent.',
        '**Mars → avril** : écrits et résultats d\'admissibilité. Commence les **oraux blancs** avant même les résultats.',
        '**Avril → juin** : les oraux. La veille et le matin même, écoute les infos : l\'actu du jour tombe souvent à l\'oral.',
        'Commence **au moins 6 mois avant**, idéalement un an, et si possible **à plusieurs** : on progresse plus vite en se corrigeant.'
      ],
      sources: [
        { name: 'La Chance : conseils pour les concours', url: 'https://www.lachance.media/la-prepa/conseils-pour-les-concours-2/' },
        { name: 'La Fabrique du journalisme', url: 'https://www.lafabriquedujournalisme.fr/preparer-concours-journalisme/' },
        { name: 'L\'Etudiant : calendrier 2026', url: 'https://www.letudiant.fr/etudes/ecoles-specialisees/le-calendrier-detaille-des-concours-aux-14-ecoles-de-journalisme-reconnues-par-la-profession.html' }
      ]
    },
    {
      id: 'qcm', icon: '📰', title: 'Le QCM d\'actualité',
      points: [
        'Il porte en général sur **les 12 derniers mois**, avec un poids plus fort sur les 3 ou 4 derniers. Certaines écoles l\'ont remplacé par d\'autres épreuves : vérifie les annales de chaque école.',
        'Méthode **« 15 minutes par jour + 1 heure par semaine »**. Chaque jour, fais l\'édition Scoop et note 3 faits dans ton carnet. Chaque dimanche, relis la semaine et fais une fiche : 5 faits, 5 noms, 3 chiffres.',
        'Les questions portent sur **les personnes** (qui dirige quoi), **les chiffres** (budget, chômage, résultats électoraux), **les lieux** (les pays dans l\'actualité, sur une carte) et **les institutions**. Les médias sont un thème récurrent : rachats, nominations, régulation par l\'Arcom.',
        'Ne te limite pas à la France : **international, sport, culture, sciences** tombent aussi. Varie tes sources, comme l\'éventail de rédactions de Scoop, avec un média étranger par semaine.',
        'Utilise la pile **« À revoir »** de Scoop comme un fichier d\'erreurs : une question ratée deux fois mérite une fiche.',
        'Le jour J, ne bloque pas sur une question : avance, puis reviens-y. Une hésitation entre deux réponses se tranche souvent avec la plus récente ou la plus précise.'
      ],
      sources: [
        { name: 'CFJ : nos conseils', url: 'https://cfjparis.com/admission/concours/nos-conseils/' },
        { name: 'La Fabrique du journalisme', url: 'https://www.lafabriquedujournalisme.fr/preparer-concours-journalisme/' }
      ]
    },
    {
      id: 'synthese', icon: '🧩', title: 'Synthèse et dépêches',
      points: [
        'L\'objectif est de **hiérarchiser** : à partir d\'un dossier (dépêches, articles), tu produis un texte court, factuel et **neutre**, sans opinion.',
        'Méthode **en 4 temps** : (1) lis tout une fois, sans prendre de notes ; (2) surligne les faits nouveaux, les chiffres, les sources et les contradictions ; (3) écris l\'**information principale** en une phrase, qui sera ton attaque ; (4) déroule en pyramide inversée.',
        'Chaque fait **attribué** garde sa source (« selon l\'AFP », « a indiqué la préfecture »). Si deux sources divergent, tu le signales au lieu de choisir.',
        '**Respecte le calibrage** à la ligne près (nombre de signes ou de mots) : c\'est une compétence évaluée.',
        'Entraîne-toi chaque semaine sur l\'une des infos de Scoop : tu prends les 2 à 4 articles cités en sources et tu en fais une synthèse de 1 500 signes.'
      ],
      sources: [
        { name: 'L\'Etudiant (épreuves du CELSA)', url: 'https://www.letudiant.fr/etudes/ecoles-specialisees/le-calendrier-detaille-des-concours-aux-14-ecoles-de-journalisme-reconnues-par-la-profession.html' }
      ]
    },
    {
      id: 'ecrit', icon: '✍️', title: 'Écrit personnel (autoportrait, reportage, sujet libre)',
      points: [
        'Les jurys cherchent **une plume personnelle et structurée**, pas un texte « type concours ». Un style vif, des mots simples et concrets, de la précision.',
        '**Montre, ne dis pas** : une scène, un détail, une citation valent mieux qu\'un adjectif. Au lieu de « J\'ai toujours été curieux », raconte le jour où tu as enquêté sur quelque chose.',
        'Pour l\'**autoportrait** (IFP), choisis **un angle**, pas une biographie. Un objet, un lieu, un moment qui dit qui tu es et pourquoi le journalisme.',
        'Pour le **reportage**, travaille l\'attaque (on est tout de suite dans la scène), la variété des sources (au moins 3 interlocuteurs) et une chute qui ouvre.',
        'Relis-toi pour **l\'orthographe** : c\'est éliminatoire en pratique. Garde 10 minutes de relecture à chaque épreuve.'
      ],
      sources: [
        { name: 'CFJ : nos conseils', url: 'https://cfjparis.com/admission/concours/nos-conseils/' },
        { name: 'L\'Etudiant : conseils', url: 'https://www.letudiant.fr/etudes/3es-cycles-et-masters/concours-d-entree-aux-formations-en-journalisme-les-conseils-pour-bien-preparer-les-epreuves.html' }
      ]
    },
    {
      id: 'dossier', icon: '📁', title: 'Le dossier : CV et lettre de motivation',
      points: [
        'Un **CV journalistique** met en avant les **publications**, les **stages** et les **expériences de terrain** (associatives incluses), avec des liens vers tes productions : articles, podcasts, vidéos.',
        'Ta lettre **prouve au lieu d\'affirmer** : chaque qualité est appuyée par une expérience. Dis **quel journalisme tu veux faire** (local, international, data, enquête, audio…) et **pourquoi cette école** en particulier.',
        'Personnalise pour chaque école : sa spécialité, son média école, ses valeurs. Le copier-coller se voit.',
        'Crée dès maintenant **un portfolio** en ligne (un blog ou une page avec 3 à 5 productions soignées). Scoop t\'en donne la matière : tes titres et attaques de l\'atelier d\'écriture.'
      ],
      sources: [
        { name: 'La Fabrique du journalisme : oraux', url: 'https://www.lafabriquedujournalisme.fr/conseils-oraux-journalisme/' },
        { name: 'L\'Etudiant : conseils', url: 'https://www.letudiant.fr/etudes/3es-cycles-et-masters/concours-d-entree-aux-formations-en-journalisme-les-conseils-pour-bien-preparer-les-epreuves.html' }
      ]
    },
    {
      id: 'oral', icon: '🎤', title: 'L\'oral : réussir l\'entretien',
      points: [
        'Format courant : **au moins 20 minutes**, par exemple environ 25 minutes à Sciences Po. On y parle de ta motivation, de ton parcours, de l\'actualité et parfois de mises en situation ou d\'anglais.',
        'Fais **des oraux blancs** avec des proches ou ton groupe de prépa, et filme-toi. Le simulateur de Scoop te donne les questions qui reviennent.',
        'Prépare **3 histoires** de ton parcours (une réussite, un échec, un moment de terrain) qui répondent à beaucoup de questions.',
        'Le matin même, **écoute les infos** et relis l\'édition Scoop du jour : « Qu\'est-ce qui vous a marqué dans l\'actu ce matin ? » est un classique.',
        'Ce qui fait la différence : savoir dire **quelle forme de journalisme tu veux pratiquer** et avoir un **avis argumenté** sur les médias (sans démolir une rédaction). Prépare aussi des **questions à poser** propres à l\'école.',
        'En visio : une tenue correcte, une pièce calme et un arrière-plan neutre. Regarde la caméra, pas l\'écran.'
      ],
      sources: [
        { name: 'La Fabrique du journalisme : 5 conseils pour les oraux', url: 'https://www.lafabriquedujournalisme.fr/conseils-oraux-journalisme/' },
        { name: 'L\'Etudiant : conseils', url: 'https://www.letudiant.fr/etudes/3es-cycles-et-masters/concours-d-entree-aux-formations-en-journalisme-les-conseils-pour-bien-preparer-les-epreuves.html' },
        { name: 'Diplomeo : concours 2027', url: 'https://diplomeo.com/actualite-concours_ecoles_journalisme' }
      ]
    },
    {
      id: 'primaires', icon: '📜', title: 'Remonter aux sources primaires',
      points: [
        'Une **source primaire** est le document ou le témoin d\'origine : une décision de justice, un texte de loi, un communiqué, un rapport officiel, un jeu de données, un discours intégral. Un article qui en parle est une **source secondaire**.',
        'Pourquoi c\'est un réflexe de journaliste : on **vérifie** ce que dit réellement le texte, on évite le jeu du téléphone (chiffres déformés, citations tronquées) et on peut **citer** précisément.',
        'Où chercher : **Légifrance** et le **Journal officiel** (lois, décrets), les sites de la **Cour de cassation**, du **Conseil constitutionnel** et du **Conseil d\'État** (décisions), l\'**INSEE** et **data.gouv.fr** (chiffres), **EUR-Lex** et le site de la Commission européenne (textes de l\'UE), l\'**ONU** et ses agences (rapports).',
        'Dans l\'édition Scoop, une info affiche **📜 Source primaire** quand l\'un de ses liens pointe vers un site officiel, et propose des **pistes** vers les portails officiels de sa rubrique. Ce sont des pistes à vérifier, pas des liens garantis.',
        'À l\'oral, c\'est un bon réflexe à citer : « Pour cette info, j\'ai regardé le communiqué du ministère plutôt que seulement les articles. » Précise toujours **qui parle** : le texte officiel dit ce qu\'une institution veut dire, pas forcément toute la réalité.'
      ],
      sources: [
        { name: 'Légifrance', url: 'https://www.legifrance.gouv.fr/' },
        { name: 'data.gouv.fr', url: 'https://www.data.gouv.fr/' },
        { name: 'EUR-Lex', url: 'https://eur-lex.europa.eu/' }
      ]
    },
    {
      id: 'anglais', icon: '🗣️', title: 'L\'anglais',
      points: [
        'Beaucoup d\'écoles évaluent l\'anglais, à l\'écrit (compréhension, résumé) ou à l\'oral. Un **bon niveau** fait partie des qualités attendues.',
        'Routine : **un article par jour en anglais**. Les sources internationales de Scoop (BBC, The Guardian, The New York Times, Al Jazeera) sont faites pour ça. Ajoute un podcast d\'info en anglais pendant tes trajets.',
        'Tiens un **carnet de vocabulaire de l\'actualité** : *ceasefire*, *budget deficit*, *runoff*, *indictment*, *press freedom*…',
        'Entraîne-toi à **résumer à voix haute en 1 minute** un article lu en anglais.'
      ],
      sources: [
        { name: 'CFJ : nos conseils', url: 'https://cfjparis.com/admission/concours/nos-conseils/' },
        { name: 'La Chance', url: 'https://www.lachance.media/la-prepa/conseils-pour-les-concours-2/' }
      ]
    },
    {
      id: 'prepas', icon: '🎓', title: 'Prépas, financement, égalité des chances',
      points: [
        'Une prépa **n\'est pas obligatoire** mais peut être très utile, selon le CFJ.',
        '**Gratuite pour les boursiers** : **La Chance**, une prépa fondée par d\'anciens élèves du CFJ. Il existe d\'autres prépas gratuites : regarde les conditions sur leurs sites.',
        '**Payantes** (exemples cités par La Fabrique du journalisme) : l\'**École W** (cours du soir, lancée à l\'initiative du CFJ) et l\'**Académie ESJ Lille**.',
        '**Budget** : certaines écoles reconnues sont privées et chères, comme l\'ESJ Lille. Épargne tôt et renseigne-toi sur les bourses et sur l\'**alternance**, qui existe dans plusieurs cursus.',
        'Pas admis du premier coup ? C\'est fréquent. Les stages, les contrats de professionnalisation et une deuxième tentative sont des voies courantes.'
      ],
      sources: [
        { name: 'CFJ : nos conseils', url: 'https://cfjparis.com/admission/concours/nos-conseils/' },
        { name: 'La Fabrique du journalisme', url: 'https://www.lafabriquedujournalisme.fr/preparer-concours-journalisme/' },
        { name: 'La Chance', url: 'https://www.lachance.media/la-prepa/conseils-pour-les-concours-2/' }
      ]
    },
    {
      id: 'erreurs', icon: '🚫', title: 'Les 10 erreurs qui coûtent cher',
      points: [
        'Rater une date d\'inscription : Sciences Po ferme dès le 11 janvier et l\'ESJ Lille ouvre mi-novembre (session 2026).',
        'Bachoter l\'actualité la dernière semaine au lieu d\'une veille régulière.',
        'Une lettre de motivation générique, identique pour toutes les écoles.',
        'Affirmer des qualités (« curieux, rigoureux ») sans exemple concret.',
        'Ne pas savoir dire quel journalisme on veut faire.',
        'Ne pas connaître l\'école : son média, ses spécialités, ses anciens.',
        'Ne lire qu\'un seul média, ou que des réseaux sociaux.',
        'Des fautes d\'orthographe dans le dossier.',
        'Arriver à l\'oral sans avoir écouté les infos du matin.',
        'Ne tenter qu\'une seule école alors que la sélectivité est très forte.'
      ],
      sources: [
        { name: 'CFJ', url: 'https://cfjparis.com/admission/concours/nos-conseils/' },
        { name: 'La Fabrique du journalisme', url: 'https://www.lafabriquedujournalisme.fr/conseils-oraux-journalisme/' },
        { name: 'L\'Etudiant', url: 'https://www.letudiant.fr/etudes/3es-cycles-et-masters/concours-d-entree-aux-formations-en-journalisme-les-conseils-pour-bien-preparer-les-epreuves.html' }
      ]
    }
  ],

  /* ---------- Ils le disent : conseils PUBLIÉS, résumés et sourcés ---------- */
  voicesNote: 'Ce sont des conseils publiés par des écoles, des prépas et des médias spécialisés, **résumés avec nos mots**, avec le lien vers l\'original. Il n\'y a aucun témoignage inventé : pour lire des retours d\'expérience complets, suis les liens.',
  voices: [
    { who: 'Le CFJ (Paris)', role: 'École reconnue', points: ['Lis la presse **tous les jours**, en diversifiant les titres, et complète avec les hebdomadaires, la radio et la télé.', 'Ne bachote pas : cherche à **comprendre** l\'actualité, pas seulement à la connaître.', 'Le jour J : un style vif, des mots simples et concrets, et surtout être sincère et naturel.'], url: 'https://cfjparis.com/admission/concours/nos-conseils/' },
    { who: 'Un responsable du CELSA, cité par L\'Etudiant', role: 'Jury d\'école', points: ['Ce qui compte : savoir **écrire de manière personnelle et structurée**.', 'Une approche authentique vaut mieux qu\'une candidature standardisée.'], url: 'https://www.letudiant.fr/etudes/3es-cycles-et-masters/concours-d-entree-aux-formations-en-journalisme-les-conseils-pour-bien-preparer-les-epreuves.html' },
    { who: 'Un responsable de formation, cité par L\'Etudiant', role: 'Jury d\'école', points: ['Les candidats retenus après l\'oral sont ceux qui savent dire **quelle forme de journalisme** ils veulent pratiquer.'], url: 'https://www.letudiant.fr/etudes/3es-cycles-et-masters/concours-d-entree-aux-formations-en-journalisme-les-conseils-pour-bien-preparer-les-epreuves.html' },
    { who: 'La Chance', role: 'Prépa gratuite pour les boursiers, fondée par d\'anciens élèves du CFJ', points: ['Cherche un stage, par exemple en **presse quotidienne régionale l\'été**, ou un service civique dans un média associatif.', 'Commence **au moins 6 mois avant**, idéalement en groupe, et tiens des fiches.', 'Soigne le français et l\'anglais, et révise l\'histoire et la géographie.'], url: 'https://www.lachance.media/la-prepa/conseils-pour-les-concours-2/' },
    { who: 'Agathe Legrand, La Fabrique du journalisme', role: 'Ancienne étudiante de l\'École de journalisme de Grenoble, autrice de guides de préparation', points: ['À l\'oral : **« N\'affirme pas, prouve-le ! »** Chaque qualité doit s\'appuyer sur un exemple.', 'Fais un **rétroplanning** : certaines dates de concours se chevauchent.', 'Renseigne-toi à fond sur chaque école et prépare des questions qui lui sont propres.'], url: 'https://www.lafabriquedujournalisme.fr/conseils-oraux-journalisme/' }
  ],

  /* ---------- Le métier aujourd'hui : chiffres et tendances sourcés ---------- */
  metier: [
    { icon: '📱', title: 'Les plateformes passent devant', text: 'Pour la première fois, les réseaux sociaux et plateformes vidéo sont la **première source d\'information** dans le monde (54 % du public). Une majorité regarde des **vidéos d\'info en ligne** chaque semaine (77 %).', source: 'Reuters Institute, Digital News Report 2026', url: 'https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2026/dnr-executive-summary' },
    { icon: '🤝', title: 'La confiance au plus bas', text: 'La confiance dans l\'information tombe à **37 %**, son plus bas niveau depuis le début de l\'étude. **42 %** des sondés disent éviter l\'actualité parfois ou souvent.', source: 'Reuters Institute, Digital News Report 2026', url: 'https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2026/dnr-executive-summary' },
    { icon: '🤖', title: 'Les chatbots s\'invitent dans l\'info', text: 'L\'usage hebdomadaire des **chatbots d\'IA pour s\'informer** passe de 7 % à 10 %, et 16 % chez les moins de 35 ans. Mais seuls 20 % des sondés font confiance à l\'info venue de ces chatbots.', source: 'Reuters Institute, Digital News Report 2026', url: 'https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2026/dnr-executive-summary' },
    { icon: '🪪', title: 'Combien de journalistes ?', text: 'Environ **35 000 cartes de presse** sont attribuées chaque année en France (34 948 en 2024). Les premières demandes étaient en hausse en 2023 (+10,6 %).', source: 'CCIJP, via CB News', url: 'https://www.cbnews.fr/medias/ccijp-hausse-du-nombre-cartes-presse-delivrees-2024' },
    { icon: '⚖️', title: 'Une précarité persistante', text: 'Plus d\'un quart des journalistes encartés sont **pigistes, en CDD ou demandeurs d\'emploi**. Chez les jeunes, la part de pigistes est très majoritaire. Pense-le dès maintenant : réseau, polyvalence, spécialité.', source: 'CCIJP, via CB News', url: 'https://www.cbnews.fr/medias/image-journaliste-plateformes-support-n-est-plus-sujet-benedicte-wautelet-ccijp-91956' },
    { icon: '📜', title: 'L\'IA encadrée par des chartes', text: 'Plusieurs rédactions (Le Figaro, Le Monde, le groupe EBRA…) ont adopté des **chartes d\'usage de l\'IA générative**. France Médias Monde pose un principe clair : l\'usage de l\'IA est **décidé par un humain et validé par un humain**.', source: 'CB News ; France Médias Monde (déc. 2025)', url: 'https://www.cbnews.fr/medias/charte-usage-ia-generative-au-figaro' },
    { icon: '💶', title: 'Médias et IA : les accords de licence', text: 'Des éditeurs signent avec des entreprises d\'IA : **Le Monde** avec OpenAI puis Perplexity, **Le Figaro** avec OpenAI, et l\'**AFP** s\'est alliée au français **Mistral**. C\'est l\'enjeu de la rémunération des contenus, dans la continuité des droits voisins.', source: 'CB News ; Techniques de l\'ingénieur (AFP)', url: 'https://www.cbnews.fr/medias/ia-monde-signe-accord-avec-perplexity' },
    { icon: '🛠️', title: 'Des outils pensés par les rédactions', text: 'Plus de 120 médias de la presse française ont présenté **Spinoza**, un outil d\'IA destiné aux journalistes et testé avec eux. RSF y voit la preuve qu\'un usage responsable est possible **si les journalistes sont impliqués**.', source: 'The Media Leader', url: 'https://fr.themedialeader.com/?p=101788' },
    { icon: '🔎', title: 'Ce que ça change pour toi', text: 'Les compétences recherchées sont la **vérification** (images, vidéos, sources ouvertes ou OSINT), les **formats vidéo verticaux et audio**, la **data**, la **pédagogie** face à la défiance, et la maîtrise critique des **outils d\'IA**. Ce sont d\'excellents sujets pour l\'oral : aie un avis argumenté.', source: 'Synthèse Scoop des sources ci-dessus', url: 'https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2026' }
  ],

  /* ---------- Simulateur d'oral ---------- */
  oral: [
    { q: 'Pourquoi voulez-vous devenir journaliste ?', tip: 'Évite « j\'ai toujours voulu ». Raconte **un déclic concret** (une rencontre, un reportage, une expérience de terrain), puis ce que tu veux apporter.', keys: ['Un déclic ou une expérience concrète', 'Une vision du rôle du journaliste', 'Un lien avec ton parcours', 'Aucune phrase toute faite'] },
    { q: 'Quel journalisme voulez-vous pratiquer ?', tip: 'C\'est LA question qui départage. Nomme un **type** (local, international, data, enquête, audio, vidéo…) et donne **un exemple de média ou de travail** qui t\'inspire.', keys: ['Un type de journalisme précis', 'Un exemple de média ou de journaliste', 'Pourquoi toi, pourquoi ce format', 'Ouverture : prêt à découvrir d\'autres formats'] },
    { q: 'Pourquoi notre école plutôt qu\'une autre ?', tip: 'Cite des éléments **propres à l\'école** (média école, spécialité, partenariats, anciens) et relie-les à ton projet.', keys: ['Au moins 2 éléments propres à l\'école', 'Lien avec ton projet', 'Pas de flatterie générale'] },
    { q: 'Qu\'est-ce qui vous a marqué dans l\'actualité ce matin ?', tip: 'Choisis **une info précise**, résume-la en 2 phrases (qui, quoi, où, quand) et dis **pourquoi elle compte**. Fais l\'édition Scoop le matin même.', keys: ['Une info précise et datée', 'Un résumé factuel en 2 phrases', 'Un enjeu ou une analyse', 'Les sources citées'] },
    { q: 'Quels médias lisez-vous, écoutez-vous ou regardez-vous ?', tip: 'Montre de la **diversité** (presse, radio, télé, pure players, un média étranger) et un **regard critique** : ce que tu apprécies, ce qui manque.', keys: ['Au moins 3 types de médias', 'Un média étranger', 'Un regard critique argumenté'] },
    { q: 'Racontez une expérience de terrain dont vous êtes fier.', tip: 'Structure en **situation → action → résultat → leçon**. Avec des détails concrets : les chiffres, les personnes, les difficultés.', keys: ['Situation claire', 'Ton action personnelle', 'Résultat concret', 'Ce que tu en as appris'] },
    { q: 'Quel est votre plus grand défaut ?', tip: 'Un **vrai défaut** (pas « perfectionniste »), et surtout ce que tu fais **concrètement** pour le corriger.', keys: ['Un vrai défaut', 'Un exemple', 'Une action concrète de correction'] },
    { q: 'Un journaliste doit-il être neutre ?', tip: 'Distingue **neutralité**, **objectivité**, **honnêteté** et **impartialité**. Cite la Charte de Munich (respect de la vérité) et un exemple.', keys: ['Distinction de notions', 'Une référence (charte, déontologie)', 'Un exemple concret', 'Une position nuancée'] },
    { q: 'Que pensez-vous de l\'usage de l\'IA dans les rédactions ?', tip: 'Donne **des faits** (chartes d\'usage, accords de licence, IA décidée et validée par un humain), puis **les risques** (erreurs, deepfakes, droits d\'auteur) et **les opportunités** (transcription, data, vérification).', keys: ['Des faits précis (charte, accord…)', 'Les risques', 'Les opportunités', 'Ta position argumentée'] },
    { q: 'Comment regagner la confiance du public ?', tip: 'Appuie-toi sur **un chiffre** (la confiance à 37 % selon le Reuters Institute 2026), puis des pistes : transparence sur les méthodes, correction des erreurs, proximité, pédagogie, vérification.', keys: ['Un constat chiffré', 'Au moins 2 pistes concrètes', 'Un exemple de média qui le fait'] },
    { q: 'Les réseaux sociaux sont-ils une menace pour le journalisme ?', tip: 'Évite le « oui » ou le « non » tranché. Ils sont la **première source d\'info dans le monde** (Reuters 2026), ce qui crée une concurrence, des risques de désinformation, mais aussi de nouveaux formats et une audience jeune.', keys: ['Un constat chiffré', 'Les risques', 'Les opportunités', 'Une conclusion nuancée'] },
    { q: 'Proposez-nous un sujet de reportage dans notre ville.', tip: 'Un **angle précis** (pas un thème), **3 interlocuteurs** que tu irais voir, le **format** (texte, son, vidéo) et pourquoi maintenant.', keys: ['Un angle précis', '3 interlocuteurs', 'Un format', 'Une raison d\'actualité'] },
    { q: 'Où vous voyez-vous dans 10 ans ?', tip: 'Ambitieux mais crédible : un domaine, un type de média, un rôle. Montre que tu connais **la réalité du métier** (pige, polyvalence).', keys: ['Un domaine précis', 'Lucidité sur le métier', 'Une ambition crédible'] },
    { q: 'Avez-vous une question à nous poser ?', tip: 'Toujours **oui**. Pose une vraie question sur la pédagogie, les stages, le média école ou l\'insertion des anciens, propre à cette école.', keys: ['Une question précise', 'Propre à l\'école', 'Qui montre que tu t\'es renseigné'] }
  ],

  /* ---------- Plan de prépa (cases à cocher persistantes) ---------- */
  checklist: [
    { id: 'c1', text: 'Choisir mes écoles (au moins 4) et noter leurs dates dans un agenda' },
    { id: 'c2', text: 'Mettre la date de mon premier concours dans Profil (compte à rebours)' },
    { id: 'c3', text: 'Faire l\'édition Scoop chaque jour pendant 30 jours (série 🔥 30)' },
    { id: 'c4', text: 'Tenir un carnet de fiches d\'actualité (1 fiche par semaine)' },
    { id: 'c5', text: 'Lire un média étranger au moins une fois par semaine' },
    { id: 'c6', text: 'Trouver un stage, un service civique ou un média étudiant' },
    { id: 'c7', text: 'Créer un portfolio avec 3 à 5 productions' },
    { id: 'c8', text: 'Rédiger mon CV journalistique' },
    { id: 'c9', text: 'Écrire une lettre de motivation de base, puis l\'adapter à chaque école' },
    { id: 'c10', text: 'Télécharger les annales de chaque école visée' },
    { id: 'c11', text: 'Faire 5 synthèses chronométrées' },
    { id: 'c12', text: 'Écrire un autoportrait et un reportage, puis les faire relire' },
    { id: 'c13', text: 'Préparer mes 3 histoires pour l\'oral (réussite, échec, terrain)' },
    { id: 'c14', text: 'Passer les 14 questions du simulateur d\'oral' },
    { id: 'c15', text: 'Faire 3 oraux blancs, dont un filmé' },
    { id: 'c16', text: 'Préparer 2 questions propres à chaque école' },
    { id: 'c17', text: 'Terminer le parcours concours et la Culture G de Scoop' },
    { id: 'c18', text: 'Prévoir le budget (frais de concours, déplacements, scolarité)' }
  ]
};

/* ---------- Quiz de la prépa : unités au format du parcours ---------- */
window.SCOOP_PREPA_UNITS = [
  {
    id: 'pecoles', title: 'Connaître les écoles', subtitle: 'Les 16 cursus reconnus (session 2026)', icon: '🏫', color: '#E63946',
    guide: [
      '16 cursus reconnus par la **CPNEJ** en janvier 2026. La reconnaissance vaut 4 ans, renouvelables.',
      'Accès **post-bac** : les BUT de **Cannes** et de **Lannion** (Parcoursup). Accès **bac+2** : l\'**EJT** à Toulouse (3 ans).',
      'Épreuves emblématiques : la synthèse de dépêches au **CELSA**, l\'autoportrait à l\'**IFP**, le photojournalisme à l\'**IJBA**.',
      'Les calendriers les plus précoces : **Sciences Po** (jusqu\'au 11 janvier) et l\'**ESJ Lille** (inscriptions dès la mi-novembre), pour la session 2026.'
    ],
    lessons: [
      {
        title: 'La carte des écoles', icon: '📍', exercises: [
          { t: 'qcm', q: 'Combien de cursus de journalisme étaient reconnus par la profession (CPNEJ) en janvier 2026 ?', c: ['16', '12', '14', '20'], a: 0, x: 'Il y en avait 16, dont le master de l\'Université de Lorraine à Metz, nouveau en 2026. Les listes plus anciennes en comptaient 14.' },
          { t: 'match', q: 'Associe chaque école à sa ville', pairs: [['IJBA', 'Bordeaux'], ['CUEJ', 'Strasbourg'], ['EPJT', 'Tours'], ['EJCAM', 'Marseille']], x: 'S\'y ajoutent l\'ESJ à Lille, l\'EJT à Toulouse et l\'EJDG à Grenoble. Le CELSA est à Neuilly-sur-Seine, CY Cergy à Gennevilliers et le master de l\'Université de Lorraine à Metz.' },
          { t: 'qcm', q: 'Quels cursus reconnus sont accessibles dès le bac, via Parcoursup ?', c: ['Les BUT de Cannes et de Lannion', 'Le CFJ et l\'ESJ Lille', 'Sciences Po et le CELSA', 'L\'IFP et l\'IPJ'], a: 0, x: 'Ce sont des BUT Information-communication en 3 ans. La plupart des autres cursus se font en 2 ans après une licence.' },
          { t: 'vf', q: 'L\'EJT (Toulouse) accepte des candidats de niveau bac+2, pour un cursus en 3 ans.', a: true, x: 'C\'est une exception dans la liste, qui permet d\'entrer plus tôt.' },
          { t: 'match', q: 'Associe chaque école à son épreuve emblématique', pairs: [['CELSA', 'Synthèse de dépêches'], ['IFP', 'Autoportrait'], ['IJBA', 'Photojournalisme'], ['EJCAM', 'Question sur le projet professionnel']], x: 'Les épreuves changent d\'une école à l\'autre : c\'est pourquoi il faut travailler les annales de chacune.' },
          { t: 'qcm', q: 'Pour la session 2026, quelle école clôturait ses inscriptions dès le 11 janvier ?', c: ['L\'École de journalisme de Sciences Po', 'Le CFJ', 'L\'IJBA', 'L\'EPJT'], a: 0, x: 'L\'ESJ Lille ouvrait aussi très tôt, dès le 15 novembre. Il faut anticiper dès l\'automne.' },
          { t: 'vf', q: 'Il existe un concours commun à toutes les écoles de journalisme reconnues.', a: false, x: 'Chaque école organise son propre concours, contrairement aux écoles de commerce.' }
        ]
      },
      {
        title: 'Coûts et stratégie', icon: '🧮', exercises: [
          { t: 'qcm', q: 'Dans quelle fourchette se situent les frais d\'inscription aux concours (session 2026) ?', c: ['De 0 à 300 €', 'De 500 à 1 000 €', 'Toujours gratuits', 'Environ 50 € partout'], a: 0, x: 'L\'EPJT, Metz et les IUT étaient gratuits ; le CFJ (299 €) et l\'ESJ Lille (290 €) étaient les plus chers. Un tarif réduit existe souvent pour les boursiers.' },
          { t: 'qcm', q: 'Quel est l\'ordre de grandeur du taux de réussite aux concours, selon les estimations publiées ?', c: ['Environ 4 à 10 %', 'Environ 30 %', 'Environ 50 %', 'Plus de 70 %'], a: 0, x: 'Ce sont des estimations, pas des statistiques officielles par école. D\'où l\'intérêt de tenter plusieurs écoles.' },
          { t: 'qcm', q: 'Combien de temps avant les épreuves conseille-t-on au minimum de commencer à se préparer ?', c: ['Au moins 6 mois', '1 semaine', '1 mois', 'Ce n\'est pas utile'], a: 0, x: 'La Chance recommande au moins 6 mois, d\'autres guides conseillent un an, idéalement en groupe.' },
          { t: 'qcm', q: 'Quelle prépa est gratuite pour les candidats boursiers et a été fondée par d\'anciens élèves du CFJ ?', c: ['La Chance', 'L\'École W', 'L\'Académie ESJ Lille', 'Sciences Po'], a: 0, x: 'L\'École W et l\'Académie ESJ Lille sont des prépas payantes.' },
          { t: 'vf', q: 'Une prépa est obligatoire pour réussir les concours.', a: false, x: 'Le CFJ précise qu\'une prépa n\'est pas obligatoire, mais qu\'elle peut être très utile.' },
          { t: 'order', q: 'Remets dans l\'ordre les grandes étapes d\'un concours type', items: ['Inscription en ligne', 'Envoi du dossier et écrits', 'Résultats d\'admissibilité', 'Oral d\'admission', 'Résultats d\'admission'], x: 'Les oraux ont surtout lieu d\'avril à juin, et les résultats arrivent fin mai ou en juin (session 2026).' }
        ]
      }
    ]
  },
  {
    id: 'pmetier', title: 'Le métier aujourd\'hui', subtitle: 'Chiffres, IA, plateformes : de quoi argumenter à l\'oral', icon: '📡', color: '#3A86FF',
    guide: [
      'Reuters Institute 2026 : **54 %** du public s\'informe d\'abord via les réseaux et la vidéo, la confiance dans l\'info est à **37 %** et **42 %** des gens évitent l\'actualité.',
      'Chatbots d\'IA pour s\'informer : **10 %** chaque semaine (16 % chez les moins de 35 ans), mais seulement **20 %** de confiance.',
      'France : environ **35 000 cartes de presse** (34 948 en 2024) et une forte précarité chez les jeunes (pige, CDD).',
      'IA : des chartes d\'usage dans les rédactions et des accords de licence (Le Monde avec OpenAI et Perplexity, AFP avec Mistral).'
    ],
    lessons: [
      {
        title: 'Le paysage en chiffres', icon: '📊', exercises: [
          { t: 'qcm', q: 'Selon le Reuters Institute (2026), quelle part du public s\'informe d\'abord via les réseaux sociaux et les plateformes vidéo ?', c: ['54 %', '12 %', '25 %', '80 %'], a: 0, x: 'C\'est une première : les plateformes passent devant les autres sources d\'information dans le monde.' },
          { t: 'qcm', q: 'Quel est le niveau de confiance dans l\'information mesuré par le Reuters Institute en 2026 ?', c: ['37 %', '60 %', '15 %', '75 %'], a: 0, x: 'C\'est le plus bas niveau depuis le début de l\'étude. C\'est un argument central pour un oral sur la défiance.' },
          { t: 'vf', q: 'Selon le Reuters Institute 2026, 42 % des personnes disent éviter l\'actualité parfois ou souvent.', a: true, x: 'C\'est la « news avoidance », un défi pour toutes les rédactions.' },
          { t: 'qcm', q: 'Combien de cartes de presse la CCIJP a-t-elle délivrées en 2024 ?', c: ['Environ 35 000', 'Environ 5 000', 'Environ 100 000', 'Environ 250 000'], a: 0, x: 'Elle en a délivré 34 948, soit +1,46 % sur un an. Le chiffre est stable autour de 34 000 à 35 000 depuis des années.' },
          { t: 'qcm', q: 'Quelle part du public utilise chaque semaine des chatbots d\'IA pour s\'informer (Reuters 2026) ?', c: ['10 %', '50 %', '1 %', '75 %'], a: 0, x: 'C\'était 7 % l\'année précédente. La part atteint 16 % chez les moins de 35 ans.' },
          { t: 'vf', q: 'Selon la CCIJP, la précarité (pige, CDD) touche particulièrement les jeunes journalistes.', a: true, x: 'Plus d\'un quart des encartés sont pigistes, en CDD ou demandeurs d\'emploi, et la part de pigistes est très majoritaire chez les jeunes.' }
        ]
      },
      {
        title: 'IA et rédactions', icon: '🤖', exercises: [
          { t: 'qcm', q: 'Quel principe France Médias Monde pose-t-il pour l\'usage de l\'IA ?', c: ['L\'usage est décidé par un humain et validé par un humain', 'L\'IA peut publier seule la nuit', 'L\'IA est interdite', 'L\'IA remplace les secrétaires de rédaction'], a: 0, x: 'C\'est un principe du « human in the loop », présent dans la plupart des chartes.' },
          { t: 'match', q: 'Associe chaque média à son partenaire IA', pairs: [['AFP', 'Mistral'], ['Le Monde', 'Perplexity'], ['Le Figaro', 'OpenAI']], x: 'Le Monde avait aussi signé avec OpenAI. Ces accords rémunèrent la réutilisation des contenus de presse.' },
          { t: 'qcm', q: 'Comment s\'appelle l\'outil d\'IA pour journalistes présenté par plus de 120 médias français ?', c: ['Spinoza', 'Voltaire', 'Gutenberg', 'Pascal'], a: 0, x: 'Selon RSF, il montre qu\'un usage responsable est possible si les journalistes sont impliqués.' },
          { t: 'vf', q: 'Plusieurs rédactions françaises ont adopté une charte d\'usage de l\'IA générative.', a: true, x: 'C\'est le cas du Figaro, du Monde et du groupe EBRA, entre autres. Celle d\'EBRA a été contestée en interne.' },
          { t: 'qcm', q: 'Quelle compétence est de plus en plus attendue des jeunes journalistes ?', c: ['La vérification d\'images et de sources ouvertes (OSINT)', 'La calligraphie', 'La sténographie manuelle', 'La typographie au plomb'], a: 0, x: 'On attend aussi les formats vidéo verticaux, la data, l\'audio et la maîtrise critique de l\'IA.' }
        ]
      }
    ]
  },
  {
    id: 'pmethode', title: 'Méthode des épreuves', subtitle: 'QCM, synthèse, écrit, oral : les bons réflexes', icon: '🧠', color: '#2B9348',
    guide: [
      'QCM d\'actu : une veille quotidienne, une fiche par semaine et un carnet d\'erreurs.',
      'Synthèse : lire, surligner, écrire l\'info principale en une phrase, dérouler en pyramide inversée et respecter le calibrage.',
      'Écrit personnel : montrer plutôt que dire, choisir un angle et non une biographie.',
      'Oral : prouver chaque qualité, dire quel journalisme on veut faire, connaître l\'école.'
    ],
    lessons: [
      {
        title: 'Les bons réflexes', icon: '✅', exercises: [
          { t: 'qcm', q: 'Face à deux dépêches qui donnent des chiffres différents, que fais-tu dans une synthèse ?', c: ['Je signale la divergence en attribuant chaque chiffre à sa source', 'Je fais la moyenne', 'Je garde le plus spectaculaire', 'Je n\'en parle pas'], a: 0, x: 'Il faut attribuer, ne jamais trancher sans élément de vérification.' },
          { t: 'qcm', q: 'Quel conseil résume le mieux l\'oral selon La Fabrique du journalisme ?', c: ['« N\'affirme pas, prouve-le ! »', '« Parle le plus possible »', '« Récite ta lettre »', '« Ne pose jamais de question »'], a: 0, x: 'Chaque qualité que tu avances doit s\'appuyer sur un exemple vécu.' },
          { t: 'vf', q: 'Bachoter l\'actualité la dernière semaine est la méthode recommandée par le CFJ.', a: false, x: 'Le CFJ conseille au contraire une lecture quotidienne et diversifiée, pour comprendre l\'actualité et pas seulement la connaître.' },
          { t: 'qcm', q: 'Qu\'est-ce qui départage souvent les candidats à l\'oral, selon un responsable de formation cité par L\'Etudiant ?', c: ['Savoir dire quel journalisme on veut pratiquer', 'Le nombre de diplômes', 'Connaître tous les ministres par cœur', 'Avoir un compte X très suivi'], a: 0, x: 'Un projet clair et argumenté fait la différence.' },
          { t: 'order', q: 'Remets dans l\'ordre la méthode de la synthèse', items: ['Lire tout le dossier une première fois', 'Surligner les faits, chiffres et sources', 'Écrire l\'information principale en une phrase', 'Dérouler en pyramide inversée', 'Relire et vérifier le calibrage'], x: 'La relecture finale (orthographe, calibrage) n\'est jamais optionnelle.' },
          { t: 'vf', q: 'Pour un autoportrait, il vaut mieux choisir un angle (un objet, un lieu, un moment) qu\'une biographie complète.', a: true, x: 'L\'angle rend le texte vivant et personnel, et c\'est ce que cherchent les jurys.' },
          { t: 'qcm', q: 'À l\'oral, à la question « Avez-vous une question à nous poser ? », que réponds-tu ?', c: ['Une question précise et propre à l\'école', '« Non, tout est clair »', '« Combien coûte la cantine ? »', '« Suis-je admis ? »'], a: 0, x: 'Cela montre que tu t\'es renseigné et que tu te projettes dans l\'école.' }
        ]
      }
    ]
  }
];
