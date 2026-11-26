#!/usr/bin/env python3
"""Meldet, ob die Vendor-Kopie des agent-team im Ziel-Repo veraltet oder
unvollstaendig eingerichtet ist. Wird von /orchestrate als Schritt 0 gerufen.

Hintergrund: Ein Ziel-Repo, das die Rollen als Projekt-Agents unter .claude/
haelt, bekommt nach dem Erstimport keine Updates von selbst. In bewertung-app
blieb die Kopie ueber Monate auf dem Stand vom 2026-09-07; der Hook fuer
Subagent-Ergebnisse fehlte deshalb, ohne dass es jemand merkte.

Geprueft wird nur, wenn .claude/agent-team/VENDORED.md existiert. Im
Plugin-Betrieb (keine Vendor-Kopie) schweigt das Skript.

  1. Stimmt der vendorte Commit mit dem Kopf des Refs im Marketplace ueberein?
     (git ls-remote, 5 s Timeout; ohne Netz wird dieser Teil uebersprungen)
  2. Deklariert .claude/settings.json die Hooks PostToolUse, SubagentStop,
     UserPromptSubmit und PreToolUse (guard-runs.py) und das Schema-Gate
     validate-handoff.py?

Ausgabe: je Befund eine Zeile "WARNUNG: ...", sonst nichts. Exit immer 0 —
die Pruefung darf einen Durchlauf nie blockieren, sie informiert nur.
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ERWARTET = ("PostToolUse", "SubagentStop", "UserPromptSubmit", "PreToolUse")


def feld(text, name):
    m = re.search(rf"\*\*{name}\*\*:\s*(\S+)", text)
    return m.group(1) if m else None


def main():
    root = Path(os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd())
    vendored = root / ".claude" / "agent-team" / "VENDORED.md"
    if not vendored.exists():
        return
    text = vendored.read_text(encoding="utf-8")
    quelle, ref, commit, datum = (feld(text, n) for n in
                                  ("Quelle", "Ref", "Commit", "Synchronisiert am"))
    sync = "./.claude/scripts/sync-agent-team.sh"

    if quelle and ref and commit:
        try:
            out = subprocess.run(["git", "ls-remote", quelle, ref], capture_output=True,
                                 text=True, timeout=5).stdout.split()
            if out and out[0] != commit:
                print(f"WARNUNG: Vendor-Kopie ist veraltet — Stand {commit[:7]} "
                      f"({datum}), {ref} steht auf {out[0][:7]}. Aktualisieren: {sync}")
        except Exception:
            pass  # kein Netz: Stand-Vergleich entfaellt, Hook-Pruefung laeuft weiter

    try:
        hooks = json.loads((root / ".claude" / "settings.json").read_text(encoding="utf-8")).get("hooks", {})
    except Exception:
        hooks = {}
    fehlt = [e for e in ERWARTET if e not in hooks]
    if fehlt:
        print("WARNUNG: .claude/settings.json deklariert keinen Hook fuer "
              + ", ".join(fehlt) + " — das Durchlauf-Protokoll bleibt dann "
              "luckenhaft (README, Abschnitt Projekt-Agents).")
    elif "validate-handoff.py" not in json.dumps(hooks):
        print("WARNUNG: Das Schema-Gate validate-handoff.py ist in "
              ".claude/settings.json nicht eingetragen.")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass
    sys.exit(0)
