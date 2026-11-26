#!/usr/bin/env python3
"""Rot-Nachweis per Mutation, ohne liegen gebliebene Reste.

  python3 mutate.py --file src/a.ts --old 'x > 0' --new 'x >= 0' --run 'npm run test'
  python3 mutate.py --file ... --old ... --new ... --run '...' --expect-fail

Ablauf: Datei sichern, `--old` genau **einmal** ersetzen (sonst Abbruch), `--run`
ausfuehren, Datei **immer** wiederherstellen (auch bei Fehler/Abbruch), Befund
melden. Mit `--expect-fail` gilt die Mutation als nachgewiesen, wenn der Lauf
**rot** wird; mit `--build` (Standardbefehl davor, z. B. 'npm run typecheck')
wird zuerst geprueft, dass die Mutation kompiliert — eine Mutation, die nicht
baut, beweist nichts.

Warum ein Skript: In den Leads-Berichten des Referenzprojekts bastelte jeder Lead
je Rot-Nachweis eine gekuerzte Kopie des Rauchtests und musste danach liegen
gebliebene `*.orig` suchen. Das hier macht den Teil mechanisch und sicher.
Exit: 0 = Erwartung erfuellt, 1 = nicht erfuellt, 2 = Mutation nicht anwendbar
oder kompiliert nicht.
"""
import argparse
import subprocess
import sys
from pathlib import Path


def lauf(cmd):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return r.returncode, (r.stdout + r.stderr)[-1500:]


def main():
    a = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    a.add_argument("--file", required=True)
    a.add_argument("--old", required=True)
    a.add_argument("--new", required=True)
    a.add_argument("--run", required=True, help="Befehl, der den Nachweis fuehrt")
    a.add_argument("--build", help="Befehl, der zeigt, dass die Mutation kompiliert")
    a.add_argument("--expect-fail", action="store_true", help="Erwartung: der Lauf wird rot")
    o = a.parse_args()

    p = Path(o.file)
    original = p.read_text(encoding="utf-8")
    if original.count(o.old) != 1:
        print(f"ABBRUCH: `--old` kommt {original.count(o.old)}x in {o.file} vor, erwartet genau 1x.")
        return 2
    try:
        p.write_text(original.replace(o.old, o.new), encoding="utf-8")
        if o.build:
            code, out = lauf(o.build)
            if code != 0:
                print("MUTATION KOMPILIERT NICHT — beweist nichts, andere waehlen.\n" + out)
                return 2
        code, out = lauf(o.run)
    finally:
        p.write_text(original, encoding="utf-8")  # immer zuruecksetzen
    rot = code != 0
    print(f"Lauf: exit {code} ({'rot' if rot else 'gruen'}); {o.file} zurueckgesetzt.")
    print(out)
    erfuellt = rot if o.expect_fail else not rot
    print("ERWARTUNG ERFUELLT" if erfuellt else
          "ERWARTUNG NICHT ERFUELLT" + (" — die Mutation blieb unbemerkt." if o.expect_fail else "."))
    return 0 if erfuellt else 1


if __name__ == "__main__":
    sys.exit(main())
