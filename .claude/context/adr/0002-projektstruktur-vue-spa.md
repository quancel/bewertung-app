# ADR-0002: Projektstruktur und Benennung für ein Vue-SPA (Abweichung von der Greenfield-Referenz)

- **Status**: accepted
- **Datum**: 2026-09-08
- **Bounded Context(s)**: `app-shell` (projektweit gültig für alle Contexts)
- **task_id**: `PO-2026-09-07-010`

## Kontext

Das Repo ist leer (geprüft 2026-09-08: kein `package.json`, kein `src/`, kein
Build-Setup). `code-conventions.md` muss deshalb im Modus `vorgegeben`
entstehen, **bevor** der erste Lead Code schreibt — sonst legt jeder Lead und
jeder von ihm gespawnte Subagent Dateien nach eigenem Gutdünken ab.

Die Greenfield-Referenzstruktur des Plugins beschreibt Angular/NgRx im
Frontend und Microservices im Backend. Der Nutzer hat den Architekten
namentlich angewiesen, bewusst davon abzuweichen und die Abweichung hier zu
begründen.

## Entscheidung

**Ein Vite-Projekt, ein Bundle, kein Monorepo.** Struktur und Benennung
stehen ausgeschrieben in `.claude/context/code-conventions.md`; hier steht die
Begründung.

Kern der Setzung:

1. **Vue 3 + TypeScript + Vite + Pinia + vue-router.** Vue ist gesetzt; die
   vier Ergänzungen sind der Standardstapel des Ökosystems. TypeScript ist
   nicht Geschmack, sondern Voraussetzung für ADR-0003: Ein versioniertes
   Speicherformat mit Migrationskette braucht einen typisierten Bestand.
2. **Feature-Schnitt statt Schichten-Schnitt.** Ein Ordner unter
   `src/features/` je Bounded Context, benannt **exakt** wie der
   `bounded_context` im Handoff. Damit ist der Weg vom Handoff zum Ordner
   nachschlagefrei.
3. **`src/persistence/` als einzige Stelle mit Gerätespeicher-Zugriff.** Sie
   übernimmt die Rolle, die in der Referenz das Backend hätte (ADR-0001).
4. **Kein Facade-Zwang.** Die Referenz verlangt eine Facade zwischen
   Komponente und Store. In Pinia ist der Store bereits die Facade — eine
   zweite Schicht wäre reine Zeremonie. Stattdessen gilt: `components/` ist
   präsentational und kennt keinen Store, `views/` binden ihn an.
5. **Framework-Vokabular englisch, Domänen-Vokabular deutsch.** Ordner heißen
   `components`, `views`, `stores`, `composables`; Domänenbegriffe bleiben
   deutsch (`Ort`, `Bewertung`, `Tag`, `Bild`, `Ortsliste.vue`). Die Domäne
   ist durchgehend deutsch — Achsennamen, Bounded Contexts, UI-Texte. Eine
   Übersetzungsschicht `orte → places` würde bei jedem Handoff neu übersetzt
   und irgendwann falsch übersetzt.
6. **Deutsche Komponentennamen dürfen einteilig sein** (`Ortsliste.vue`, nicht
   `OrtListe.vue`). Die Vue-Regel „mehrteilige Komponentennamen" existiert, um
   Kollisionen mit HTML-Elementen zu verhindern; ein deutsches
   Kompositum kann nicht mit einem HTML-Element kollidieren. Steht
   ausdrücklich in `code-conventions.md`, damit es niemand „korrigiert".

## Konsequenzen

- Positiv: Der Weg vom Handoff zur Datei ist mechanisch — `bounded_context` →
  `src/features/<context>/`. `files_to_touch` lässt sich vom Architekten
  füllen, ohne das Repo zu durchsuchen.
- Positiv: Feature-Isolation hält die späteren Pakete (002/004/005/006/009)
  voneinander unabhängig, obwohl sie alle am selben Ort-Aggregat hängen.
- Negativ/Trade-off: Ohne Facade wandert Zustandslogik direkt in den Store.
  Wird ein Store zu groß, ist das ein Zeichen für einen falschen
  Feature-Schnitt, nicht für eine fehlende Schicht.
- Negativ/Trade-off: Gemischtsprachige Bezeichner (`useOrteStore`) sehen
  ungewohnt aus. Der Preis ist bewusst gezahlt; die Alternative wäre eine
  dauerhafte Übersetzungspflicht.
- Betrifft künftig: Beide Leads und **alle** von ihnen gespawnten Subagents.
  Der Architekt nimmt die jeweils relevanten Regeln als `constraints` ins
  Handoff auf, weil Subagents `code-conventions.md` nicht zwingend sehen.

## Alternativen (kurz)

- **Angular/NgRx-Referenz 1:1 übertragen** — verworfen: Vue ist gesetzt, die
  Struktur wäre nicht übertragbar (Facade, Effects, Module).
- **Microservice-Zuschnitt aus der Referenz** — verworfen: Es gibt keinen
  Dienst (ADR-0001).
- **Schichten-Schnitt (`src/components`, `src/stores`, `src/views`)** —
  verworfen: Bei sieben Contexts läge jedes Paket in vier Ordnern verstreut,
  und Feature-Isolation wäre nicht prüfbar.
- **Nuxt statt Vite-SPA** — verworfen: Nuxt bringt Server-Rendering und einen
  Server-Anteil mit, den ADR-0001 gerade ausschließt.
