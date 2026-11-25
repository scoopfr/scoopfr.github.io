# Scoop en vraie appli iOS et Android

## Ce qui existe déjà

Scoop est une **PWA** : on l'installe depuis le navigateur (Android/Chrome : « Installer l'application » ; iPhone/Safari : Partager → « Sur l'écran d'accueil »). Elle s'ouvre en plein écran, marche hors ligne et peut envoyer des notifications (voir `server/README.md`). Pour beaucoup d'élèves, c'est suffisant et gratuit.

Une appli dans l'**App Store** et le **Google Play Store** ajoute : la visibilité (les gens la trouvent), la confiance, et des notifications plus fiables (surtout sur iPhone).

## Les deux chemins

| | Android | iPhone |
|---|---|---|
| **Le plus rapide** | **TWA** (la PWA emballée) avec PWABuilder ou Bubblewrap : environ 1 à 2 h | Enveloppe **Capacitor** : 1 à 2 jours |
| **Compte développeur** | Google Play : **25 $ une fois** | Apple Developer Program : **99 $ par an** |
| **Machine nécessaire** | Aucune (PWABuilder fonctionne dans le navigateur) | Un **Mac avec Xcode**, ou un Mac dans le cloud (GitHub Actions `macos-latest`, Codemagic) |
| **Risque de refus** | Faible | **Réel** : la règle 4.2 d'Apple refuse les simples « sites dans une coque ». Il faut de vraies fonctions natives (rappels locaux, notifications push, partage, retours haptiques) |

## Recommandation

1. **Android d'abord (TWA)** : rapide et sans machine.
   - Va sur pwabuilder.com, entre `https://scoopfr.github.io/`, choisis « Android » : il génère le paquet signé.
   - Mets l'empreinte de signature dans `.well-known/assetlinks.json` (le fichier existe, vide, et `.nojekyll` est en place pour que GitHub Pages le serve).
   - Crée le compte Google Play (25 $). Un compte personnel récent doit d'abord passer par un test fermé avec une douzaine de testeurs pendant 14 jours (règle Google à revérifier au moment de publier).
2. **iPhone ensuite (Capacitor)** : une seule enveloppe pour iOS et Android, dans `native/`.
   - `native/capacitor.config.json` charge le site en ligne (les éditions du jour restent donc toujours fraîches, sans republier l'appli).
   - Fonctions natives à brancher pour passer la validation Apple : **rappels locaux** (`@capacitor/local-notifications` : série et objectif, sans serveur), **notifications push** (`@capacitor/push-notifications`), **partage** et **haptique**. Les paquets sont déjà listés dans `native/package.json`.
   - Étapes : `cd native`, `npm install`, `npm run www`, `npm run add:ios`, `npm run sync`, `npm run open:ios` (sur Mac), puis signature et envoi via Xcode / App Store Connect.

## Ce que je ne peux pas faire d'ici

Ce PC n'a ni Node, ni Mac, ni Android Studio, et les comptes développeur (Google, Apple) sont à ton nom avec un paiement. J'ai donc préparé les fichiers (`native/`, `.well-known/`, manifeste enrichi, serveur de notifications) ; la compilation et l'envoi aux stores restent à faire une fois les comptes créés. Je peux alors te guider pas à pas, ou écrire un workflow GitHub Actions qui compile l'appli Android automatiquement.

## Côté notifications dans une vraie appli

- **Rappels locaux** (série, objectif) : programmés par l'appli sur le téléphone, sans serveur, donc à heure exacte. À préférer dans l'appli native.
- **Push** : Android via Firebase (gratuit), iPhone via la clé APNs d'Apple. Le Worker de `server/` couvre pour l'instant les navigateurs et PWA installées (Web Push) ; il faudrait y ajouter l'envoi FCM/APNs pour les appareils de l'appli native.
