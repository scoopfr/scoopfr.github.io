/* Notifications push : adresse du Worker (voir server/README.md). Laisse `url` vide tant que le serveur n'est pas déployé :
   les rappels restent alors locaux (bandeau de l'accueil + synchronisation périodique de Chrome). */
window.SCOOP_PUSH = {
  url: 'https://scoop-push.nicolas-chaix.workers.dev',
  key: 'BGUklLAs01k1Gif8mRUi_f2nV3FjsshFF5sCBpcTPbeavhcg0--eHZ4QB-3W_DFfmLv35xpEli6-oKDAa9Tg-ME'   // clé publique VAPID (publique par nature)
};
