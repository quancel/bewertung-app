#!/usr/bin/env python3
"""Stand nach einem Abbruch: progress-Dateien der Leads plus git status.

  python3 <pfad>/resume-status.py

Liest .claude/progress/*.md im Ziel-Repo (CLAUDE_PROJECT_DIR, sonst cwd) und
zeigt je Paket Rolle, Status, Zeitpunkt, 'Nächster Schritt' und 'Offen'.
Dazu `git status --porcelain`, damit Arbeitsbaum und Selbstauskunft des Leads
nebeneinander stehen. Regeln: rules/RESUME.md. Schreibt nichts, exit 0.
"""
import os
import re
import subprocess
import sys
from pathlib import Path


def abschnitt(text, titel):
    m = re.search(rf"^## {titel}\s*\n(.*?)(?=^## |\Z)", text, re.S | re.M)
    return (m.group(1).strip() if m else "") or "—"


def kopf(text, name):
    m = re.search(rf"^{name}:\s*([^#\n]*)", text, re.M)
    return m.group(1).strip() if m else "—"


def main():
    root = Path(os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd())
    dateien = sorted((root / ".claude" / "progress").glob("*.md"))
    if not dateien:
        print("Keine progress-Dateien unter .claude/progress/ — Stand nur aus dem "
              "Arbeitsbaum rekonstruierbar (RESUME.md, Punkt 4).")
    for p in dateien:
        t = p.read_text(encoding="utf-8")
        print(f"\n== {p.stem} ({kopf(t, 'Rolle')}) — Status: {kopf(t, 'Status')}, "
              f"zuletzt {kopf(t, 'Aktualisiert')}")
        print("  Nächster Schritt:", abschnitt(t, "Nächster Schritt").replace("\n", "\n    "))
        offen = abschnitt(t, "Offen")
        if offen != "—":
            print("  ! Offen (vor dem Weiterbauen abarbeiten):\n    " + offen.replace("\n", "\n    "))
    try:
        r = subprocess.run(["git", "status", "--porcelain"], cwd=root, capture_output=True,
                           text=True, timeout=10)
        if r.returncode != 0:
            raise RuntimeError("kein Git-Repo")
        out = r.stdout.strip()
        print("\ngit status --porcelain:\n" + ("\n".join("  " + l for l in out.splitlines()) or "  (sauber)"))
    except Exception:
        print("\n(git status nicht verfügbar)")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"resume-status.py: {exc}", file=sys.stderr)
    sys.exit(0)
