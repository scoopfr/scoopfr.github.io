# Scoop : consigne de mise à jour quotidienne

Ce fichier est la consigne qu'exécute la routine chaque matin (ou que tu peux donner à Claude à la main).
Trois règles passent avant tout le reste :

1. **Aucune invention** : n'utilise que les faits présents dans `scripts/news-today.txt` (ta mémoire de l'actualité récente n'est pas fiable).
2. **Double vérification** : chaque info retenue doit être couverte par **au moins 2 rédactions différentes** dans `news-today.txt`, et tu cites ces 2 sources (ou plus), avec leurs URL.
3. **Questions = brief** : chaque question des leçons doit pouvoir se résoudre **uniquement en lisant le brief du jour** (titres, textes, « Pour le concours », mémo, mot du jour). Si une question demande un savoir de contexte (date d'une loi, article de la Constitution…), ce savoir doit être écrit dans le `why` ou le `text` d'une info.

## Étapes

1. Détermine la date du jour au format `AAAA-MM-JJ` (fuseau Europe/Paris). Si `data/days/<date>.js` existe déjà, arrête-toi, **sauf** si sa première ligne contient `SCOOP:REGENERER`. Dans ce cas, régénère-le entièrement (le nouveau fichier ne doit plus contenir ce marqueur) et, dans `index.js`, **remplace** l'entrée de cette date au lieu d'en ajouter une seconde.
   La structure de référence est `data/days/_modele.js`. Ne modifie jamais ce fichier et ne l'ajoute pas à `index.js`. Attention : ce modèle utilise encore l'ancien format `source` et `link` pour les infos ; utilise **le nouveau format `sources`** décrit à l'étape 5.
2. Lance la récupération des articles et des vidéos :
   - sous Linux ou macOS (routine cloud) : `python3 scripts/fetch_news.py` et `python3 scripts/fetch_shorts.py`
   - sous Windows : `powershell -ExecutionPolicy Bypass -File scripts\fetch-news.ps1` et `scripts\fetch-shorts.ps1`
3. Lis `scripts/news-today.txt`. Il contient 2 parties :
   - **1. SUJETS RECOUPÉS** : des groupes de titres proches publiés par au moins 2 médias différents. C'est **là que tu choisis tes infos**. Le regroupement est automatique, par mots-clés : **vérifie toujours** que les titres d'un groupe parlent bien du même fait, sinon écarte-le.
   - **2. REVUE BRUTE** : tous les titres, média par média, pour retrouver un deuxième média qui confirme un sujet.
   Les sources couvrent la France (Le Monde, franceinfo, France 24, RFI, Le Figaro, les dépêches AFP via « Le Figaro Flash », Libération, Ouest-France, 20 Minutes, La Croix, Mediapart, Courrier international, Euronews), la francophonie (Radio-Canada, Le Temps) et l'international (BBC News, The Guardian, The New York Times, Al Jazeera, France 24 English). Les sources anglophones servent à recouper ; écris toujours en français.
4. Choisis 8 à 10 infos **recoupées**, en équilibrant les thèmes : politique française, international (au moins 3 infos, dont une recoupée par un média étranger si possible), Europe, économie, climat ou sciences, médias (toujours au moins 1 : c'est le cœur des concours), société et culture. Laisse de côté les faits divers sans portée générale. Si deux médias divergent sur un chiffre ou un fait, ne garde que ce qui est commun ou signale la divergence dans le texte.
5. Écris `data/days/<date>.js` :
   - `title` : un titre d'édition de 60 à 80 caractères qui résume les 2 ou 3 sujets majeurs.
   - `intro` : 2 phrases.
   - `word` : un « mot du jour » (notion d'institutions, d'économie, de droit ou de médias liée à l'actu), défini en 2 ou 3 phrases.
   - `stories[]` : `{ tag, title, text, why?, sources: [{ name, url }, { name, url }, …] }`.
     - `sources` contient **au moins 2 rédactions différentes** : deux rubriques du même journal ne comptent que pour une source. Chaque `url` vient de `news-today.txt`. Une dépêche du flux « Le Figaro Flash » se cite `{ name: 'AFP (via Le Figaro)', url }`.
     - `text` fait 3 à 5 phrases factuelles, limitées aux éléments **communs aux sources**.
     - `why` relie l'info à une notion de concours, et c'est l'endroit où écrire le savoir de contexte utilisé dans les questions.
     - `tag` prend l'une des valeurs Politique, Monde, Europe, Économie, Climat, Médias, Justice, Société ou Culture.
   - `memo[]` : 4 ou 5 choses à retenir (dates, chiffres, noms), tirées des infos.
   - `lessons[]` : **exactement 3 leçons**.
     1. « Le quiz de la une » ☕ (France), 9 ou 10 exercices.
     2. « Le tour du monde » 🌍 (international et Europe), 8 ou 9 exercices.
     3. « Médias & atelier » 🎙️, 7 ou 8 exercices, dont **2 `write`** (titrer une dépêche, rédiger une attaque ou un chapô) construits sur une vraie info du jour.
   - **Chaque question porte sur une info du brief.** Ne pose pas de question sur un sujet absent des `stories`, même s'il figure dans `news-today.txt`.
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

## Rappels sur les types d'exercices

```
qcm   {t:'qcm', q, c:[3 ou 4 choix], a:index_bonne_réponse, x}
vf    {t:'vf', q:'affirmation', a:true|false, x}
input {t:'input', q, a:['réponse', 'variante'], hint?, x}
order {t:'order', q, items:[dans le BON ordre], x}
match {t:'match', q, pairs:[[gauche, droite], x4], x}
write {t:'write', q, src, model, crit:[4 critères]}
```

L'application mélange elle-même les choix et les éléments. Mets toujours la bonne réponse où tu veux, en indiquant son index dans `a`.
