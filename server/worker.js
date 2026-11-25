/* Scoop — serveur de notifications (Cloudflare Worker, gratuit).
   - POST /subscribe   { sub, hour, morning }  : enregistre l'abonnement push d'un appareil
   - POST /unsubscribe { endpoint }            : le supprime
   - Déclencheur horaire (cron) : à l'heure choisie par chaque élève (heure de Paris), envoie une notification « vide » ;
     c'est le service worker de l'appli qui compose le message (série, objectif…) à partir de l'état local de l'élève.
   Aucune donnée personnelle n'est stockée : seulement l'adresse push de l'appareil et l'heure de rappel.
   Réglages (voir server/README.md) : KV « SUBS », variables ALLOWED_ORIGIN, VAPID_PUBLIC, VAPID_SUBJECT, secret VAPID_PRIVATE_JWK. */

const enc = new TextEncoder();
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const parisHour = () => +new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', hour12: false, timeZone: 'Europe/Paris' }).format(new Date()) % 24;

async function keyId(endpoint) { return 'sub:' + b64u(await crypto.subtle.digest('SHA-256', enc.encode(endpoint))); }

function cors(env, req) {
  const origin = req.headers.get('Origin') || '';
  const ok = origin === env.ALLOWED_ORIGIN || /^http:\/\/localhost(:\d+)?$/.test(origin);
  return { 'Access-Control-Allow-Origin': ok ? origin : env.ALLOWED_ORIGIN, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' };
}

async function vapidHeader(env, endpoint) {
  const jwk = JSON.parse(env.VAPID_PRIVATE_JWK);
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const head = b64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64u(enc.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: env.VAPID_SUBJECT })));
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(`${head}.${body}`));   // r||s, format attendu par JWT
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${env.VAPID_PUBLIC}`;
}

// notification sans contenu : le service worker de l'appli compose le texte
async function push(env, sub) {
  const r = await fetch(sub.endpoint, { method: 'POST', headers: { Authorization: await vapidHeader(env, sub.endpoint), TTL: '7200', Urgency: 'normal', 'Content-Length': '0' } });
  return r.status;
}

export default {
  async fetch(req, env) {
    const h = cors(env, req), url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    if (req.method === 'GET') return new Response('Scoop push : ok', { headers: h });
    if (req.method !== 'POST') return new Response('Méthode refusée', { status: 405, headers: h });
    let b; try { b = await req.json(); } catch (e) { return new Response('JSON invalide', { status: 400, headers: h }); }
    if (url.pathname === '/subscribe') {
      const s = b && b.sub;
      if (!s || typeof s.endpoint !== 'string' || !/^https:\/\//.test(s.endpoint) || s.endpoint.length > 600) return new Response('Abonnement invalide', { status: 400, headers: h });
      const hour = Number.isInteger(b.hour) && b.hour >= 0 && b.hour <= 23 ? b.hour : 18;
      await env.SUBS.put(await keyId(s.endpoint), JSON.stringify({ endpoint: s.endpoint, hour, morning: b.morning !== false }), { expirationTtl: 60 * 86400 });   // expire seul si l'appli ne se réabonne pas
      return new Response('ok', { headers: h });
    }
    if (url.pathname === '/unsubscribe') {
      if (b && typeof b.endpoint === 'string') await env.SUBS.delete(await keyId(b.endpoint));
      return new Response('ok', { headers: h });
    }
    return new Response('Introuvable', { status: 404, headers: h });
  },

  // appelé toutes les heures pile (cron)
  async scheduled(event, env, ctx) {
    const hour = parisHour();
    let cursor;
    do {
      const page = await env.SUBS.list({ prefix: 'sub:', cursor });
      cursor = page.list_complete ? undefined : page.cursor;
      await Promise.all(page.keys.map(async k => {
        const raw = await env.SUBS.get(k.name); if (!raw) return;
        const sub = JSON.parse(raw);
        if (sub.hour !== hour && !(sub.morning && hour === 8)) return;
        try {
          const st = await push(env, sub);
          if (st === 404 || st === 410) await env.SUBS.delete(k.name);   // appareil désabonné
        } catch (e) { /* on réessaiera à la prochaine heure concernée */ }
      }));
    } while (cursor);
  }
};
