# Comment l'actu se met à jour

Trois niveaux, du meilleur au plus sûr. Chaque créneau (7 h, 11 h, 14 h, 18 h, 21 h l'hiver ; une heure plus tard l'été, les horaires étant en UTC) est assuré par le premier niveau qui fonctionne.

| Quand (UTC) | Qui | Quoi |
|---|---|---|
| h:00 (6, 10, 13, 17, 20) | **Routine Claude principale** (autre compte Claude) | Édition complète ou mise à jour, rédigée et vérifiée selon `scripts/DAILY_PROMPT.md`. |
| h+1:00 (7, 11, 14, 18, 21) | **Routine Claude de secours** (compte Nico2, `trig_015NVDvZEBRexPYvnGZA8z71`) | Lance `scripts/deja_fait.py 70` : si la principale a publié (ou signalé « rien de nouveau »), elle s'arrête ; sinon elle fait le travail, avec la même qualité. |
| h+1:45 (7:45, 11:45, 14:45, 18:45, 21:45) | **Secours sans IA** (GitHub Actions, gratuit : `.github/workflows/edition-secours.yml`) | Seulement si aucune routine Claude n'a rien publié depuis 1 h 45 (par exemple plus de crédits Claude). |

Un passage « rien de nouveau » compte comme un passage : `scripts/new_topics.py` l'inscrit lui-même dans `scripts/passages.txt` et le publie.

## Le secours sans IA (`scripts/edition_secours.py`)

Garanti sans invention, parce qu'aucun texte n'y est rédigé par une machine :

- **Infos** : uniquement les faits publiés par au moins 2 rédactions différentes. Il faut des titres qui partagent au moins 3 mots-clés, dont 2 précis (pas seulement « Ukraine » ou « Trump »), un mot commun qui ne soit pas un nom propre, et des résumés qui se recoupent aussi. Les faits en double sont écartés.
- **Texte** : le résumé publié par chaque rédaction, **cité mot pour mot** entre guillemets avec son nom, et les liens vers les articles. Pas de « Bon à savoir » (il faudrait l'écrire).
- **Questions**, exactes par construction :
  - compléter un nom ou un chiffre d'un titre publié ;
  - « Quelle rédaction a publié ce titre ? » (les rédactions qui ont publié le même titre ne sont jamais proposées comme mauvaise réponse) ;
  - vrai/faux sur un titre exact, ou sur un titre volontairement modifié ;
  - associer des titres à leur rédaction ;
  - écrire un chapô, comparé au chapô publié.
- **Mot du jour** : liste de définitions vérifiées. **Mémo** : les titres.
- `scripts/check-edition.js` doit valider l'édition, sinon rien n'est publié. Moins de 8 faits recoupés le matin : pas d'édition (rien n'est inventé pour compléter).

Moins riche qu'une édition Claude (pas d'explication ni de reformulation), mais toujours juste.

## Lancer à la main

GitHub → Actions → « Édition de secours sans IA » → Run workflow. L'option `--force` publie même si une routine est passée.

## Notes

- `scripts/auto_edition.py` contient d'anciens essais avec des IA gratuites (Pollinations, Groq, Gemini…). Ils ne sont plus utilisés : leur qualité n'était pas assez fiable. Le secours sans IA s'en sert seulement pour lire les titres et écrire les fichiers.
- Notifications : `server/README.md` (Cloudflare Worker, 2 rappels par jour).
