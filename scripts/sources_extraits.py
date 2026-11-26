#!/usr/bin/env python3
"""Ajoute aux sources d'une édition le titre et le chapeau de chaque article.

Usage : python3 scripts/sources_extraits.py AAAA-MM-JJ

Les ateliers d'écriture affichent un « dossier » : la dépêche Scoop, puis ce qu'écrit chaque
rédaction (titre + chapeau de son article, avec le lien). Ces textes viennent des flux RSS déjà
collectés par fetch_news.py (scripts/news-today.txt et scripts/news-new.txt) : le chapeau que
le média publie lui-même pour présenter son article, jamais l'article entier.

Pour chaque source { name, url } de data/days/<date>.js dont l'adresse figure dans ces fichiers,
le script ajoute titre: '...' et extrait: '...'. Il ne touche à rien d'autre et peut être relancé.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def key(url):
    """Adresse comparable : sans paramètres, sans ancre, sans « / » final, en minuscules."""
    u = re.sub(r'[?#].*$', '', url.strip())
    return u.rstrip('/').lower().replace('http://', 'https://')


def articles():
    """{adresse: (titre, chapeau)} lus dans les revues de presse du jour."""
    out = {}
    for name in ('news-today.txt', 'news-new.txt'):
        path = os.path.join(ROOT, 'scripts', name)
        if not os.path.exists(path):
            continue
        lines = open(path, encoding='utf-8').read().split('\n')
        for i, ln in enumerate(lines):
            m = re.match(r'^\s+- \(([^)]*)\) (.+)$', ln)
            if not m:
                continue
            title, desc, url = m.group(2).strip(), '', ''
            for nxt in lines[i + 1:i + 4]:
                s = nxt.strip()
                if re.match(r'^https?://', s):
                    url = s
                    break
                if s and not s.startswith('- ('):
                    desc = (desc + ' ' + s).strip()
            if url:
                out.setdefault(key(url), (title, desc))
    return out


def js_str(s):
    s = re.sub(r'\s+', ' ', s).strip()
    return "'" + s.replace('\\', '\\\\').replace("'", "\\'") + "'"


def main():
    if len(sys.argv) != 2 or not re.match(r'^\d{4}-\d{2}-\d{2}$', sys.argv[1]):
        sys.exit(__doc__)
    path = os.path.join(ROOT, 'data', 'days', sys.argv[1] + '.js')
    src = open(path, encoding='utf-8', newline='').read()
    arts = articles()
    if not arts:
        sys.exit('Aucune revue de presse (scripts/news-today.txt) : lance d’abord fetch_news.py.')
    done = 0

    def repl(m):
        nonlocal done
        body = m.group(0)
        if 'extrait:' in body:
            return body
        um = re.search(r"url\"?:\s*'((?:[^'\\]|\\.)*)'", body) or re.search(r'url"?:\s*"((?:[^"\\]|\\.)*)"', body)
        if not um:
            return body
        hit = arts.get(key(um.group(1).replace("\\'", "'")))
        if not hit or not hit[1]:
            return body
        done += 1
        title, desc = hit
        return body[:-1].rstrip() + f', titre: {js_str(title)}, extrait: {js_str(desc)} }}'

    # une source = un objet sur une ligne : { name: '…', url: '…' }
    src2 = re.sub(r"\{\s*\"?name\"?:\s*(?:'(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\")\s*,\s*\"?url\"?:\s*(?:'(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\")\s*\}", repl, src)
    if src2 != src:
        open(path, 'w', encoding='utf-8', newline='').write(src2)
    print(f'{sys.argv[1]} : {done} source(s) complétée(s) (titre + chapeau).')


if __name__ == '__main__':
    main()
