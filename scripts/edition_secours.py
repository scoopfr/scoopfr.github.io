#!/usr/bin/env python3
"""Scoop : édition de SECOURS, SANS AUCUNE IA, garantie sans invention.

Rôle : dernier filet de sécurité. Elle ne publie QUE si le créneau de mise à jour n'a pas été assuré
(ni par la routine Claude principale, ni par la routine Claude de secours), par exemple faute de crédits Claude.

Garanties (par construction, aucun texte n'est rédigé par une machine) :
  - une info n'est retenue que si au moins 2 rédactions différentes publient des titres sur le même fait
    (mêmes noms propres ou au moins 3 mots-clés en commun) ;
  - le texte de l'info cite mot pour mot le résumé publié par chaque rédaction, entre guillemets, avec son nom ;
  - les questions sont fabriquées mécaniquement à partir de ces citations : texte à trous sur un titre,
    « quelle rédaction a publié ce titre ? », vrai/faux sur un titre exact ou volontairement modifié,
    association titre / rédaction. Leur réponse est donc exacte par construction ;
  - le mot du jour vient d'une liste de définitions vérifiées ;
  - scripts/check-edition.js doit valider l'édition, sinon rien n'est publié.

Usage : python3 scripts/edition_secours.py [--si-rien-depuis MINUTES] [--force] [--dry] [--skip-fetch]
"""
import datetime
import json
import random
import re
import subprocess
import sys

import auto_edition as A   # lecture des titres, fichiers, contrôle (aucun appel d'IA n'est fait ici)
from fetch_news import norm_tokens

ARGV = sys.argv[1:]
log = A.log

OPINION = re.compile(r"\b(EN DIRECT|LIVE|VIDÉO|VIDEO|PHOTOS?|TRIBUNE|ÉDITO|EDITO|CHRONIQUE|PODCAST|QUIZ|HOROSCOPE|PRONOSTIC|BONS PLANS?)\b", re.I)
SECTION_TAG = {"Le Monde International": "Monde", "Le Monde Économie": "Économie", "Le Monde Médias": "Médias", "Le Monde Culture": "Culture"}
STOP_SWAP = {"France", "Paris", "Europe", "Union", "États-Unis", "Etats-Unis"}


# ------------------------------------------------------------------ déclenchement
def deja_fait(minutes):
    """Une mise à jour (ou un passage « rien de nouveau ») a-t-elle été publiée depuis `minutes` minutes ?"""
    try:
        subprocess.run(["git", "fetch", "-q", "origin", "main"], check=False, capture_output=True)
        ref = "origin/main" if subprocess.run(["git", "rev-parse", "-q", "--verify", "origin/main"], capture_output=True).returncode == 0 else "HEAD"
        out = subprocess.run(["git", "log", ref, f"--since={minutes} minutes ago", "--format=%s", "--",
                              "data/days", "scripts/topics-seen.txt", "scripts/passages.txt"],
                             capture_output=True, text=True, encoding="utf-8").stdout.strip()
        return out.splitlines()[0] if out else ""
    except Exception as e:
        log(f"  vérification impossible ({e}) : on considère que rien n'a été publié")
        return ""


# ------------------------------------------------------------------ infos recoupées (sans IA)
def caps(title):
    """Noms propres d'un titre (mots à majuscule hors premier mot)."""
    words = re.findall(r"[A-ZÉÈÀÂÎÔÛÇ][\wÀ-ÿ'’-]{2,}", title)
    first = re.match(r"\W*([\wÀ-ÿ'’-]+)", title)
    return {A.plain_norm(w) for w in words if not (first and w == first.group(1))}


BROAD = set("""ukraine russie guerre trump france etats-unis israel gaza iran chine europe ue onu otan
monde pays president gouvernement ministre armee attaque attaques morts mort militaires soldats russes ukrainiens
francais francaise americain americaine nouvelle nouveau nouveaux annonce selon
lundi mardi mercredi jeudi vendredi samedi dimanche janvier fevrier mars avril juin juillet aout septembre octobre
novembre decembre 2025 2026 2027 heures jour jours semaine annee plus apres avant contre pour""".split())


def same_fact(a, b):
    """Même fait ? Au moins 3 mots-clés communs dont 2 « précis » (hors grands sujets comme Ukraine, Trump, guerre…),
    ou au moins 30 % des mots des deux titres en commun. Sinon, on ne parle pas de recoupement."""
    ta, tb = norm_tokens(a["title"]), norm_tokens(b["title"])
    shared = ta & tb
    precise = shared - BROAD
    titles_ok = (len(shared) >= 3 and len(precise) >= 2) or (ta and tb and len(shared) / len(ta | tb) >= 0.3 and len(precise) >= 2)
    if not titles_ok:
        return 0
    # au moins un mot commun qui ne soit pas un nom propre : deux articles sur la même personne ne racontent pas forcément le même fait
    if not (precise - caps(a["title"]) - caps(b["title"])):
        return 0
    # les résumés doivent aussi raconter la même chose (au moins 4 mots précis en commun, titres compris)
    fa = norm_tokens(a["title"] + " " + (a["desc"] or "")) - BROAD
    fb = norm_tokens(b["title"] + " " + (b["desc"] or "")) - BROAD
    if len(fa & fb) < 4:
        return 0
    return len(shared)


def groups(items):
    fr = [i for i in items if i["src"] in A.FR_SOURCES and not OPINION.search(i["title"]) and not i["title"].startswith(("«", '"', "“"))]
    used, out = set(), []
    for lead in fr:
        if id(lead) in used:
            continue
        mates, bases = [], {A.media_base(lead["src"])}
        for j in items:
            if j is lead or id(j) in used or A.media_base(j["src"]) in bases or OPINION.search(j["title"]):
                continue
            if same_fact(lead, j):
                mates.append(j)
                bases.add(A.media_base(j["src"]))
        if mates:
            used.add(id(lead))
            used.update(id(m) for m in mates)
            out.append({"lead": lead, "mates": mates[:3], "all": [lead] + mates})
    out.sort(key=lambda g: -len(g["mates"]))
    return out


def quote(desc, cap=320):
    """Citation exacte : phrases complètes du résumé publié, sinon le début suivi de […]."""
    d = A.EMOJI_RX.sub("", desc or "").strip()
    d = re.sub(r"\.\.\.$|…$", "", d).strip()
    sents = re.findall(r"[^.!?]+[.!?]", d)
    keep = ""
    for s_ in sents:
        if len(keep) + len(s_) > cap:
            break
        keep += s_
    keep = keep.strip()
    if not keep:
        keep = A.cut(d, cap).strip() + " […]"
    return keep


TAG_SAFE = [
    ("Justice", r"\btribunal|\bprocès|\bjuge[sr]?\b|condamné|\bparquet\b|mis en examen|cour d'assises|cour criminelle|perpétuité"),
    ("Médias", r"journalis|\barcom\b|\bcnews\b|\bbfm|france télévisions|radio france|audiovisuel|liberté de la presse|reporters sans frontières"),
    ("Politique", r"bardella|rassemblement national|\brn\b|président du r|présidentielle|\bdéputés?\b|\bsénat|assemblée nationale|\bcandidat|premier ministre|gouvernement français|\bélysée|\bprimaire"),
    ("Économie", r"droits? de douane|\binflation|\bbourse\b|croissance économique|\bchômage|\bbudget\b|\bsalaires?\b|\bpib\b|\bexportations?\b"),
    ("Climat", r"\bclimat|\bcop\d|réchauffement|biodiversité|émissions de|sécheresse|canicule|inondations?"),
    ("Culture", r"\bcinéma|\bfilm\b|\bfestival|\bmusique|\bmusée|\bexposition|\bthéâtre|\bécrivain|\bchanteu|\bgroupe de rock|guitariste"),
    ("Société", r"\bgrippe|\bépidémie|\bécole|\blogement|\bretraites?\b|\bgrève|\bsanté publique"),
    ("Monde", r"ukrain|\brusse|russie|israël|\bgaza|\biran|\bchine|états-unis|\byémen|\bsyrie|\bliban|\bsoudan|\bégypte|\birak|\bcorée|pyongyang|\bsuisse|\bafrique|\binde\b|\bbrésil|\bjapon|\bvenezuela|\bturquie|\bafghan|\bpakistan|\bmexique|\bcanada|\bbirmanie|\bespagne|\bitalie|\ballemagne|royaume-uni|londres|washington|moscou|pékin|kiev|kyiv"),
]


def safe_tag(text, src=""):
    t, tn = text.lower(), A.plain_norm(text)
    for tag, rx in TAG_SAFE:
        if re.search(rx, t) or re.search(A.plain_norm(rx), tn):   # « Egypte » sans accent = « Égypte »
            return tag
    # rien de reconnu : rédaction internationale → Monde ; rédaction française → Société
    return "Monde" if (src not in A.FR_SOURCES or src in ("Courrier international", "France 24", "RFI", "Euronews", "Le Temps (Suisse)")) else "Société"


def story_of_group(g):
    lead = g["lead"]
    srcs = [lead] + [m for m in g["mates"] if same_fact(lead, m)]
    parts = []
    for it in srcs:
        if it["src"] in A.FR_SOURCES and it["desc"]:
            parts.append(f"{A.display_name(it['src'])} : « {quote(it['desc'])} »")
        if len(parts) == 2:
            break
    if not parts:
        return None
    others = [A.display_name(it["src"]) for it in srcs if f"{A.display_name(it['src'])} :" not in " ".join(parts)]
    text = " ".join(parts) + (f" Information également rapportée par {', '.join(others)}." if others else "")
    tag = SECTION_TAG.get(lead["src"]) or safe_tag(lead["title"] + " " + (lead["desc"] or ""), lead["src"])
    seen, sources = set(), []
    for it in srcs:
        b = A.media_base(it["src"])
        if b not in seen:
            seen.add(b)
            sources.append({"name": A.display_name(it["src"]), "url": it["link"]})
    return {"tag": tag, "title": A.EMOJI_RX.sub("", lead["title"]).strip(), "text": text, "why": "", "sources": sources[:4],
            "_lead": A.display_name(lead["src"]),
            "_exclude": {A.display_name(i["src"]) for i in g["all"]} | {A.media_base(i["src"]) for i in g["all"]}}


# ------------------------------------------------------------------ questions exactes par construction
def ex_cloze(st):
    b = A.blank_word(st["title"])
    if not b:
        return None
    return {"t": "input", "q": f"Complète le titre publié par {st['_lead']} : « {b[0]} »", "a": [b[1]], "x": f"Titre exact : « {st['title']} »"}


def ex_who(st, outlets, rnd):
    others = [o for o in outlets if o not in {s["name"] for s in st["sources"]} and o not in st.get("_exclude", set())]
    if len(others) < 2:
        return None
    rnd.shuffle(others)
    ch = [st["_lead"]] + others[:3]
    return {"t": "qcm", "q": f"Quelle rédaction a publié ce titre : « {A.cut(st['title'], 140)} » ?", "c": ch, "a": 0,
            "x": f"Titre publié par {st['_lead']}."}


def altered(title, others, rnd):
    """Le même titre avec un nom propre remplacé par celui d'un autre titre du jour (donc faux)."""
    words = title.split()
    idx = [k for k, w in enumerate(words) if k > 0 and re.match(r"^[A-ZÉÈÀÂÎÔ][a-zà-ÿ’'-]{3,}$", w.strip("«»\"',.:;")) and w.strip("«»\"',.:;") not in STOP_SWAP]
    pool = sorted({w.strip("«»\"',.:;") for o in others for w in o.split()[1:]
                   if re.match(r"^[A-ZÉÈÀÂÎÔ][a-zà-ÿ’'-]{3,}$", w.strip("«»\"',.:;")) and w.strip("«»\"',.:;") not in STOP_SWAP and w.strip("«»\"',.:;") not in title})
    if not idx or not pool:
        return None
    k = rnd.choice(idx)
    old = words[k].strip("«»\"',.:;")
    words[k] = words[k].replace(old, rnd.choice(pool))
    return " ".join(words)


def ex_vf(st, all_titles, rnd, truth):
    if truth:
        return {"t": "vf", "q": f"{st['_lead']} a publié ce titre : « {st['title']} »", "a": True, "x": "C'est le titre exact."}
    alt = altered(st["title"], [t for t in all_titles if t != st["title"]], rnd)
    if not alt:
        return None
    return {"t": "vf", "q": f"{st['_lead']} a publié ce titre : « {alt} »", "a": False, "x": f"Le titre exact est : « {st['title']} »"}


def ex_match(stories):
    pick, outs = [], set()
    for st in stories:
        if st["_lead"] not in outs:
            pick.append(st)
            outs.add(st["_lead"])
        if len(pick) == 4:
            break
    if len(pick) < 3:
        return None
    return {"t": "match", "q": "Associe chaque titre à la rédaction qui l'a publié",
            "pairs": [[A.cut(st["title"], 80), st["_lead"]] for st in pick], "x": "Chaque titre est cité tel qu'il a été publié."}


def ex_write(st):
    lead_quote = re.search(r"« (.*?) »", st["text"])
    model = lead_quote.group(1) if lead_quote else st["title"]
    return {"t": "write", "max": 300, "q": "✍️ Écris un chapô de 300 signes maximum pour cette info (l'essentiel : qui, quoi, où, quand)",
            "src": f"Titre : {st['title']}\n\n{st['text']}", "model": f"**Chapô publié par {st['_lead']} :** {model}",
            "crit": ["Il donne l'essentiel (qui, quoi, où, quand)", "Il fait moins de 300 signes", "Il ne recopie pas le titre", "Tout ce qui est écrit figure dans les citations"]}


USED_Q = set()


def lesson(stories, all_stories, outlets, rnd, title, icon, desc, n_write=1):
    ex = []
    titles = [s["title"] for s in all_stories]
    for k, st in enumerate(stories):
        for e in (ex_cloze(st), ex_who(st, outlets, rnd), ex_vf(st, titles, rnd, k % 2 == 0)):
            if e:
                ex.append(e)
    rnd.shuffle(ex)
    ex = [e for e in ex if e["q"] not in USED_Q]
    ex = ex[:8]
    USED_Q.update(e["q"] for e in ex)
    m = ex_match(stories if len(stories) >= 3 else all_stories)
    if m:
        ex.append(m)
    for st in stories[:n_write]:
        ex.append(ex_write(st))
    return {"title": title, "icon": icon, "desc": desc, "exercises": ex}


def strip_private(stories):
    for s in stories:
        s.pop("_lead", None)
        s.pop("_exclude", None)
    return stories


# ------------------------------------------------------------------ édition / mise à jour
def dedupe(stories):
    out = []
    for st in stories:
        t = norm_tokens(st["title"])
        urls = {x["url"] for x in st["sources"]}
        if any(urls & {x["url"] for x in o["sources"]} or len(t & norm_tokens(o["title"])) >= 3
               or len((t & norm_tokens(o["title"])) - BROAD) >= 2 for o in out):
            continue
        out.append(st)
    return out


def build(date, gs):
    stories = dedupe([x for x in (story_of_group(g) for g in gs) if x])[:10]
    if len(stories) < 8:
        raise RuntimeError(f"seulement {len(stories)} infos recoupées : pas d'édition (rien n'est inventé pour compléter)")
    rnd = random.Random(date)
    outlets = sorted({s["sources"][0]["name"] for s in stories} | {x["name"] for s in stories for x in s["sources"]})
    fr = [s for s in stories if s["tag"] not in ("Monde", "Europe")]
    world = [s for s in stories if s["tag"] in ("Monde", "Europe")]
    fr, world = (fr if len(fr) >= 3 else stories[:5]), (world if len(world) >= 3 else stories[-5:])
    rest = [s_ for s_ in stories if s_ not in fr[:4] and s_ not in world[:4]] or stories
    lessons = [lesson(fr, stories, outlets, rnd, "Le quiz de la une", "☕", "Les titres du jour"),
               lesson(world, stories, outlets, rnd, "Le tour du monde", "🌍", "International et Europe"),
               lesson(rest + stories, stories, outlets, rnd, "Médias & atelier", "🎙️", "Qui a publié quoi, et à toi d'écrire", n_write=2)]
    w = A.WORDS[datetime.date.fromisoformat(date).toordinal() % len(A.WORDS)]
    day = {"date": date, "title": "Revue de presse : " + A.cut(stories[0]["title"], 60),
           "intro": "Les informations du jour confirmées par au moins deux rédactions, citées telles qu'elles ont été publiées.",
           "word": {"term": w[0], "def": w[1]}, "glossary": [], "memo": [s["title"] for s in stories[:5]],
           "stories": strip_private(stories), "lessons": lessons, "shorts": []}
    return day


def update(day, gs, hour):
    used = {s_["url"] for st in day["stories"] for s_ in st.get("sources", [])}
    have = [norm_tokens(st["title"]) for st in day["stories"]]
    fresh = []
    for g in gs:
        if g["lead"]["link"] in used or any(m["link"] in used for m in g["mates"]):
            continue
        t = norm_tokens(g["lead"]["title"])
        if any(len(t & h) >= 3 for h in have):
            continue
        st = story_of_group(g)
        if st:
            fresh.append(st)
    room = A.MAX_STORIES - len(day["stories"])
    fresh = fresh[:min(3, room)]
    if not fresh:
        return False
    rnd = random.Random(day["date"] + str(hour))
    outlets = sorted({x["name"] for s in fresh for x in s["sources"]} | {x["name"] for s in day["stories"] for x in s.get("sources", [])})
    k0 = len(day["stories"])
    flash = lesson(fresh, fresh, outlets, rnd, f"⚡ Flash de {hour} h", "⚡", "Mise à jour")
    day["stories"] += strip_private(fresh)
    day.setdefault("updates", []).append({"at": f"{hour:02d}:00", "stories": list(range(k0, k0 + len(fresh)))})
    day["lessons"].append(flash)
    return True


def main():
    now = datetime.datetime.now(A.PARIS)
    date, hour = now.strftime("%Y-%m-%d"), now.hour
    log(f"Scoop secours sans IA : {date} {hour} h (Paris)")
    if "--si-rien-depuis" in ARGV:
        minutes = int(ARGV[ARGV.index("--si-rien-depuis") + 1])
        done = deja_fait(minutes)
        if done and "--force" not in ARGV:
            log(f"  déjà fait par une routine Claude : « {done} » → rien à faire")
            return 0
        log("  aucune publication récente : le secours sans IA prend le relais")
    if "--skip-fetch" not in ARGV:
        subprocess.run([sys.executable, str(A.ROOT / "scripts" / "fetch_news.py")], check=False)
    gs = groups(A.read_items())
    log(f"  {len(gs)} faits recoupés par au moins 2 rédactions")
    path = A.day_path(date)
    index = A.load_index()
    if not path.exists() or "SCOOP:REGENERER" in path.read_text(encoding="utf-8")[:200]:
        if hour < 6 and "--force" not in ARGV:
            log("  trop tôt"); return 0
        day = build(date, gs)
        p = A.write_day(day, "(édition de secours sans IA : citations exactes des rédactions)")
        errs = A.check(p)
        if errs:
            log("ÉCHEC du contrôle, rien n'est publié :", errs[:5])
            if "--dry" not in ARGV:
                p.unlink(missing_ok=True)
            return 1
        index = [e for e in index if e.get("date") != date]
        index.insert(0, {"date": date, "title": day["title"], "lessons": len(day["lessons"])})
        A.write_index(index)
        subprocess.run([sys.executable, str(A.ROOT / "scripts" / "sources_extraits.py"), date], check=False)  # titre + chapeau des articles (ateliers)
        log(f"Édition de secours du {date} publiée : {len(day['stories'])} infos, {len(day['lessons'])} leçons")
    else:
        day = A.node_json(path)
        before = json.loads(json.dumps(day))
        if not update(day, gs, hour):
            log("  rien de nouveau et recoupé : édition inchangée"); return 0
        p = A.write_day(day, "(mise à jour de secours sans IA)")
        errs = A.check(p)
        if errs:
            log("ÉCHEC du contrôle, mise à jour annulée :", errs[:5])
            A.write_day(before, "(inchangée)")
            return 1
        for e in index:
            if e.get("date") == date:
                e["lessons"] = len(day["lessons"])
        A.write_index(index)
        subprocess.run([sys.executable, str(A.ROOT / "scripts" / "sources_extraits.py"), date], check=False)  # titre + chapeau des articles (ateliers)
        log(f"Mise à jour de secours de {hour} h publiée : {len(day['stories'])} infos")
    return 0


if __name__ == "__main__":
    sys.exit(main())
