#!/usr/bin/env node
/* Scoop — mise à jour continue des vidéos du fil (lancée toutes les 30 min par GitHub Actions).
   1. Récupère les Shorts récents de rédactions fiables (flux YouTube publics).
   2. Écarte les vidéos non intégrables et les contenus hors actualité.
   3. Relie chaque vidéo à une info de l'édition du jour (recoupement par mots-clés).
   4. Dédoublonne PAR SUJET : une seule vidéo par info, une seule par sujet hors édition.
   5. Écrit data/live/shorts.js (seulement si la liste a changé).
   Node 18+ sans dépendance. Usage : node scripts/update-live.mjs */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data', 'live', 'shorts.js');
const HOURS = Number(process.env.SCOOP_HOURS || 48);
const MAX = 40;
const UA = 'Mozilla/5.0 (compatible; ScoopNewsBot/1.0)';

const CHANNELS = [
  ['franceinfo', 'UCO6K_kkdP-lnSCiO3tPx7WA'], ['Le Monde', 'UCYpRDnhk5H8h16jpS84uqsA'],
  ['HugoDécrypte', 'UCAcAnMF0OrCtUep3Y4M-ZPw'], ['France 24', 'UCCCPCZNChQdGa9EkATeye4g'],
  ['AFP', 'UCckz6n8QccTd6K_xdwKqa0A'], ['Brut', 'UCSKdvgqdnj72_SLggp7BDTg'],
  ['Le Figaro', 'UCCDz_XYeKWd0OIyjp95dqyQ'], ['Libération', 'UC9x4Iyu-D257P0P-VDRwSzw'],
  ['TV5MONDE Info', 'UCzKH70qfN_yuXq3s91fdwmg'], ['RFI', 'UCm4fSpMpPIZ9z6KHoezLUAg'],
  ['euronews', 'UCW2QcKZiU8aUGg4yxCIditg'], ['France Inter', 'UCJldRgT_D7Am-ErRHQZ90uw'],
  ['Mediapart', 'UCdnaDhU-LDQrIEEmSIfq0-Q'], ['Le Parisien', 'UCfHn_8-ehdem86fEvlFg-Gw'],
  ['TF1 INFO', 'UCsrPUA0ZSDCNZC6wyRlR7ZA'], ['LCI', 'UCewhc0fvja891XkpIPGRMxQ'],
  ['France Culture', 'UCd5DKToXYTKAQ6khzewww2g']
];

// Hors actualité : divertissement, conseils pratiques, promo, extraits d'éditorialistes
const EXCLUDE = [
  /recette|cuisine|astuce|horoscope|bande[- ]annonce|trailer|maquillage|beaut[ée]|régime|minceur|playlist|clip officiel|abonnez|nouvelle série|série audio|podcast/i,
  /^\s*[«"“]/,                            // titre qui commence par une citation = extrait de débat d'opinion
  /lance .{0,40} dans (le club|les grandes gueules|l'heure des pros)/i,
  /#(sant[ée]|nutrition|lifestyle|humour)/i
];

const STOP = new Set(('le la les un une des du de au aux et ou en dans sur pour par avec sans sous chez apres avant ce cette ces son sa ses leur leurs qui que quoi dont est sont etre ete ont fait faire plus moins pas ne se il elle ils elles on nous vous comme mais aussi tres tout tous toute toutes entre contre vers selon lors depuis encore deja alors ainsi quand comment pourquoi quel quelle quels quelles vient veut doit peut nouveau nouvelle nouvelles nouveaux france24 franceinfo video direct explique explication voici voila').split(' '));
const ALIAS = { ukrainien: 'ukraine', ukrainienne: 'ukraine', ukrainiens: 'ukraine', russe: 'russie', russes: 'russie', libyen: 'libye', libyens: 'libye', israelien: 'israel', israelienne: 'israel', americain: 'etats-unis', americaine: 'etats-unis', bateaux: 'navires', navire: 'navires' };
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const tokens = s => new Set(norm(s).replace(/[^a-z0-9\- ]/g, ' ').split(/\s+/)
  .map(w => w.replace(/^-+|-+$/g, '')).map(w => ALIAS[w] || w)
  .filter(w => w.length >= 4 && !STOP.has(w) && !/^\d+$/.test(w)));
const inter = (a, b) => { let n = 0; for (const x of a) if (b.has(x)) n++; return n; };
const decode = s => String(s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();

async function get(url, ms = 20000) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms);
  try { return await fetch(url, { headers: { 'User-Agent': UA }, signal: ctl.signal }); }
  finally { clearTimeout(t); }
}

async function channelShorts([name, cid]) {
  try {
    const r = await get(`https://www.youtube.com/feeds/videos.xml?playlist_id=UUSH${cid.slice(2)}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const xml = await r.text();
    return xml.split('<entry>').slice(1).map(e => ({
      id: (e.match(/<yt:videoId>([^<]+)</) || [])[1],
      title: decode((e.match(/<title>([^<]*)</) || [])[1]),
      published: (e.match(/<published>([^<]+)</) || [])[1],
      source: name
    })).filter(v => v.id && v.title && v.published);
  } catch (err) {
    console.log(`  ${name} : ERREUR ${err.message}`);
    return [];
  }
}

async function embeddable(id) {
  try { const r = await get(`https://www.youtube.com/oembed?url=https://www.youtube.com/shorts/${id}&format=json`, 15000); return r.ok; }
  catch { return false; }
}

async function pool(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
}

function loadScript(file) {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
  return sandbox.window;
}

function latestEdition() {
  try {
    const idx = (loadScript(path.join(ROOT, 'data', 'days', 'index.js')).SCOOP_DAYS_INDEX || [])
      .map(d => typeof d === 'string' ? d : d.date).filter(Boolean).sort().reverse();
    const date = idx[0];
    if (!date) return { date: null, stories: [], shorts: [] };
    const day = (loadScript(path.join(ROOT, 'data', 'days', `${date}.js`)).SCOOP_DAYS || {})[date] || {};
    return { date, stories: day.stories || [], shorts: day.shorts || [] };
  } catch (err) {
    console.log('Édition introuvable : ' + err.message);
    return { date: null, stories: [], shorts: [] };
  }
}

const tidy = t => t.replace(/\s*[•|]\s*(FRANCE 24|RFI|euronews|TV5MONDE.*|franceinfo)\s*$/i, '').trim();

async function main() {
  const since = Date.now() - HOURS * 3600e3;
  const ed = latestEdition();
  console.log(`Édition de référence : ${ed.date || 'aucune'} (${ed.stories.length} infos, ${ed.shorts.length} vidéos choisies par la rédaction)`);

  // 1. Collecte
  const all = (await Promise.all(CHANNELS.map(channelShorts))).flat()
    .filter(v => Date.parse(v.published) >= since)
    .map(v => ({ ...v, title: tidy(v.title) }));
  // les vidéos choisies par la routine du matin restent prioritaires, même si elles ont plus de 48 h
  for (const c of ed.shorts) if (c && c.id && !all.some(v => v.id === c.id)) all.push({ id: c.id, title: c.title, source: c.source, published: null, curated: true });
  for (const v of all) if (ed.shorts.some(c => c && c.id === v.id)) v.curated = true;
  console.log(`Collectées : ${all.length}`);

  // 2. Filtres : hors actualité, puis intégrables
  const news = all.filter(v => v.curated || !EXCLUDE.some(rx => rx.test(v.title)));
  const ok = await pool(news, 6, v => v.curated ? true : embeddable(v.id));
  const usable = news.filter((_, i) => ok[i]);
  console.log(`Actualité : ${news.length}, intégrables : ${usable.length}`);

  // 3. Recoupement avec les infos du jour
  const storyTok = ed.stories.map(s => tokens(`${s.title} ${s.text}`));
  for (const v of usable) {
    v.tok = tokens(v.title);
    const cur = ed.shorts.find(c => c && c.id === v.id);
    if (cur && Number.isInteger(cur.story)) { v.story = cur.story; continue; }
    let best = -1, score = 0;
    storyTok.forEach((st, i) => { const s = inter(v.tok, st); if (s > score) { score = s; best = i; } });
    v.story = score >= 2 ? best : null;
  }

  // 4. Une vidéo par sujet
  const byStory = new Map();
  for (const v of usable.filter(v => v.story != null)) {
    const prev = byStory.get(v.story);
    const better = !prev || (v.curated && !prev.curated) || (v.curated === prev.curated && Date.parse(v.published || 0) > Date.parse(prev.published || 0));
    if (better) byStory.set(v.story, v);
  }
  const loose = usable.filter(v => v.story == null).sort((a, b) => Date.parse(b.published || 0) - Date.parse(a.published || 0));
  const kept = [];
  for (const v of loose) if (!kept.some(k => inter(k.tok, v.tok) >= 2)) kept.push(v); // même sujet = au moins 2 mots-clés communs
  const linked = [...byStory.values()].sort((a, b) => a.story - b.story);
  const videos = [...linked, ...kept].slice(0, MAX).map(v => ({
    id: v.id, source: v.source, title: v.title, published: v.published || null,
    story: v.story ?? null, curated: !!v.curated
  }));
  console.log(`Retenues : ${videos.length} (${linked.length} reliées à une info, ${videos.length - linked.length} autres sujets)`);

  // 5. Écriture seulement si quelque chose a changé
  const body = JSON.stringify({ date: ed.date, videos }, null, 1);
  let previous = '';
  try { previous = fs.readFileSync(OUT, 'utf8'); } catch { /* premier passage */ }
  const prevBody = (previous.match(/\/\*DATA\*\/([\s\S]*)\/\*FIN\*\//) || [])[1];
  if (prevBody && prevBody.trim() === body.trim()) { console.log('Aucun changement : fichier conservé.'); return; }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const updated = new Date().toISOString();
  fs.writeFileSync(OUT, `/* Scoop — vidéos du fil, mises à jour automatiquement (scripts/update-live.mjs). Ne pas modifier à la main. */\n` +
    `window.SCOOP_LIVE = Object.assign({ updated: '${updated}' }, /*DATA*/${body}/*FIN*/);\n`);
  console.log(`Écrit : ${path.relative(ROOT, OUT)} (${updated})`);
}

main().catch(err => { console.error(err); process.exit(1); });
