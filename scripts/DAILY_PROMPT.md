# Scoop : consigne de mise à jour quotidienne

Ce fichier est la consigne qu'exécute la routine chaque matin (ou que tu peux donner à Claude à la main).
Trois règles passent avant tout le reste :

1. **Aucune invention** : n'utilise que les faits présents dans `scripts/news-today.txt` (ta mémoire de l'actualité récente n'est pas fiable).
2. **Double vérification** : chaque info retenue doit être couverte par **au moins 2 rédactions différentes** dans `news-today.txt`, et tu cites ces 2 sources (ou plus), avec leurs URL.
3. **Questions = brief** : chaque question des leçons doit pouvoir se résoudre **uniquement en lisant le brief du jour** (titres, textes, « Bon à savoir », mémo, mot du jour). Si une question demande un savoir de contexte (date d'une loi, article de la Constitution…), ce savoir doit être écrit dans le `why` ou le `text` d'une info.

## Étapes

1. Détermine la date du jour au format `AAAA-MM-JJ` (fuseau Europe/Paris). Si `data/days/<date>.js` existe déjà, arrête-toi, **sauf** si sa première ligne contient `SCOOP:REGENERER`. Dans ce cas, régénère-le entièrement (le nouveau fichier ne doit plus contenir ce marqueur) et, dans `index.js`, **remplace** l'entrée de cette date au lieu d'en ajouter une seconde.
   La structure de référence est `data/days/_modele.js`. Ne modifie jamais ce fichier et ne l'ajoute pas à `index.js`. Attention : ce modèle utilise encore l'ancien format `source` et `link` pour les infos ; utilise **le nouveau format `sources`** décrit à l'étape 5.
2. Lance la récupération des articles et des vidéos :
   - sous Linux ou macOS (routine cloud) : `python3 scripts/fetch_news.py` et `python3 scripts/fetch_shorts.py`
   - sous Windows : `powershell -ExecutionPolicy Bypass -File scripts\fetch-news.ps1` et `scripts\fetch-shorts.ps1`
3. Lis `scripts/news-today.txt`. Il contient 3 parties (la 3e, **SOURCES PRIMAIRES**, liste les publications officielles récentes de l'ONU, de la Commission européenne, de l'OMS et du Conseil constitutionnel : quand une info porte sur l'un de ces documents, mets-le dans `primary`, sans lire la 3e partie en détail si aucune info n'est concernée) :
   - **1. SUJETS RECOUPÉS** : des groupes de titres proches publiés par au moins 2 médias différents. C'est **là que tu choisis tes infos**. Le regroupement est automatique, par mots-clés : **vérifie toujours** que les titres d'un groupe parlent bien du même fait, sinon écarte-le.
   - **2. REVUE BRUTE** : tous les titres, média par média, pour retrouver un deuxième média qui confirme un sujet.
   Les sources couvrent la France (Le Monde, franceinfo, France 24, RFI, Le Figaro, les dépêches AFP via « Le Figaro Flash », Libération, Ouest-France, 20 Minutes, La Croix, Mediapart, Courrier international, Euronews), la francophonie (Radio-Canada, Le Temps) et l'international (BBC News, The Guardian, The New York Times, Al Jazeera, France 24 English). Les sources anglophones servent à recouper ; écris toujours en français.
4. Choisis 8 à 10 infos **recoupées**, en équilibrant les thèmes : politique française, international (au moins 3 infos, dont une recoupée par un média étranger si possible), Europe, économie, climat ou sciences, médias (toujours au moins 1 : c'est le cœur des concours), société et culture. Laisse de côté les faits divers sans portée générale. Si deux médias divergent sur un chiffre ou un fait, ne garde que ce qui est commun ou signale la divergence dans le texte.
5. Écris `data/days/<date>.js` :
   - `title` : un titre d'édition de 60 à 80 caractères qui résume les 2 ou 3 sujets majeurs.
   - `intro` : 2 phrases.
   - `word` : un « mot du jour » (notion d'institutions, d'économie, de droit ou de médias liée à l'actu), défini en 2 ou 3 phrases.
   - `glossary` (**nourrit le glossaire de l'application**) : 3 à 5 termes **présents dans les textes des infos** (juridique, institutionnel, économique, diplomatique ou technique), `{ term, def, cat, aliases? }` avec `cat` parmi Justice, Institutions, International, Europe, Économie, Climat, Numérique, Société, Monde, Métier. Définis chaque terme en une ou deux phrases, de façon **intemporelle et neutre** (pas de fait d'actualité, pas de chiffre daté, pas de jugement).
     - **Méthode** : relis tes `text`, `why`, `memo` et tes questions, repère les mots techniques qu'un candidat pourrait ne pas connaître (institution, procédure, sigle, notion économique, nom d'organisme), puis cherche chacun dans `data/glossaire.js` (`grep -ic "<terme>" data/glossaire.js`). Ne garde que ceux qui **n'y sont pas**. Si tous y sont déjà, `glossary` peut rester vide.
     - Chaque terme doit apparaître tel quel dans le `text`, le `why` ou le `memo` d'une info, pour que l'application le mette en lien. Ajoute dans `aliases` les autres formes utilisées (pluriel irrégulier, sigle, variante) **en y incluant le terme lui-même**. L'application reconnaît déjà le pluriel en « s » ou « x » et les formes sans accent.
     - L'application met aussi les termes en lien dans l'intro, le mémo et les explications des quiz (pas dans les choix de réponse). Une explication `x` ou un `why` qui emploie le terme exact aide donc le candidat.
   - `stories[]` : `{ tag, title, sujet, text, why?, sources: [{ name, url }, { name, url }, …] }`.
     - `sujet` (**obligatoire**) : une phrase courte, affichée au-dessus de chaque question sur cette info, qui **situe le contexte sans donner aucune réponse**. Le titre ne peut pas servir : « Reporters sans frontières demande à l'Arcom de suspendre CNews » au-dessus de « Quelle ONG… ? » donne la réponse. Écris plutôt « La chaîne CNews visée par une demande de suspension ». Relis-le face à **toutes** les questions de l'info, y compris les reformulations `qv` et les affirmations `vv` : il ne doit contenir ni nom, ni chiffre, ni date, ni lieu, ni fait demandé. `check-edition.js` refuse un sujet qui contient une bonne réponse, mais il ne peut pas tout voir (les vrai/faux, par exemple) : ta relecture compte.
     - `sources` contient **au moins 2 rédactions différentes** : deux rubriques du même journal ne comptent que pour une source. Chaque `url` vient de `news-today.txt`. Une dépêche du flux « Le Figaro Flash » se cite `{ name: 'AFP (via Le Figaro)', url }`.
     - `primary` (facultatif) : `[{ name, url }]`, la **source primaire** de l'info (communiqué officiel, décision de justice, texte de loi, rapport, jeu de données). **N'en mets que si l'URL figure dans `news-today.txt` ou dans un article que tu as réellement ouvert, jamais de mémoire ni d'URL devinée.** Si tu n'en as pas, omets le champ : l'application repère déjà seule les liens de `sources` qui pointent vers un site officiel (gouv.fr, europa.eu, un.org…) et propose des pistes par rubrique. Ne dépense pas de crédits à en chercher.
     - `text` fait 3 à 5 phrases factuelles, limitées aux éléments **communs aux sources**.
     - `why` relie l'info à une notion de concours, et c'est l'endroit où écrire le savoir de contexte utilisé dans les questions.
     - `tag` prend l'une des valeurs Politique, Monde, Europe, Économie, Climat, Médias, Justice, Société ou Culture.
   - `memo[]` : 4 ou 5 choses à retenir (dates, chiffres, noms), tirées des infos.
   - `lessons[]` : **exactement 3 leçons**.
     1. « Le quiz de la une » ☕ (France), 9 ou 10 exercices.
     2. « Le tour du monde » 🌍 (international et Europe), 8 ou 9 exercices.
     3. « Médias & atelier » 🎙️, 7 ou 8 exercices, dont **2 `write`** (titrer une dépêche, rédiger une attaque ou un chapô) construits sur une vraie info du jour.
     - **Écriture dans chaque leçon** : les leçons 1 et 2 comptent aussi **1 `write`** chacune (résumer une dépêche en 2 phrases, trouver un angle de reportage, écrire 3 questions d'interview). L'application en ajoute elle-même un si tu l'oublies, mais un exercice choisi par toi est meilleur.
     - **Reformulations (OBLIGATOIRES)** : l'élève parcourt **toutes les formulations d'une question avant d'en revoir une** (test, Fil, 2e chance). Quand toutes ont servi, le cycle recommence, avec une réponse à taper. Plus tu écris de variantes, plus la répétition arrive tard. Il doit répondre parce qu'il a compris l'info, pas parce qu'il reconnaît la phrase. L'application ne fabrique aucune reformulation : c'est à toi de les écrire, **4 de plus par question** (5 formulations en tout).
       - `qcm` et `input` : `qv: ['formulation 2', 'formulation 3', 'formulation 4', 'formulation 5']`, avec **la même bonne réponse** et les mêmes choix. Change l'angle, pas seulement les mots : par la cause, la conséquence, le chiffre, l'acteur… Exemple : « Quelle ONG demande la suspension de CNews ? » devient « Qui a saisi l'Arcom contre CNews ? », puis « L'appel à suspendre CNews un mois émane de quelle organisation ? ».
       - `vf` : `vv: [{ q, a, x }, …]`, soit **4 affirmations de plus** sur la même info, dont **au moins deux de vérité inverse** (si l'originale est vraie, une variante fausse, et l'inverse), chacune avec son explication `x`. La variante fausse change un seul élément vérifiable (un chiffre, un acteur, un lieu, le sens d'une décision) et reste plausible.
       - Relis chaque variante comme une question à part : la réponse est dans le brief, une seule réponse possible, rôles non inversés.
     - **Plus de questions** : vise le haut de la fourchette (10, 9 et 8 exercices), en variant les types (`qcm`, `vf`, `input`, `order`, `match`).
   - **Chaque question porte sur une info du brief.** Ne pose pas de question sur un sujet absent des `stories`, même s'il figure dans `news-today.txt`.
   - **Ne jamais inverser les rôles.** Qui a envoyé ou reçu, qui accuse ou est accusé, qui a proposé ou refusé : la question reprend exactement le sens de la dépêche. Erreur réelle signalée par un élève : « Quel candidat a **reçu** des messages antisémites ? » alors que Jordan Bardella est accusé de les avoir **envoyés**. Si une formulation peut se lire de deux façons, réécris-la.
   - **Relecture obligatoire de chaque question avant publication**, en se posant trois questions : la réponse est-elle écrite telle quelle dans le brief ? Une seule réponse est-elle possible ? La question se comprend-elle seule, sans la question précédente ? Pour une personne mise en cause, écris « attribués à », « accusé de », jamais un fait non établi.
   - Varie les types : surtout des `qcm` et des `vf`, au moins un `match` ou un `order` par leçon. Un `input` est possible si la réponse est courte et sans ambiguïté.
   - `match` : 4 paires dont les textes sont tous différents, et chaque paire reprend des éléments du brief.
   - Les mauvaises réponses des QCM doivent être plausibles, et toujours dans le même domaine que la bonne.
   - Chaque exercice a une explication `x` courte.
   - Échappe les apostrophes (`\'`) dans les chaînes entre apostrophes.
5 bis. **Vidéos du fil (format Shorts)**
   - Lis `scripts/shorts-today.txt` (format : source | date | id | intégrable | titre).
   - Choisis **8 à 12 Shorts**, uniquement avec `intégrable = oui`. Ils doivent couvrir l'actualité : politique, international, société, climat, médias, sciences.
   - **Exclus** le divertissement, le lifestyle, le cinéma et les séries, les conseils santé ou cuisine, les bandes-annonces et l'autopromotion. Exclus aussi les extraits de débats d'opinion où un éditorialiste donne son avis (titres entre « … » attribués à un chroniqueur), et les faits divers sordides sans portée générale.
   - **Varie les sources** : au moins 5 rédactions différentes, et 3 vidéos au maximum par rédaction. Privilégie les vidéos qui traitent des infos du brief.
   - Quand une vidéo traite d'une info retenue dans `stories`, relie-la avec `story: <index dans stories>`. Vise au moins 4 vidéos reliées.
   - **Un sujet = une vidéo.** Au plus **1 vidéo par info**, et jamais deux vidéos non reliées sur le même sujet. Si plusieurs médias couvrent un sujet, garde la vidéo la plus claire : le recoupement se voit dans les `sources` de l'info, pas dans le fil.
   - Le fil reçoit aussi des vidéos fraîches toutes les 30 minutes (`data/live/shorts.js`, géré par GitHub Actions). Ne modifie pas ce fichier.
   - Ajoute le tableau `shorts` : `{ id, source, title, tag, story? }`. Reprends le titre tel quel, en retirant seulement les suffixes du type « • FRANCE 24 ».
   - Ne pose **aucune question de quiz sur le contenu d'une vidéo** : tu n'en connais que le titre.
   - Si le script échoue, mets `shorts: []`.
6. Mets à jour `data/days/index.js` : ajoute `{ date: '<date>', title: '<title>', lessons: 3 }` **en tête**, ou remplace l'entrée existante en cas de régénération.
7. **Vérification obligatoire** : `node scripts/check-edition.js data/days/<date>.js`.
   - Le script contrôle la syntaxe, la structure, le recoupement (2 sources différentes avec URL par info) et la présence des réponses dans le brief.
   - Tant qu'il affiche `ÉCHEC`, corrige le fichier : ajoute la 2e source, réécris le texte ou le `why`, ou remplace la question, puis relance-le.
   - **Ne publie jamais une édition en échec.** Si tu n'y arrives pas, n'écris pas d'édition et explique pourquoi dans ton résumé.

## Mises à jour de la journée (11 h, 14 h, 18 h, 21 h)

Quand l'édition du jour **existe déjà** (sans marqueur `SCOOP:REGENERER`), tu ne la réécris pas : tu la **complètes**. **Économise au maximum** : ne lis ni `news-today.txt` en entier, ni l'édition en entier, ni le reste de cette consigne s'il est inutile.

1. Lance `python3 scripts/fetch_news.py` puis le **pré-tri gratuit** `python3 scripts/new_topics.py <date>` (pas `fetch_shorts.py`).
   - S'il affiche `RIEN DE NOUVEAU` : **arrête-toi**, sans rien lire ni publier (« rien de nouveau »), **sauf** si c'est la mise à jour de 17 h (ou une suivante) et que l'édition n'a pas encore de `reco` : va alors directement à l'étape 9 (recommandation seule).
   - Sinon, lis **seulement** `scripts/news-new.txt` : il contient les sujets recoupés absents de l'édition. Pour l'édition, ne lis que ce qu'il te faut (les titres des infos avec `grep -n "title:"`, la fin du fichier pour insérer).
   - Si le pré-tri plante, reviens à la méthode longue : lis la partie 1 de `news-today.txt` et compare avec les `stories`.
2. Garde les sujets **recoupés par au moins 2 rédactions** qui ne sont **pas déjà traités** dans `stories` : compare les faits, pas seulement les mots. Un développement nouveau et important d'un sujet existant (par exemple une décision, un vote ou un bilan) compte comme nouveau ; une simple reformulation, non.
3. **Si aucun ne convient, ne modifie pas l'édition** ; publie seulement `scripts/topics-seen.txt` (`git commit -m "Pré-tri de <HH> h"`) pour que ces sujets ne soient pas réexaminés. Ne force jamais une mise à jour.
4. Sinon, **ajoute** 1 à 3 infos **à la fin** de `stories`, au même format (`sources` avec au moins 2 rédactions différentes). Ne modifie, ne supprime et ne réordonne **aucune** info existante : les leçons y font référence par position. L'édition ne doit pas dépasser 20 infos au total.
5. Ajoute **à la fin** de `lessons` une leçon `{ title: '⚡ Flash de <HH> h', icon: '⚡', desc: 'Mise à jour', exercises: [...] }` de 5 à 7 exercices (`qcm`, `vf`, `input`, éventuellement un `match`) **dont 1 `write`** (titre, chapô, attaque ou résumé d'une des infos ajoutées), qui portent **uniquement** sur les infos que tu viens d'ajouter.
6. Ajoute à l'objet de l'édition (ou complète s'il existe) le tableau `updates` : `updates: [{ at: '<HH>:00', stories: [<index des infos ajoutées>] }]`, une entrée par mise à jour.
7. Tu peux ajouter des vidéos à `shorts` pour les nouvelles infos (`story` = leur index), en respectant « un sujet = une vidéo ».
8. Dans `data/days/index.js`, mets à jour l'entrée du jour : `lessons` = nouveau nombre total de leçons. Garde le titre, sauf si un sujet ajouté est clairement le plus important de la journée.
9. **Recommandation culturelle « En écho à l'actu » (mise à jour de 17 h)** : si l'édition n'a **pas encore** de champ `reco` et que la mise à jour est celle de 17 h (ou une suivante, si elle a été manquée), ajoute-le, **même si aucune nouvelle info n'est publiée ce jour-là** (dans ce cas, ne touche ni aux `stories`, ni aux `lessons`, ni aux `updates`). Elle s'affiche sur l'accueil.
   - Format : `reco: [{ type, title, by, year, story, why }]`, avec **1 recommandation** (2 ou 3 de types différents si tu en es sûr).
   - `type` : `'film'`, `'série'`, `'docu'` ou `'podcast'`. `story` : l'index de l'info du jour qu'elle prolonge (choisis l'événement le plus marquant de la journée). `why` : 2 phrases qui expliquent le lien avec l'actu.
   - **Aucune invention.** Ne cite qu'une œuvre que tu connais **avec certitude** : titre exact, réalisateur ou auteur, année. Le sujet de l'œuvre doit réellement faire écho à l'info (même thème, même institution, même type d'événement). Si tu n'es pas sûr d'une œuvre, choisis-en une plus connue. N'écris ni lien ni plateforme de diffusion : l'application propose une recherche.
   - Préfère des œuvres reconnues (films et séries primés, documentaires de référence, podcasts de médias établis comme France Culture ou France Inter) et variées d'un jour à l'autre : relis `grep -h -A1 "reco:" data/days/*.js` (ou la fin des éditions récentes) pour ne pas répéter une recommandation récente.
10. Lance `node scripts/check-edition.js data/days/<date>.js` (il doit afficher OK), puis publie l'édition, `index.js` et `scripts/topics-seen.txt` : `git commit -m "Mise à jour de <HH> h"`.

## Variété des questions (côté application, rien à faire)

Chaque question est comptée dans le navigateur de l'élève : reformulée dès le 2e passage, à réponse tapée dès le 3e, à expliquer par écrit dès le 5e. Les exercices `write` sont proposés en plus dans chaque leçon du jour.

## Rappels sur les types d'exercices

```
qcm   {t:'qcm', q, c:[3 ou 4 choix], a:index_bonne_réponse, x, qv:[4 autres formulations]}
vf    {t:'vf', q:'affirmation', a:true|false, x, vv:[4 × {q:'autre affirmation', a:true|false, x}]}
input {t:'input', q, a:['réponse', 'variante'], hint?, x, qv:[4 autres formulations]}
order {t:'order', q, items:[dans le BON ordre], x}
match {t:'match', q, pairs:[[gauche, droite], x4], x}
write {t:'write', q, src, model, crit:[4 critères]}
```

L'application mélange elle-même les choix et les éléments. Mets toujours la bonne réponse où tu veux, en indiquant son index dans `a`.
