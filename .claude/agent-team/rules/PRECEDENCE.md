# Präzedenz bei widersprüchlichen Vorgaben

Gilt für `architekt`, `frontend-lead`, `backend-lead` und `ux-ui-designer`;
der `design-concept`-Agent taucht als Empfänger eines Patts auf.
Feldbedeutungen: `HANDOFF_SCHEMA.md` (im selben Ordner).

## Rangfolge

Widersprechen sich zwei Vorgaben, gewinnt die höherrangige — für **alle**
Rollen dieselbe Reihenfolge:

1. bestehendes ADR in `.claude/context/adr/`
2. `constraints` aus dem Handoff (vom `architekt`)
3. `design-concept.md` und `code-conventions.md` — projektweite Setzungen
4. `design_notes` — für dieses Paket bewusst gesetzt, in Kenntnis der Konventionen
5. `design-conventions.md` — kuratierte, projektweite UI-Konventionen
6. etabliertes Pattern im Ziel-Repo — was faktisch existiert
7. eigene Präferenz des umsetzenden Agents

Die Entscheidung wird im Handoff kurz vermerkt.

Zwei Stufen, die man leicht vertauscht:

- **`design_notes` über `design-conventions.md`** (4 über 5): Der Designer
  hat die Konventionen gelesen, bevor er die Notes schrieb. Weicht er ab,
  ist das für dieses Paket gewollt.
- **Dokumentierte Festlegungen über gewachsene Patterns** (3–5 über 6): Ein
  Repo-Pattern ist das, was zufällig da ist; eine Konvention ist das, was
  jemand entschieden hat. Andernfalls würde jede alte Stelle im Code jede
  neue Festlegung aushebeln.

**„Konservativ" / „strenger"** heißt konkret: die Option mit dem kleineren
Blast-Radius — keine neue Abhängigkeit, keine Änderung an einem öffentlichen
Contract (API, Event, exportiertes Interface), lokal umkehrbar.

## Echter Patt

Ein Patt liegt **nur** vor, wenn beide Vorgaben auf **derselben Rangstufe**
stehen — also aus derselben Quelle stammen. Dann löst der umsetzende Agent
das **nicht** selbst auf:

- `status: "blocked"` setzen,
- `blocked_reason` mit **beiden** Vorgaben im Wortlaut füllen,
- `target_role` auf die Rolle setzen, die die kollidierende Datei **schreiben
  darf**, und zurückgeben.

**Die Zielrolle richtet sich nach der Quelle der Kollision** — sonst landet
der Patt bei jemandem, der ihn gar nicht auflösen darf:

| Kollision auf gleicher Stufe | `target_role` |
|------------------------------|---------------|
| zwei ADRs · zwei `constraints` untereinander | `architekt` |
| zwei Einträge in `code-conventions.md` | `architekt` |
| zwei Einträge in `design-conventions.md` | `ux-ui-designer` |
| zwei Einträge in `design-concept.md` | `design-concept` |
| `design-concept.md` gegen `code-conventions.md` (beide Stufe 3) | `architekt` — er klärt es mit dem `design-concept`-Agenten |

**Kein Patt ist**, wenn die Vorgaben auf **verschiedenen** Stufen stehen —
dann entscheidet die Rangfolge oben, und du setzt einfach die höherrangige
um. Insbesondere:

- `design_notes` gegen `design-conventions.md` → `design_notes` gewinnen (4
  über 5).
- `design-concept.md` gegen `design-conventions.md` → das Konzept gewinnt (3
  über 5).

**Aber:** In diesen beiden Fällen bleibt die unterlegene Konvention in ihrer
Datei stehen und ist ab sofort falsch. Sie blockiert dich nicht, führt aber
den nächsten Leser in die Irre — genau das macht sie gefährlich.

Melde sie deshalb über `notes_for_learnings`, ausdrücklich als
**Konventions-Nachpflege** gekennzeichnet und mit Nennung des betroffenen
Eintrags. Der `architekt` nimmt sie **nicht** in `learnings.md` auf, sondern
gibt sie als eigene Liste weiter; der `ux-ui-designer` zieht
`design-conventions.md` nach. Stillschweigend überstimmen und weitergehen
ist die schlechteste Variante: Der Fehler bleibt, und niemand erfährt davon.

Bereits fertiggestellte, unabhängige Teile bleiben erhalten — ein Patt
blockiert das weitere Vorgehen, macht geleistete Arbeit aber nicht rückgängig.

Der Roundtrip ist bewusst in Kauf genommen: Ein Patt auf gleicher Rangstufe
heißt, dass die Vorgaben selbst fehlerhaft sind. Das ist durch Auslegung im
Lead nicht reparierbar — eine „passende" Auslegung lässt den Fehler stehen
und reproduziert ihn beim nächsten Paket.
