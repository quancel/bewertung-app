/**
 * Rauchtest gegen den Produktions-Build — die fünf Zusicherungen aus
 * `.claude/agent-team/rules/VERIFICATION.md`.
 *
 * Er ersetzt weder Unit-Tests noch die Abnahme. Er fängt die eine Klasse,
 * die beiden davor entgeht: „sieht im Code richtig aus, funktioniert aber
 * nicht". Zwei reale Fehler dieses Projekts sind genau so durch alle
 * Prüfungen gekommen —
 *
 *   - jedes Icon war ein farbiger Kasten, weil ein unquotiertes `url()`
 *     mit einer Data-URI voller Hochkommata ungültig ist und der Browser
 *     die Deklaration verwirft (→ Zusicherung 4);
 *   - das Feld „Adresse" war ohne Netz nicht anklickbar, weil die
 *     Hinweisfläche der Ortssuche vollflächig darüber lag
 *     (→ Zusicherung 5).
 *
 * Beide sind hier als Zusicherung abgebildet, nicht als Einzelfall-Test:
 * geprüft wird die Eigenschaft, nicht die Stelle.
 *
 * Aufruf: `npm run smoke` (baut vorher). Bildschirmfotos landen in
 * `.smoke/`, das Verzeichnis ist ignoriert.
 */
import { spawn } from 'node:child_process'
import { mkdir, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import process from 'node:process'

const PORT = 4173
const BASIS = `http://localhost:${PORT}`
const FOTOS = '.smoke'

/** Die Ansichten, die der Rauchtest öffnet. `vorbereiten` schafft den
 *  Zustand, den die Ansicht zum Zeigen braucht — ohne Ort gibt es keine
 *  Detailansicht und keinen Marker. */
const ANSICHTEN = [
  { name: 'ortsliste', pfad: '/orte' },
  { name: 'ortsdetail', pfad: '/orte', vorbereiten: legeOrtAnUndOeffneIhn },
  { name: 'kartenansicht', pfad: '/orte?ansicht=karte' },
  { name: 'datenbereich', pfad: '/daten' },
  { name: 'adresse-ohne-ziel', pfad: '/gibtesnicht' },
]

/** Playwright ist bewusst KEINE Projekt-Abhängigkeit — es zieht einen
 *  Browser nach sich, den CI und Entwicklungsumgebungen meist schon
 *  mitbringen. Gefunden wird es dort, wo es üblicherweise liegt; fehlt es,
 *  sagt der Rauchtest das und endet mit 0, statt einen Build rot zu
 *  färben, der nichts dafür kann. */
async function ladePlaywright() {
  const require = createRequire(import.meta.url)
  const kandidaten = [
    'playwright',
    '/opt/node22/lib/node_modules/playwright/index.mjs',
    '/usr/lib/node_modules/playwright/index.mjs',
  ]
  for (const kandidat of kandidaten) {
    try {
      return await import(kandidat.startsWith('/') ? kandidat : require.resolve(kandidat))
    } catch {
      /* nächster Kandidat */
    }
  }
  return null
}

/** `detached: true` legt eine eigene Prozessgruppe an. Ohne sie trifft
 *  `kill` nur `npx`, und der eigentliche `vite`-Prozess lebt weiter — der
 *  Rauchtest laeuft dann durch, endet aber nie. */
function starteVorschau() {
  return spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    stdio: 'ignore',
    detached: true,
  })
}

function beendeVorschau(server) {
  if (!server?.pid) return
  try {
    process.kill(-server.pid, 'SIGTERM')
  } catch {
    /* Gruppe schon beendet */
  }
}

async function warteAufServer() {
  for (let versuch = 0; versuch < 60; versuch += 1) {
    try {
      const antwort = await fetch(BASIS)
      if (antwort.ok) return true
    } catch {
      /* noch nicht da */
    }
    await new Promise((fertig) => setTimeout(fertig, 500))
  }
  return false
}

async function legeOrtAnUndOeffneIhn(seite) {
  await seite.getByRole('button', { name: /hinzuf|anlegen/i }).first().click()
  await seite.waitForTimeout(300)
  await seite.locator('input[type="text"]:visible').first().fill('Rauchtest-Ort')
  await seite.keyboard.press('Enter')
  await seite.waitForTimeout(700)
}

/** Zusicherung 4: Was über CSS geladen wird, ist aufgelöst. Ein `.icon`
 *  mit `mask-image: none` und gesetzter Hintergrundfarbe ist ein farbiger
 *  Kasten — im DOM vorhanden, im Test „sichtbar", für den Nutzer kaputt. */
function pruefeCssRessourcen() {
  const kaputt = []
  for (const el of document.querySelectorAll('.icon')) {
    const maske = getComputedStyle(el).maskImage
    if (maske === 'none' || maske === '') {
      kaputt.push(el.className + ' → mask-image: ' + (maske || '(leer)'))
    }
  }
  return kaputt
}

/** Zusicherung 5: Kein Bedienelement ist verdeckt. Geprüft wird der
 *  Mittelpunkt — was dort liegt, muss das Element selbst oder eines seiner
 *  Kinder sein. Ein Label o. Ä. darüber ist in Ordnung, ein deckendes
 *  Panel nicht. */
function pruefeVerdeckung() {
  const verdeckt = []
  const auswahl = 'button, input, select, textarea, a[href], [role="button"], [tabindex]:not([tabindex="-1"])'
  for (const el of document.querySelectorAll(auswahl)) {
    // Absichtlich versteckte Elemente sind kein Befund: der per Button
    // ausgelöste Datei-Eingang etwa liegt als 1x1-Fläche mit `clip` und
    // `aria-hidden` irgendwo im Baum. Er SOLL verdeckt sein.
    if (el.getAttribute('tabindex') === '-1') continue
    if (el.closest('[aria-hidden="true"]')) continue
    const kasten = el.getBoundingClientRect()
    if (kasten.width < 4 || kasten.height < 4) continue
    if (kasten.bottom < 0 || kasten.top > innerHeight) continue
    const stil = getComputedStyle(el)
    if (stil.visibility === 'hidden' || stil.opacity === '0') continue
    const x = kasten.x + kasten.width / 2
    const y = kasten.y + kasten.height / 2
    const oben = document.elementFromPoint(x, y)
    if (!oben) continue
    if (oben === el || el.contains(oben) || oben.contains(el)) continue
    verdeckt.push(
      (el.id || el.tagName.toLowerCase()) + ' verdeckt von ' + oben.tagName.toLowerCase() + '.' + oben.className,
    )
  }
  return verdeckt
}

async function main() {
  const playwright = await ladePlaywright()
  if (!playwright) {
    console.log('Playwright nicht gefunden — Rauchtest übersprungen.')
    console.log('Installation: npm i -D playwright && npx playwright install chromium')
    console.log('Die fünf Zusicherungen bleiben damit UNGEPRÜFT (VERIFICATION.md).')
    return
  }

  await rm(FOTOS, { recursive: true, force: true })
  await mkdir(FOTOS, { recursive: true })

  const server = starteVorschau()
  let browser
  const befunde = []

  try {
    if (!(await warteAufServer())) {
      throw new Error(`Vorschau-Server auf ${BASIS} nicht erreichbar — läuft "npm run build"?`)
    }

    browser = await playwright.chromium.launch()
    const seite = await browser.newPage({ viewport: { width: 1280, height: 900 } })

    // Zusicherung 2: keine unbehandelten Laufzeitfehler.
    seite.on('pageerror', (fehler) => befunde.push(`Laufzeitfehler: ${fehler.message}`))
    seite.on('console', (nachricht) => {
      if (nachricht.type() === 'error') befunde.push(`Konsole: ${nachricht.text().slice(0, 160)}`)
    })

    for (const ansicht of ANSICHTEN) {
      await seite.goto(BASIS + ansicht.pfad, { waitUntil: 'networkidle' })
      if (ansicht.vorbereiten) await ansicht.vorbereiten(seite)
      await seite.waitForTimeout(400)

      // Zusicherung 1 + 3: die Ansicht ist geöffnet und nicht leer.
      const textLaenge = await seite.evaluate(() => document.body.innerText.trim().length)
      if (textLaenge === 0) befunde.push(`${ansicht.name}: Ansicht ist leer`)

      for (const eintrag of await seite.evaluate(pruefeCssRessourcen)) {
        befunde.push(`${ansicht.name}: ${eintrag}`)
      }
      for (const eintrag of await seite.evaluate(pruefeVerdeckung)) {
        befunde.push(`${ansicht.name}: ${eintrag}`)
      }

      await seite.screenshot({ path: `${FOTOS}/${ansicht.name}.png` })
      console.log(`  ${ansicht.name} — geöffnet, Bildschirmfoto in ${FOTOS}/${ansicht.name}.png`)
    }

    // Zusicherung 5 im Ausnahmezustand: ohne Netz darf die Ortssuche das
    // Feld „Adresse" nicht verdecken. Genau dieser Fall ist einmal
    // durchgerutscht, deshalb steht er hier ausdrücklich.
    await seite.goto(BASIS + '/orte', { waitUntil: 'networkidle' })
    await legeOrtAnUndOeffneIhn(seite)
    await seite.context().setOffline(true)
    await seite.waitForTimeout(500)
    for (const eintrag of await seite.evaluate(pruefeVerdeckung)) {
      befunde.push(`ortsdetail ohne Netz: ${eintrag}`)
    }
    await seite.screenshot({ path: `${FOTOS}/ortsdetail-ohne-netz.png` })
    console.log(`  ortsdetail ohne Netz — geprüft, Bildschirmfoto in ${FOTOS}/ortsdetail-ohne-netz.png`)
    await seite.context().setOffline(false)
  } finally {
    await browser?.close()
    beendeVorschau(server)
  }

  if (befunde.length > 0) {
    console.error(`\nRauchtest fehlgeschlagen — ${befunde.length} Befund(e):`)
    for (const befund of befunde) console.error(`  - ${befund}`)
    process.exitCode = 1
    return
  }
  console.log('\nRauchtest erfolgreich: alle Ansichten geöffnet, keine Laufzeitfehler,')
  console.log('CSS-Ressourcen aufgelöst, kein Bedienelement verdeckt.')
}

await main()
