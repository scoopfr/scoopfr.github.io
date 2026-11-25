# Serveur de notifications Scoop

Un petit « Cloudflare Worker » (gratuit, 100 000 requêtes par jour) qui envoie les rappels aux appareils, **même appli fermée**, sur Android, iPhone (appli ajoutée à l'écran d'accueil, iOS 16.4 ou plus) et ordinateur.

Il ne stocke **aucune donnée personnelle** : seulement l'adresse push de l'appareil et l'heure de rappel choisie. Le texte du rappel (série, objectif…) est composé sur l'appareil par l'appli.

## Mise en place (15 minutes, sans rien installer)

Il faut un compte Cloudflare gratuit (cloudflare.com). Tout se fait dans le navigateur.

1. **Créer le Worker** : Workers & Pages → Create → Create Worker → nom `scoop-push` → Deploy → Edit code. Efface le code d'exemple, colle le contenu de `server/worker.js`, Deploy.
2. **Créer la mémoire** : Storage & Databases → KV → Create namespace `SUBS`.
3. **Relier la mémoire** : Worker `scoop-push` → Settings → Bindings → Add → KV namespace → nom de variable `SUBS`, namespace `SUBS`.
4. **Variables** (Settings → Variables and Secrets) :
   - `ALLOWED_ORIGIN` = `https://scoopfr.github.io` (texte)
   - `VAPID_PUBLIC` = la clé publique de `data/push-config.js` (texte)
   - `VAPID_SUBJECT` = `mailto:` suivi d'une adresse de contact de ton choix (texte). Utilise une adresse dédiée, pas ton Gmail personnel si tu veux le garder privé.
   - `VAPID_PRIVATE_JWK` = tout le contenu du fichier `server/vapid-prive.json` (**secret**, jamais dans GitHub : le fichier est déjà ignoré par git).
5. **Déclencheur horaire** : Settings → Trigger Events → Add → Cron Trigger → `0 * * * *` (toutes les heures pile).
6. **Brancher l'appli** : copie l'adresse du Worker (du type `https://scoop-push.<ton-compte>.workers.dev`) dans `data/push-config.js`, champ `url`. Pousse sur GitHub.
7. **Tester** : sur l'appli installée, Profil → Rappels → activer, puis choisir l'heure. Pour forcer un envoi tout de suite, dans Cloudflare : Worker → Triggers → Cron → « Test » (ou temporairement mets l'heure de rappel sur l'heure actuelle de Paris).

## Fonctionnement

- L'appli s'abonne (`/subscribe`) quand on active les rappels et envoie son heure.
- Chaque heure pile, le Worker envoie une notification vide aux appareils dont l'heure correspond (et à 8 h pour « l'édition du jour »).
- Le service worker de l'appli (`sw.js`, évènement `push`) compose le message selon l'état local (série en danger, objectif presque atteint…) et l'affiche. S'il n'y a rien à dire, il affiche un message neutre (iPhone et Chrome exigent qu'une notification soit toujours affichée).
- Un abonnement expire seul après 60 jours sans réabonnement ; un appareil désabonné est supprimé automatiquement.

## Sécurité

- Clé privée : uniquement dans les secrets Cloudflare. Si elle fuit, génère une nouvelle paire (tout le monde devra réactiver les rappels).
- Le Worker n'accepte les appels du navigateur que depuis `https://scoopfr.github.io` (et `localhost` pour les essais).
