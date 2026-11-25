# Scoop : consignes pour Claude

Ce fichier est lu automatiquement par Claude Code, **quel que soit le compte Claude utilisé** (compte principal ou compte de secours, sur le PC ou dans le cloud). Il suffit d'ouvrir une session dans ce dossier pour reprendre le travail là où il s'est arrêté : tout l'état du projet est dans ce dépôt GitHub, rien n'est rattaché à un compte Claude.

Réponds toujours en français.

## Le projet

- PWA statique, « Duolingo de l'actu » pour préparer les concours des écoles de journalisme.
- Dépôt : `github.com/scoopfr/scoopfr.github.io` ; en ligne sur https://scoopfr.github.io/ (GitHub Pages, branche `main`, racine).
- N'utilise jamais l'ancien dépôt `nicolaschaix34/scoop` (remote `ancien`) : il ne sert qu'à rediriger vers la nouvelle adresse.

## Avant toute modification

1. `git pull` : une routine cloud pousse plusieurs fois par jour (7 h, 11 h, 14 h, 18 h, 21 h, heure de Paris) et GitHub Actions rafraîchit `data/live/` toutes les 30 min.
2. Quand tu modifies le code de l'app, incrémente le `?v=` dans `index.html` et `VERSION` dans `sw.js`.
3. Pour les commits, utilise l'e-mail `190466635+nicolaschaix34@users.noreply.github.com` (l'adresse Gmail doit rester privée).

## Mettre l'actu à jour

Suis `scripts/DAILY_PROMPT.md` à la lettre. Si l'édition du jour existe déjà, applique la partie « Mises à jour de la journée » :
`python scripts/fetch_news.py`, puis `python scripts/new_topics.py AAAA-MM-JJ` (arrête-toi à `RIEN DE NOUVEAU`).

Règles non négociables :
- chaque info est confirmée par **au moins 2 rédactions différentes**, avec leurs URL ;
- chaque question se résout en lisant le brief du jour ;
- aucune invention : les faits viennent de `scripts/news-today.txt` (ou `news-new.txt`) ;
- 16 infos au maximum par édition ; ne modifie, ne supprime et ne réordonne jamais les infos existantes.

Vérification avant de publier :
- avec Node : `node scripts/check-edition.js data/days/AAAA-MM-JJ.js` doit afficher `OK` ;
- sans Node (le PC Windows n'en a pas) : lance l'app (`.claude/launch.json`, config « scoop », port 8080), charge `scripts/check-edition.js` et l'édition dans la page, puis appelle `ScoopCheck(window.SCOOP_DAYS['AAAA-MM-JJ'])` : `ok` doit valoir `true`.

Ne publie jamais une édition en échec.
