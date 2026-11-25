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
     S'il affiche RIEN DE NOUVEAU, arrête-toi immédiatement sans rien publier.
3. Chaque info doit être confirmée par au moins 2 rédactions différentes. Aucune invention.
4. node scripts/check-edition.js data/days/<date>.js doit afficher OK avant toute publication.
5. Commite avec l'e-mail 190466635+nicolaschaix34@users.noreply.github.com
   (git pull --rebase avant de pousser), puis pousse sur main.
   Message : « Édition du <date> » ou « Mise à jour de <HH> h » ou « Pré-tri de <HH> h ».
```

## 3. Passer d'un compte à l'autre

Quand le compte principal n'a plus de crédit :

1. Sur le **compte principal** : mets la routine Scoop **en pause**, si tu peux encore te connecter.
2. Sur le **compte de secours** : **réactive** la routine. Tu peux aussi cliquer sur « Lancer maintenant » pour rattraper l'heure manquée.
3. Quand les crédits du compte principal reviennent, fais l'inverse.

Pour travailler sur l'app depuis ton PC, il suffit de changer de compte dans Claude (`/login` dans Claude Code) puis d'ouvrir le dossier `scoop`. `CLAUDE.md` redonne tout le contexte, quel que soit le compte.

Le passage d'un compte à l'autre est **manuel** : Claude ne peut pas détecter tout seul qu'un compte est à sec ni basculer sur l'autre.
