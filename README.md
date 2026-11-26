# Scoop 🗞️ · l'actu en s'amusant

> **En une phrase** : Scoop est une appli gratuite qui, chaque jour, transforme l'actualité en petites leçons et en quiz (comme une appli de langues), pour préparer les concours des écoles de journalisme.

- **L'appli en ligne** : https://scoopfr.github.io/
- **Le code** : https://github.com/scoopfr/scoopfr.github.io (ce dépôt)
- **Dernière mise à jour de ce document** : 26 novembre 2026, version **v47** de l'appli.

Ce document a deux parties :
1. **Pour tout le monde** : à quoi sert l'appli, comment elle marche, sans jargon.
2. **Pour reprendre le projet** (un développeur ou un nouveau Claude) : où est quoi dans le code, les règles à respecter et où on en est.

---

## Partie 1 · Pour tout le monde

### À quoi ça sert ?

Pour entrer dans une école de journalisme (CFJ, ESJ Lille, IPJ, CELSA…), il faut réussir un concours. On y est interrogé sur l'**actualité**, la **culture générale** et l'**écriture journalistique**. Scoop aide à s'y préparer **un peu chaque jour, en s'amusant** :

- **L'actu du jour, résumée** : une dizaine d'infos importantes, expliquées simplement. Chacune est vérifiée par **au moins deux médias différents**, avec les liens.
- **Des quiz** sur ces infos : choix multiples, vrai ou faux, réponses à taper, remises en ordre, associations.
- **De l'entraînement à l'écriture** : écrire un titre, un chapô ou une attaque, puis comparer avec une proposition.
- **De la culture générale**, un **glossaire**, le **mot du jour** et une **recommandation** (film, série, docu, podcast) en écho à l'actu.
- **La préparation aux concours** : fiches des écoles, annales, simulation d'oral.
- **Le côté jeu** : points d'expérience (XP), série de jours d'affilée 🔥, niveaux, objectif quotidien, rappels par notification.

### Comment l'installer ?

- **Sur Android** : ouvre le lien dans Chrome, puis choisis « Installer l'application ».
- **Sur iPhone** : ouvre le lien dans Safari, puis touche Partager et « Sur l'écran d'accueil ».
- **Sur ordinateur** : il suffit d'ouvrir le lien.

L'appli marche aussi sans connexion. La progression est enregistrée **sur l'appareil**, sans compte. Pour la changer d'appareil, va dans Profil, puis Exporter et Importer.

### Qui écrit l'actu chaque jour ?

L'actu se met à jour **5 fois par jour** (7 h, 11 h, 14 h, 18 h et 21 h, heure de Paris). Trois « équipes » se relaient, de la meilleure à la plus sûre :

1. **Un assistant IA (Claude)** lit les titres de nombreux médias et rédige l'édition. Il ne garde que les infos confirmées par au moins deux rédactions, puis écrit les quiz et les vérifie.
2. **Un second Claude, de secours**, passe une heure plus tard, seulement si le premier n'a rien publié.
3. **Un programme sans IA**, de dernier recours, prend le relais si aucun des deux n'a rien publié. Il n'écrit rien lui-même : il cite mot pour mot les résumés des médias, et ses questions sont justes par construction.

Une vérification automatique contrôle chaque édition. **Une édition qui ne passe pas la vérification n'est jamais publiée.**

### Ce qui ne coûte rien

Tout est gratuit : l'hébergement (GitHub Pages), les automatismes (GitHub Actions) et les notifications (Cloudflare, offre gratuite). Seuls les assistants Claude dépendent des abonnements Claude du propriétaire. Quand ils n'ont plus de crédits, le programme sans IA prend le relais.

---

## Partie 2 · Pour reprendre le projet

> **Nouveau Claude : lis d'abord [`CLAUDE.md`](CLAUDE.md).** Il contient les règles non négociables. Ce README sert de carte du projet.

### Démarrer en 3 étapes

1. `git pull` avant toute chose : des automatismes publient plusieurs fois par jour.
2. **Lancer l'appli en local** : `.claude/launch.json`, configuration « scoop », port 8080 (à défaut, `scripts/serve.ps1`). Ouvre ensuite http://localhost:8080/.
3. **Pas de Node sur le PC Windows**, mais Python est installé. Pour valider une édition sans Node : charge `scripts/check-edition.js` dans la page, puis lance `ScoopCheck(window.SCOOP_DAYS['AAAA-MM-JJ'])` (le résultat doit avoir `ok: true`).

### Comment l'appli est faite

C'est une **PWA statique** : du HTML, du CSS et du JavaScript, sans framework, sans compilation et sans serveur d'application. GitHub Pages sert directement la branche `main`. Toutes les données sont des fichiers `.js` qui remplissent des variables globales (`window.SCOOP_…`). La progression de l'élève est dans le `localStorage` du navigateur, sous la clé `scoop.v1`.

```
index.html               page unique : barre de navigation, chargement des scripts (avec ?v=NN)
sw.js                    service worker : cache hors ligne (VERSION = 'scoop-vNN'), notifications push
manifest.webmanifest     identité de l'appli installable
css/style.css            tout le style (thème clair et sombre)

js/app.js                LE MOTEUR (environ 2 200 lignes), en 4 grandes parties :
  ├─ accueil et barre du haut (renderChrome, l. ~213)
  ├─ onglet Actu : fil des dernières 24 h, édition du jour
  ├─ moteur de leçon (l. ~965) : lessonFromKey, orderByStory (questions groupées par info),
  │    startLesson, showEx, variantize (rotation des formulations), answerOk (correction tolérante),
  │    RENDER = les 7 types d'exercices : qcm, vf, input, order, match, write, qcmfree
  └─ le Fil vidéo façon Shorts (l. ~1527)
  Les modules ci-dessous s'y branchent via window.SCOOP_MODULES et une API ctx
  (addLesson, addRoute, addTrainItem, onAnswer, loadDays…).

js/memoire.js            fiches « Rappel » auto (👤 Qui ? 📅 Quand ? 🔢 Combien ?) + révision espacée
js/savoir.js             glossaire, recherche, noms et dates, jauge de connaissance
js/ecriture.js           atelier d'écriture (titre, chapô, attaque, brève, angle)
js/concours.js           « Mes concours » : écoles filtrées selon le profil de l'élève
js/annales.js            vraies annales + entraînements aux écrits et aux oraux
js/jury-local.js         simulation d'oral sans IA (moteur à règles, hors ligne)
js/oral.js, js/ai.js     oral avec une IA externe (clé API fournie par l'élève, facultatif)
js/alertes.js            rappels : bandeau d'accueil, notifications
js/alertes-core.js       choix du rappel, partagé entre l'appli et sw.js

data/days/AAAA-MM-JJ.js  UNE ÉDITION PAR JOUR (voir le format plus bas)
data/days/index.js       liste des éditions, la plus récente en premier
data/live/               vidéos du Fil, rafraîchies par GitHub Actions
data/units.js            parcours concours permanent (format des exercices documenté en tête)
data/culture.js, culture2.js   culture générale permanente
data/glossaire.js        définitions de base
data/prepa.js, concours.js, annales.js   écoles, épreuves, dates, sources publiques
data/push-config.js      adresse du serveur de notifications
```

### Le contenu d'une édition (`data/days/AAAA-MM-JJ.js`)

```js
window.SCOOP_DAYS['2026-11-26'] = {
  date, title, intro,
  word: { term, def },               // mot du jour
  glossary: [...],                   // termes expliqués
  stories: [                         // 20 infos au maximum
    { tag: 'Politique', title, text /* **gras** autorisé */, why /* « Bon à savoir » concours */,
      sources: [{ name, url }, …] }  // 2 rédactions différentes au minimum
  ],
  memo: [...],                       // l'essentiel en une ligne par info
  lessons: [{ title, exercises: [...] }],   // les quiz du jour
  updates: [...],                    // mises à jour de la journée (11 h, 14 h…)
  reco: {...},                       // film, série, docu ou podcast en écho à l'actu (ajouté vers 17-18 h)
  shorts: [...]
};
```

Les règles de rédaction (questions, glossaire, reco, mises à jour) sont dans [`scripts/DAILY_PROMPT.md`](scripts/DAILY_PROMPT.md). Le contrôle automatique est [`scripts/check-edition.js`](scripts/check-edition.js).

### La publication automatique de l'actu

Le détail complet est dans [`docs/EDITION_AUTOMATIQUE.md`](docs/EDITION_AUTOMATIQUE.md).

| Étape | Où | Fichiers |
|---|---|---|
| Récupérer les titres du jour (flux RSS) | routine Claude | `scripts/fetch_news.py` produit `scripts/news-today.txt` |
| Ne garder que les sujets nouveaux | routine Claude | `scripts/new_topics.py AAAA-MM-JJ` (s'arrête sur « RIEN DE NOUVEAU »), `scripts/topics-seen.txt` |
| Rédiger l'édition ou la mise à jour | routine Claude **principale** (autre compte Claude) | `scripts/DAILY_PROMPT.md` |
| Ne rien faire si la principale est passée | routine Claude **de secours** (compte Nico2), 1 h après | `scripts/deja_fait.py 70`, `scripts/passages.txt` |
| Secours **sans IA**, 1 h 45 après | GitHub Actions | `.github/workflows/edition-secours.yml` lance `scripts/edition_secours.py` (s'appuie sur `scripts/auto_edition.py`) |
| Contrôler chaque édition poussée | GitHub Actions | `.github/workflows/verif-edition.yml` |
| Vidéos du Fil (toutes les heures, de jour) | GitHub Actions | `.github/workflows/videos.yml` lance `scripts/update-live.mjs` |
| Illustrations et sources officielles (facultatif) | scripts | `scripts/update_images.py`, `update_primary.py` ; `update_voices.py` est désactivé (API X payante) |

### Notifications

Elles passent par un **Cloudflare Worker gratuit** (`server/worker.js`, mode d'emploi dans [`server/README.md`](server/README.md)), à l'adresse `https://scoop-push.nicolas-chaix.workers.dev`. Il envoie **2 rappels par jour** : à la sortie de l'édition du jour (entre 7 h et 12 h), puis à 18 h. Le texte du rappel est composé sur l'appareil, par `sw.js` et `js/alertes-core.js`.

### Vraie appli iOS et Android

Le projet est préparé mais n'est pas publié : les comptes développeur sont payants, et le propriétaire **ne veut rien payer**. Voir [`docs/APP_IOS_ANDROID.md`](docs/APP_IOS_ANDROID.md), le dossier `native/` (Capacitor) et `.well-known/assetlinks.json`.

### Règles à ne jamais enfreindre

1. **Rien d'inventé.** Chaque fait vient des titres récupérés et est confirmé par **au moins 2 rédactions**, avec leurs URL.
2. **Chaque question se résout en lisant le brief du jour.** Elle a une seule bonne réponse et ne doit pas **inverser les rôles** (qui accuse, qui est accusé, qui envoie, qui reçoit).
3. **Aucune question fabriquée par l'app sans preuve qu'elle est juste.** Leçon du 26/11 : une fiche automatique a demandé « 👤 Qui ? » à propos d'un **navire**. Avant d'ajouter une génération automatique, teste ce qu'elle produit sur toutes les éditions.
4. **Ne pas modifier en direct en production.** Teste en local, relis, puis publie. Ne publie jamais une édition en échec.
5. **À chaque modification du code**, augmente `?v=NN` dans `index.html` (toutes les occurrences) **et** `VERSION` dans `sw.js`. Sinon, les téléphones gardent l'ancienne version en cache.
6. **Commits** avec l'adresse `190466635+nicolaschaix34@users.noreply.github.com` (l'adresse personnelle reste privée). **Ne jamais pousser** vers l'ancien dépôt `nicolaschaix34/scoop` (remote `ancien`).
7. **Jamais de clé, de jeton ni de mot de passe** tapé ou copié par Claude : le propriétaire le fait lui-même. **Pas de service payant.**
8. Toujours répondre **en français**, de façon claire et sans jargon.

### Pièges connus

- Sur Windows, les heredocs de Bash abîment les `\` : écris les scripts avec l'outil d'écriture de fichiers.
- Avec `Set-Content`, PowerShell 5.1 change l'encodage et les fins de ligne : passe par Python (`newline=''`) pour un remplacement de texte.
- L'API publique de GitHub limite le nombre de requêtes : pour savoir si un push est arrivé, utilise `git ls-remote`.
- Pas de `gh` sur le PC. Pour lancer un workflow à la main, passe par le navigateur (GitHub, Actions, Run workflow).

### Où on en est (26/11/2026, v47)

**Fait récemment :**
- v44 : plus de reformulation « Explique en une ou deux phrases ».
- v45 : quiz plus clairs. Les questions sont regroupées par info, avec un repère « 📰 Info » et un compteur.
- v46 : les réponses à taper sont corrigées avec tolérance (formulation, unité, petite faute), sauf les chiffres, qui doivent être exacts.
- v47 :
  - « Qui ? » ne porte plus que sur une vraie personne (`PERSON_CUE` dans `js/memoire.js`) ;
  - la carte « Cette réponse est-elle juste ? Réponse proposée : X » est supprimée ;
  - les anciennes fiches « Qui ? » enregistrées sont purgées (`mem.v = 3`).
- L'édition du 26/11 a été rédigée et relue à la main, puis complétée par la mise à jour de 11 h, relue elle aussi.
- Architecture de publication sur 3 niveaux en place.

**Pistes ouvertes :**
- L'issue GitHub #1 (rôles inversés dans une ancienne édition faite par une IA gratuite) est corrigée sur le fond par les règles de `DAILY_PROMPT.md`. Elle reste à fermer.
- Surveiller la qualité des éditions de la routine principale. En cas d'erreur signalée par un élève, corriger l'édition **et** ajouter la règle qui l'aurait évitée dans `DAILY_PROMPT.md`.
- Les applis des stores restent en attente (payantes).
