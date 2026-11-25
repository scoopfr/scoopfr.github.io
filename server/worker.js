/* Scoop — serveur de notifications (Cloudflare Worker, gratuit).
   - POST /subscribe   { sub, hour, morning }  : enregistre l'abonnement push d'un appareil
   - POST /unsubscribe { endpoint }            : le supprime
   - Déclencheur horaire (cron) : 2 rappels par jour (édition publiée, puis actus de 18 h, heure de Paris), notification « vide » ;
     c'est le service worker de l'appli qui compose le message (série, objectif…) à partir de l'état local de l'élève.
   Aucune donnée personnelle n'est stockée : seulement l'adresse push de l'appareil et l'heure de rappel.
   Réglages (voir server/README.md) : KV « SUBS », variables ALLOWED_ORIGIN et VAPID_SUBJECT. Les clés VAPID se génèrent toutes seules. */

const enc = new TextEncoder();
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const parisHour = () => +new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', hour12: false, timeZone: 'Europe/Paris' }).format(new Date()) % 24;

const parisDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date());   // AAAA-MM-JJ

// l'édition du jour est-elle publiée ? (la 1re entrée de l'index porte la date du jour)
async function editionPublished(today) {
  try {
    const t = await (await fetch('https://scoopfr.github.io/data/days/index.js?t=' + Date.now())).text();
    const m = t.match(/date: '(\d{4}-\d{2}-\d{2})'/);
    return !!m && m[1] === today;
  } catch (e) { return false; }
}

async function keyId(endpoint) { return 'sub:' + b64u(await crypto.subtle.digest('SHA-256', enc.encode(endpoint))); }

function cors(env, req) {
  const origin = req.headers.get('Origin') || '';
  const ok = origin === env.ALLOWED_ORIGIN || /^http:\/\/localhost(:\d+)?$/.test(origin);
  return { 'Access-Control-Allow-Origin': ok ? origin : env.ALLOWED_ORIGIN, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' };
}

// paire de clés VAPID : générée au premier appel puis gardée dans la mémoire KV du Worker (rien à copier-coller)
async function getKeys(env) {
  let k = await env.SUBS.get('vapid', 'json');
  if (!k) {
    const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    k = { jwk: await crypto.subtle.exportKey('jwk', kp.privateKey), pub: b64u(await crypto.subtle.exportKey('raw', kp.publicKey)) };
    await env.SUBS.put('vapid', JSON.stringify(k));
  }
  return k;
}

async function vapidHeader(env, endpoint) {
  const { jwk, pub } = await getKeys(env);
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const head = b64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64u(enc.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: env.VAPID_SUBJECT })));
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(`${head}.${body}`));   // r||s, format attendu par JWT
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${pub}`;
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
    if (req.method === 'GET' && url.pathname === '/key') return new Response((await getKeys(env)).pub, { headers: h });   // clé publique pour l'abonnement
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

  // appelé toutes les heures pile (cron) : 2 rappels par jour
  //  - édition du jour : dès qu'elle est publiée (entre 7 h et 12 h, une seule fois par jour)
  //  - actus de la journée : à 18 h (heure de Paris)
  async scheduled(event, env, ctx) {
    const hour = parisHour(), today = parisDate();
    let go = hour === 18;
    if (!go && hour >= 7 && hour <= 12 && !(await env.SUBS.get('morning:' + today)) && await editionPublished(today)) {
      go = true; await env.SUBS.put('morning:' + today, '1', { expirationTtl: 172800 });
    }
    if (!go) return;
    let cursor;
    do {
      const page = await env.SUBS.list({ prefix: 'sub:', cursor });
      cursor = page.list_complete ? undefined : page.cursor;
      await Promise.all(page.keys.map(async k => {
        const raw = await env.SUBS.get(k.name); if (!raw) return;
        try {
          const st = await push(env, JSON.parse(raw));
          if (st === 404 || st === 410) await env.SUBS.delete(k.name);   // appareil désabonné
        } catch (e) { /* on réessaiera au prochain rappel */ }
      }));
    } while (cursor);
  }
};
