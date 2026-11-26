"""Scoop : la routine principale (autre compte Claude) est-elle déjà passée ?

Utilisé par la routine Claude de SECOURS (compte Nico2), lancée 1 h après la routine principale.
Regarde les publications des 70 dernières minutes qui touchent l'édition, le pré-tri ou le registre
des passages (un passage « rien de nouveau » compte aussi). Les vidéos de GitHub Actions (data/live) ne comptent pas.

Affiche :
  DÉJÀ FAIT : <message du commit>   -> la routine de secours s'arrête sans rien faire
  À FAIRE                           -> la routine de secours fait la mise à jour
Gratuit : aucun appel à Claude, seulement git.
"""
import subprocess
import sys

MINUTES = int(sys.argv[1]) if len(sys.argv) > 1 else 70

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

try:
    # Dans le cloud, le dépôt est cloné en « HEAD détaché » : on lit origin/main directement.
    subprocess.run(["git", "fetch", "-q", "origin", "main"], check=False)
    ref = "origin/main" if subprocess.run(["git", "rev-parse", "-q", "--verify", "origin/main"],
                                          capture_output=True).returncode == 0 else "HEAD"
    out = subprocess.run(
        ["git", "log", ref, f"--since={MINUTES} minutes ago", "--format=%s", "--",
         "data/days", "scripts/topics-seen.txt", "scripts/passages.txt"],
        capture_output=True, text=True, encoding="utf-8", check=True,
    ).stdout.strip()
except Exception as e:  # en cas de doute, on fait la mise à jour
    print(f"À FAIRE (vérification impossible : {e})")
    sys.exit(0)

print("DÉJÀ FAIT : " + out.splitlines()[0] if out else "À FAIRE")
