# Édition automatique (sans Claude, sans abonnement)

## Comment ça marche

`.github/workflows/edition-auto.yml` lance `scripts/auto_edition.py` sur GitHub Actions (gratuit sur un dépôt public), aux heures UTC `05:10/06:10`, `09:10/10:10`, `12:10/13:10`, `15:10/16:10`, `19:10/20:10`. Le script regarde l'heure de Paris et décide seul :

| Situation | Action |
|---|---|
| Pas d'édition aujourd'hui (à partir de 6 h) | édition complète : 9 infos, 3 leçons, mot du jour, mémo |
| Édition présente, dernière mise à jour il y a 2 h ou plus (à partir de 10 h) | 1 à 3 infos ajoutées + leçon « ⚡ Flash » |
| À partir de 17 h, pas encore de recommandation | film, série, docu ou podcast « En écho à l'actu » |

Rien à publier = aucun commit. Un échec de contrôle = rien n'est publié et le workflow passe au rouge (GitHub t'envoie un e-mail).

## Qui écrit ?

1. Les **titres** viennent des flux RSS de ~24 rédactions, regroupés par sujet (au moins 2 rédactions différentes).
2. Les **sources et liens** de chaque info viennent du code, jamais de l'IA.
3. Les **textes et les quiz** sont rédigés par une IA gratuite à clé (un secret GitHub, au choix) :
   - **Mistral** (`MISTRAL_API_KEY`, console.mistral.ai, entreprise française, niveau gratuit « Experiment »), **Groq** (`GROQ_API_KEY`), **Gemini** (`GEMINI_API_KEY`, le niveau gratuit dépend du pays/compte) ou **OpenRouter** (`OPENROUTER_API_KEY`, modèles gratuits). La première clé trouvée est utilisée.
   - GitHub Models et les IA sans clé ont été essayés : inutilisables depuis GitHub Actions.
   - sans clé : **mode de secours sans aucune IA** (extraits des dépêches, quiz automatiques : titres à compléter, rubriques, associations, un exercice d'écriture). Moins riche, mais l'application ne reste jamais sans édition.
4. `scripts/check-edition.js` vérifie le résultat ; les exercices dont la réponse n'est pas dans le brief sont retirés.

## Ajouter une clé gratuite (2 minutes)

1. Crée la clé : console.mistral.ai → API Keys → Create new key (compte gratuit, choisis l'offre « Experiment »).
2. GitHub → dépôt `scoopfr/scoopfr.github.io` → Settings → Secrets and variables → Actions → New repository secret → nom `MISTRAL_API_KEY`, valeur = la clé.
3. Actions → « Édition automatique » → Run workflow avec l'option `--force`.

## Lancer à la main

GitHub → Actions → « Édition automatique » → Run workflow. Option `--force` pour ignorer l'heure (utile pour un essai).

## Désactiver Claude

Aucune routine Claude ne doit plus tourner : la routine de secours (compte Nico2) est coupée ; si l'ancienne routine du compte principal existe encore, supprime-la sur claude.ai/code/routines (sinon elle republierait en parallèle).
