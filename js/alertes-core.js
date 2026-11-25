/* Scoop — choix du rappel à envoyer (partagé entre l'appli et le service worker).
   pick(état, date) renvoie { kind, title, body, today } ou null. Aucune donnée ne quitte l'appareil. */
(function (g) {
  'use strict';
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (s, n) => { const [y, m, d] = s.split('-').map(Number); return ymd(new Date(y, m - 1, d + n)); };
  const rot = (a, seed) => a[seed % a.length];
  const plur = (n, w) => `${n} ${w}${n > 1 ? 's' : ''}`;

  // st : { on, hour, name, streak, last, xpToday, goal, examDays, sentDay }
  function pick(st, now = new Date(), opts = {}) {
    if (!st || !st.on) return null;
    const today = ymd(now), h = now.getHours(), seed = Math.floor(now / 864e5);
    if (!opts.force && st.sentDay === today) return null;      // un seul rappel par jour
    const played = st.last === today;
    const streak = (played || st.last === addDays(today, -1)) ? (st.streak || 0) : 0;
    const rh = Number.isInteger(st.hour) ? st.hour : 18;
    const hi = st.name ? `${st.name}, ` : '';
    const left = Math.max(0, (st.goal || 50) - (st.xpToday || 0));
    const out = (kind, title, body) => ({ kind, title, body, today });

    if (!played && streak > 0 && h >= rh) return out('streak',
      rot([`🔥 ${plur(streak, 'jour')} d'affilée : ne les perds pas`, `🔥 Ta série de ${plur(streak, 'jour')} est en danger`, `⏳ ${hi}ta série s'arrête ce soir`], seed),
      rot(['Une leçon de 2 minutes et elle repart pour demain.', 'Il te reste quelques heures : une seule leçon suffit à la sauver.', 'Trois questions d\'actu et ta flamme repart.'], seed));
    if (typeof st.examDays === 'number' && st.examDays >= 0 && st.examDays <= 14 && !played && h >= 12) return out('exam',
      `⏳ J-${st.examDays} avant ton concours`, rot(['Chaque jour compte : 10 minutes d\'actu et de culture G aujourd\'hui.', 'Un quiz et un exercice d\'écriture, c\'est l\'entraînement du jour.'], seed));
    if (played && left > 0 && h >= rh + 1) return out('goal',
      `🎯 Plus que ${left} XP pour ton objectif`, rot(['Un quiz rapide suffit pour le boucler.', 'Une dernière leçon et la journée est réussie.'], seed));
    if (!played && h >= 8 && h < 12) return out('morning',
      rot([`☕ ${hi}l'édition du jour est en kiosque`, '📰 Les infos du jour sont là'], seed),
      rot(['Une dizaine d\'infos recoupées, 3 minutes pour tout savoir.', 'Lis l\'essentiel, teste-toi : tu gagnes tes premiers XP.'], seed) + (streak ? ` Ta série : ${plur(streak, 'jour')}.` : ''));
    if (!played && streak === 0 && st.last && h >= 12) return out('comeback',
      rot([`${hi}on t'a gardé une place`, '📰 Ça fait un moment…'], seed), rot(['L\'actu a bougé : reprends avec un quiz rapide de 3 minutes.', 'Repars de zéro : une leçon aujourd\'hui, et une nouvelle série commence.'], seed));
    return null;
  }
  g.ScoopAlerts = { pick, ymd, addDays };
})(typeof self !== 'undefined' ? self : this);
