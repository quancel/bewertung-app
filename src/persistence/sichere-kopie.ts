/**
 * Macht einen Wert strukturiert klonbar, bevor er in die IndexedDB
 * geschrieben wird (PO-2026-09-12-001, ADR-0023).
 *
 * Hintergrund: Ein Pinia-Store auf Composition-API-Basis (`ref`/`reactive`)
 * hält seine Objekte hinter einem `Proxy` (Vue-Reaktivität). Die HTML-
 * Spezifikation des strukturierten Klons lehnt `Proxy`-Objekte ausdrücklich
 * ab — das ist kein Eigenheit einer Engine, sondern Teil des Algorithmus
 * selbst (nachvollziehbar mit dem eingebauten, spec-treuen
 * `structuredClone()` in Node/V8, ohne Browser). `fake-indexeddb` bildet den
 * strukturierten Klon dagegen in reinem JavaScript nach und lässt einen
 * `Proxy` anstandslos durch — ein grüner Test dagegen ist deshalb KEIN Beleg,
 * dass eine echte IndexedDB denselben Wert annimmt.
 *
 * Diese Funktion baut den Wert deshalb rekursiv aus rohen, neuen
 * Objekten/Arrays wieder auf. Das entfernt jeden `Proxy` (auch tief
 * verschachtelt — ein `Proxy` kann z. B. entstehen, wenn nur EIN Feld eines
 * verschachtelten Objekts per Spread neu zusammengesetzt wird und die
 * übrigen Felder dabei unverändert durchgereicht werden) — unabhängig davon,
 * ob Vue im Spiel ist. Sie importiert bewusst nichts aus `vue`: Die
 * Persistenzschicht kennt keine UI-Bibliothek, sie kennt nur, dass ein Wert
 * strukturiert klonbar sein muss.
 *
 * `Blob` wird unverändert durchgereicht (kein Aufbrechen über `Object.keys`
 * — ein `Blob` hat keine eigenen aufzählbaren Eigenschaften, ein Nachbau über
 * `{}` würde seinen Inhalt verlieren). `Blob` ist nativ strukturiert klonbar
 * und braucht diese Behandlung nicht.
 */
export function sichereKopie<T>(wert: T): T {
  if (Array.isArray(wert)) {
    return wert.map((element) => sichereKopie(element)) as unknown as T
  }

  if (wert instanceof Blob) {
    return wert
  }

  if (wert !== null && typeof wert === 'object') {
    const quelle = wert as Record<string, unknown>
    const ergebnis: Record<string, unknown> = {}
    for (const schluessel of Object.keys(quelle)) {
      ergebnis[schluessel] = sichereKopie(quelle[schluessel])
    }
    return ergebnis as T
  }

  return wert
}
