#!/usr/bin/env python3
"""Scoop - illustre les infos de l'édition avec des images LIBRES, avec le nom du photographe et la licence.

Chemin retenu, le plus fiable : pour chaque info, on cherche la page Wikipédia dont le TITRE correspond exactement à
un nom propre de l'info (personne, lieu, organisation), on prend l'image principale de cette page, puis on lit ses
métadonnées sur Wikimedia Commons (auteur, licence). Seules les licences libres sont gardées (CC BY, CC BY-SA, CC0,
domaine public). Pas de correspondance exacte = pas d'image : on préfère ne rien montrer que montrer faux.
L'image illustre le NOM PROPRE (portrait, lieu), pas l'événement : la légende le dit.

Lancé par GitHub Actions. Écrit data/live/images.js, seulement si le résultat a changé.
Python standard uniquement. Usage : python3 scripts/update_images.py
"""
import datetime
import html
import json
import pathlib
import re
import sys
import unicodedata
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "live" / "images.js"
UA = "ScoopNewsBot/1.0 (https://scoopfr.github.io; projet pedagogique)"
KEEP_DAYS = 14
WIDTH = 640
FREE = re.compile(r"^(CC[ -]BY|CC0|CC[ -]BY-SA|Public domain|PD|Domaine public)", re.I)
BLOCK = re.compile(r"non-?free|fair use|NC|ND\b", re.I)

STOPWORDS = set("""Le La Les Un Une Des Du De Au Aux En Dans Sur Pour Par Avec Sans Selon Après Avant Mort Retour Fin Premier Première
Nouveau Nouvelle Procès Annonce Lundi Mardi Mercredi Jeudi Vendredi Samedi Dimanche Janvier Février Mars Avril Mai Juin Juillet Août
Septembre Octobre Novembre Décembre Monde Presse Congrès Loi Justice Ukraine
Tribunal Cour Conseil Assemblée Sénat Gouvernement Parlement Police Armée Logement Présidentielle Élections Élection Droite Gauche
Maire Maires Procès Appel Enquête Moselle Police Ministre Président Député Sénateur""".split())


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read().decode("utf-8"))


def nz(s):
    s = unicodedata.normalize("NFD", s.lower())
    return re.sub(r"[^a-z0-9]+", " ", "".join(c for c in s if unicodedata.category(c) != "Mn")).strip()


def strip_html(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s or ""))).strip()


STORY = re.compile(r"tag:\s*'([^']*)',\s*title:\s*(\"(?:[^\"\\]|\\.)*\"|'(?:[^'\\]|\\.)*')\s*,\s*text:\s*(\"(?:[^\"\\]|\\.)*\"|'(?:[^'\\]|\\.)*')", re.S)


def js_str(s):
    return re.sub(r"\\(.)", r"\1", s[1:-1])


def days():
    idx = (ROOT / "data" / "days" / "index.js").read_text(encoding="utf-8")
    return sorted(set(re.findall(r"date:\s*'(\d{4}-\d{2}-\d{2})'", idx)))[-3:]


def keywords(title):
    """Noms propres du titre : d'abord les groupes de plusieurs mots (« Jensen Huang »), puis les mots seuls."""
    t = re.sub(r"\b[LDld][’']", "", title)
    # « Le Havre », « La Rochelle » : le nom propre garde son article (sinon on tombe sur une autre page)
    withart = re.findall(r"\b(?:Le|La|Les)\s+[A-ZÉÈÀ][\w'’-]{2,}", t)
    groups = re.findall(r"[A-ZÉÈÀ][\w'’-]+(?:\s+[A-ZÉÈÀ][\w'’-]+)+", t)
    singles = [w for w in re.findall(r"[A-ZÉÈÀ0-9][\w'’-]{3,}", t) if w not in STOPWORDS]
    out = list(withart)
    covered = " ".join(withart)
    for k in groups + singles:
        k = " ".join(w for w in k.split() if w not in STOPWORDS)
        if len(k) >= 4 and not k.isdigit() and k not in out and k not in covered:
            out.append(k)
    return out[:4]


def page_image(wiki, kw):
    """Image principale de la page dont le titre (après redirection) est exactement kw. None sinon."""
    q = urllib.parse.urlencode({"action": "query", "format": "json", "redirects": 1, "titles": kw,
                                "prop": "pageimages|pageprops", "piprop": "name", "ppprop": "disambiguation"})
    d = get(f"https://{wiki}.wikipedia.org/w/api.php?{q}")
    pages = list((d.get("query") or {}).get("pages", {}).values())
    if not pages or "missing" in pages[0] or "disambiguation" in (pages[0].get("pageprops") or {}):
        return None
    p = pages[0]
    # le titre trouvé doit correspondre au nom propre cherché (pas une page voisine)
    if nz(p.get("title", "")) != nz(kw) and nz(kw) not in nz(p.get("title", "")).split(" (")[0]:
        return None
    return p.get("pageimage")


def commons_info(filename):
    q = urllib.parse.urlencode({"action": "query", "format": "json", "titles": "File:" + filename, "prop": "imageinfo",
                                "iiprop": "url|extmetadata|mime|size", "iiurlwidth": WIDTH})
    d = get("https://commons.wikimedia.org/w/api.php?" + q)
    pages = list((d.get("query") or {}).get("pages", {}).values())
    if not pages or "imageinfo" not in pages[0]:
        return None
    ii = pages[0]["imageinfo"][0]
    if ii.get("mime") not in ("image/jpeg", "image/png", "image/webp"):
        return None
    m = ii.get("extmetadata", {})
    lic = strip_html((m.get("LicenseShortName") or {}).get("value", ""))
    if not lic or not FREE.search(lic) or BLOCK.search(lic):
        return None
    author = strip_html((m.get("Artist") or {}).get("value", "")) or strip_html((m.get("Credit") or {}).get("value", ""))
    if not author:
        return None
    return {"url": ii.get("thumburl") or ii["url"], "w": ii.get("thumbwidth"), "h": ii.get("thumbheight"),
            "author": author[:120], "license": lic, "licenseUrl": strip_html((m.get("LicenseUrl") or {}).get("value", "")),
            "source": ii.get("descriptionurl", ""), "alt": strip_html((m.get("ImageDescription") or {}).get("value", ""))[:160]}


def find_image(title):
    for kw in keywords(title):
        for wiki in ("fr", "en"):
            try:
                name = page_image(wiki, kw)
                info = commons_info(name) if name else None
            except Exception as e:      # un échec réseau n'arrête rien
                print(f"  {kw} ({wiki}) : {e}", file=sys.stderr)
                continue
            # l'image doit réellement concerner le nom propre : son nom de famille (ou le mot) figure dans le nom du
            # fichier ou sa description. Cela écarte les illustrations génériques (« 2025 », « Logement », collages…).
            if info and re.search(r"collage|montage|logo|map|carte|flag|drapeau", (name or "").lower()):
                info = None
            if info and nz(kw).split(" ")[-1] in nz((name or "") + " " + info.get("alt", "")):
                info["kw"] = kw
                return info
    return None


def main():
    existing = {}
    if OUT.exists():
        m = re.search(r"/\*(\{.*\})\*/", OUT.read_text(encoding="utf-8"))
        if m:
            existing = json.loads(m.group(1))
    cutoff = (datetime.date.today() - datetime.timedelta(days=KEEP_DAYS)).isoformat()
    result = {k: v for k, v in existing.items() if k.split(":")[0] >= cutoff}
    added = 0
    for date in days():
        src = (ROOT / "data" / "days" / f"{date}.js").read_text(encoding="utf-8")
        for i, m in enumerate(STORY.finditer(src)):
            key = f"{date}:{i}"
            if key in result:
                continue          # déjà traité (image trouvée ou « pas d'image » mémorisé)
            info = find_image(js_str(m.group(2)))
            result[key] = info or {"none": True}
            added += 1 if info else 0
    body = json.dumps(result, ensure_ascii=False, sort_keys=True)
    if OUT.exists() and f"/*{body}*/" in OUT.read_text(encoding="utf-8"):
        print("Rien de nouveau.")
        return
    OUT.parent.mkdir(parents=True, exist_ok=True)
    shown = {k: v for k, v in result.items() if not v.get("none")}
    OUT.write_text(f"/*{body}*/\n/* Généré par scripts/update_images.py : images libres de Wikimedia Commons, auteur et licence affichés. */\n"
                   f"window.SCOOP_IMAGES = {json.dumps(shown, ensure_ascii=False)};\n", encoding="utf-8")
    print(f"OK : {added} nouvelle(s) image(s), {len(shown)} au total.")


if __name__ == "__main__":
    main()
