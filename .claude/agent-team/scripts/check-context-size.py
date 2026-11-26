#!/usr/bin/env python3
"""Meldet Gedaechtnisdateien, die ihr Groessenbudget ueberschreiten.

  python3 <pfad>/check-context-size.py

Budget und Begruendung: rules/CONTEXT_BUDGET.md. Liest im Ziel-Repo
(CLAUDE_PROJECT_DIR, sonst cwd): CLAUDE.md (hart, 150 Zeilen) und die Hauptdateien
unter .claude/context/ (Richtwert in KB). Prueft ausserdem, ob die Hauptdatei auf
jede ihrer Themendateien verweist (Register, Pflicht). Exit immer 0,
ausser mit --strict (dann 1 bei DRINGEND) — die Pruefung darf einen Lauf nie
blockieren.
"""
import os
import sys
from pathlib import Path

CLAUDE_ZEILEN = 150          # hart: wird bei jeder Sitzung ganz geladen
KONTEXT_KB = 12              # Richtwert je Hauptdatei unter .claude/context/
KONTEXT_DATEIEN = ("context-map", "code-conventions", "learnings",
                   "design-concept", "design-conventions")


def main():
    root = Path(os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd())
    dringend = False

    cl = root / "CLAUDE.md"
    if cl.is_file():
        text = cl.read_text(encoding="utf-8", errors="replace")
        n, kb = len(text.splitlines()), len(text.encode("utf-8")) / 1024
        if n > 2 * CLAUDE_ZEILEN:
            dringend = True
            print(f"DRINGEND: CLAUDE.md hat {n} Zeilen ({kb:.0f} KB), hart {CLAUDE_ZEILEN} — "
                  "wird bei jeder Sitzung ganz geladen; kuratieren (rules/CONTEXT_BUDGET.md).")
        elif n > CLAUDE_ZEILEN:
            print(f"WARNUNG: CLAUDE.md hat {n} Zeilen ({kb:.0f} KB), hart {CLAUDE_ZEILEN}.")

    for name in KONTEXT_DATEIEN:
        rel = f".claude/context/{name}.md"
        p = root / rel
        if not p.is_file():
            continue
        text = p.read_text(encoding="utf-8", errors="replace")
        kb = len(text.encode("utf-8")) / 1024
        if kb > 2 * KONTEXT_KB:
            print(f"WARNUNG: {rel} hat {kb:.0f} KB ({len(text.splitlines())} Zeilen), "
                  f"Richtwert {KONTEXT_KB} KB — auslagern und Register pflegen.")
        elif kb > KONTEXT_KB:
            print(f"HINWEIS: {rel} hat {kb:.0f} KB, Richtwert {KONTEXT_KB} KB — "
                  "unkritisch, solange das Register stimmt und nur Themendateien gelesen werden.")
        themen = p.with_suffix("")
        if themen.is_dir():
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
