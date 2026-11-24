#!/usr/bin/env python3
"""Scoop - récupère les titres du jour (flux RSS de médias français et internationaux)
et repère les sujets couverts par plusieurs rédactions (recoupement).

Usage : python3 scripts/fetch_news.py
Sortie : scripts/news-today.txt
  1. SUJETS RECOUPÉS : groupes de titres proches publiés par au moins 2 médias différents
  2. REVUE BRUTE : tous les titres, par média
Python standard uniquement (pas de dépendance).
"""
import datetime
import html
import pathlib
import re
import unicodedata
import urllib.request
import xml.etree.ElementTree as ET

# (nom affiché, URL du flux, langue)
FEEDS = [
    # France
    ("Le Monde", "https://www.lemonde.fr/rss/une.xml", "fr"),
    ("Le Monde International", "https://www.lemonde.fr/international/rss_full.xml", "fr"),
    ("Le Monde Économie", "https://www.lemonde.fr/economie/rss_full.xml", "fr"),
    ("Le Monde Médias", "https://www.lemonde.fr/actualite-medias/rss_full.xml", "fr"),
    ("Le Monde Culture", "https://www.lemonde.fr/culture/rss_full.xml", "fr"),
    ("franceinfo", "https://www.franceinfo.fr/titres.rss", "fr"),
    ("France 24", "https://www.france24.com/fr/rss", "fr"),
    ("RFI", "https://www.rfi.fr/fr/rss", "fr"),
    ("Le Figaro", "https://www.lefigaro.fr/rss/figaro_actualites.xml", "fr"),
    ("Le Figaro Flash (dépêches AFP)", "https://www.lefigaro.fr/rss/figaro_flash-actu.xml", "fr"),
    ("Libération", "https://www.liberation.fr/arc/outboundfeeds/rss-all/?outputType=xml", "fr"),
    ("Ouest-France", "https://www.ouest-france.fr/rss/une", "fr"),
    ("20 Minutes", "https://www.20minutes.fr/feeds/rss-une.xml", "fr"),
    ("La Croix", "https://www.la-croix.com/RSS/UNIVERS", "fr"),
    ("Mediapart", "https://www.mediapart.fr/articles/feed", "fr"),
    ("Courrier international", "https://www.courrierinternational.com/feed/all/rss.xml", "fr"),
    ("Euronews", "https://fr.euronews.com/rss", "fr"),
    # Francophonie
    ("Radio-Canada", "https://ici.radio-canada.ca/rss/4159", "fr"),
    ("Le Temps (Suisse)", "https://www.letemps.ch/articles.rss", "fr"),
    # International (anglophone / autre)
    ("BBC News", "https://feeds.bbci.co.uk/news/world/rss.xml", "en"),
    ("The Guardian", "https://www.theguardian.com/world/rss", "en"),
    ("The New York Times", "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", "en"),
    ("Al Jazeera", "https://www.aljazeera.com/xml/rss/all.xml", "en"),
    ("France 24 English", "https://www.france24.com/en/rss", "en"),
]
# Flux de SOURCES PRIMAIRES (publications officielles). Ils ne servent pas au recoupement entre médias :
# ils alimentent la partie 3 de news-today.txt, pour renseigner le champ `primary` des infos.
# Adresses vérifiées le 24/11/2026 (réponse RSS valide). Ajouter un domaine = l'autoriser aussi dans
# l'environnement cloud (liste de domaines autorisés).
OFFICIAL_FEEDS = [
    ("ONU Info", "https://news.un.org/feed/subscribe/fr/news/all/rss.xml"),
    ("Commission européenne (communiqués)", "https://ec.europa.eu/commission/presscorner/api/rss?language=fr"),
    ("OMS", "https://www.who.int/rss-feeds/news-french.xml"),
    ("Conseil constitutionnel", "https://www.conseil-constitutionnel.fr/flux/rss.xml"),
]
PER_OFFICIAL = 15
PER_FEED = 12
UA = "Mozilla/5.0 (compatible; ScoopNewsBot/1.0)"
OUT = pathlib.Path(__file__).with_name("news-today.txt")

# Mots vides FR + EN ignorés pour le rapprochement des titres
STOP = set("""
le la les un une des du de d l au aux et ou en dans sur pour par avec sans sous chez apres avant
ce cette ces son sa ses leur leurs qui que quoi dont est sont ete etre a ont avait fait faire plus moins
pas ne se s y il elle ils elles on nous vous je tu comme mais aussi tres tout tous toute toutes entre
contre vers selon lors depuis encore deja alors ainsi quand comment pourquoi quel quelle quels quelles
direct live video photos analyse edito tribune interview
the a an of to in on at for with from by and or is are was were be been has have had will would after
before over into about as its it this that these those not no new says say said amid against than
""".split())

# Équivalences simples FR/EN pour aider le recoupement multilingue
ALIASES = {
    "libya": "libye", "ukraine": "ukraine", "ukrainian": "ukraine", "ukrainien": "ukraine", "ukrainienne": "ukraine",
    "russia": "russie", "russian": "russie", "russe": "russie", "russes": "russie",
    "israel": "israel", "israeli": "israel", "israelien": "israel", "gaza": "gaza",
    "iran": "iran", "iranian": "iran", "china": "chine", "chinese": "chine", "chinois": "chine",
    "france": "france", "french": "france", "francais": "france", "francaise": "france",
    "germany": "allemagne", "german": "allemagne", "spain": "espagne", "spanish": "espagne",
    "britain": "royaume-uni", "uk": "royaume-uni", "british": "royaume-uni", "britannique": "royaume-uni",
    "belgium": "belgique", "sudan": "soudan", "syria": "syrie", "lebanon": "liban", "turkey": "turquie",
    "election": "election", "elections": "election", "presidential": "presidentielle",
    "climate": "climat", "budget": "budget", "strike": "greve", "strikes": "greve",
    "ships": "navires", "ship": "navires", "navire": "navires", "bateaux": "navires",
    "genocide": "genocide", "court": "cour", "rohingya": "rohingya", "myanmar": "birmanie",
    "pope": "pape", "un": "onu", "nato": "otan", "eu": "ue", "europe": "europe", "european": "europe",
}


def clean(text):
    text = html.unescape(text or "")
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def norm_tokens(title):
    t = unicodedata.normalize("NFD", title.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    words = re.findall(r"[a-z0-9][a-z0-9\-']+", t)
    out = set()
    for w in words:
        w = w.strip("-'")
        w = ALIASES.get(w, w)
        if len(w) >= 4 and w not in STOP and not w.isdigit():
            out.add(w)
    return out


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read()


def items_of(root):
    """Gère RSS 2.0 et Atom."""
    found = list(root.iter("item"))
    if found:
        for it in found:
            yield clean(it.findtext("title")), clean(it.findtext("description")), clean(it.findtext("link")), clean(it.findtext("pubDate"))
        return
    ns = {"a": "http://www.w3.org/2005/Atom"}
    for e in root.findall("a:entry", ns):
        link = e.find("a:link", ns)
        yield (clean(e.findtext("a:title", "", ns)), clean(e.findtext("a:summary", "", ns)),
               link.get("href") if link is not None else "", clean(e.findtext("a:updated", "", ns)))


def main():
    all_items = []          # (source, titre, desc, lien, date)
    report = []
    for name, url, lang in FEEDS:
        try:
            root = ET.fromstring(fetch(url))
            n = 0
            for title, desc, link, date in items_of(root):
                if not title:
                    continue
                if len(desc) > 240:
                    desc = desc[:240] + "..."
                all_items.append((name, title, desc, link, date))
                n += 1
                if n >= PER_FEED:
                    break
            report.append(f"{name} : {n} titres")
        except Exception as e:  # un flux en panne ne bloque pas les autres
            report.append(f"{name} : ERREUR {e}")

    # --- Recoupement : regroupe les titres de médias DIFFÉRENTS qui partagent >= 2 mots-clés
    toks = [norm_tokens(t) for _, t, _, _, _ in all_items]
    parent = list(range(len(all_items)))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    def base(src):  # "Le Monde International" et "Le Monde" = même rédaction
        return src.split(" (")[0].replace(" International", "").replace(" Économie", "").replace(" Médias", "").replace(" Culture", "").replace(" Flash", "").replace(" English", "")

    for i in range(len(all_items)):
        for j in range(i + 1, len(all_items)):
            if base(all_items[i][0]) == base(all_items[j][0]):
                continue
            if len(toks[i] & toks[j]) >= 2:
                parent[find(i)] = find(j)

    groups = {}
    for i in range(len(all_items)):
        groups.setdefault(find(i), []).append(i)
    clusters = []
    for idx in groups.values():
        medias = {base(all_items[i][0]) for i in idx}
        if len(medias) >= 2:
            clusters.append((len(medias), idx, sorted(medias)))
    clusters.sort(key=lambda c: -c[0])

    lines = [f"Scoop - revue de presse du {datetime.datetime.now():%Y-%m-%d %H:%M} (UTC)",
             "Flux : " + " | ".join(report), "",
             "################ 1. SUJETS RECOUPÉS (au moins 2 médias différents) ################",
             "Rapprochement automatique par mots-clés : VÉRIFIE toujours que les titres parlent bien du même fait.", ""]
    for k, (nm, idx, medias) in enumerate(clusters, 1):
        lines.append(f"[S{k}] {nm} médias : {', '.join(medias)}")
        for i in idx:
            src, title, desc, link, date = all_items[i]
            lines.append(f"    - ({src}) {title}")
            if desc:
                lines.append(f"        {desc}")
            lines.append(f"        {link}")
        lines.append("")
    lines += ["", "################ 2. REVUE BRUTE PAR MÉDIA ################", ""]
    current = None
    for src, title, desc, link, date in all_items:
        if src != current:
            lines.append(f"=== {src} ===")
            current = src
        lines.append(f"- {title}")
        if desc:
            lines.append(f"    {desc}")
        lines.append(f"    [{date}] {link}")
    # --- 3. Sources primaires : publications officielles récentes (un flux en panne n'arrête rien)
    lines += ["", "################ 3. SOURCES PRIMAIRES (publications officielles) ################",
              "Documents d'origine (communiqués, décisions, rapports). Si une info de l'édition porte sur l'un d'eux,",
              "ajoute-le dans son champ `primary: [{ name, url }]`. N'utilise QUE ces URL, jamais d'URL devinée.", ""]
    for name, url in OFFICIAL_FEEDS:
        try:
            root = ET.fromstring(fetch(url))
            n = 0
            lines.append(f"=== {name} ===")
            for title, desc, link, date in items_of(root):
                if not title or not link:
                    continue
                lines.append(f"- {title}")
                lines.append(f"    [{date}] {link}")
                n += 1
                if n >= PER_OFFICIAL:
                    break
        except Exception as e:
            lines.append(f"=== {name} : ERREUR {e} ===")
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"OK -> {OUT} : {len(all_items)} titres, {len(clusters)} sujets recoupés")


if __name__ == "__main__":
    main()
