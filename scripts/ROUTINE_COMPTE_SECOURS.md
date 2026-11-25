# Faire tourner la routine Scoop sur le compte de secours

Ce guide sert à recréer la routine quotidienne sur ton **2e compte Claude**, pour qu'il prenne le relais quand le compte principal n'a plus de crédit.

Règle d'or : **une seule routine active à la fois.** Si les deux tournent en même temps, elles se marchent dessus (conflits Git) et consomment des crédits des deux côtés.

---

## 1. Préparer le compte de secours (une seule fois)

1. Va sur https://claude.ai/code et **connecte-toi avec le 2e compte**.
2. **Relie GitHub** : dans les réglages de Claude Code, connecte ton compte GitHub, puis autorise l'application Claude sur l'organisation **scoopfr** et le dépôt **scoopfr.github.io** (droits de lecture et d'écriture).
   - Si l'app GitHub Claude est déjà installée sur l'organisation, il suffit d'y ajouter l'accès depuis ce compte.
3. **Crée l'environnement cloud** (réglages, Environnements) :
   - accès réseau **Limité** ;
   - ajoute ces domaines à la liste autorisée :

```
www.lemonde.fr
www.franceinfo.fr
www.france24.com
www.rfi.fr
www.lefigaro.fr
www.liberation.fr
www.ouest-france.fr
www.20minutes.fr
www.la-croix.com
www.mediapart.fr
www.courrierinternational.com
fr.euronews.com
ici.radio-canada.ca
www.letemps.ch
feeds.bbci.co.uk
www.theguardian.com
rss.nytimes.com
www.aljazeera.com
www.youtube.com
news.un.org
ec.europa.eu
www.who.int
www.conseil-constitutionnel.fr
```

   GitHub est autorisé d'office. Quand une source est ajoutée dans `fetch_news.py` ou `fetch_shorts.py`, ajoute son domaine **dans les deux comptes**.

## 2. Créer la routine (une seule fois)

Dans claude.ai/code, onglet Routines, puis « Nouvelle routine » :

| Réglage | Valeur |
|---|---|
| Nom | `Scoop : édition et mises à jour (7h, 11h, 14h, 18h, 21h)` |
| Dépôt | `scoopfr/scoopfr.github.io`, branche `main` |
| Environnement | celui créé à l'étape 1 |
| Modèle | Sonnet (le moins cher qui suffit) |
| Horaire (cron, en UTC) | `0 6,10,13,17,20 * * *` |
| État | **En pause** au départ (voir la partie 3) |

Note : le cron est en UTC. En hiver, 6 h UTC correspond à 7 h à Paris ; en été, cela devient 8 h.

**Consigne à coller :**

```
Tu es la routine de mise à jour de Scoop (dépôt scoopfr/scoopfr.github.io). Réponds en français.

1. Lis CLAUDE.md, puis suis scripts/DAILY_PROMPT.md à la lettre.
2. Détermine la date et l'heure à Paris (TZ=Europe/Paris date).
   - Si data/days/<date>.js n'existe pas, ou si sa première ligne contient SCOOP:REGENERER :
     écris l'édition complète (python3 scripts/fetch_news.py et python3 scripts/fetch_shorts.py).
   - Sinon, fais une mise à jour de la journée, en économisant au maximum :
     python3 scripts/fetch_news.py puis python3 scripts/new_topics.py <date>.
     S'il affiche RIEN DE NOUVEAU, arrête-toi sans rien publier, sauf à la mise à jour de 17 h (ou suivante) si l'édition n'a pas de `reco` : applique alors seulement l'étape 9 de scripts/DAILY_PROMPT.md.
3. Chaque info doit être confirmée par au moins 2 rédactions différentes. Aucune invention.
4. node scripts/check-edition.js data/days/<date>.js doit afficher OK avant toute publication.
5. Commite avec l'e-mail 190466635+nicolaschaix34@users.noreply.github.com
   (git pull --rebase avant de pousser), puis pousse sur main.
   Message : « Édition du <date> » ou « Mise à jour de <HH> h » ou « Pré-tri de <HH> h ».
```

## 2 bis. Variante automatique : routine de secours décalée de 30 min (recommandée)

Plutôt que de basculer à la main, le compte de secours peut avoir une routine **toujours active**, lancée **30 min après** la principale (cron `30 6,10,13,17,20 * * *`, soit 7 h 30, 11 h 30, 14 h 30, 18 h 30 et 21 h 30 à Paris en hiver). Elle lance d'abord `python3 scripts/deja_fait.py` (gratuit, sans Claude) :

- `DÉJÀ FAIT` : un commit d'édition ou de pré-tri a eu lieu dans les 50 dernières minutes, donc la routine principale est passée. Elle s'arrête aussitôt, pour quelques centimes de crédit.
- `À FAIRE` : la routine principale n'a rien publié (crédits épuisés ou panne). Elle fait la mise à jour à sa place, avec la même consigne, et signe ses commits « (secours) ».

Limites : si la routine principale a fini sur `RIEN DE NOUVEAU`, elle ne publie rien et le secours refait le pré-tri (gratuit, puis arrêt). Si la principale met plus de 30 min, les deux peuvent se chevaucher ; c'est rare, et `git pull --rebase` limite les conflits.

## 2 ter. Variante locale (sans liaison GitHub côté Claude)

Si la liaison GitHub du 2e compte échoue (incident GitHub du 25/11/2026 : erreurs 500/502 sur la page d'autorisation), la même logique tourne en **tâche planifiée locale** de l'application Claude sur le PC : `scoop-secours-plus-30-min`, à 7 h 30, 11 h 30, 14 h 30, 18 h 30 et 21 h 30 (heure locale). Elle utilise le git du PC pour pousser, donc aucune autorisation GitHub côté Claude.

Limite : elle ne tourne que **PC allumé et application ouverte**. Si l'application est fermée à l'heure prévue, elle s'exécute au prochain lancement. Elle est installée sur le compte avec lequel l'application est connectée.

## 3. Passer d'un compte à l'autre (variante manuelle)

Quand le compte principal n'a plus de crédit :

1. Sur le **compte principal** : mets la routine Scoop **en pause**, si tu peux encore te connecter.
2. Sur le **compte de secours** : **réactive** la routine. Tu peux aussi cliquer sur « Lancer maintenant » pour rattraper l'heure manquée.
3. Quand les crédits du compte principal reviennent, fais l'inverse.

Pour travailler sur l'app depuis ton PC, il suffit de changer de compte dans Claude (`/login` dans Claude Code) puis d'ouvrir le dossier `scoop`. `CLAUDE.md` redonne tout le contexte, quel que soit le compte.

Le passage d'un compte à l'autre est **manuel** : Claude ne peut pas détecter tout seul qu'un compte est à sec ni basculer sur l'autre.
