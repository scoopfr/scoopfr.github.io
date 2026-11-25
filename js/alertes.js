/* =========================================================
   Scoop — Rappels : ne pas perdre sa série, objectif du jour, nouvelle édition, compte à rebours du concours.
   - Bandeau sur l'accueil (toujours disponible).
   - Notifications (si l'élève les active) : envoyées par le service worker, sans serveur ni compte.
     Elles partent via la synchronisation périodique (Chrome / Android, appli installée) ; ailleurs, le bandeau prend le relais.
   Aucune donnée ne quitte l'appareil.
   ========================================================= */
(window.SCOOP_MODULES = window.SCOOP_MODULES || []).push(ctx => {
  'use strict';
  const { esc, TODAY } = ctx;
  const A = window.ScoopAlerts;
  if (!A) return;
  const set = () => ctx.S.settings;
  const supported = 'Notification' in window && 'serviceWorker' in navigator;

  function state() {
    const S = ctx.S, s = S.settings;
    const ex = s.exam && /^\d{4}-\d{2}-\d{2}$/.test(s.exam) ? Math.round((ctx.parseYmd(s.exam) - ctx.parseYmd(TODAY)) / 864e5) : null;
    return { on: !!s.alerts, hour: Number.isInteger(+s.alertHour) ? +s.alertHour : 18, name: s.name || '', streak: S.streak || 0, last: S.last || null,
      xpToday: (S.daily && S.daily[TODAY]) || 0, goal: s.goal || 50, examDays: ex };
  }
  const swReg = () => navigator.serviceWorker.getRegistration().then(r => r || navigator.serviceWorker.ready).catch(() => null);

  // envoie l'état au service worker (il décide seul d'envoyer ou non le rappel)
  let timer = null;
  function sync() {
    if (!supported) return;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const reg = await swReg(); if (!reg || !reg.active) return;
      reg.active.postMessage({ type: 'alert-state', state: state() });
      try {
        if (reg.periodicSync) {
          if (state().on && Notification.permission === 'granted') await reg.periodicSync.register('scoop-rappel', { minInterval: 6 * 3600 * 1000 });
          else await reg.periodicSync.unregister('scoop-rappel');
        }
      } catch (e) { /* non supporté ou refusé */ }
    }, 400);
  }
  ctx.onReady(sync);
  ctx.onAnswer(sync);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') sync(); });

  // ---------- Bandeau de l'accueil ----------
  ctx.addHomeBlock(() => {
    const s = set();
    if (s.alertHideDay === TODAY) return '';
    const a = A.pick({ ...state(), on: true }, new Date(), { force: true });
    if (!a) return '';
    return `<div class="alert-banner" data-kind="${esc(a.kind)}"><div class="ab-txt"><b>${esc(a.title)}</b><span>${esc(a.body)}</span></div>
      <div class="ab-act"><a class="btn small green" href="#/learn">C'est parti</a>${s.alerts ? '' : '<a class="ab-link" href="#/profile">🔔 Activer les rappels</a>'}<button class="ab-x" aria-label="Masquer pour aujourd'hui" data-hide-alert>✕</button></div></div>`;
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-hide-alert]')) return;
    set().alertHideDay = TODAY; ctx.save(); const b = e.target.closest('.alert-banner'); if (b) b.remove();
  });

  // ---------- Réglage dans le profil ----------
  const hours = [12, 17, 18, 19, 20, 21, 22];
  ctx.addProfileBlock(() => {
    const s = set(), perm = supported ? Notification.permission : 'unsupported';
    const note = !supported ? 'Ton navigateur ne gère pas les notifications : le bandeau de l\'accueil te rappelle quand même ta série.'
      : perm === 'denied' ? 'Les notifications sont bloquées dans ton navigateur : autorise-les dans les réglages du site pour les recevoir.'
      : 'Tu reçois au plus un rappel par jour : série en danger, objectif presque atteint, nouvelle édition. Sur Android/Chrome, installe l\'appli pour qu\'ils arrivent même app fermée ; sur iPhone, ils demandent l\'appli ajoutée à l\'écran d\'accueil.';
    return `<h2 class="section-title" style="font-size:22px">Rappels</h2><div class="card">
      <label class="toggle"><span><span style="font-weight:700;font-size:14px">🔔 Me rappeler de venir</span><br><small class="muted">Série, objectif du jour, nouvelle édition. Rien ne quitte ton appareil.</small></span><input id="f-alerts" type="checkbox" ${s.alerts ? 'checked' : ''} ${supported ? '' : 'disabled'}></label>
      <div class="form-row" style="margin-top:12px"><label for="f-alert-hour">Rappel à partir de</label><select id="f-alert-hour">${hours.map(h => `<option value="${h}" ${(+s.alertHour || 18) === h ? 'selected' : ''}>${h} h</option>`).join('')}</select></div>
      <p class="muted" style="font-size:13px;margin-top:10px">${note}</p>
      ${supported ? '<button class="btn small ghost" id="b-alert-test" style="margin-top:8px">Tester un rappel</button>' : ''}</div>`;
  }, () => {
    const t = document.getElementById('f-alerts'); if (!t) return;
    t.onchange = async e => {
      const s = set();
      if (e.target.checked) {
        const p = await Notification.requestPermission().catch(() => 'denied');
        if (p !== 'granted') { e.target.checked = false; s.alerts = false; ctx.save(); alert('Les notifications n\'ont pas été autorisées. Le bandeau de l\'accueil restera ton rappel.'); return; }
      }
      s.alerts = e.target.checked; ctx.save(); sync();
    };
    document.getElementById('f-alert-hour').onchange = e => { set().alertHour = +e.target.value; ctx.save(); sync(); };
    const b = document.getElementById('b-alert-test');
    if (b) b.onclick = async () => {
      if (Notification.permission !== 'granted') { const p = await Notification.requestPermission().catch(() => 'denied'); if (p !== 'granted') return; }
      const reg = await swReg(); const a = A.pick({ ...state(), on: true }, new Date(), { force: true }) || { title: '🔥 Ta série t\'attend', body: 'Une leçon de 2 minutes suffit.', kind: 'test' };
      if (reg) reg.showNotification(a.title, { body: a.body, tag: 'test', icon: 'icons/icon-192.png', data: { url: './#/home' } });
    };
  });
});
