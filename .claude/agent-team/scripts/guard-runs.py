#!/usr/bin/env python3
"""PreToolUse-Wache: Rollen lesen .claude/runs/ nicht direkt.

Das Durchlauf-Protokoll ist vollstaendig, aber es ist Material fuer die
Auswertung (/lauf-analyse, runs-report.py, runs-query.py), nicht fuer die
Arbeit an einem Paket. Ein Agent, der es ungefragt liest, zahlt Kontext fuer
Daten, die ihm nichts nuetzen (prompts.md allein: 200+ KB) und kann seine
eigene Mitschrift als Auftrag missverstehen.

Verweigert wird jeder Zugriff auf .claude/runs/ ueber Read, Grep, Glob, Edit,
Write, NotebookEdit — und ueber Bash, ausser der Befehl ruft ausschliesslich
runs-report.py oder runs-query.py auf. Gilt fuer Subagents wie fuer den
Hauptthread. Die Hooks, die das Protokoll schreiben, sind keine Tool-Aufrufe
und bleiben unberuehrt.

**Grenze, ehrlich:** Das ist eine Wache gegen versehentliches Lesen, kein
Sicherheitsmechanismus. Wer den Pfad in Bash verschleiert (Variable, Glob,
`cd` und relativer Pfad), kommt vorbei; die Bash-Pruefung sucht deshalb auch
den bloßen Verzeichnisnamen `runs/` (nur wenn er allein steht, nicht `src/runs/`). Gewollter Zugriff geht ueber die Skripte.

Fehler im Skript verweigern nie etwas (fail open, Exit 0).
"""
import json
import re
import sys

ERLAUBT = ("runs-report.py", "runs-query.py")
PFAD = re.compile(r"(^|[\\/\s'\"=:])\.?claude[\\/]runs([\\/\s'\"]|$)|(^|[\s'\"])runs[\\/]")
GRUND = ("Zugriff auf .claude/runs/ verweigert: Das Durchlauf-Protokoll ist nur fuer die "
         "Auswertung gedacht. Nutze /lauf-analyse oder "
         "`python3 .claude/agent-team/scripts/runs-query.py --help`; fuer die Arbeit an "
         "einem Paket brauchst du es nicht.")


def verweigern():
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse", "permissionDecision": "deny",
        "permissionDecisionReason": GRUND}}, ensure_ascii=False))


def bash_betroffen(cmd):
    for teil in re.split(r"&&|\|\||;|\||\n", cmd):
        if PFAD.search(teil) and not any(s in teil for s in ERLAUBT):
            return True
    return False


def main():
    p = json.load(sys.stdin)
    if p.get("hook_event_name") not in (None, "PreToolUse"):
        return
    tool, ti = p.get("tool_name", ""), p.get("tool_input") or {}
    if tool == "Bash":
        if bash_betroffen(str(ti.get("command", ""))):
            verweigern()
    elif tool in ("Read", "Grep", "Glob", "Edit", "Write", "NotebookEdit"):
        ziele = [str(ti.get(k, "")) for k in ("file_path", "path", "pattern", "notebook_path")]
        if any(PFAD.search(z.replace("\\", "/")) or ".claude/runs" in z.replace("\\", "/") for z in ziele):
            verweigern()


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass
    sys.exit(0)
