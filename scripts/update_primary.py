#!/usr/bin/env python3
"""Scoop - rapproche chaque info de l'édition du jour des PUBLICATIONS OFFICIELLES récentes
(ONU, Commission européenne, OMS, Conseil constitutionnel), pour afficher la source primaire.

Lancé toutes les heures par GitHub Actions (aucun crédit d'IA : simple rapprochement par mots-clés).
Écrit data/live/primary.js, seulement si le résultat a changé.
Python standard uniquement. Usage : python3 scripts/update_primary.py
"""
import datetime
import html
import json
import pathlib
import re
import unicodedata
import urllib.request
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "live" / "primary.js"
UA = "Mozilla/5.0 (compatible; ScoopNewsBot/1.0)"

# Flux vérifiés le 24/11/2026 (réponse RSS valide)
OFFICIAL = [
    ("ONU Info", "https://news.un.org/feed/subscribe/fr/news/all/rss.xml"),
    ("Commission européenne", "https://ec.europa.eu/commission/presscorner/api/rss?language=fr"),
    ("OMS", "https://www.who.int/rss-feeds/news-french.xml"),
    ("Conseil constitutionnel", "https://www.conseil-constitutionnel.fr/flux/rss.xml"),
]
PER_FEED = 40
MIN_SHARED = 2          # mots-clés DISTINCTIFS communs pour proposer un rapprochement
MAX_DF = 3              # un mot présent dans plus de 3 publications est trop courant (« nations », « femmes »…)
MAX_PER_STORY = 2

STOP = set("""
le la les un une des du de d l au aux et ou en dans sur pour par avec sans sous chez apres avant ce cette ces son sa ses leur leurs
qui que quoi dont est sont ete etre ont avait fait faire plus moins pas ne se il elle ils elles on nous vous comme mais aussi tres
tout tous entre contre vers selon lors depuis encore deja alors ainsi quand comment pourquoi quel quelle apres mardi lundi
mercredi jeudi vendredi samedi dimanche novembre decembre janvier annee mois jour monde pays gouvernement president nouveau nouvelle
retour bande droit milliards millions dollars euros pourcent ayant faits violences environ quelque plusieurs conseil presse organisation
the and for with from that this speech press release commissioner
""".split())


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read()


def clean(t):
    t = html.unescape(t or "")
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", t)).strip()


def tokens(text):
    t = unicodedata.normalize("NFD", (text or "").lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    out = set()
    for w in re.findall(r"[a-z0-9][a-z0-9\-']+", t):
        w = w.strip("-'")
        if len(w) >= 5 and w not in STOP and not w.isdigit():
            out.add(w[:7])           # racine approximative : « ukrainien » ~ « ukraine »
    return out


def latest_day():
    idx = ROOT / "data" / "days" / "index.js"
    dates = re.findall(r"date:\s*'(\d{4}-\d{2}-\d{2})'", idx.read_text(encoding="utf-8"))
    return sorted(dates)[-1] if dates else None


STORY = re.compile(r"tag:\s*'([^']*)',\s*title:\s*(\"(?:[^\"\\]|\\.)*\"|'(?:[^'\\]|\\.)*')\s*,\s*text:\s*(\"(?:[^\"\\]|\\.)*\"|'(?:[^'\\]|\\.)*')", re.S)


def js_str(s):
    body = s[1:-1]
    return re.sub(r"\\(.)", r"\1", body)


def stories_of(date):
    src = (ROOT / "data" / "days" / f"{date}.js").read_text(encoding="utf-8")
    return [(m.group(1), js_str(m.group(2)), js_str(m.group(3))) for m in STORY.finditer(src)]


def main():
    date = latest_day()
    if not date:
        print("Pas d'édition.")
        return
    stories = stories_of(date)
    items = []
    for name, url in OFFICIAL:
        try:
            root = ET.fromstring(fetch(url))
            n = 0
            for it in root.iter("item"):
                title, link = clean(it.findtext("title")), clean(it.findtext("link"))
                if not title or not link:
                    continue
                items.append((name, title, link, tokens(title + " " + clean(it.findtext("description"))[:300])))
                n += 1
                if n >= PER_FEED:
                    break
        except Exception as e:      # un flux en panne n'arrête pas les autres
            print(f"{name} : ERREUR {e}")

    # fréquence de chaque mot dans les publications : les mots courants ne prouvent rien
    df = {}
    for _, _, _, itk in items:
        for w in itk:
            df[w] = df.get(w, 0) + 1

    result = {}
    for i, (tag, title, text) in enumerate(stories):
        tk = tokens(title + " " + text[:400])
        ttk = tokens(title)
        scored = []
        for name, t, link, itk in items:
            shared = {w for w in (tk & itk) if df.get(w, 0) <= MAX_DF}
            # précision avant tout : au moins 2 mots rares en commun dont un du TITRE de l'info, ou 4 mots rares
            if (len(shared) >= MIN_SHARED and shared & ttk) or len(shared) >= 4:
                scored.append((len(shared), name, t, link))
        scored.sort(key=lambda x: -x[0])
        if scored:
            best = scored[0][0]     # on ne garde que les meilleurs rapprochements (pas les sujets voisins)
            keep = [x for x in scored if x[0] >= best]
            result[f"{date}:{i}"] = [{"name": n, "title": t, "url": l} for _, n, t, l in keep[:MAX_PER_STORY]]

    payload = {"date": date, "items": result}
    body = json.dumps(payload, ensure_ascii=False, sort_keys=True)
    if OUT.exists() and f"/*{body}*/" in OUT.read_text(encoding="utf-8"):
        print("Rien de nouveau.")
        return
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        f"/*{body}*/\n/* Généré par scripts/update_primary.py : rapprochement automatique par mots-clés, à vérifier. */\n"
        f"window.SCOOP_PRIMARY = Object.assign({json.dumps(payload, ensure_ascii=False)}, {{ updated: '{stamp}' }});\n",
        encoding="utf-8")
    print(f"OK : {len(result)} info(s) sur {len(stories)} reliée(s) à une publication officielle ({date}).")


if __name__ == "__main__":
    main()
