#!/usr/bin/env python3
"""Scoop : édition quotidienne et mises à jour AUTOMATIQUES, sans Claude ni abonnement.

Lancé par GitHub Actions (.github/workflows/edition-auto.yml, gratuit). Étapes :
  1. récupère les titres de ~24 rédactions (scripts/fetch_news.py) et les regroupe par sujet (au moins 2 rédactions différentes) ;
  2. selon l'heure de Paris : édition complète (si elle n'existe pas), mise à jour de la journée, ou recommandation culturelle (17 h) ;
  3. la rédaction (textes, quiz) est confiée à une IA GRATUITE : une IA gratuite à clé (Groq, Gemini, Mistral ou OpenRouter : un secret GitHub) ;
     les sources (rédactions et liens) viennent du code, jamais de l'IA ;
  4. contrôle par scripts/check-edition.js (les exercices fautifs sont retirés) ; sans IA ou en cas d'échec, un mode de secours
     fabrique une édition « revue de presse » sans aucune IA (extraits des dépêches + quiz automatiques).
Python standard uniquement. Options : --dry (n'écrit rien dans data/), --no-llm (force le mode de secours), --force (ignore l'heure).
"""
import datetime
import json
import os
import pathlib
import random
import re
import subprocess
import sys
import time
import urllib.error
import unicodedata
import urllib.request
from zoneinfo import ZoneInfo

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from fetch_news import norm_tokens  # noqa: E402

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

TAGS = ["Politique", "Monde", "Europe", "Économie", "Climat", "Médias", "Justice", "Société", "Culture"]
MAX_STORIES = 20
try:
    PARIS = ZoneInfo("Europe/Paris")
except Exception:   # Windows sans base de fuseaux (essais locaux) : règle européenne de l'heure d'été
    def _last_sunday(y, m):
        d = datetime.date(y, m, 31)
        return d - datetime.timedelta(days=(d.weekday() + 1) % 7)

    class _Paris(datetime.tzinfo):
        def utcoffset(self, dt):
            y = dt.year
            start = datetime.datetime.combine(_last_sunday(y, 3), datetime.time(2))
            end = datetime.datetime.combine(_last_sunday(y, 10), datetime.time(3))
            return datetime.timedelta(hours=2 if start <= dt.replace(tzinfo=None) < end else 1)

        def dst(self, dt):
            return self.utcoffset(dt) - datetime.timedelta(hours=1)

        def tzname(self, dt):
            return "Paris"
    PARIS = _Paris()
ARGS = set(sys.argv[1:])


def log(*a):
    print(*a, flush=True)


# ------------------------------------------------------------------ lecture des titres
def media_base(src):
    s = src.split(" (")[0]
    for w in (" International", " Économie", " Médias", " Culture", " Flash", " English"):
        s = s.replace(w, "")
    return s


def display_name(src):
    if "Figaro Flash" in src:
        return "AFP (via Le Figaro)"
    return media_base(src)


def read_items():
    text = (ROOT / "scripts" / "news-today.txt").read_text(encoding="utf-8")
    part = text.split("################ 2.")[1].split("################ 3.")[0]
    items, src, cur = [], None, None
    for line in part.splitlines():
        m = re.match(r"=== (.+) ===$", line)
        if m:
            src = m.group(1); cur = None
        elif line.startswith("- ") and src:
            cur = {"src": src, "title": line[2:].strip(), "desc": "", "link": ""}
            items.append(cur)
        elif cur and re.match(r"^\s+\[.*?\]\s+https?://", line):
            cur["link"] = re.search(r"(https?://\S+)", line).group(1)
        elif cur and line.startswith("    ") and not cur["desc"]:
            cur["desc"] = line.strip()
    return [i for i in items if i["link"]]


def cluster(items):
    """Regroupement par sujet : on compare chaque titre au titre de départ du groupe (pas de chaînage, donc pas de groupe fourre-tout)."""
    toks = [norm_tokens(i["title"]) for i in items]
    groups = []
    for k, it in enumerate(items):
        best, score = None, 0
        for g in groups:
            if media_base(it["src"]) in g["bases"]:
                continue
            shared = len(toks[k] & g["seed"])
            small = max(1, min(len(toks[k]), len(g["seed"])))
            if shared >= 2 and shared / small >= 0.34 and shared > score:
                best, score = g, shared
        if best:
            best["idx"].append(k); best["bases"].add(media_base(it["src"])); best["toks"] |= toks[k]
        else:
            groups.append({"seed": toks[k], "idx": [k], "bases": {media_base(it["src"])}, "toks": set(toks[k])})
    out = [g for g in groups if len(g["bases"]) >= 2]
    out.sort(key=lambda g: (-len(g["bases"]), -len(g["idx"])))
    merged = []   # un même fait raconté par deux groupes : on les fusionne
    for g in out:
        twin = next((m for m in merged if len(m["toks"] & g["toks"]) >= 4), None)
        if twin:
            twin["idx"] += g["idx"]; twin["bases"] |= g["bases"]; twin["toks"] |= g["toks"]
        else:
            merged.append(g)
    merged.sort(key=lambda g: (-len(g["bases"]), -len(g["idx"])))
    out = merged
    res = []
    for n, g in enumerate(out[:16]):
        mem = [items[i] for i in g["idx"]]
        res.append({"id": n, "items": mem, "toks": g["toks"]})
    return res


def sources_of(cl):
    seen, out = set(), []
    for it in cl["items"]:
        b = media_base(it["src"])
        if b in seen:
            continue
        seen.add(b)
        out.append({"name": display_name(it["src"]), "url": it["link"]})
    return out[:4]


def brief(clusters):
    lines = []
    for c in clusters:
        lines.append(f"[{c['id']}] " + ", ".join(sorted({media_base(i['src']) for i in c["items"]})))
        for it in c["items"][:3]:
            d = (it["desc"] or "")[:170]
            lines.append(f"  - ({media_base(it['src'])}) {it['title']}" + (f" — {d}" if d else ""))
    return "\n".join(lines)


# ------------------------------------------------------------------ IA gratuite
class NoLLM(Exception):
    pass


def _post(url, body, headers, tries=3):
    last = None
    for k in range(tries):
        req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "User-Agent": "scoop-auto-edition/1.0", **headers})
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                raw = r.read().decode("utf-8", "ignore")
                try:
                    return json.loads(raw)
                except Exception:
                    raise RuntimeError(f"HTTP {r.status}, corps non JSON : {raw[:300]!r}")
        except urllib.error.HTTPError as e:
            last = f"HTTP {e.code} {e.read().decode('utf-8', 'ignore')[:200]}"
            if e.code in (429, 500, 502, 503):
                time.sleep(20 * (k + 1)); continue
            raise RuntimeError(last)
        except Exception as e:  # réseau
            last = str(e); time.sleep(5)
    raise RuntimeError(last)


def parse_json(txt):
    txt = txt.strip()
    txt = re.sub(r"^```(?:json)?|```$", "", txt, flags=re.M).strip()
    a, b = txt.find("{"), txt.rfind("}")
    txt = txt[a:b + 1]
    try:
        return json.loads(txt)
    except json.JSONDecodeError:
        pass
    try:
        return json.loads(re.sub(r",\s*([}\]])", lambda m: m.group(1), txt))   # virgules en trop avant } ou ]
    except json.JSONDecodeError:
        return salvage(txt)


def salvage(txt):
    """Réponse coupée en plein milieu : on garde ce qui est complet et on referme les crochets."""
    for k in [m.end() for m in re.finditer(r"\}", txt)][::-1][:60]:
        part = txt[:k]
        stack, in_str, esc = [], False, False
        for ch in part:
            if in_str:
                if esc:
                    esc = False
                elif ch == "\\":
                    esc = True
                elif ch == '"':
                    in_str = False
            elif ch == '"':
                in_str = True
            elif ch in "{[":
                stack.append("}" if ch == "{" else "]")
            elif ch in "}]" and stack:
                stack.pop()
        try:
            return json.loads(part + "".join(reversed(stack)))
        except json.JSONDecodeError:
            continue
    raise json.JSONDecodeError("réponse inutilisable", txt, 0)


def llm(system, user, max_tokens=3500):
    if "--no-llm" in ARGS:
        raise NoLLM("désactivée")
    gk = os.environ.get("GEMINI_API_KEY")
    if gk and "--no-gemini" not in ARGS:
        model = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
        r = _post(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gk}",
                  {"systemInstruction": {"parts": [{"text": system}]}, "contents": [{"role": "user", "parts": [{"text": user}]}],
                   "generationConfig": {"responseMimeType": "application/json", "temperature": 0.3, "maxOutputTokens": max_tokens}}, {})
        try:
            return parse_json(r["candidates"][0]["content"]["parts"][0]["text"])
        except Exception:
            raise RuntimeError("réponse Gemini inattendue : " + json.dumps(r, ensure_ascii=False)[:300])
    # fournisseurs gratuits compatibles OpenAI : (secret, adresse, modèles)
    providers = [
        ("GROQ_API_KEY", "https://api.groq.com/openai/v1/chat/completions", [os.environ.get("GROQ_MODEL"), "llama-3.3-70b-versatile", "llama-3.1-8b-instant"]),
        ("MISTRAL_API_KEY", "https://api.mistral.ai/v1/chat/completions", [os.environ.get("MISTRAL_MODEL"), "mistral-small-latest"]),
        ("OPENROUTER_API_KEY", "https://openrouter.ai/api/v1/chat/completions", [os.environ.get("OPENROUTER_MODEL"), "meta-llama/llama-3.3-70b-instruct:free"]),
    ]
    for env, url, models in providers:
        key = os.environ.get(env)
        if not key:
            continue
        for model in [m for m in models if m]:
            try:
                r = _post(url, {"model": model, "temperature": 0.3, "max_tokens": min(max_tokens, 4000), "response_format": {"type": "json_object"},
                                "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}]},
                          {"Authorization": f"Bearer {key}"})
                content = (r.get("choices") or [{}])[0].get("message", {}).get("content") or ""
                if not content.strip():
                    raise RuntimeError("réponse vide : " + json.dumps(r, ensure_ascii=False)[:300])
                return parse_json(content)
            except Exception as e:
                log(f"  ({env.split('_')[0].lower()} · {model} : {str(e)[:160]})")
    # IA gratuite sans clé ni compte (Pollinations) : 1 réponse toutes les 45 s par adresse, donc on espace les appels
    last = None
    for attempt in range(4):
        gap = 46 - (time.time() - _LAST_FREE[0])
        if gap > 0:
            time.sleep(gap)
        _LAST_FREE[0] = time.time()
        try:
            r = _post("https://text.pollinations.ai/openai", {"model": "openai", "temperature": 0.3, "max_tokens": min(max_tokens, 4000),
                                                            "response_format": {"type": "json_object"},
                                                            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}]}, {})
            content = (r.get("choices") or [{}])[0].get("message", {}).get("content") or ""
            if not content.strip():
                raise RuntimeError("réponse vide")
            return parse_json(content)
        except Exception as e:
            last = e; log(f"  (IA sans clé, essai {attempt + 1}/4 : {str(e)[:140]})")
            m = re.search(r"Retry after (\d+)s", str(e))
            if m:
                time.sleep(int(m.group(1)) + 2)
    raise NoLLM(str(last))


_LAST_FREE = [0.0]


SYSTEM = ("Tu es rédacteur en chef d'une application d'actualité pour préparer les concours des écoles de journalisme. "
          "RÈGLES ABSOLUES : (1) n'utilise QUE les informations des titres et résumés fournis, sans rien inventer (aucun chiffre, nom, date absent du brief) ; "
          "(2) écris en français clair et neutre, sans jugement ; (3) réponds UNIQUEMENT par un objet JSON valide.")

EX_SPEC = """Types d'exercices (JSON) :
{"t":"qcm","q":"...","c":["A","B","C","D"],"a":0,"x":"explication courte"}   (3 ou 4 choix, a = index de la bonne réponse, mauvaises réponses plausibles du même domaine)
{"t":"vf","q":"affirmation","a":true,"x":"..."}
{"t":"input","q":"...","a":["réponse","variante"],"x":"..."}   (réponse courte et sans ambiguïté)
{"t":"order","q":"Remets dans l'ordre","items":["dans le bon ordre", ...3 à 5],"x":"..."}
{"t":"match","q":"Associe","pairs":[["gauche","droite"], ... 4 paires aux textes tous différents],"x":"..."}
{"t":"write","q":"consigne d'écriture (titre, chapô, attaque ou résumé d'une dépêche)","src":"la dépêche à partir de laquelle écrire","model":"proposition de la rédaction","crit":["critère 1","critère 2","critère 3","critère 4"]}
CONTRAINTES : la bonne réponse de chaque question doit se trouver mot pour mot dans les textes des infos fournies (jamais de savoir extérieur) ;
une seule réponse possible (si deux choix sont vrais d'après les infos, change la question) ; ne déforme jamais le sens (qui a fait, proposé ou refusé quoi) ;
varie les infos interrogées et ne pose jamais deux fois la même question."""


# ------------------------------------------------------------------ fichiers d'édition (via Node, qui lit les .js existants)
def node_json(path, key="day"):
    try:
        subprocess.run(["node", "--version"], capture_output=True, check=True)
    except Exception:
        if key == "index":   # essai local sans Node : lecture simple de l'index
            txt = pathlib.Path(path).read_text(encoding="utf-8")
            return [{"date": m.group(1), "title": m.group(2).replace("\'", "'"), "lessons": int(m.group(3))} for m in
                    re.finditer(r"""date['"]?: ['"]([\d-]+)['"], ['"]?title['"]?: ['"](.*?)['"], ['"]?lessons['"]?: (\d+)""", txt)]
        raise RuntimeError("Node.js absent")
    out = subprocess.run(["node", str(ROOT / "scripts" / "day_tool.mjs"), str(path), key], capture_output=True, text=True, encoding="utf-8")
    if out.returncode != 0:
        raise RuntimeError(out.stderr[:300])
    return json.loads(out.stdout)


def write_day(day, header):
    p = ROOT / "data" / "days" / f"{day['date']}.js"
    body = json.dumps(day, ensure_ascii=False, indent=2)
    txt = f"/* Scoop — édition du {day['date']} {header} */\nwindow.SCOOP_DAYS = window.SCOOP_DAYS || {{}};\nwindow.SCOOP_DAYS['{day['date']}'] = {body};\n"
    if "--dry" in ARGS:
        (ROOT / "scripts" / "dry").mkdir(exist_ok=True)
        p = ROOT / "scripts" / "dry" / f"{day['date']}.js"
    p.write_text(txt, encoding="utf-8")
    return p


def write_index(entries):
    txt = "/* Scoop — index des éditions (le plus récent en premier). Mis à jour automatiquement. */\nwindow.SCOOP_DAYS_INDEX = [\n" + \
          ",\n".join("  " + json.dumps(e, ensure_ascii=False) for e in entries) + "\n];\n"
    if "--dry" not in ARGS:
        (ROOT / "data" / "days" / "index.js").write_text(txt, encoding="utf-8")


def check(path):
    try:
        subprocess.run(["node", "--version"], capture_output=True, check=True)
    except Exception:
        log("  (Node absent : contrôle ignoré, essai local)"); return []
    r = subprocess.run(["node", str(ROOT / "scripts" / "check-edition.js", ), str(path)], capture_output=True, text=True, encoding="utf-8")
    errs = [l[len("ERREUR : "):] for l in r.stdout.splitlines() if l.startswith("ERREUR : ")]
    return errs


def repair(day, path_writer):
    """Retire les exercices que le contrôle refuse (réponse absente du brief, format), puis revérifie."""
    for _ in range(4):
        p = path_writer(day)
        errs = check(p)
        if not errs:
            return True
        bad = {}
        rest = []
        for e in errs:
            m = re.match(r"Leçon (\d+), exercice (\d+)", e)
            if m:
                bad.setdefault(int(m.group(1)), set()).add(int(m.group(2)))
            else:
                rest.append(e)
        log("  contrôle :", len(errs), "erreur(s)", "; ".join(rest[:3]))
        if not bad:
            return False
        for li, eis in bad.items():
            day["lessons"][li]["exercises"] = [x for k, x in enumerate(day["lessons"][li]["exercises"]) if k not in eis]
    return False


# ------------------------------------------------------------------ rédaction par l'IA
def llm_fact_check(stories, clusters_by_story):
    """2e passe : chaque info est comparée à ses dépêches ; toute affirmation non prouvée ou déformée fait rejeter l'info."""
    if not stories:
        return stories
    blocks = []
    for k, (st, c) in enumerate(zip(stories, clusters_by_story)):
        src = "\n".join(f"   - ({media_base(i['src'])}) {i['title']} — {(i['desc'] or '')[:200]}" for i in c["items"][:4])
        blocks.append(f"[{k}] INFO : {st['title']}. {st['text']}\n   DÉPÊCHES :\n{src}")
    u = ("Compare chaque INFO à ses DÉPÊCHES. Une INFO est fausse si elle contient une affirmation absente des dépêches, "
         "si elle déforme le sens (qui a dit, fait, proposé ou refusé quoi), ou si elle exagère. Sois strict.\n\n" + "\n\n".join(blocks) +
         '\n\nRéponds : {"fausses":[{"i":NUMÉRO,"why":"raison courte"}]}  (liste vide si toutes sont fidèles)')
    try:
        r = llm(SYSTEM, u, 700)
    except NoLLM:
        raise
    except Exception as e:
        log(f"  vérification des infos impossible ({str(e)[:80]})")
        return stories
    bad = set()
    for b in r.get("fausses", []) or []:
        try:
            k = int(b.get("i") if isinstance(b, dict) else b)
        except Exception:
            continue
        if 0 <= k < len(stories):
            bad.add(k)
            QUALITY["infos rejetées"] += 1
            log(f"  info rejetée par la vérification ({(b.get('why') if isinstance(b, dict) else '')[:90]}) : {stories[k]['title'][:70]}")
    return [st for k, st in enumerate(stories) if k not in bad]


def llm_stories(clusters, want, already="", per_story="3 à 5 phrases"):
    u = (f"Voici des sujets d'actualité du jour, regroupés par fait (chaque sujet est couvert par au moins 2 rédactions). Identifiants entre crochets.\n\n{brief(clusters)}\n\n"
         f"{already}"
         f"Choisis {want} sujets (équilibre : politique française, international (au moins 3), Europe, économie, climat ou sciences, médias (au moins 1), société, culture ; "
         "écarte les faits divers sans portée générale et les sujets dont les titres ne parlent pas du même fait).\n"
         'Réponds : {"stories":[{"cluster":ID,"tag":"' + "|".join(TAGS) + '","title":"titre factuel ≤ 90 caractères","text":"' + per_story + ' factuelles tirées des titres et résumés","why":"1 à 2 phrases : pourquoi c\'est utile pour un concours (notion, institution, définition connue de tous)"}]}')
    r = llm(SYSTEM, u, 3800)
    out, seen = [], set()
    by_id = {c["id"]: c for c in clusters}
    for s in r.get("stories", []):
        try:
            cid = int(s["cluster"])
        except Exception:
            continue
        c = by_id.get(cid)
        if not c or cid in seen or s.get("tag") not in TAGS or not s.get("title") or not s.get("text"):
            continue
        story = {"tag": s["tag"], "title": s["title"].strip(), "text": s["text"].strip(), "why": (s.get("why") or "").strip(), "sources": sources_of(c)}
        ok, reason = grounded(story, c)
        if not ok:
            QUALITY["infos rejetées"] += 1
            log(f"  info rejetée (non conforme aux dépêches : {reason}) : {story['title'][:70]}")
            continue
        seen.add(cid)
        out.append(story)
        story["_c"] = c
    out = llm_fact_check(out, [x["_c"] for x in out])
    for x in out:
        x.pop("_c", None)
    return out


# ------------------------------------------------------------------ contrôles de fiabilité
QUALITY = {"infos rejetées": 0, "exercices retirés par la relecture": 0, "exercices retirés (contrôles)": 0, "recommandations refusées": 0}
NUM_RX = re.compile(r"\d+(?:[.,]\d+)?")
TAG_NEED = {"Médias": r"média|journal|presse|télévision|chaîne|radio|journaliste|réseaux sociaux|arcom|cnews|france télévisions|audiovisuel",
            "Justice": r"tribunal|procès|juge|condamn|justice|parquet|cour |mis en examen|prison|enquête|plainte|avocat",
            "Climat": r"climat|cop\d|réchauffement|émission|biodiversité|écolog|énergie|carbone|sécheresse|inondation",
            "Culture": r"cinéma|film|festival|musique|livre|exposition|série|théâtre|concert|musée|artiste|chanteu|écrivain"}


def plain_norm(t):
    t = unicodedata.normalize("NFD", str(t or "").lower())
    return "".join(ch for ch in t if unicodedata.category(ch) != "Mn")


def nums(t):
    return {n.replace(",", ".") for n in NUM_RX.findall(str(t or ""))}


def proper_nouns(t):
    """Mots à majuscule hors début de phrase (noms de personnes, lieux, organisations)."""
    out = set()
    for sent in re.split(r"(?<=[.!?:»])\s+", str(t or "")):
        words = re.findall(r"[A-ZÉÈÀÂÎÔÛÇ][\wÀ-ÿ'’-]{2,}", sent)
        first = re.match(r"\W*([\wÀ-ÿ'’-]+)", sent)
        for w in words:
            if first and w == first.group(1):
                continue
            out.add(w)
    return out


def grounded(story, cluster):
    """Une info n'est publiée que si ses chiffres, ses noms propres et l'essentiel de ses mots viennent des dépêches du groupe."""
    src = " ".join(i["title"] + " " + (i["desc"] or "") for i in cluster["items"])
    src_n = plain_norm(src)
    src_nums = nums(src)
    body = story["title"] + " " + story["text"]
    missing = [n for n in nums(body) if n not in src_nums and not (len(n) == 4 and n.startswith("20"))]   # années courantes tolérées
    if missing:
        return False, "chiffre absent des sources : " + ", ".join(missing[:3])
    src_tok = norm_tokens(src)
    def known(w):
        return plain_norm(w) in src_n or bool(norm_tokens(w) & src_tok)
    # un prénom ou un titre est toléré s'il est collé à un nom présent dans les sources (« Donald Trump » quand la source dit « Trump »)
    seqs = re.findall(r"(?:[A-ZÉÈÀÂÎÔÛÇ][\wÀ-ÿ'’-]+)(?:\s+(?:de |d'|du |la |le )?[A-ZÉÈÀÂÎÔÛÇ][\wÀ-ÿ'’-]+)*", body)
    ok_words = set()
    for sq in seqs:
        parts = re.findall(r"[A-ZÉÈÀÂÎÔÛÇ][\wÀ-ÿ'’-]+", sq)
        if any(known(x) for x in parts):
            ok_words |= set(parts)
    bad_nouns = [w for w in proper_nouns(body) if w not in ok_words and not known(w)]
    if bad_nouns:
        return False, "nom absent des sources : " + ", ".join(bad_nouns[:3])
    tok = norm_tokens(story["text"])
    if tok and len(tok & src_tok) / len(tok) < 0.45:
        return False, "texte trop éloigné des dépêches"
    # « pourquoi c'est utile » : pas de chiffre ni de nom inventé ; sinon on le remplace par une phrase neutre
    if [n for n in nums(story["why"]) if n not in src_nums] or [w for w in proper_nouns(story["why"]) if plain_norm(w) not in src_n and w not in ("Union", "Europe", "France", "ONU", "OTAN", "État", "États")]:
        story["why"] = "Un fait confirmé par plusieurs rédactions : savoir le résumer (qui, quoi, où, quand) et en expliquer l'enjeu fait partie de l'épreuve d'actualité."
    # rubrique plausible
    need = TAG_NEED.get(story["tag"])
    if need and not re.search(need, (story["title"] + " " + story["text"]).lower()):
        story["tag"] = guess_tag(story["title"], story["text"])
    return True, ""


LESSON_TAGS = [{"Politique", "Société", "Économie", "Justice", "Culture", "Climat"},
               {"Monde", "Europe", "Économie", "Climat"},
               {"Médias", "Culture", "Société", "Justice", "Politique"}]


def dedupe_stories(stories):
    out = []
    for st in stories:
        t = norm_tokens(st["title"] + " " + st["text"])
        if any(len(t & norm_tokens(o["title"] + " " + o["text"])) / max(1, min(len(t), len(norm_tokens(o["title"] + " " + o["text"])))) >= 0.45 for o in out):
            log(f"  info en doublon retirée : {st['title'][:70]}")
            continue
        out.append(st)
    return out


def ambiguous_qcm(stories, e):
    """Plusieurs choix sont vrais d'après les infos (ex. deux médias ont publié la même révélation) : question ambiguë."""
    c, a = e.get("c"), e.get("a")
    if not isinstance(c, list) or not isinstance(a, int) or not 0 <= a < len(c):
        return True
    good = plain_norm(c[a])
    for st in stories:
        txt = plain_norm(st["title"] + " " + st["text"])
        if good and good in txt:
            others = [x for k, x in enumerate(c) if k != a and len(plain_norm(x)) > 2 and plain_norm(x) in txt]
            if others:
                return True
    return False


COUNTRIES = set(plain_norm(x) for x in "France Allemagne Espagne Italie Royaume-Uni États-Unis Chine Russie Ukraine Israël Iran Birmanie Salvador Égypte Libye Syrie Liban Turquie Inde Japon Brésil Mexique Canada Belgique Suisse Pologne Hongrie Grèce Portugal Algérie Maroc Tunisie Mali Niger Soudan Gaza Venezuela Argentine Colombie Corée Australie".split())


def wrong_kind(e):
    """« Quel pays » dont la réponse est une personne, « Qui » dont la réponse est un chiffre, etc."""
    q = plain_norm(e.get("q", ""))
    ans = e["c"][e["a"]] if e.get("t") == "qcm" and isinstance(e.get("c"), list) and isinstance(e.get("a"), int) and 0 <= e["a"] < len(e["c"]) else ((e.get("a") or [""])[0] if isinstance(e.get("a"), list) else "")
    a = plain_norm(ans)
    person = len(re.findall(r"[A-ZÉÈ][a-zà-ÿ]+", str(ans))) >= 2 and not any(c in a for c in COUNTRIES)
    if re.search(r"\bquel(le)? (pays|ville|region|etat)\b", q) and person:
        return True
    if re.search(r"\b(qui|quel dirigeant|quelle personne)\b", q) and re.fullmatch(r"[\d\s.,%]+", a or "x"):
        return True
    if re.search(r"\bcombien\b", q) and not re.search(r"\d", a):
        return True
    return False


def sentences_of(stories):
    out = []
    for st in stories:
        for t in (st["title"], st["text"]):
            for x in re.split(r"(?<=[.!?»])\s+", t):
                if x.strip():
                    out.append(x)
    return out


def best_sentence(sents, text, must=""):
    """Phrase des infos qui contient `must` (la réponse) et le plus de mots de `text` (la question). Renvoie la part des mots retrouvés."""
    tok = norm_tokens(text)
    m = plain_norm(must)
    best = 0.0
    for x in sents:
        if m and m not in plain_norm(x):
            continue
        xt = norm_tokens(x)
        if not tok:
            return 1.0
        best = max(best, len(tok & xt) / len(tok))
    return best


QWORDS = set("""nom noms quel quelle quels quelles combien personne personnes organisme organismes pays ville villes region
quoi quand titre complete info infos jour edition annonce annonces etait sont selon parmi suivant suivante suivants
principal principale objectif lequel laquelle lesquels designe appelle appele chiffre nombre date annee mois
associe correspond correspondant correspondants element elements fait faits vrai faux affirmation""".split())


def toks(t):
    """Mots porteurs de sens, apostrophes séparées (« d'une » -> « une »)."""
    return norm_tokens(re.sub(r"[’']", " ", str(t or "")))


def content_tokens(t):
    return {w for w in toks(t) if w not in QWORDS}


def story_of(stories, text, must=""):
    """L'info qui contient la réponse (`must`) et le plus de mots de `text`."""
    m = plain_norm(must)
    best, score = None, -1
    tok = content_tokens(text)
    for st in stories:
        body = st["title"] + " " + st["text"]
        bt = toks(body)
        if m and m not in plain_norm(body) and not (content_tokens(must) and content_tokens(must) <= bt):
            continue   # la réponse doit figurer dans l'info (telle quelle, ou tous ses mots)
        sc = len(tok & bt)
        if sc > score:
            best, score = st, sc
    return best


def all_words_in(text, story, tolerance=0):
    """Tous les mots porteurs de sens de `text` figurent dans l'info (au plus `tolerance` absents)."""
    if not story:
        return False
    body = toks(story["title"] + " " + story["text"])
    stems = {b[:6] for b in body if len(b) >= 6}

    def has(w):   # même mot, ou même racine pour les mots longs (« demandé » / « demander »)
        return w in body or (len(w) >= 6 and w[:6] in stems)
    missing = [w for w in content_tokens(text) if not has(w)]
    return len(missing) <= tolerance


def strict_ok(stories, e):
    """Ancrage mécanique, sans IA : la question n'emploie que des mots de l'info concernée et la réponse y figure telle quelle.
    Une question qui invente un mot (« journaliste », « a reçu ») ou un lien (« Pays-Bas ») est rejetée."""
    t = e.get("t")
    if t == "qcm":
        good = e["c"][e["a"]]
        st = story_of(stories, str(e.get("q")), good)
        return all_words_in(str(e.get("q")), st, 0)
    if t == "input":
        good = (e.get("a") or [""])[0]
        st = story_of(stories, str(e.get("q")), good)
        return all_words_in(str(e.get("q")), st, 0)
    if t == "vf":
        st = story_of(stories, str(e.get("q")))
        if e.get("a") is True:
            return all_words_in(str(e.get("q")), st, 0)       # une affirmation VRAIE : aucun mot ajouté
        return st is not None and len(content_tokens(str(e.get("q"))) & toks(st["title"] + " " + st["text"])) >= 2
    if t == "match":
        for left, right in e.get("pairs") or []:
            if not any(all_words_in(f"{left} {right}", st, 0) for st in stories):
                return False
        return True
    if t == "order":
        return all(any(all_words_in(it, st, 1) for st in stories) for it in e.get("items") or [])
    return True


def check_exercises(stories, exs):
    """Contrôles automatiques simples, avant la relecture par l'IA."""
    corpus = plain_norm(" ".join(s["title"] + " " + s["text"] + " " + s.get("why", "") for s in stories))
    corpus_nums = nums(" ".join(s["title"] + " " + s["text"] for s in stories))
    keep = []
    for e in exs:
        t = e.get("t")
        txt = json.dumps(e, ensure_ascii=False)
        if [n for n in nums(txt) if n not in corpus_nums and not (len(n) == 4 and n.startswith("20"))] and t != "write":
            if t == "qcm":   # un mauvais choix peut contenir un chiffre inventé ; la question et la bonne réponse, non
                good = e.get("c", [None] * 9)[e.get("a", 0)] if isinstance(e.get("c"), list) and isinstance(e.get("a"), int) and 0 <= e.get("a", 0) < len(e.get("c")) else None
                if good is None or [n for n in nums(str(e.get("q")) + " " + str(good)) if n not in corpus_nums]:
                    continue
            elif t == "vf" and e.get("a") is False:
                pass   # une affirmation fausse peut contenir un chiffre faux
            else:
                continue
        if t == "qcm":
            c = e.get("c")
            if not isinstance(c, list) or len(c) < 3 or len({plain_norm(x) for x in c}) != len(c) or not isinstance(e.get("a"), int) or not 0 <= e["a"] < len(c):
                continue
            if ambiguous_qcm(stories, e):
                continue
        if t == "match":
            pairs = e.get("pairs")
            if not isinstance(pairs, list) or len(pairs) < 3 or any(not isinstance(pr, list) or len(pr) != 2 for pr in pairs):
                continue
        if t in ("qcm", "input") and wrong_kind(e):
            continue
        if t == "input":
            a = e.get("a")
            if not isinstance(a, list) or not a or len(str(a[0]).split()) > 5 or plain_norm(a[0]) not in corpus:
                continue
        if t == "vf" and e.get("a") is True:
            tok = norm_tokens(str(e.get("q")))
            if tok and len([w for w in tok if w in corpus]) / len(tok) < 0.7:
                continue
        if t != "write" and not strict_ok(stories, e):
            log(f"  exercice retiré (non ancré dans une phrase des infos) : {str(e.get('q'))[:80]}")
            continue
        keep.append(e)
    QUALITY["exercices retirés (contrôles)"] += len(exs) - len(keep)
    return keep


def show(e):
    t = e.get("t")
    if t == "qcm":
        return f"QCM « {e.get('q')} » choix {e.get('c')} → réponse donnée : « {e['c'][e['a']]} »"
    if t == "vf":
        return f"VRAI/FAUX « {e.get('q')} » → réponse donnée : {'VRAI' if e.get('a') else 'FAUX'}"
    if t == "input":
        return f"RÉPONSE À TAPER « {e.get('q')} » → réponse donnée : « {(e.get('a') or [''])[0]} »"
    if t == "match":
        return f"ASSOCIATION « {e.get('q')} » paires {e.get('pairs')}"
    if t == "order":
        return f"ORDRE « {e.get('q')} » ordre donné {e.get('items')}"
    return f"ÉCRITURE « {e.get('q')} »"


def llm_review(stories, exs):
    """Relecture : une 2e passe de l'IA signale les exercices faux, ambigus ou mal formulés ; ils sont retirés."""
    if not exs:
        return exs
    lst = "\n".join(f"{k}. {show(e)}" for k, e in enumerate(exs))
    u = (f"Voici les infos du jour (seule référence) :\n{stories_brief(stories)}\n\nVoici des exercices de quiz :\n{lst}\n\n"
         "Tu es correcteur exigeant. Signale chaque exercice dont : la réponse donnée est fausse ou non prouvée par les infos ; la question est ambiguë, "
         "mal formulée ou incohérente avec la réponse (ex. « quel pays » pour une personne) ; plusieurs choix pourraient être justes ; une affirmation VRAI n'est pas exactement dans les infos ; la question déforme le sens d'une info (qui a proposé quoi, qui a refusé quoi). "
         'Réponds : {"bad":[{"i":NUMÉRO,"why":"raison courte"}]}  (liste vide si tout est juste)')
    try:
        r = llm(SYSTEM, u, 900)
    except NoLLM:
        raise
    except Exception as e:
        log(f"  relecture impossible ({str(e)[:80]}) : exercices gardés après contrôles automatiques")
        return exs
    bad = set()
    for b in r.get("bad", []) or []:
        try:
            k = int(b.get("i") if isinstance(b, dict) else b)
        except Exception:
            continue
        if 0 <= k < len(exs) and exs[k].get("t") != "write":
            bad.add(k)
            log(f"  relecture : exercice retiré ({(b.get('why') if isinstance(b, dict) else '')[:80]}) : {str(exs[k].get('q'))[:70]}")
    QUALITY["exercices retirés par la relecture"] += len(bad)
    return [e for k, e in enumerate(exs) if k not in bad]


def wiki_verify(title, by, year):
    """L'œuvre recommandée existe-t-elle vraiment (titre, auteur, année) ? Vérifié sur Wikipédia (fr puis en)."""
    import urllib.parse
    last = plain_norm(str(by or "").split()[-1]) if by else ""
    tw = [w for w in norm_tokens(title)] or [plain_norm(title)]
    for lang in ("fr", "en"):
        try:
            q = urllib.parse.quote(f"{title} {by or ''}")
            url = f"https://{lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch={q}&srlimit=3&format=json"
            req = urllib.request.Request(url, headers={"User-Agent": "scoop-auto-edition/1.0"})
            hits = json.loads(urllib.request.urlopen(req, timeout=20).read().decode())["query"]["search"]
            for h in hits:
                u2 = f"https://{lang}.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles={urllib.parse.quote(h['title'])}&format=json"
                req2 = urllib.request.Request(u2, headers={"User-Agent": "scoop-auto-edition/1.0"})
                pages = json.loads(urllib.request.urlopen(req2, timeout=20).read().decode())["query"]["pages"]
                ext = plain_norm(" ".join(pg.get("extract", "") for pg in pages.values()) + " " + h["title"])
                if all(w in ext for w in tw[:4]) and (not last or last in ext) and (not year or str(year) in ext):
                    return True
        except Exception as e:
            log(f"  (vérification Wikipédia {lang} impossible : {str(e)[:80]})")
    return False


def stories_brief(stories):
    return "\n".join(f"{i}. [{s['tag']}] {s['title']} — {s['text']} {s.get('why', '')}" for i, s in enumerate(stories))


def llm_meta(stories):
    u = (f"Voici les infos du jour :\n{stories_brief(stories)}\n\n"
         'Réponds : {"title":"titre d\'édition de 60 à 80 caractères qui résume les 2 ou 3 sujets majeurs","intro":"2 phrases",'
         '"word":{"term":"mot du jour (notion d\'institutions, d\'économie, de droit ou de médias liée à l\'actu)","def":"définition en 2 ou 3 phrases, intemporelle"},'
         '"memo":["4 ou 5 choses à retenir (dates, chiffres, noms) présentes dans les infos"],'
         '"glossary":[{"term":"terme présent tel quel dans les textes","def":"définition intemporelle, 1 à 2 phrases","cat":"Justice|Institutions|International|Europe|Économie|Climat|Numérique|Société|Monde|Métier"}]}  (3 termes)')
    return llm(SYSTEM, u, 1800)


LESSONS = [
    ("Le quiz de la une", "☕", "France : politique, société, économie", "Fais 9 ou 10 exercices (qcm, vf, input, un match ou un order) sur les infos de France ; ajoute 1 exercice write (résumé ou titre d'une dépêche)."),
    ("Le tour du monde", "🌍", "International et Europe", "Fais 8 ou 9 exercices (qcm, vf, input, un match ou un order) sur les infos internationales et européennes ; ajoute 1 exercice write."),
    ("Médias & atelier", "🎙️", "Presse, culture et écriture", "Fais 7 ou 8 exercices, dont 2 write (titrer une dépêche, rédiger une attaque ou un chapô) construits sur de vraies infos du brief, avec le reste en qcm, vf ou match."),
]


def llm_lesson(stories, spec, n_ex=None, title=None, icon=None, desc=None):
    t, ic, d, consigne = spec
    u = (f"Voici les infos du jour :\n{stories_brief(stories)}\n\n{EX_SPEC}\n\n"
         f"Rédige la leçon « {title or t} » : {consigne}\n"
         'Réponds : {"exercises":[ ... ]}')
    r = llm(SYSTEM, u, 3800)
    ex = [e for e in r.get("exercises", []) if isinstance(e, dict) and e.get("t") in ("qcm", "vf", "input", "order", "match", "write")]
    return {"title": title or t, "icon": icon or ic, "desc": desc or d, "exercises": ex}


PARTS = [
    ("Fais exactement 5 exercices courts (qcm, vf ou input), sans exercice write.", ),
    ("Fais exactement 3 autres exercices courts (qcm, vf ou input) sur d'autres infos que les précédents, sans exercice write.", ),
    ("Fais exactement 3 exercices : 1 match (4 paires) ou 1 order, 1 qcm, et 1 exercice write construit sur une vraie info du brief.", ),
]


def llm_lesson2(stories, spec):
    """Leçon en 2 petites demandes (l'IA gratuite coupe les réponses longues)."""
    t, ic, d, _ = spec
    ex = []
    for (consigne,) in PARTS:
        try:
            ex += llm_lesson(stories, (t, ic, d, consigne))["exercises"]
        except NoLLM:
            raise
        except Exception as e:
            log(f"  morceau de leçon « {t} » ignoré ({str(e)[:100]})")
    uniq, seen = [], []
    for e in ex:
        tq = norm_tokens(str(e.get("q", "")))
        if e.get("t") != "write" and any(tq and len(tq & o) / max(1, min(len(tq), len(o))) >= 0.7 for o in seen):
            continue
        seen.append(tq)
        uniq.append(e)
    writes = [e for e in uniq if e.get("t") == "write"]
    uniq = [e for e in uniq if e.get("t") != "write"] + writes[:2]   # l'exercice d'écriture en fin de leçon
    ex = llm_review(stories, check_exercises(stories, uniq))
    return {"title": t, "icon": ic, "desc": d, "exercises": ex}


def llm_reco(stories):
    u = (f"Infos du jour :\n{stories_brief(stories)}\n\n"
         "Recommande UNE œuvre (film, série, documentaire ou podcast) qui fait écho à l'événement le plus marquant de la journée. "
         "Cite uniquement une œuvre réelle et très connue dont tu es CERTAIN (titre exact, réalisateur ou auteur, année). Sinon réponds {\"reco\":null}.\n"
         'Réponds : {"reco":{"type":"film|série|docu|podcast","title":"...","by":"...","year":2000,"story":INDEX_DE_L_INFO_LIÉE,"why":"2 phrases sur le lien avec l\'actu"}}')
    return llm(SYSTEM, u, 700).get("reco")


# ------------------------------------------------------------------ mode de secours (sans IA)
WORDS = [
    ("Pluralisme", "Existence de plusieurs médias, opinions et sources d'information indépendants les uns des autres, garante du débat démocratique."),
    ("Recoupement", "Vérification d'une information auprès d'au moins deux sources indépendantes avant de la publier."),
    ("Dépêche", "Texte court et factuel diffusé par une agence de presse (AFP, Reuters) que les médias reprennent."),
    ("Secret des sources", "Droit du journaliste de ne pas révéler l'identité des personnes qui lui ont fourni des informations."),
    ("Chapô", "Court texte placé sous le titre d'un article, qui en donne l'essentiel ou l'angle."),
    ("Pyramide inversée", "Manière d'écrire qui place l'information la plus importante au début, puis les détails par ordre décroissant."),
    ("Droit de réponse", "Faculté pour une personne nommée dans un média d'y faire publier sa réponse."),
    ("Embargo", "Interdiction de publier une information avant une date et une heure convenues."),
    ("Angle", "Point de vue choisi pour traiter un sujet, formulé comme une question précise."),
    ("Fact-checking", "Vérification des faits et des chiffres avancés dans le débat public."),
    ("Lanceur d'alerte", "Personne qui révèle de bonne foi des faits graves dont elle a connaissance, dans l'intérêt général."),
    ("Éditorial", "Article d'opinion qui engage la rédaction d'un média, distinct de l'information."),
]
TAG_RULES = [
    ("Monde", r"ukrain|russ|israël|israel|gaza|iran|chine|états-unis|etats-unis|libye|syrie|onu|otan|guerre|trump|netanyahu"),
    ("Justice", r"tribunal|procès|juge|condamn|justice|parquet|cour |mis en examen|prison"),
    ("Médias", r"média|journal|presse|télévision|réseaux sociaux|tiktok|journaliste"),
    ("Climat", r"climat|cop\d|réchauffement|émission|biodiversité|écolog|énergie|météo|tempête|inondation"),
    ("Économie", r"économi|inflation|bourse|droits de douane|taux|entreprise|budget|croissance|emploi|chômage|salaire|prix"),
    ("Europe", r"union européenne|bruxelles|commission européenne|parlement européen|\bue\b|européen"),
    ("Politique", r"gouvernement|assemblée|sénat|ministre|présidentielle|élection|premier ministre|député|macron|parti"),
    ("Culture", r"cinéma|film|festival|musique|livre|prix |exposition|série|théâtre|concert"),
    ("Société", r"école|santé|logement|retraite|immigration|police|manifest|grève|famille|incendie|football|ligue des champions|match|sport"),
]


def guess_tag(title, desc):
    t = (title + " " + desc).lower()
    for tag, rx in TAG_RULES:
        if re.search(rx, t):
            return tag
    return "Monde"


def cut(t, n):
    if len(t) <= n:
        return t
    t = t[:n].rsplit(" ", 1)[0].rstrip(" ,;:-«(")
    stop = {"une", "un", "de", "du", "des", "la", "le", "les", "et", "à", "au", "aux", "en", "que", "qui", "pour", "avec", "sur", "dans", "par", "sa", "son", "ses", "d'", "l'"}
    parts = t.split(" ")
    while len(parts) > 2 and parts[-1].lower() in stop:
        parts.pop()
    return " ".join(parts)


EMOJI_RX = re.compile("[\U0001F300-\U0001FAFF\u2600-\u27BF\u2B50\u2B55\u23E9-\u23FA]")


def first_sentences(d, n=2, cap=330):
    d = EMOJI_RX.sub("", d).strip()
    sents = re.findall(r"[^.!?]+[.!?]", d)
    out = " ".join(x.strip() for x in sents[:n]) if sents else d
    out = cut(out, cap)
    return out if out.endswith((".", "!", "?")) else out + "."


FR_SOURCES = {name for name, _url, lang in __import__("fetch_news").FEEDS if lang == "fr"}


def basic_stories(clusters, want, used_urls=()):
    out = []
    for c in clusters:
        if any(i["link"] in used_urls for i in c["items"]):
            continue
        its = [i for i in c["items"] if i["src"] in FR_SOURCES] + [i for i in c["items"] if i["src"] not in FR_SOURCES]
        if its[0]["src"] not in FR_SOURCES:
            continue   # aucun titre en français : on ne publie pas une info en anglais
        first = its[0]
        if re.search(r"\b(EN DIRECT|LIVE)\b", first["title"]):
            continue
        text_parts = [first_sentences(i["desc"] or i["title"], 1) for i in its[:2] if i["src"] in FR_SOURCES]
        tag = guess_tag(first["title"], first["desc"])
        out.append({"tag": tag, "title": cut(first["title"], 140), "text": " ".join(dict.fromkeys(text_parts)),
                    "why": f"Un fait relayé par {len(c['bases']) if 'bases' in c else len({media_base(i['src']) for i in its})} rédactions : savoir le situer (qui, où, quand) fait partie de l'épreuve d'actualité.",
                    "sources": sources_of(c)})
        if len(out) >= want:
            break
    return out


def blank_word(title):
    """Texte à trous : retire un mot propre (majuscule) ou un nombre du titre."""
    words = title.split()
    if re.search(r"\b(EN DIRECT|LIVE|DIRECT)\b", title):
        return None
    cands = [k for k, w in enumerate(words) if k > 0 and not w.isupper() and not w.startswith(("«", '"'))
             and (re.match(r"^[A-ZÉÈÀÂÎÔ][a-zà-ÿ’'-]{3,}$", w.strip("«»\"',.:;")) or re.match(r"^\d[\d.,]*$", w))]
    if not cands:
        return None
    k = random.choice(cands)
    ans = words[k].strip("«»\"',.:;")
    q = " ".join(words[:k] + ["_____"] + words[k + 1:])
    return q, ans


def basic_lessons(stories, day):
    rnd = random.Random(day["date"])
    exs_cloze, exs_tag = [], []
    for s in stories:
        b = blank_word(s["title"])
        if b:
            exs_cloze.append({"t": "input", "q": f"Complète le titre d'une info du jour : « {b[0]} »", "a": [b[1]], "x": f"Titre complet : {s['title']}"})
    pool = [s["title"] for s in stories]
    for s in stories:
        wrong = [t for t in pool if t != s["title"]]
        rnd.shuffle(wrong)
        ch = [s["title"][:110]] + [w[:110] for w in wrong[:3]]
        if len(ch) < 3:
            continue
        pass   # (QCM « quelle rubrique » supprimés : la rubrique est devinée, donc pas assez fiable pour un quiz)
    tags = {}
    for s in stories:
        tags.setdefault(s["tag"], s)
    pairs = [[t, s["title"][:90]] for t, s in tags.items()][:4]
    mt = [{"t": "match", "q": "Associe chaque rubrique à une info du jour", "pairs": pairs, "x": "Une rubrique, une info de l'édition."}] if len(pairs) >= 3 else []
    rnd.shuffle(exs_cloze); rnd.shuffle(exs_tag)
    parts = [(exs_cloze[0:4] + exs_tag[0:3] + mt), (exs_cloze[4:8] + exs_tag[3:6]), (exs_tag[6:9] + exs_cloze[8:11])]
    lessons = []
    for (t, ic, d, _), ex in zip(LESSONS, parts):
        ex = ex or exs_tag[:3]
        w = stories[len(lessons) % len(stories)]
        ex = ex + [{"t": "write", "q": "✍️ Écris un chapô de 300 signes maximum pour cette dépêche", "src": w["text"], "max": 300,
                    "model": "**Chapô possible :** " + first_sentences(w["text"], 2, 295),
                    "crit": ["Il donne l'essentiel (qui, quoi, où, quand)", "Il fait moins de 300 signes", "Il ne recopie pas le titre", "Tout ce qui est écrit figure dans la dépêche"]}]
        lessons.append({"title": t, "icon": ic, "desc": d, "exercises": ex})
    return lessons


def basic_flash(new, title):
    ex = []
    for s in new:
        b = blank_word(s["title"])
        if b:
            ex.append({"t": "input", "q": f"Complète le titre d'une info ajoutée : « {b[0]} »", "a": [b[1]], "x": f"Titre complet : {s['title']}"})
    w = new[0]
    ex.append({"t": "write", "q": "✍️ Écris un titre informatif (80 signes maximum, avec un verbe) pour cette dépêche", "src": w["text"], "max": 80,
               "model": f"**Titre de la rédaction :** {w['title']}",
               "crit": ["Il est informatif (on comprend le fait)", "Il contient un verbe et reste sous 80 signes", "Il ne promet rien que le texte ne donne pas", "Il évite les adjectifs de jugement"]})
    return {"title": title, "icon": "⚡", "desc": "Mise à jour", "exercises": ex}


def basic_meta(stories, date):
    w = WORDS[datetime.date.fromisoformat(date).toordinal() % len(WORDS)]
    tops = [cut(re.split(r"[:,«]", s["title"])[0].strip(), 38) for s in stories[:2]]
    return {"title": " · ".join(tops) + " et l'actu du jour", "intro": "Revue de presse du jour : les infos confirmées par au moins deux rédactions.",
            "word": {"term": w[0], "def": w[1]}, "memo": [s["title"][:120] for s in stories[:5]], "glossary": []}


# ------------------------------------------------------------------ scénarios
def day_path(date):
    return ROOT / "data" / "days" / f"{date}.js"


def load_index():
    p = ROOT / "data" / "days" / "index.js"
    return node_json(p, "index") if p.exists() else []


def build_full(date, clusters):
    want = 9
    try:
        stories = []
        for chunk in (clusters[0:6], clusters[6:11], clusters[11:16]):   # petites demandes : l'IA gratuite coupe ses réponses longues
            if chunk:
                try:
                    stories += llm_stories(chunk, 4, per_story="3 phrases")
                except NoLLM:
                    raise
                except Exception as e:
                    log(f"  lot d'infos ignoré ({str(e)[:100]})")
        stories = dedupe_stories(stories)[:10]
        log(f"  {len(stories)} infos rédigées par l'IA (doublons retirés)")
        if 4 <= len(stories) < 9:   # on complète avec des infos recoupées en extraits (sans IA)
            used = {x["url"] for st in stories for x in st["sources"]}
            stories += basic_stories(clusters, 9 - len(stories), used)
        if len(stories) < 8:
            raise RuntimeError(f"seulement {len(stories)} infos retenues")
        meta = llm_meta(stories)
        lessons = []
        for k, sp in enumerate(LESSONS):
            sub = [x for x in stories if x["tag"] in LESSON_TAGS[k]]
            if len(sub) < 3:
                sub = stories
            lessons.append(llm_lesson2(sub, sp))
        seen_q = []
        for l in lessons:   # une même question ne revient pas d'une leçon à l'autre
            keep = []
            for e in l["exercises"]:
                tq = norm_tokens(str(e.get("q", "")))
                if e.get("t") != "write" and any(tq and len(tq & o) / max(1, min(len(tq), len(o))) >= 0.7 for o in seen_q):
                    QUALITY["exercices retirés (contrôles)"] += 1
                    continue
                seen_q.append(tq)
                keep.append(e)
            l["exercises"] = keep
        basic = basic_lessons(stories, {"date": date})
        for k, l in enumerate(lessons):
            if 3 <= len(l["exercises"]) < 7:   # complément sûr : exercices automatiques tirés des titres
                extra = [e for e in basic[k]["exercises"] if e["t"] in ("input", "qcm")][:7 - len(l["exercises"])]
                l["exercises"] = l["exercises"][:-1] + extra + l["exercises"][-1:] if l["exercises"] and l["exercises"][-1]["t"] == "write" else l["exercises"] + extra
            if len(l["exercises"]) < 5:
                log(f"  leçon {k} trop courte : remplacée par la version automatique"); lessons[k] = basic[k]
        mode = "IA gratuite"
    except Exception as e:
        log(f"  IA indisponible ou insuffisante ({str(e)[:150]}) : mode de secours sans IA")
        stories = basic_stories(clusters, 9)
        if len(stories) < 8:
            raise RuntimeError("pas assez de sujets recoupés pour une édition")
        meta = basic_meta(stories, date)
        mode = "sans IA"
    if mode == "IA gratuite":
        corpus = plain_norm(" ".join(x["title"] + " " + x["text"] for x in stories))
        cnums = nums(" ".join(x["title"] + " " + x["text"] for x in stories))
        meta["memo"] = [m for m in (meta.get("memo") or []) if isinstance(m, str) and not [n for n in nums(m) if n not in cnums]
                        and len([w for w in norm_tokens(m) if w in corpus]) >= 0.7 * max(1, len(norm_tokens(m)))]
        meta["glossary"] = [g for g in (meta.get("glossary") or []) if isinstance(g, dict) and plain_norm(g.get("term", "")) in corpus]
        meta["memo"] = [x["title"] for x in stories[:5]]   # mémo = titres vérifiés des infos, jamais de phrase inventée
    day = {"date": date, "title": meta.get("title") or "Les infos du jour", "intro": meta.get("intro", ""), "word": meta.get("word") or {},
           "glossary": [g for g in (meta.get("glossary") or []) if isinstance(g, dict) and g.get("term") and g.get("def")][:5],
           "memo": [m for m in (meta.get("memo") or []) if isinstance(m, str)][:5], "stories": stories,
           "lessons": lessons if mode == "IA gratuite" else basic_lessons(stories, {"date": date}), "shorts": []}
    return day, mode


def add_update(day, clusters, hour):
    used = {s_["url"] for st in day["stories"] for s_ in st.get("sources", [])}
    day_toks = [norm_tokens(st["title"] + " " + st["text"]) for st in day["stories"]]
    fresh = []
    for c in clusters:
        if any(i["link"] in used for i in c["items"]):
            continue
        cnt = {}
        for i in c["items"]:
            for w in norm_tokens(i["title"]):
                cnt[w] = cnt.get(w, 0) + 1
        core = {w for w, n in cnt.items() if n >= 2} or c["toks"]
        need = len(core) if len(core) < 3 else max(3, round(0.6 * len(core)))
        if any(len(core & t) >= need for t in day_toks):
            continue
        fresh.append(c)
    room = MAX_STORIES - len(day["stories"])
    if not fresh or room <= 0:
        return None
    k0 = len(day["stories"])
    try:
        new = llm_stories(fresh[:6], min(3, room))[:min(3, room)]
        mode = "IA gratuite"
    except Exception as e:
        log(f"  IA indisponible ({str(e)[:120]}) : mode de secours sans IA")
        new = basic_stories(fresh[:6], min(2, room)); mode = "sans IA"
    if not new:
        return None
    day["stories"] += new
    idx = list(range(k0, k0 + len(new)))
    day.setdefault("updates", []).append({"at": f"{hour:02d}:00", "stories": idx})
    title = f"⚡ Flash de {hour} h"
    lesson = None
    if mode == "IA gratuite":
        try:
            lesson = llm_lesson(new, ("Flash", "⚡", "Mise à jour", "Fais 5 à 7 exercices (qcm, vf, input, éventuellement un match) portant UNIQUEMENT sur ces infos, dont 1 exercice write."), title=title)
        except Exception as e:
            log(f"  leçon Flash par l'IA impossible ({str(e)[:100]})")
    if not lesson:
        lesson = basic_flash(new, title)
    day["lessons"].append(lesson)
    return mode


def main():
    now = datetime.datetime.now(PARIS)
    date, hour = now.strftime("%Y-%m-%d"), now.hour
    log(f"Scoop auto : {date} {hour} h (Paris), options {sorted(ARGS)}")
    if "--skip-fetch" not in ARGS:
        subprocess.run([sys.executable, str(ROOT / "scripts" / "fetch_news.py")], check=False)
    items = read_items()
    clusters = cluster(items)
    log(f"  {len(items)} titres, {len(clusters)} sujets recoupés")
    if len(clusters) < 4:
        log("  trop peu de sujets recoupés (réseau ?) : rien n'est publié"); return 0

    path = day_path(date)
    index = load_index()
    changed = False
    if not path.exists() or "SCOOP:REGENERER" in path.read_text(encoding="utf-8")[:200]:
        if hour < 6 and "--force" not in ARGS:
            log("  trop tôt (avant 6 h) : on attend"); return 0
        day, mode = build_full(date, clusters)
        ok = repair(day, lambda d: write_day(d, f"(générée automatiquement, {mode})"))
        if not ok:
            log("ÉCHEC : l'édition ne passe pas le contrôle, rien n'est publié"); path.unlink(missing_ok=True) if "--dry" not in ARGS else None; return 1
        index = [e for e in index if e.get("date") != date]
        index.insert(0, {"date": date, "title": day["title"], "lessons": len(day["lessons"])})
        write_index(index); changed = True
        log(f"Édition du {date} publiée ({mode}) : {len(day['stories'])} infos, {len(day['lessons'])} leçons")
    else:
        day = node_json(path)
        last = max([int(u["at"][:2]) for u in day.get("updates", [])] or [8])
        if (hour >= last + 2 or "--force" in ARGS) and hour >= 10 and len(day["stories"]) < MAX_STORIES:
            snapshot = json.loads(json.dumps(day))
            mode = add_update(day, clusters, hour)
            if mode:
                if repair(day, lambda d: write_day(d, "(mise à jour automatique)")):
                    for e in index:
                        if e.get("date") == date:
                            e["lessons"] = len(day["lessons"])
                    write_index(index); changed = True
                    log(f"Mise à jour de {hour} h publiée ({mode}) : {len(day['stories'])} infos")
                else:
                    log("Mise à jour refusée par le contrôle : édition inchangée"); day = snapshot; write_day(day, "(inchangée)") if "--dry" not in ARGS else None
            else:
                log("  rien de nouveau")
        else:
            log("  pas de mise à jour à faire maintenant")
    # recommandation culturelle à partir de 17 h
    if (hour >= 17 or "--force" in ARGS) and not day.get("reco"):
        try:
            r = llm_reco(day["stories"])
            if r and not wiki_verify(r.get("title", ""), r.get("by", ""), r.get("year")):
                QUALITY["recommandations refusées"] += 1
                log(f"  recommandation refusée (introuvable telle quelle sur Wikipédia) : {r.get('title')} / {r.get('by')} / {r.get('year')}")
                r = None
            before = json.loads(json.dumps(day))
            if r and r.get("type") in ("film", "série", "docu", "podcast") and r.get("title") and r.get("why") and isinstance(r.get("story"), int) and 0 <= r["story"] < len(day["stories"]):
                day["reco"] = [{k: r[k] for k in ("type", "title", "by", "year", "story", "why") if k in r}]
                if repair(day, lambda d: write_day(d, "(avec recommandation)")):
                    changed = True; log(f"Recommandation ajoutée : {r['title']}")
                else:
                    write_day(before, "(inchangée)"); log("  recommandation refusée par le contrôle")
        except Exception as e:
            log(f"  pas de recommandation ({str(e)[:100]})")
    report = "\n".join(f"- {k} : {v}" for k, v in QUALITY.items())
    log("Contrôle qualité :\n" + report)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as f:
            f.write(f"### Scoop : contrôle qualité ({date} {hour} h)\n{report}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
