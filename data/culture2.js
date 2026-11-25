/* =========================================================
   Scoop — Culture G, suite : institutions, histoire des médias, économie, Europe et ONU, culture et sport.
   Même format que data/culture.js (ajouté à la suite). Uniquement des faits établis et vérifiables.
   Les exercices « write » s'auto-évaluent : proposition de la rédaction + critères à cocher.
   ========================================================= */
window.SCOOP_CULTURE = (window.SCOOP_CULTURE || []).concat([
  /* ------------------------------------------------------- */
  {
    id: 'institutions', title: 'Institutions françaises', subtitle: 'Pouvoirs, textes et procédures', icon: '🏛️', color: '#2F6690',
    guide: [
      `**Constitution de 1958** (Ve République). Le président est élu au suffrage universel direct depuis **1962** ; le mandat dure **5 ans** (quinquennat) depuis le référendum de **2000**.`,
      `**Assemblée nationale** : 577 députés, élus au suffrage direct pour 5 ans. **Sénat** : 348 sénateurs, élus par des grands électeurs (surtout des élus locaux) pour 6 ans, renouvelés **par moitié tous les 3 ans**.`,
      `**Article 12** : dissolution de l'Assemblée. **Article 16** : pouvoirs exceptionnels en cas de crise grave. **Article 49.3** : le gouvernement engage sa responsabilité sur un texte, adopté sauf motion de censure votée par **289 députés** (majorité absolue).`,
      `**Conseil constitutionnel** : 9 membres, mandat de 9 ans non renouvelable. Il contrôle la conformité des lois ; depuis **2010**, tout justiciable peut soulever une **QPC** (question prioritaire de constitutionnalité).`,
      `**Cohabitations** : 1986-1988, 1993-1995, 1997-2002. Un **projet de loi** vient du gouvernement, une **proposition de loi** d'un parlementaire.`
    ],
    lessons: [
      {
        title: 'Les pouvoirs', icon: '⚖️', exercises: [
          { t: 'qcm', q: `Combien de députés siègent à l'Assemblée nationale ?`, c: [`577`, `348`, `289`, `650`], a: 0, x: `Ils sont élus pour 5 ans au suffrage universel direct. 289 est la majorité absolue, et 348 le nombre de sénateurs.` },
          { t: 'qcm', q: `Qui élit les sénateurs ?`, c: [`Un collège de grands électeurs, surtout des élus locaux`, `Tous les citoyens, au suffrage direct`, `Le président de la République`, `Les seuls députés`], a: 0, x: `Le Sénat est élu au suffrage indirect, pour 6 ans, avec un renouvellement par moitié tous les 3 ans.` },
          { t: 'vf', q: `Depuis 2000, le mandat du président de la République dure 5 ans.`, a: true, x: `Le quinquennat a été adopté par référendum le 24 septembre 2000 et s'applique depuis l'élection de 2002.` },
          { t: 'qcm', q: `Quel article de la Constitution permet au président de dissoudre l'Assemblée nationale ?`, c: [`L'article 12`, `L'article 16`, `L'article 49`, `L'article 89`], a: 0, x: `L'article 16 donne des pouvoirs exceptionnels en cas de crise, le 49 engage la responsabilité du gouvernement, le 89 organise la révision de la Constitution.` },
          { t: 'qcm', q: `Combien de membres compte le Conseil constitutionnel (hors anciens présidents de la République) ?`, c: [`9, pour un mandat de 9 ans non renouvelable`, `12, pour un mandat de 6 ans`, `7, pour un mandat de 5 ans`, `15, pour un mandat à vie`], a: 0, x: `Il siège au Palais-Royal à Paris et contrôle la conformité des lois à la Constitution.` },
          { t: 'match', q: `Associe chaque institution à son rôle`, pairs: [[`Conseil d'État`, `Juge suprême de l'ordre administratif, conseiller du gouvernement`], [`Cour de cassation`, `Juge suprême de l'ordre judiciaire`], [`Cour des comptes`, `Contrôle l'usage de l'argent public`], [`Conseil constitutionnel`, `Vérifie la conformité des lois à la Constitution`]], x: `Quatre institutions à ne pas confondre : deux ordres de juridiction, un contrôle des finances publiques et un contrôle de constitutionnalité.` },
          { t: 'order', q: `Remets dans l'ordre le parcours simplifié d'une loi`, items: [`Dépôt du projet ou de la proposition de loi`, `Examen et vote par l'Assemblée et le Sénat`, `Saisine éventuelle du Conseil constitutionnel`, `Promulgation par le président de la République`, `Publication au Journal officiel`], x: `La loi entre en vigueur après sa promulgation et sa publication au Journal officiel.` }
        ]
      },
      {
        title: 'Procédures et vocabulaire', icon: '📑', exercises: [
          { t: 'qcm', q: `Que permet l'article 49.3 de la Constitution ?`, c: [`Au gouvernement d'engager sa responsabilité sur un texte, adopté sauf motion de censure`, `Au président de dissoudre l'Assemblée`, `Au Sénat de bloquer une loi`, `Aux citoyens de convoquer un référendum`], a: 0, x: `Le texte est considéré comme adopté sans vote, sauf si une motion de censure est votée.` },
          { t: 'qcm', q: `Combien de voix faut-il pour adopter une motion de censure ?`, c: [`La majorité absolue des députés (289)`, `La majorité des votants présents`, `Les deux tiers des députés`, `Un tiers des sénateurs`], a: 0, x: `Seuls les votes favorables comptent, et il faut 289 voix sur 577 députés.` },
          { t: 'vf', q: `Le Premier ministre est élu par l'Assemblée nationale.`, a: false, x: `Il est nommé par le président de la République et il est responsable devant l'Assemblée.` },
          { t: 'qcm', q: `Qu'appelle-t-on une cohabitation ?`, c: [`Un président et un gouvernement issus de camps politiques opposés`, `Un gouvernement formé de deux partis alliés`, `Un président qui exerce deux mandats`, `Deux chambres du Parlement qui siègent ensemble`], a: 0, x: `La France a connu trois cohabitations : 1986-1988, 1993-1995 et 1997-2002.` },
          { t: 'qcm', q: `Depuis quelle année les citoyens peuvent-ils soulever une QPC ?`, c: [`2010`, `1958`, `1971`, `2000`], a: 0, x: `La question prioritaire de constitutionnalité est issue de la révision de 2008 et s'applique depuis le 1er mars 2010.` },
          { t: 'input', q: `Quel organe vote la loi de finances, c'est-à-dire le budget de l'État ?`, a: [`Le Parlement`, `Parlement`, `Assemblée nationale et Sénat`], hint: `Deux assemblées, une seule réponse.`, x: `Le gouvernement prépare le projet, mais c'est le Parlement qui le vote.` },
          { t: 'write', q: `Explique en deux phrases la différence entre un projet de loi et une proposition de loi.`, model: `**Un projet de loi** est déposé par le gouvernement, sur décision du Premier ministre. **Une proposition de loi** est déposée par un parlementaire, député ou sénateur. Dans les deux cas, le texte est ensuite examiné par les deux assemblées.`, crit: [`J'ai dit qui dépose chaque type de texte`, `J'ai cité le gouvernement et les parlementaires`, `J'ai fait deux phrases claires, avec mes mots`] }
        ]
      }
    ]
  },
  /* ------------------------------------------------------- */
  {
    id: 'histmedias', title: 'Histoire des médias', subtitle: 'Presse, radio, télé et déontologie', icon: '📰', color: '#C44536',
    guide: [
      `**1631** : *La Gazette* de Théophraste Renaudot, premier journal périodique français. **1835** : agence Havas, ancêtre de l'AFP (créée en 1944).`,
      `**29 juillet 1881** : loi sur la liberté de la presse (elle encadre aussi la diffamation et l'injure). **13 janvier 1898** : « J'accuse… ! » d'Émile Zola dans *L'Aurore*.`,
      `**1915** : *Le Canard enchaîné*. **1944** : *Le Monde* (Hubert Beuve-Méry). **1970** : *Charlie Hebdo*. **1973** : *Libération*.`,
      `Audiovisuel : **1974** éclatement de l'ORTF ; **1981** fin du monopole d'État sur la radio (radios libres) ; **2022** : l'**Arcom** (fusion du CSA et de la Hadopi) régule l'audiovisuel.`,
      `Déontologie : **charte de Munich (1971)**, secret des sources, recoupement, droit de réponse. **Prix Albert-Londres** (1933) pour le grand reportage.`
    ],
    lessons: [
      {
        title: 'Grandes dates de la presse', icon: '🗞️', exercises: [
          { t: 'qcm', q: `Quel est le premier journal périodique français, fondé en 1631 ?`, c: [`La Gazette de Théophraste Renaudot`, `Le Figaro`, `Le Moniteur universel`, `Le Journal des savants`], a: 0, x: `Renaudot lance *La Gazette* avec le soutien de Richelieu. *Le Journal des savants* date de 1665.` },
          { t: 'qcm', q: `Quelle loi de 1881 fonde la liberté de la presse en France ?`, c: [`La loi du 29 juillet 1881`, `La loi du 9 novembre 1981`, `La loi Bichet de 1947`, `La loi de séparation de 1905`], a: 0, x: `Elle supprime l'autorisation préalable et la censure, et définit les abus (diffamation, injure) que le juge peut sanctionner.` },
          { t: 'qcm', q: `Dans quel journal Émile Zola a-t-il publié « J'accuse… ! » en janvier 1898 ?`, c: [`L'Aurore`, `Le Figaro`, `Le Petit Journal`, `La Croix`], a: 0, x: `La lettre ouverte au président Félix Faure, parue à la une de *L'Aurore* le 13 janvier 1898, relance l'affaire Dreyfus.` },
          { t: 'match', q: `Associe chaque titre de presse à son année de création`, pairs: [[`Le Canard enchaîné`, `1915`], [`Le Monde`, `1944`], [`Charlie Hebdo`, `1970`], [`Libération`, `1973`]], x: `*Le Monde* naît à la Libération, *Libération* est fondé en 1973 avec Jean-Paul Sartre.` },
          { t: 'vf', q: `L'agence Havas, ancêtre de l'AFP, a été créée en 1835.`, a: true, x: `Charles-Louis Havas fonde l'une des premières agences de presse au monde. L'AFP naît en 1944.` },
          { t: 'qcm', q: `En quelle année la fin du monopole d'État sur la radio autorise-t-elle les radios libres ?`, c: [`1981`, `1974`, `1968`, `1986`], a: 0, x: `La loi du 9 novembre 1981 met fin au monopole. L'ORTF avait éclaté en 1974.` },
          { t: 'order', q: `Remets ces événements de l'histoire des médias dans l'ordre chronologique`, items: [`La Gazette de Renaudot`, `Loi sur la liberté de la presse`, `« J'accuse… ! » de Zola`, `Création du Monde`, `Les radios libres sont autorisées`], x: `1631 → 1881 → 1898 → 1944 → 1981.` }
        ]
      },
      {
        title: 'Déontologie et droit', icon: '🧭', exercises: [
          { t: 'qcm', q: `Que protège le secret des sources ?`, c: [`Le droit du journaliste de ne pas révéler qui lui a donné une information`, `Le droit de ne jamais être poursuivi en justice`, `L'anonymat des journalistes`, `Le secret des délibérations du jury`], a: 0, x: `C'est une garantie pour les lanceurs d'alerte et les témoins, inscrite dans la loi de 2010 en France.` },
          { t: 'qcm', q: `Qu'est-ce que la charte de Munich de 1971 ?`, c: [`Une déclaration des devoirs et des droits des journalistes`, `Un traité sur la propriété des médias`, `Une loi allemande sur la presse`, `Un code de la publicité`], a: 0, x: `Elle a été adoptée par des syndicats de journalistes de la Communauté européenne. Elle insiste sur la vérité, l'honnêteté et le respect des sources.` },
          { t: 'match', q: `Associe chaque notion à sa définition`, pairs: [[`Diffamation`, `Allégation d'un fait précis qui porte atteinte à l'honneur`], [`Injure`, `Expression outrageante, sans fait précis`], [`Droit de réponse`, `Faculté pour une personne nommée de faire publier sa réponse`], [`Droit à l'image`, `Pouvoir de s'opposer à la diffusion de son image sans accord`]], x: `Diffamation et injure sont définies par la loi de 1881. Le droit de réponse protège la personne mise en cause.` },
          { t: 'vf', q: `Un journaliste peut publier une rumeur tant qu'il cite « une source proche du dossier ».`, a: false, x: `Il doit vérifier et recouper l'information avant de la publier. Une source anonyme ne dispense pas de vérifier.` },
          { t: 'qcm', q: `Quelle autorité régule l'audiovisuel en France depuis 2022 ?`, c: [`L'Arcom`, `Le CSA seul`, `La Hadopi seule`, `L'Autorité de la concurrence`], a: 0, x: `L'Arcom est née au 1er janvier 2022 de la fusion du CSA et de la Hadopi.` },
          { t: 'qcm', q: `Que désigne la pratique du recoupement ?`, c: [`Confirmer une information auprès d'au moins deux sources indépendantes`, `Couper un article pour qu'il tienne en page`, `Citer deux fois la même source`, `Relire un article avant publication`], a: 0, x: `C'est la base de la vérification : une information n'est solide que si elle est confirmée par des sources indépendantes.` },
          { t: 'qcm', q: `Quel prix récompense chaque année un grand reportage francophone ?`, c: [`Le prix Albert-Londres`, `Le prix Goncourt`, `Le prix Pulitzer`, `Le prix Renaudot`], a: 0, x: `Créé en 1933, il porte le nom du grand reporter Albert Londres. Le Pulitzer est américain.` },
          { t: 'write', q: `En trois phrases, explique pourquoi le recoupement est la base du métier de journaliste.`, model: `**Une information fausse publiée par un média perd sa crédibilité et peut nuire à des personnes.** Le recoupement consiste à la confirmer auprès d'au moins deux sources indépendantes avant de la publier. C'est ce qui distingue un journaliste d'une simple rumeur sur les réseaux.`, crit: [`J'ai expliqué le risque d'une info fausse`, `J'ai défini le recoupement (deux sources indépendantes)`, `J'ai fait le lien avec la crédibilité du journaliste`] }
        ]
      }
    ]
  },
  /* ------------------------------------------------------- */
  {
    id: 'economie', title: 'Économie et société', subtitle: 'Indicateurs, budget, protection sociale', icon: '📈', color: '#BC6C25',
    guide: [
      `**PIB** : richesse produite sur un territoire en un an. **Inflation** : hausse générale et durable des prix, mesurée en France par l'Insee (indice des prix à la consommation). **Récession** : en général deux trimestres consécutifs de baisse du PIB.`,
      `**Déficit** : l'écart d'une année entre dépenses et recettes. **Dette** : l'ensemble des déficits accumulés. Critères de **Maastricht** (traité de 1992) : déficit sous **3 %** du PIB, dette sous **60 %**.`,
      `**SMIC** : salaire minimum légal depuis **1970** (il remplace le SMIG de 1950). **Sécurité sociale** : **1945**. **RSA** : 2009, il remplace le RMI (1988).`,
      `Institutions : **Insee** (statistiques), **BCE** (Francfort, taux directeurs de la zone euro), **FMI** et Banque mondiale (Bretton Woods, 1944), **OMC** (Genève, 1995), OCDE (Paris).`,
      `Le **budget de l'État** est voté par le Parlement (loi de finances). Taux normal de **TVA** : 20 %. Trois fonctions publiques : État, territoriale, hospitalière.`
    ],
    lessons: [
      {
        title: 'Les indicateurs', icon: '📊', exercises: [
          { t: 'qcm', q: `Que mesure le PIB ?`, c: [`La richesse produite sur un territoire pendant une année`, `La dette de l'État`, `Le niveau des prix`, `Le nombre de chômeurs`], a: 0, x: `PIB signifie produit intérieur brut. Il sert à mesurer la croissance, c'est-à-dire sa variation d'une année sur l'autre.` },
          { t: 'qcm', q: `Qu'appelle-t-on l'inflation ?`, c: [`Une hausse générale et durable des prix`, `Une hausse du chômage`, `Une baisse du PIB`, `Une hausse des impôts`], a: 0, x: `En France, l'Insee la mesure avec l'indice des prix à la consommation.` },
          { t: 'vf', q: `Le déficit public et la dette publique désignent la même chose.`, a: false, x: `Le déficit est l'écart d'une année entre dépenses et recettes. La dette est l'accumulation des déficits passés, qu'il faut rembourser.` },
          { t: 'qcm', q: `Comment définit-on couramment une récession ?`, c: [`Deux trimestres consécutifs de baisse du PIB`, `Une hausse de l'inflation sur un an`, `Un déficit supérieur à 3 %`, `Une baisse du SMIC`], a: 0, x: `C'est une convention utilisée par les économistes et les médias, surtout pour comparer les pays.` },
          { t: 'qcm', q: `Quel plafond de déficit public fixent les critères de Maastricht ?`, c: [`3 % du PIB`, `5 % du PIB`, `1 % du PIB`, `60 % du PIB`], a: 0, x: `Le plafond de dette est de 60 % du PIB. Le traité de Maastricht a été signé en 1992.` },
          { t: 'match', q: `Associe chaque organisme à sa mission`, pairs: [[`Insee`, `Produire les statistiques officielles`], [`BCE`, `Gérer la monnaie unique, siège à Francfort`], [`FMI`, `Prêter aux États en difficulté et surveiller la stabilité financière`], [`OMC`, `Fixer les règles du commerce mondial, à Genève`]], x: `Quatre sigles qui reviennent chaque semaine dans l'actualité économique.` },
          { t: 'vf', q: `Le SMIC est le salaire minimum légal en France, créé en 1970.`, a: true, x: `Il remplace le SMIG (salaire minimum interprofessionnel garanti) de 1950 et est revalorisé chaque année.` }
        ]
      },
      {
        title: 'Budget et protection sociale', icon: '🧾', exercises: [
          { t: 'qcm', q: `Qui vote le budget de l'État ?`, c: [`Le Parlement`, `Le Premier ministre seul`, `La Cour des comptes`, `La Banque de France`], a: 0, x: `Le gouvernement prépare le projet de loi de finances ; les députés et les sénateurs le votent à l'automne.` },
          { t: 'qcm', q: `Quelles sont les trois fonctions publiques françaises ?`, c: [`D'État, territoriale et hospitalière`, `D'État, régionale et militaire`, `Nationale, départementale et communale`, `Centrale, locale et judiciaire`], a: 0, x: `La fonction publique d'État, territoriale (communes, départements, régions) et hospitalière.` },
          { t: 'qcm', q: `Quelle prestation le RSA a-t-il remplacée en 2009 ?`, c: [`Le RMI`, `Le SMIG`, `L'ARE`, `L'APL`], a: 0, x: `Le revenu minimum d'insertion (RMI) datait de 1988. Le revenu de solidarité active (RSA) l'a remplacé.` },
          { t: 'qcm', q: `En quelle année la Sécurité sociale a-t-elle été créée ?`, c: [`1945`, `1936`, `1958`, `1981`], a: 0, x: `Elle est créée par les ordonnances d'octobre 1945, à la Libération.` },
          { t: 'qcm', q: `Quel est le taux normal de la TVA en France ?`, c: [`20 %`, `5,5 %`, `10 %`, `25 %`], a: 0, x: `Il existe aussi des taux réduits : 10 %, 5,5 % et 2,1 %.` },
          { t: 'vf', q: `La Banque centrale européenne fixe les taux directeurs de la zone euro.`, a: true, x: `Elle a son siège à Francfort. La Banque de France fait partie du système européen de banques centrales.` },
          { t: 'input', q: `Dans quelle ville se trouve le siège de la Banque centrale européenne ?`, a: [`Francfort`, `Frankfurt`, `Francfort-sur-le-Main`], x: `La BCE a été créée en 1998 pour gérer l'euro.` },
          { t: 'write', q: `Explique avec tes mots la différence entre le déficit et la dette, avec une image simple.`, model: `**Le déficit, c'est ce qui manque sur une seule année :** l'État dépense plus qu'il ne reçoit. **La dette, c'est le total** de tous les déficits passés, qu'il doit rembourser avec des intérêts. Image : le déficit est le découvert du mois, la dette est le crédit qu'on accumule.`, crit: [`J'ai précisé que le déficit se calcule sur une année`, `J'ai précisé que la dette est un total accumulé`, `J'ai donné une image ou un exemple simple`] }
        ]
      }
    ]
  },
  /* ------------------------------------------------------- */
  {
    id: 'europemonde', title: 'Europe et organisations', subtitle: 'UE, ONU, justice internationale', icon: '🇪🇺', color: '#1D4ED8',
    guide: [
      `**9 mai 1950** : déclaration Schuman. **1957** : traité de Rome, 6 pays (Allemagne de l'Ouest, Belgique, France, Italie, Luxembourg, Pays-Bas). **1992** : traité de Maastricht, qui crée l'Union européenne (en vigueur en 1993). **2002** : billets et pièces en euros.`,
      `Brexit : référendum le **23 juin 2016**, sortie effective le **31 janvier 2020**. Institutions : Commission (propose), Parlement européen (élu au suffrage direct), Conseil de l'UE, Conseil européen, Cour de justice (Luxembourg).`,
      `Le **Conseil de l'Europe** (Strasbourg, 1949) n'est pas l'UE : il abrite la Cour européenne des droits de l'homme.`,
      `**ONU** : 1945, siège à New York. Conseil de sécurité : 15 membres dont 5 permanents avec droit de veto (États-Unis, Russie, Chine, France, Royaume-Uni). **OTAN** : 1949, siège à Bruxelles.`,
      `**CIJ** (La Haye) : juge les différends entre États. **CPI** (La Haye, statut de Rome 1998, en vigueur en 2002) : juge des individus pour génocide, crimes contre l'humanité et crimes de guerre.`
    ],
    lessons: [
      {
        title: `L'Union européenne`, icon: '🇪🇺', exercises: [
          { t: 'qcm', q: `Combien de pays ont signé le traité de Rome en 1957 ?`, c: [`6`, `9`, `12`, `15`], a: 0, x: `L'Allemagne de l'Ouest, la Belgique, la France, l'Italie, le Luxembourg et les Pays-Bas créent la Communauté économique européenne.` },
          { t: 'qcm', q: `Quel traité a créé l'Union européenne ?`, c: [`Le traité de Maastricht`, `Le traité de Rome`, `Le traité de Lisbonne`, `Le traité de Versailles`], a: 0, x: `Signé en 1992, entré en vigueur en 1993. Le traité de Lisbonne (2007) a réformé le fonctionnement de l'Union.` },
          { t: 'match', q: `Associe chaque institution européenne à son rôle`, pairs: [[`Commission européenne`, `Propose les textes et veille à l'application des traités`], [`Parlement européen`, `Vote les lois avec le Conseil, élu au suffrage direct`], [`Conseil européen`, `Réunit les chefs d'État et de gouvernement`], [`Cour de justice de l'UE`, `Veille au respect du droit de l'Union, à Luxembourg`]], x: `Le Parlement européen est élu au suffrage universel direct depuis 1979.` },
          { t: 'vf', q: `Le Conseil de l'Europe et l'Union européenne sont la même organisation.`, a: false, x: `Le Conseil de l'Europe (Strasbourg, 1949) compte plus de pays que l'UE et abrite la Cour européenne des droits de l'homme.` },
          { t: 'qcm', q: `Quand le Royaume-Uni a-t-il quitté officiellement l'Union européenne ?`, c: [`Le 31 janvier 2020`, `Le 23 juin 2016`, `Le 1er janvier 2021`, `Le 29 mars 2017`], a: 0, x: `Le référendum a eu lieu le 23 juin 2016. La période de transition s'est achevée fin 2020.` },
          { t: 'qcm', q: `Quelle date célèbre la Journée de l'Europe ?`, c: [`Le 9 mai`, `Le 14 juillet`, `Le 11 novembre`, `Le 1er mai`], a: 0, x: `Elle rappelle la déclaration de Robert Schuman, le 9 mai 1950, qui propose de mettre en commun le charbon et l'acier.` },
          { t: 'order', q: `Remets ces étapes de la construction européenne dans l'ordre`, items: [`Déclaration Schuman`, `Traité de Rome`, `Traité de Maastricht`, `Billets et pièces en euros`, `Brexit effectif`], x: `1950 → 1957 → 1992 → 2002 → 2020.` }
        ]
      },
      {
        title: 'ONU et justice internationale', icon: '🌍', exercises: [
          { t: 'qcm', q: `Quels sont les cinq membres permanents du Conseil de sécurité de l'ONU ?`, c: [`États-Unis, Russie, Chine, France, Royaume-Uni`, `États-Unis, Russie, Chine, France, Allemagne`, `États-Unis, Russie, Inde, France, Royaume-Uni`, `États-Unis, Japon, Chine, France, Royaume-Uni`], a: 0, x: `Les cinq vainqueurs de 1945 disposent d'un droit de veto. Le Conseil compte 15 membres au total.` },
          { t: 'qcm', q: `Où se trouve le siège de l'ONU ?`, c: [`À New York`, `À Genève`, `À La Haye`, `À Bruxelles`], a: 0, x: `L'ONU a aussi un grand bureau à Genève. La CIJ et la CPI siègent à La Haye.` },
          { t: 'qcm', q: `Que juge la Cour pénale internationale (CPI) ?`, c: [`Des individus accusés de génocide, de crimes contre l'humanité ou de crimes de guerre`, `Des différends entre États`, `Des litiges commerciaux`, `Des violations de la Convention européenne des droits de l'homme`], a: 0, x: `La Cour internationale de justice (CIJ), organe de l'ONU, juge les différends entre États. Les deux siègent à La Haye.` },
          { t: 'match', q: `Associe chaque organisation à son siège`, pairs: [[`OTAN`, `Bruxelles`], [`OMS`, `Genève`], [`CPI`, `La Haye`], [`Cour européenne des droits de l'homme`, `Strasbourg`]], x: `Des sièges à connaître pour ne pas confondre les institutions.` },
          { t: 'vf', q: `Un membre permanent du Conseil de sécurité peut bloquer une résolution par son veto.`, a: true, x: `Un seul veto suffit à empêcher l'adoption d'une résolution, même si les autres membres votent pour.` },
          { t: 'qcm', q: `En quelle année l'ONU a-t-elle été créée ?`, c: [`1945`, `1919`, `1948`, `1957`], a: 0, x: `La Charte est signée à San Francisco en juin 1945. La Société des Nations, son ancêtre, datait de 1919.` },
          { t: 'write', q: `Explique en deux phrases ce qu'est le droit de veto à l'ONU et pourquoi on le critique.`, model: `**Le droit de veto permet à l'un des cinq membres permanents du Conseil de sécurité de bloquer une résolution,** même soutenue par tous les autres. On le critique parce qu'il peut paralyser l'ONU quand un de ces États, ou l'un de ses alliés, est concerné par une crise.`, crit: [`J'ai nommé les membres permanents ou leur statut`, `J'ai expliqué que le veto bloque une résolution`, `J'ai donné une raison de la critique (blocage, paralysie)`] }
        ]
      }
    ]
  },
  /* ------------------------------------------------------- */
  {
    id: 'cultpop', title: 'Culture, sport et numérique', subtitle: 'Cinéma, prix, sport, internet', icon: '🎬', color: '#D6336C',
    guide: [
      `**28 décembre 1895** : première séance publique payante du cinématographe des frères Lumière, à Paris. **Festival de Cannes** : créé en 1946. **Palmes d'or** : *Parasite* (2019), *Titane* de Julia Ducournau (2021), *Anatomie d'une chute* de Justine Triet (2023).`,
      `Prix : **Goncourt** (littérature, annoncé en novembre), **César** (cinéma, depuis 1976), **Albert-Londres** (reportage, 1933), **Nobel de littérature 2022** : Annie Ernaux.`,
      `Sport : JO modernes à **Athènes en 1896** (Pierre de Coubertin) ; Paris a accueilli les JO d'été en **1900, 1924 et 2024**. Football : France championne du monde en **1998** et **2018**. **Tour de France** : 1903, lancé par le journal *L'Auto*.`,
      `Numérique : Wikipédia (**2001**), YouTube (**2005**), iPhone (**2007**), ChatGPT (**novembre 2022**). **Notre-Dame de Paris** : incendie le **15 avril 2019**.`
    ],
    lessons: [
      {
        title: 'Cinéma, lettres et prix', icon: '🎞️', exercises: [
          { t: 'qcm', q: `Quand a eu lieu la première séance publique payante du cinématographe des frères Lumière ?`, c: [`Le 28 décembre 1895`, `Le 14 juillet 1900`, `Le 1er janvier 1900`, `Le 5 mai 1889`], a: 0, x: `Elle se tient à Paris, au Grand Café, boulevard des Capucines.` },
          { t: 'qcm', q: `Quel film sud-coréen a obtenu la Palme d'or 2019, puis l'Oscar du meilleur film ?`, c: [`Parasite`, `Oldboy`, `Burning`, `Decision to Leave`], a: 0, x: `*Parasite* de Bong Joon-ho est le premier film en langue non anglaise à recevoir l'Oscar du meilleur film.` },
          { t: 'qcm', q: `Quelle réalisatrice française a reçu la Palme d'or en 2023 pour *Anatomie d'une chute* ?`, c: [`Justine Triet`, `Julia Ducournau`, `Céline Sciamma`, `Mati Diop`], a: 0, x: `Julia Ducournau l'avait reçue en 2021 pour *Titane*.` },
          { t: 'match', q: `Associe chaque prix à son domaine`, pairs: [[`Goncourt`, `Roman`], [`César`, `Cinéma français`], [`Albert-Londres`, `Grand reportage`], [`Molière`, `Théâtre`]], x: `Le Goncourt est annoncé chaque année en novembre, les Césars existent depuis 1976.` },
          { t: 'qcm', q: `Quelle autrice française a reçu le prix Nobel de littérature en 2022 ?`, c: [`Annie Ernaux`, `Marguerite Duras`, `Yasmina Reza`, `Leïla Slimani`], a: 0, x: `Son œuvre mêle récit personnel et regard sociologique.` },
          { t: 'vf', q: `Le Festival de Cannes a été créé en 1946.`, a: true, x: `La première édition se tient en septembre 1946. Le festival se déroule aujourd'hui en mai.` },
          { t: 'qcm', q: `Quel musée parisien abrite *La Joconde* ?`, c: [`Le Louvre`, `Le musée d'Orsay`, `Le Centre Pompidou`, `L'Orangerie`], a: 0, x: `Le tableau de Léonard de Vinci est exposé au Louvre, le musée le plus visité du monde.` }
        ]
      },
      {
        title: 'Sport et numérique', icon: '🏅', exercises: [
          { t: 'qcm', q: `Qui est à l'origine des Jeux olympiques modernes, organisés à Athènes en 1896 ?`, c: [`Pierre de Coubertin`, `Jules Rimet`, `Henri Desgrange`, `Avery Brundage`], a: 0, x: `Jules Rimet a créé la Coupe du monde de football, Henri Desgrange le Tour de France.` },
          { t: 'qcm', q: `En quelles années Paris avait-elle déjà accueilli les Jeux olympiques d'été avant 2024 ?`, c: [`1900 et 1924`, `1896 et 1900`, `1924 et 1948`, `1900 et 1936`], a: 0, x: `Paris 2024 était donc sa troisième édition, cent ans après celle de 1924.` },
          { t: 'qcm', q: `En quelles années l'équipe de France masculine a-t-elle gagné la Coupe du monde de football ?`, c: [`1998 et 2018`, `1984 et 2000`, `1998 et 2006`, `2006 et 2018`], a: 0, x: `1984 et 2000 sont ses victoires au championnat d'Europe.` },
          { t: 'match', q: `Associe chaque service ou produit à son année de lancement`, pairs: [[`Wikipédia`, `2001`], [`YouTube`, `2005`], [`iPhone`, `2007`], [`ChatGPT`, `2022`]], x: `Quatre outils qui ont changé la manière de s'informer.` },
          { t: 'qcm', q: `Quand a eu lieu l'incendie de Notre-Dame de Paris ?`, c: [`Le 15 avril 2019`, `Le 14 juillet 2018`, `Le 13 novembre 2015`, `Le 7 janvier 2015`], a: 0, x: `La cathédrale a rouvert au public en décembre 2024, après cinq ans de travaux.` },
          { t: 'qcm', q: `Quel journal est à l'origine du Tour de France, en 1903 ?`, c: [`L'Auto`, `L'Équipe`, `Le Petit Journal`, `Le Figaro`], a: 0, x: `*L'Auto*, dirigé par Henri Desgrange, a lancé la course pour vendre plus de journaux. *L'Équipe* lui a succédé en 1946.` },
          { t: 'write', q: `Présente en trois phrases un événement culturel ou sportif récent (film, livre, match, festival) et explique pourquoi il compte.`, model: `**Structure possible :** une première phrase qui donne le fait (quoi, qui, quand), une deuxième qui apporte un détail précis (résultat, chiffre, récompense), une troisième qui dit pourquoi cela compte (impact, public, enjeu).`, crit: [`J'ai donné le fait précis (quoi, qui, quand)`, `J'ai ajouté un détail vérifiable (résultat, chiffre, nom)`, `J'ai expliqué pourquoi cet événement compte`] }
        ]
      }
    ]
  }
]);
