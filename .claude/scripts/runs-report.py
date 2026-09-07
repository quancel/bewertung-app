#!/usr/bin/env python3
"""Verdichtet .claude/runs/ zu einer Uebersicht.

  python3 .claude/scripts/runs-report.py            # alle Durchlaeufe
  python3 .claude/scripts/runs-report.py --last 5   # nur die juengsten 5
  python3 .claude/scripts/runs-report.py <dir>      # ein bestimmter Durchlauf

Zweck: die Rohdaten sind vollstaendig, aber viele Dateien. Diese Uebersicht
ist der Einstieg — welche Rollen liefen wie oft, wo blockierte etwas, wo
gingen Fragen an den Nutzer. Fuer Details dann die genannten JSON-Dateien.
"""
import json
import sys
from collections import Counter
from pathlib import Path

RUNS = Path(__file__).resolve().parents[2] / ".claude" / "runs"


def load(d):
    for p in sorted(d.glob("[0-9][0-9][0-9]-*.json")):
        try:
            yield p, json.loads(p.read_text(encoding="utf-8"))
        except ValueError:
            print(f"  ! unlesbar: {p.name}", file=sys.stderr)


def report(d):
    records = list(load(d))
    print(f"\n=== {d.name} — {len(records)} Aufrufe ===")
    if not records:
        print("  (keine Aufrufe protokolliert)")
        return

    prompts = d / "prompts.md"
    if prompts.exists():
        lines = [l.strip() for l in prompts.read_text(encoding="utf-8").splitlines()]
        trigger = next((l for l in lines if l and not l.startswith(("#", "```"))), "")
        if trigger:
            print(f"  Ausloeser: {trigger[:100]}")

    rollen = Counter(r.get("rolle", "?") for _, r in records)
    print("  Rollen:   " + ", ".join(f"{k}×{v}" for k, v in rollen.most_common()))
    print(f"  Zeitraum: {records[0][1].get('zeit')} .. {records[-1][1].get('zeit')}")

    stati, blockiert, fragen, accepted = Counter(), [], [], Counter()
    for p, r in records:
        for h in r.get("handoffs") or []:
            st = h.get("status")
            if st:
                stati[st] += 1
            if st == "blocked":
                blockiert.append((p.name, h.get("task_id"), h.get("target_role"),
                                  h.get("blocked_reason")))
            for q in h.get("user_questions") or []:
                fragen.append((p.name, r.get("rolle"), q.get("frage")))
            if "accepted" in h:
                accepted[bool(h.get("accepted"))] += 1

    if stati:
        print("  Status:   " + ", ".join(f"{k}={v}" for k, v in stati.most_common()))
    if accepted:
        print(f"  Abnahme:  angenommen={accepted[True]}, offen={accepted[False]}")
    if blockiert:
        print(f"  Blockaden ({len(blockiert)}):")
        for datei, tid, ziel, grund in blockiert:
            print(f"    - {tid} -> {ziel}: {str(grund)[:90]}  [{datei}]")
    if fragen:
        print(f"  Fragen an den Nutzer ({len(fragen)}):")
        for datei, rolle, frage in fragen:
            print(f"    - {rolle}: {str(frage)[:90]}  [{datei}]")

    unvollstaendig = [
        (p.name, r.get("rolle"))
        for p, r in records
        for h in (r.get("handoffs") or [])
        for q in (h.get("user_questions") or [])
        if not all(q.get(f) for f in ("frage", "optionen", "warum", "annahme"))
    ]
    if unvollstaendig:
        print(f"  ! Unvollstaendige user_questions (Formfehler laut Schema): "
              + ", ".join(f"{r} [{f}]" for f, r in unvollstaendig))


def main():
    args = sys.argv[1:]
    if not RUNS.exists():
        print(f"Kein Verzeichnis {RUNS} — es gab noch keinen protokollierten Durchlauf.")
        return
    dirs = sorted(p for p in RUNS.iterdir() if p.is_dir())
    if args and args[0] != "--last":
        dirs = [Path(args[0])]
    elif args and args[0] == "--last":
        dirs = dirs[-int(args[1] if len(args) > 1 else 1):]
    if not dirs:
        print("Noch keine Durchlaeufe protokolliert.")
        return
    for d in dirs:
        report(d)
    fehler = RUNS / "hook-errors.log"
    if fehler.exists():
        print(f"\n! {fehler} existiert — der Protokoll-Hook hatte Fehler.")


if __name__ == "__main__":
    main()
