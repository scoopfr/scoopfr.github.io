#!/usr/bin/env python3
"""Scoop - RECOUPEMENT par les prises de parole officielles sur X (optionnel, désactivé sans clé).

L'accès à X passe par son API officielle, qui est PAYANTE et demande une clé (« bearer token »). Sans la variable
d'environnement X_BEARER_TOKEN, ce script ne fait rien et ne coûte rien. Avec elle, il lit les derniers messages d'une
courte liste de comptes institutionnels, les rapproche des infos de l'édition (mots rares du titre) et écrit
data/live/voices.js. L'application les affiche comme un RECOUPEMENT sous l'info, jamais comme une source seule.

Coût : 1 recherche d'identifiants (gardée en mémoire dans data/live/x-ids.json) + 1 lecture par compte à chaque passage.
Le script ne tourne qu'une fois toutes les 3 heures au maximum. Vérifie la tarification de l'API de X avant d'activer.

Python standard uniquement. Usage : X_BEARER_TOKEN=... python3 scripts/update_voices.py
"""
import datetime
import json
import os
import pathlib
import re
import sys
import unicodedata
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "live" / "voices.js"
IDS = ROOT / "data" / "live" / "x-ids.json"
TOKEN = os.environ.get("X_BEARER_TOKEN", "").strip()
MIN_HOURS = 3
PER_ACCOUNT = 10

# (nom affiché, identifiant du compte) : comptes institutionnels et responsables, à ajuster
ACCOUNTS = [
    ("Élysée", "Elysee"), ("Gouvernement", "gouvernementFR"), ("Diplomatie française", "FranceDiplomatie"),
    ("Assemblée nationale", "Assemblee_nat"), ("Sénat", "Senat"), ("Commission européenne", "EU_Commission"),
    ("Parlement européen", "Europarl_FR"), ("ONU", "UN"), ("OTAN", "NATO"), ("OMS", "WHO"),
]
STOP = set("""le la les un une des du de d l au aux et ou en dans sur pour par avec sans sous chez apres avant ce cette ces son sa ses leur leurs
qui que quoi dont est sont ete etre ont avait fait faire plus moins pas ne se il elle ils elles on nous vous comme mais aussi tres tout tous
entre contre vers selon lors depuis encore deja alors ainsi quand comment pourquoi mardi lundi mercredi jeudi vendredi samedi dimanche
the and for with from that this today new will about""".split())


def api(path, params=None):
    url = "https://api.x.com/2/" + path + (("?" + urllib.parse.urlencode(params)) if params else "")
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}", "User-Agent": "ScoopNewsBot/1.0"})
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read().decode("utf-8"))


def tokens(text):
    t = unicodedata.normalize("NFD", (text or "").lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return {w[:7] for w in re.findall(r"[a-z0-9][a-z0-9\-']+", t) if len(w) >= 5 and w not in STOP and not w.isdigit()}


STORY = re.compile(r"tag:\s*'([^']*)',\s*title:\s*(\"(?:[^\"\\]|\\.)*\"|'(?:[^'\\]|\\.)*')\s*,\s*text:\s*(\"(?:[^\"\\]|\\.)*\"|'(?:[^'\\]|\\.)*')", re.S)


def js_str(s):
    return re.sub(r"\\(.)", r"\1", s[1:-1])


def latest_day():
    idx = (ROOT / "data" / "days" / "index.js").read_text(encoding="utf-8")
    d = sorted(re.findall(r"date:\s*'(\d{4}-\d{2}-\d{2})'", idx))
    return d[-1] if d else None


def recently_run():
    if not OUT.exists():
        return False
    m = re.search(r"updated:\s*'([^']+)'", OUT.read_text(encoding="utf-8"))
    if not m:
        return False
    try:
        t = datetime.datetime.fromisoformat(m.group(1).replace("Z", "+00:00"))
    except ValueError:
        return False
    return (datetime.datetime.now(datetime.timezone.utc) - t).total_seconds() < MIN_HOURS * 3600


def main():
    if not TOKEN:
        print("Accès à X non activé (pas de X_BEARER_TOKEN) : rien à faire.")
        return
    if recently_run():
        print("Déjà lancé il y a moins de 3 h : on économise les appels.")
        return
    date = latest_day()
    if not date:
        return
    src = (ROOT / "data" / "days" / f"{date}.js").read_text(encoding="utf-8")
    stories = [(js_str(m.group(2)), js_str(m.group(3))) for m in STORY.finditer(src)]

    ids = json.loads(IDS.read_text(encoding="utf-8")) if IDS.exists() else {}
    missing = [h for _, h in ACCOUNTS if h not in ids]
    if missing:
        d = api("users/by", {"usernames": ",".join(missing)})
        for u in d.get("data", []):
            ids[u["username"]] = u["id"]
        IDS.write_text(json.dumps(ids), encoding="utf-8")

    posts = []
    for who, handle in ACCOUNTS:
        uid = ids.get(handle)
        if not uid:
            continue
        try:
            d = api(f"users/{uid}/tweets", {"max_results": PER_ACCOUNT, "exclude": "retweets,replies", "tweet.fields": "created_at"})
        except Exception as e:      # un compte qui échoue n'arrête pas les autres
            print(f"{handle} : {e}", file=sys.stderr)
            continue
        for t in d.get("data", []):
            posts.append({"who": who, "date": t["created_at"][:10], "text": re.sub(r"\s+", " ", t["text"])[:200],
                          "url": f"https://x.com/{handle}/status/{t['id']}", "tk": tokens(t["text"])})

    result = {}
    for i, (title, text) in enumerate(stories):
        tk, ttk = tokens(title + " " + text[:400]), tokens(title)
        hits = []
        for p in posts:
            shared = tk & p["tk"]
            if len(shared) >= 2 and shared & ttk:
                hits.append((len(shared), p))
        hits.sort(key=lambda x: -x[0])
        if hits:
            result[f"{date}:{i}"] = [{k: v for k, v in p.items() if k != "tk"} for _, p in hits[:2]]

    stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    OUT.write_text(f"window.SCOOP_VOICES = {json.dumps({'date': date, 'updated': stamp, 'items': result}, ensure_ascii=False)};\n"
                   f"/* Généré par scripts/update_voices.py : rapprochement par mots-clés, à vérifier. Recoupement, pas une source seule. */\n",
                   encoding="utf-8")
    print(f"OK : {len(result)} info(s) recoupée(s) par une prise de parole officielle.")


if __name__ == "__main__":
    main()
