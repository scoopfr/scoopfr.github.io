/* =========================================================
   Scoop — couche IA (jury d'entretien, bilan)
   L'IA est un service EXTERNE, indépendant de Claude Code : tu fournis ta propre clé API.
   La clé reste dans ce navigateur (clé « scoop.ai »), elle n'est jamais exportée avec ta
   progression et n'est envoyée qu'au fournisseur que tu as choisi.
   Fournisseurs : Google Gemini (offre gratuite), Anthropic (Claude), ou toute API compatible OpenAI.
   ========================================================= */
(window.SCOOP_MODULES = window.SCOOP_MODULES || []).push(ctx => {
  'use strict';
  const KEY = 'scoop.ai';
  const PROVIDERS = {
    gemini: { label: 'Google Gemini (offre gratuite)', model: 'gemini-2.5-flash', help: 'Clé gratuite sur aistudio.google.com/apikey (compte Google, sans carte bancaire).', keyUrl: 'https://aistudio.google.com/apikey' },
    anthropic: { label: 'Claude (Anthropic, payant)', model: 'claude-haiku-5-5', help: 'Clé sur console.anthropic.com. Facturée à l\'usage, séparément de ton abonnement Claude.', keyUrl: 'https://console.anthropic.com/settings/keys' },
    puter: { label: 'Puter (sans clé, allocation gratuite)', model: '', nokey: true, help: 'Aucune clé à créer : tu te connectes avec un compte Puter gratuit (fenêtre qui s\'ouvre au premier essai). L\'usage est pris sur l\'allocation gratuite mensuelle de ton compte. Tes réponses transitent par Puter.', keyUrl: 'https://puter.com' },
    openai: { label: 'Compatible OpenAI (OpenRouter, Groq, Mistral…)', model: '', base: 'https://openrouter.ai/api/v1', help: 'Indique l\'adresse de l\'API, ta clé et le nom du modèle (ex. OpenRouter, Groq, Mistral).', keyUrl: 'https://openrouter.ai/keys' }
  };

  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const cfg = () => { const c = read(), p = PROVIDERS[c.provider] ? c.provider : 'puter'; return { provider: p, key: c.key || '', model: c.model || PROVIDERS[p].model, base: c.base || PROVIDERS.openai.base }; };
  const setCfg = o => { try { localStorage.setItem(KEY, JSON.stringify(Object.assign(read(), o))); } catch (e) { /* stockage indisponible */ } };
  const ready = () => { const c = cfg(); return c.provider === 'puter' || (!!c.key && !!c.model); };

  // Puter : IA sans clé (l'utilisateur se connecte à son compte gratuit Puter)
  let puterP = null;
  const loadPuter = () => window.puter ? Promise.resolve() : (puterP = puterP || new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = 'https://js.puter.com/v2/'; s.onload = res;
    s.onerror = () => { puterP = null; rej(new Error('Impossible de charger Puter (connexion ?).')); }; document.head.appendChild(s);
  }));
  async function puterChat(c, system, messages, maxTokens, temperature) {
    await loadPuter();
    try {
      const r = await window.puter.ai.chat([{ role: 'system', content: system || '' }, ...messages], Object.assign({ temperature, max_tokens: maxTokens }, c.model ? { model: c.model } : {}));
      const m = typeof r === 'string' ? r : (r && r.message ? r.message.content : '');
      return (Array.isArray(m) ? m.map(p => p.text || '').join('') : String(m || '')).trim();
    } catch (e) {
      const d = e && (e.error && e.error.message || e.message || e.msg) || (typeof e === 'string' ? e : '');
      throw new Error('Puter : ' + (d || 'connexion refusée ou allocation gratuite épuisée.'));
    }
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function friendly(status, body, c) {
    const msg = (body && (body.error && (body.error.message || body.error) || body.message)) || '';
    const m = typeof msg === 'string' ? msg : JSON.stringify(msg);
    if (status === 401 || status === 403 || /api key|permission|unauthor/i.test(m) && status < 500) return `Clé refusée par ${PROVIDERS[c.provider].label.split(' (')[0]} (${status}). Vérifie qu'elle est complète et active. ${m.slice(0, 140)}`;
    if (status === 404) return `Modèle introuvable (« ${c.model} »). Change le nom du modèle dans les réglages de l'IA.`;
    if (status === 429) return 'Quota atteint (trop de demandes ou limite gratuite du jour). Attends un peu, ou change de modèle ou de fournisseur.';
    if (status >= 500) return `Le service IA est momentanément indisponible (${status}). Réessaie dans un instant.`;
    return `Erreur ${status}. ${m.slice(0, 200)}`;
  }

  // messages : [{ role: 'user' | 'assistant', content }] (le premier doit être « user »)
  async function chat({ system, messages, json = false, maxTokens = 1200, temperature = 0.8, signal } = {}) {
    const c = cfg();
    if (c.provider === 'puter') {
      const t = await puterChat(c, system, messages, maxTokens, temperature);
      if (!t) throw new Error('Réponse vide de Puter. Réessaie.');
      return t;
    }
    if (!c.key) throw new Error('Aucune clé IA enregistrée.');
    let url, headers = { 'Content-Type': 'application/json' }, body;
    if (c.provider === 'gemini') {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(c.model)}:generateContent`;
      headers['x-goog-api-key'] = c.key;
      const gc = { temperature, maxOutputTokens: maxTokens };
      if (json) gc.responseMimeType = 'application/json';
      if (/gemini-2\.5-flash/.test(c.model)) gc.thinkingConfig = { thinkingBudget: 0 };   // réponses rapides, délais naturels
      body = { systemInstruction: { parts: [{ text: system || '' }] }, contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })), generationConfig: gc };
    } else if (c.provider === 'anthropic') {
      url = 'https://api.anthropic.com/v1/messages';
      Object.assign(headers, { 'x-api-key': c.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' });
      body = { model: c.model, max_tokens: maxTokens, temperature, system: system || '', messages };
    } else {
      url = c.base.replace(/\/+$/, '') + '/chat/completions';
      headers.Authorization = 'Bearer ' + c.key;
      body = { model: c.model, max_tokens: maxTokens, temperature, messages: [{ role: 'system', content: system || '' }, ...messages] };
      if (json) body.response_format = { type: 'json_object' };
    }
    let lastErr;
    for (let attempt = 0; attempt < 2; attempt++) {
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 60000);
      if (signal) signal.addEventListener('abort', () => ctl.abort(), { once: true });
      try {
        const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: ctl.signal });
        clearTimeout(t);
        let data = null; try { data = await res.json(); } catch (e) { /* corps vide */ }
        if (!res.ok) {
          if ((res.status === 429 || res.status === 503) && attempt === 0) { await sleep(2500); continue; }
          throw new Error(friendly(res.status, data, c));
        }
        let text = '';
        if (c.provider === 'gemini') text = ((data.candidates || [])[0] || {}).content ? (data.candidates[0].content.parts || []).map(p => p.text || '').join('') : '';
        else if (c.provider === 'anthropic') text = (data.content || []).map(p => p.text || '').join('');
        else text = ((data.choices || [])[0] || {}).message ? data.choices[0].message.content : '';
        if (!text) throw new Error('Réponse vide de l\'IA (contenu filtré ou limite atteinte). Réessaie.');
        return text.trim();
      } catch (e) {
        clearTimeout(t); lastErr = e;
        if (e.name === 'AbortError') { if (signal && signal.aborted) throw e; lastErr = new Error('L\'IA met trop de temps à répondre. Réessaie.'); }
        else if (e instanceof TypeError) lastErr = new Error('Impossible de joindre le service IA (connexion coupée, ou ce fournisseur refuse les appels depuis un navigateur). Essaie un autre fournisseur dans les réglages.');
        if (attempt === 1 || /Clé refusée|Modèle introuvable/.test(lastErr.message)) throw lastErr;
        await sleep(1200);
      }
    }
    throw lastErr;
  }

  // Extrait un objet JSON d'une réponse (même entourée de texte ou de ```)
  function parseJson(text) {
    if (!text) return null;
    const t = text.replace(/```(?:json)?/gi, '').trim();
    try { return JSON.parse(t); } catch (e) { /* on cherche les accolades */ }
    const a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch (e) { /* ignore */ } }
    return null;
  }

  async function test() {
    const r = await chat({ system: 'Tu réponds en un seul mot.', messages: [{ role: 'user', content: 'Dis « prêt ».' }], maxTokens: 20, temperature: 0 });
    return r;
  }

  ctx.ai = { preload: () => { loadPuter().catch(() => {}); }, PROVIDERS, cfg, setCfg, ready, chat, parseJson, test };
});
