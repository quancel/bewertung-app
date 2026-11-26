#!/usr/bin/env python3
"""Meldet Gedaechtnisdateien, die ihr Groessenbudget ueberschreiten.

  python3 <pfad>/check-context-size.py

Budget und Begruendung: rules/CONTEXT_BUDGET.md. Liest im Ziel-Repo
(CLAUDE_PROJECT_DIR, sonst cwd): CLAUDE.md und .claude/context/*.md. Ausgabe je
Datei eine Zeile; Ueberschreitung = WARNUNG, doppelt so viel = DRINGEND. Prueft
auch, ob die Hauptdatei auf ihre Themendateien verweist (Register). Exit immer 0,
ausser mit --strict (dann 1 bei DRINGEND) — die Pruefung darf einen Lauf nie
blockieren.
"""
import os
import sys
from pathlib import Path

BUDGET = {
    "CLAUDE.md": 150,
    ".claude/context/context-map.md": 100,
    ".claude/context/code-conventions.md": 120,
    ".claude/context/learnings.md": 120,
    ".claude/context/design-concept.md": 120,
    ".claude/context/design-conventions.md": 150,
}


def main():
    root = Path(os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd())
    dringend = False
    for rel, soll in BUDGET.items():
        p = root / rel
        if not p.is_file():
            continue
        text = p.read_text(encoding="utf-8", errors="replace")
        n = len(text.splitlines())
        kb = len(text.encode("utf-8")) / 1024
        if n > 2 * soll:
            dringend = True
            print(f"DRINGEND: {rel} hat {n} Zeilen ({kb:.0f} KB), Soll {soll} — kuratieren "
                  "und auslagern (rules/CONTEXT_BUDGET.md).")
        elif n > soll:
            print(f"WARNUNG: {rel} hat {n} Zeilen ({kb:.0f} KB), Soll {soll}.")
        themen = p.with_suffix("")
        if rel.startswith(".claude/context/") and themen.is_dir():
            fehlt = [t.name for t in sorted(themen.glob("*.md")) if t.stem not in text and t.name not in text]
            if fehlt:
                print(f"WARNUNG: {rel} verweist nicht auf die Themendatei(en): " + ", ".join(fehlt)
                      + " — ohne Register findet sie niemand.")
    return 1 if dringend and "--strict" in sys.argv else 0


if __name__ == "__main__":
    try:
        code = main()
    except Exception as exc:
        print(f"check-context-size.py: {exc}", file=sys.stderr)
        code = 0
    sys.exit(code)
