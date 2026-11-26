# Verifikations-Hilfen für Ziel-Repos (Vorlage)

Der Referenzlauf zeigte: Ein voller Rauchtest dauerte ~7,5 Minuten, und für jeden
Rot-Nachweis baute jeder Lead eine gekürzte Kopie des Skripts und suchte danach
liegen gebliebene `*.orig`. Zwei Dinge sparen den größten Teil davon.

## 1. Rauchtest mit `--only`
Das Skript nimmt `--only <name[,name]>`: nur diese Ansichten bzw. Zusicherungen laufen.
Ohne Argument läuft alles. Der Lead nutzt `--only` während der Arbeit und den **vollen**
Lauf einmal vor `done`. Namen kommen aus derselben Liste wie die Ansichten, keine zweite
Liste pflegen. Ein unbekannter Name ist ein Fehler, kein stilles Überspringen.

## 2. Mutationen mit `mutate.py`
`python3 .claude/agent-team/scripts/mutate.py --file <f> --old '<Text>' --new '<Text>'
--build '<Typecheck>' --run '<Test/Rauchtest --only …>' --expect-fail`

Sichert die Datei, ersetzt genau eine Stelle, prüft optional, dass die Mutation
kompiliert, führt den Nachweis aus und stellt die Datei **immer** wieder her. Exit 0 =
Mutation wurde bemerkt (Rot-Nachweis erbracht). Das Ergebnis (welche Mutation, welcher
Befund) kommt in `docs/pakete/<task_id>.md`.
