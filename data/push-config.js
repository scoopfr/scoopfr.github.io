/* Notifications push : adresse du Worker (voir server/README.md). Laisse `url` vide tant que le serveur n'est pas déployé :
   les rappels restent alors locaux (bandeau de l'accueil + synchronisation périodique de Chrome). */
window.SCOOP_PUSH = {
  url: 'https://scoop-push.nicolas-chaix.workers.dev',
  key: ''   // vide : la clé publique est demandée au serveur (/key)
};
