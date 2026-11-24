"""Scoop : pré-tri gratuit (sans IA) pour les mises à jour de la journée.

Usage : python3 scripts/new_topics.py AAAA-MM-JJ   (après fetch_news.py)

Compare les « sujets recoupés » de scripts/news-today.txt aux infos déjà publiées
dans data/days/<date>.js et écrit dans scripts/news-new.txt UNIQUEMENT les sujets
nouveaux (au moins 2 rédactions). Les sujets déjà proposés lors d'un passage
précédent du jour (retenus ou écartés) sont mémorisés dans
scripts/topics-seen.txt pour ne pas être réexaminés.

Dernière ligne affichée :
  RIEN DE NOUVEAU          -> la routine s'arrête sans rien lire d'autre
  N SUJET(S) CANDIDAT(S)   -> lire scripts/news-new.txt
"""
import re
import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from fetch_news import norm_tokens  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
NEWS = ROOT / "scripts" / "news-today.txt"
OUT = ROOT / "scripts" / "news-new.txt"
SEEN = ROOT / "scripts" / "topics-seen.txt"
MAX_CANDIDATES = 6


def parse_clusters(text):
    part = text.split("################ 2.")[0]
    clusters = []
    for block in re.split(r"\n(?=\[S\d+\])", part):
        m = re.match(r"\[S\d+\] (\d+) médias : (.*)", block)
        if not m:
            continue
        titles = re.findall(r"^\s+- \((.+?)\) (.+)$", block, re.M)
        links = re.findall(r"^\s+(https?://\S+)$", block, re.M)
        clusters.append({"n": int(m.group(1)), "medias": m.group(2), "titles": titles,
                         "links": links, "block": block.strip()})
    return clusters


def parse_stories(js):
    m = re.search(r"\n  stories: \[(.*?)\n  \],?\n  [a-zA-Z]+:", js, re.S)
    region = m.group(1) if m else js
    stories = []
    for chunk in re.split(r"\n\s*tag:", region)[1:]:
        strings = re.findall(r"(?:title|text|why):\s*(\"(?:[^\"\\]|\\.)*\"|'(?:[^'\\]|\\.)*')", chunk)
        toks = set()
        for s in strings:
            toks |= norm_tokens(s)
        stories.append({"toks": toks, "urls": set(re.findall(r"https?://[^'\"\s]+", chunk))})
    return stories


def core_tokens(cluster):
    """Mots-clés partagés par au moins 2 titres du groupe (le cœur du sujet)."""
    counts = {}
    for _, t in cluster["titles"]:
        for w in norm_tokens(t):
            counts[w] = counts.get(w, 0) + 1
    core = {w for w, c in counts.items() if c >= 2}
    return core or set(counts)


def main():
    if len(sys.argv) < 2:
        sys.exit("Usage : python3 scripts/new_topics.py AAAA-MM-JJ")
    date = sys.argv[1]
    day = ROOT / "data" / "days" / f"{date}.js"
    if not day.exists():
        sys.exit(f"Pas d'édition {date} : fais l'édition complète, pas une mise à jour.")
    stories = parse_stories(day.read_text(encoding="utf-8"))
    used_urls = set().union(*(s["urls"] for s in stories)) if stories else set()

    seen = set()
    if SEEN.exists():
        lines = SEEN.read_text(encoding="utf-8").splitlines()
        if lines and lines[0] == date:   # mémoire remise à zéro chaque jour
            seen = set(lines[1:])

    candidates = []
    for c in parse_clusters(NEWS.read_text(encoding="utf-8")):
        if any(u in used_urls for u in c["links"]):
            continue                                   # déjà cité dans une info
        if c["links"] and sum(u in seen for u in c["links"]) * 2 >= len(c["links"]):
            continue                                   # déjà proposé plus tôt dans la journée
        core = core_tokens(c)
        need = len(core) if len(core) < 3 else max(3, round(0.6 * len(core)))
        if any(len(core & s["toks"]) >= need for s in stories):
            continue                                   # même sujet qu'une info existante
        candidates.append(c)
        if len(candidates) >= MAX_CANDIDATES:
            break

    if not candidates:
        OUT.write_text("RIEN DE NOUVEAU\n", encoding="utf-8")
        print("RIEN DE NOUVEAU")
        return
    OUT.write_text(
        f"Sujets recoupés NOUVEAUX depuis l'édition {date} (pré-tri automatique : vérifie que les titres\n"
        "d'un groupe parlent bien du même fait, et écarte les faits divers sans portée générale).\n\n"
        + "\n\n".join(c["block"] for c in candidates) + "\n", encoding="utf-8")
    seen |= {u for c in candidates for u in c["links"]}
    SEEN.write_text(date + "\n" + "\n".join(sorted(seen)) + "\n", encoding="utf-8")
    print(f"{len(candidates)} SUJET(S) CANDIDAT(S) -> {OUT}")


if __name__ == "__main__":
    main()
