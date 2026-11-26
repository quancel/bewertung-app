#!/usr/bin/env python3
"""Gezielte Abfrage des Durchlauf-Protokolls — der erlaubte Weg an die Rohdaten.

  runs-query.py --list                          Sitzungen und Aufrufe (eine Zeile je Aufruf)
  runs-query.py --task PO-2026-11-24-005        alle Aufrufe zu einem Paket
  runs-query.py --rolle frontend-lead --feld ausgabe --max 2000
  runs-query.py --session 0ccbd4aa --feld handoffs

Felder: ausgabe (Standard), eingabe_prompt, handoffs, nutzung, alle. Die Ausgabe
ist vollstaendig; fuer eine Analyse braucht man alle Daten. Wer sie begrenzen
will, setzt --max <Zeichen>. Gedacht fuer /lauf-analyse und den Orchestrator; die Rollen
selbst brauchen das Protokoll nicht (guard-runs.py sperrt den Direktzugriff).
"""
import argparse
import json
import os
import sys
from pathlib import Path


def runs_dir():
    env = os.environ.get("CLAUDE_PROJECT_DIR")
    for d in ([Path(env)] if env else []) + [Path.cwd(), *Path.cwd().parents]:
        if (d / ".claude" / "runs").is_dir():
            return d / ".claude" / "runs"
    return Path.cwd() / ".claude" / "runs"


def records(base, session):
    for d in sorted(p for p in base.iterdir() if p.is_dir()):
        if session and session not in d.name:
            continue
        for f in sorted(d.glob("[0-9][0-9][0-9]-*.json")):
            try:
                yield d.name, f.name, json.loads(f.read_text(encoding="utf-8"))
            except ValueError:
                continue


def task_ids(r):
    return [h.get("task_id") for h in r.get("handoffs") or [] if h.get("task_id")]


def main():
    a = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    a.add_argument("--list", action="store_true")
    a.add_argument("--task"); a.add_argument("--rolle"); a.add_argument("--session")
    a.add_argument("--feld", default="ausgabe")
    a.add_argument("--max", type=int, default=0, help="Zeichen je Feld kappen (0 = nicht kappen)")
    o = a.parse_args()
    base = runs_dir()
    if not base.is_dir():
        print(f"Kein Protokoll unter {base}"); return
    treffer = [(d, f, r) for d, f, r in records(base, o.session)
               if (not o.task or o.task in task_ids(r))
               and (not o.rolle or o.rolle in str(r.get("rolle", "")))]
    if o.list or not (o.task or o.rolle or o.session):
        for d, f, r in treffer:
            n = r.get("nutzung") or {}
            print(f"{d}/{f}  {r.get('rolle')}  {','.join(task_ids(r)) or '—'}  "
                  f"out={n.get('tokens_out', '—')}")
        return
    for d, f, r in treffer:
        print(f"\n### {d}/{f} — {r.get('rolle')} — {r.get('zeit')}")
        wert = r if o.feld == "alle" else r.get(o.feld)
        text = wert if isinstance(wert, str) else json.dumps(wert, ensure_ascii=False, indent=1)
        if o.max and len(text) > o.max:
            text = text[:o.max] + f"\n[... {len(text) - o.max} Zeichen gekappt, --max erhoehen]"
        print(text)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"runs-query.py: {exc}", file=sys.stderr)
    sys.exit(0)
