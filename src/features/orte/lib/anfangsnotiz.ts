/**
 * Eine Gültigkeitsregel, eine Stelle (code-conventions.md „Freitext mit
 * Zeichenobergrenze und ohne Zeilenumbruch", PO-2026-09-27-002): Läufe von
 * Zeilenumbruchzeichen werden zu einem Leerzeichen zusammengefasst, danach
 * wird auf `ANFANGSNOTIZ_MAX_ZEICHEN` UTF-16-Codeeinheiten gekürzt, ohne ein
 * Surrogatpaar zu zerschneiden. Leer oder nur Leerraum wird zu `null`, sonst
 * bleibt der Text UNGETRIMMT (Trim würde tippbare Leerzeichen am Rand
 * verschlucken, während noch getippt wird).
 *
 * „Zeichen" = `String.length` (UTF-16-Codeeinheit) — dieselbe Zählung wie
 * `maxlength` am `<textarea>` und der Zähler in `AnfangsnotizFeld.vue`.
 *
 * Reine Funktion, kein Store-/DOM-/Netzzugriff — Gate sitzt im Store-Setter
 * (`useOrteStore.aktualisiereAnfangsnotiz`), diese Funktion kennt den Store
 * nicht.
 */

export const ANFANGSNOTIZ_MAX_ZEICHEN = 100

/**
 * Zeichen, die als Zeilenumbruch gelten (code-conventions.md, wörtlich
 * aufgezählt): CR, LF, CRLF, LINE SEPARATOR, PARAGRAPH SEPARATOR, NEL,
 * Vertical Tab, Form Feed. Läufe davon (z. B. eingefügtes CRLF oder mehrere
 * Leerzeilen) werden zu GENAU EINEM Leerzeichen zusammengefasst, nicht je
 * Zeichen eines.
 */
const ZEILENUMBRUCH_LAUF = new RegExp('[\\r\\n\\u2028\\u2029\\u0085\\v\\f]+', 'g')

/**
 * Kürzt eine Zeichenkette auf höchstens `grenze` UTF-16-Codeeinheiten, ohne
 * ein Surrogatpaar (führendes Surrogat U+D800–U+DBFF gefolgt von einem
 * nachfolgenden Surrogat U+DC00–U+DFFF) an der Schnittstelle zu zerlegen.
 */
function kuerzeOhneSurrogatpaarZuZerschneiden(text: string, grenze: number): string {
  if (text.length <= grenze) return text
  let ende = grenze
  const vorletztesZeichen = text.charCodeAt(ende - 1)
  const istFuehrendesSurrogat = vorletztesZeichen >= 0xd800 && vorletztesZeichen <= 0xdbff
  if (istFuehrendesSurrogat) ende -= 1
  return text.slice(0, ende)
}

/**
 * Normalisiert eine Anfangsnotiz-Roheingabe zum gespeicherten Wert. Wird von
 * `useOrteStore.aktualisiereAnfangsnotiz` (Gate) UND von
 * `AnfangsnotizFeld.vue` (DOM-Nachziehen nach der Normalisierung) aufgerufen
 * — derselbe Weg, keine zweite Implementierung.
 */
export function normalisiereAnfangsnotiz(roh: string): string | null {
  const ohneZeilenumbrueche = roh.replace(ZEILENUMBRUCH_LAUF, ' ')
  const gekuerzt = kuerzeOhneSurrogatpaarZuZerschneiden(ohneZeilenumbrueche, ANFANGSNOTIZ_MAX_ZEICHEN)
  if (gekuerzt.trim() === '') return null
  return gekuerzt
}
