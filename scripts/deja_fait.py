"""Scoop : la routine principale (autre compte) est-elle déjà passée ?

Utilisé par la routine de SECOURS, lancée 30 min après la routine principale.
Regarde les commits des 50 dernières minutes qui touchent l'édition ou le pré-tri
(les vidéos automatiques de GitHub Actions, dans data/live, ne comptent pas).

Affiche :
  DÉJÀ FAIT : <message du commit>   -> la routine de secours s'arrête sans rien faire
  À FAIRE                           -> la routine de secours fait la mise à jour
Gratuit : aucun appel à Claude, seulement git.
"""
import subprocess
import sys

MINUTES = 50

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

try:
    # Dans le cloud, le dépôt est cloné en « HEAD détaché » (git pull échoue) : on lit donc origin/main directement.
    subprocess.run(["git", "fetch", "-q", "origin", "main"], check=False)
    ref = "origin/main" if subprocess.run(["git", "rev-parse", "-q", "--verify", "origin/main"],
                                          capture_output=True).returncode == 0 else "HEAD"
    out = subprocess.run(
        ["git", "log", ref, f"--since={MINUTES} minutes ago", "--format=%s", "--",
         "data/days", "scripts/topics-seen.txt"],
        capture_output=True, text=True, encoding="utf-8", check=True,
    ).stdout.strip()
except Exception as e:  # en cas de doute, on fait la mise à jour
    print(f"À FAIRE (vérification impossible : {e})")
    sys.exit(0)

if out:
    print("DÉJÀ FAIT : " + out.splitlines()[0])
else:
    print("À FAIRE")
