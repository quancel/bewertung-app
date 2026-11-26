#!/usr/bin/env python3
"""Verdichtet die Durchlauf-Protokolle des Ziel-Repos zu einer Uebersicht.

  python3 <pfad>/runs-report.py            # alle Durchlaeufe
  python3 <pfad>/runs-report.py --last 5   # nur die juengsten 5
  python3 <pfad>/runs-report.py <dir>      # ein bestimmter Durchlauf

Gesucht wird .claude/runs/ im Ziel-Repo (CLAUDE_PROJECT_DIR, sonst vom
Arbeitsverzeichnis aufwaerts) — nicht neben diesem Skript, das im
Plugin-Ordner liegen kann.

Zweck: die Rohdaten sind vollstaendig, aber viele Dateien. Diese Uebersicht
ist der Einstieg — welche Rollen liefen wie oft, wo blockierte etwas, wo
gingen Fragen an den Nutzer. Fuer Details dann die genannten JSON-Dateien.
"""
import json
import os
import sys
from collections import Counter
from pathlib import Path


def find_runs():
    env = os.environ.get("CLAUDE_PROJECT_DIR")
    if env and (Path(env) / ".claude" / "runs").exists():
        return Path(env) / ".claude" / "runs"
    here = Path.cwd().resolve()
    for d in [here, *here.parents]:
        if (d / ".claude" / "runs").exists():
            return d / ".claude" / "runs"
    return here / ".claude" / "runs"


RUNS = find_runs()


def load(d):
    for p in sorted(d.glob("[0-9][0-9][0-9]-*.json")):
        try:
            yield p, json.loads(p.read_text(encoding="utf-8"))
        except ValueError:
            print(f"  ! unlesbar: {p.name}", file=sys.stderr)


def zahl(n):
    return f"{n:,}".replace(",", ".")


def verbrauch(records):
    """Summen je Rolle und je Paket aus den `nutzung`-Feldern. Eingabeseite =
    Eingabe + Cache schreiben + Cache lesen (Cache-Lesen dominiert meist und
    ist guenstiger — deshalb steht es auch einzeln da). Aufrufe ohne Messung
    werden gezaehlt, nicht verschwiegen."""
    je_rolle, je_paket, ohne = {}, {}, 0
    for _, r in records:
        n = r.get("nutzung")
        if r.get("ereignis") != "SubagentStop" and not n:
            continue  # Start-Quittung eines asynchronen Aufrufs: Ergebnis kommt separat
        if not n:
            ohne += 1
            continue
        ein = sum(n.get(k) or 0 for k in ("tokens_in", "tokens_cache_schreiben", "tokens_cache_lesen"))
        aus = n.get("tokens_out") or 0
        gesamt = n.get("tokens_gesamt")
        werte = (ein, aus, n.get("tokens_cache_lesen") or 0, n.get("tool_uses") or 0,
                 n.get("dauer_ms") or 0, gesamt or 0)
        tids = [h.get("task_id") for h in (r.get("handoffs") or []) if h.get("task_id")] or ["(ohne task_id)"]
        rk = r.get("rolle", "?").replace(" (Ergebnis)", "") + (f" [{n['modell']}]" if n.get("modell") else "")
        for tabelle, key in ((je_rolle, rk),
                             (je_paket, tids[0])):
            alt = tabelle.get(key, (0, 0, 0, 0, 0, 0, 0))
            tabelle[key] = tuple(a + b for a, b in zip(alt, (1, *werte)))
    if not je_rolle and not ohne:
        return
    print("  Verbrauch (Eingabeseite / Ausgabe / davon Cache-Lesen / Tools / Dauer):")
    for titel, tabelle in (("je Rolle", je_rolle), ("je Paket", je_paket)):
        for key, (k, ein, aus, cache, tools, ms, gesamt) in sorted(tabelle.items(), key=lambda x: -x[1][1]):
            tok = f"{zahl(ein)} / {zahl(aus)} / {zahl(cache)}" if ein or aus else f"gesamt {zahl(gesamt)}"
            print(f"    {titel:9} {key:<24} {k}× {tok} · {tools} Tools · {ms // 60000} min")
    if ohne:
        print(f"    ! {ohne} Ergebnis(se) ohne Messung (Transkript nicht gefunden) — "
              "Feld `payload_felder` in der -ergebnis-Datei zeigt, was der Harness lieferte")


def report(d):
    records = list(load(d))
    # Ein Aufruf erzeugt zwei Eintraege: den Start (PostToolUse) und, bei
    # asynchronen Agents, das Ergebnis (SubagentStop). Gezaehlt werden Aufrufe.
    starts = [(p, r) for p, r in records if r.get("ereignis") != "SubagentStop"]
    ergebnisse = len(records) - len(starts)
    print(f"\n=== {d.name} — {len(starts)} Aufrufe, {ergebnisse} Ergebnisse ===")
    if not records:
        print("  (keine Aufrufe protokolliert)")
        return

    prompts = d / "prompts.md"
    if prompts.exists():
        lines = [l.strip() for l in prompts.read_text(encoding="utf-8").splitlines()]
        trigger = next((l for l in lines if l and not l.startswith(("#", "```"))), "")
        if trigger:
            print(f"  Ausloeser: {trigger[:100]}")

    rollen = Counter(r.get("rolle", "?") for _, r in starts)
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

    verbrauch(records)

    unvollstaendig = [
        (p.name, r.get("rolle"))
        for p, r in records
        for h in (r.get("handoffs") or [])
        for q in (h.get("user_questions") or [])
        if not all(q.get(f) for f in ("frage", "optionen", "warum", "annahme"))
    ]
    if unvollstaendig:
        print("  ! Unvollstaendige user_questions (Formfehler laut Schema): "
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
