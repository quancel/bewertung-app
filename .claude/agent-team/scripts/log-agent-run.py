#!/usr/bin/env python3
"""Protokolliert jeden Agent-Team-Durchlauf im Ziel-Repo unter .claude/runs/.

Haengt als Hook an drei Ereignissen (siehe ../hooks/hooks.json):

  PostToolUse (Task|Agent)  ein Subagent wurde aufgerufen -> Eingabe wegschreiben;
                            bei synchronen Agents auch die Ausgabe
  SubagentStop              ein Subagent ist fertig -> sein finaler Text.
                            Bei asynchronen Agents die einzige Stelle, an der
                            das Ergebnis strukturiert ankommt
  UserPromptSubmit          der Ausloeser des Durchlaufs (z.B. /orchestrate)

Warum ein Hook und nicht "der Orchestrator schreibt eine Zusammenfassung":
Eine Zusammenfassung entsteht nur, wenn das Modell daran denkt — und der
Durchlauf, der schiefging, ist genau der, bei dem es das nicht tut. Der Hook
laeuft unabhaengig davon.

**Geschrieben wird immer ins Ziel-Repo, nie neben dieses Skript.** Im
Plugin-Betrieb liegt es im Plugin-Cache; wuerde es sich ueber __file__
verorten, landete das Protokoll dort statt im Projekt. Das Ziel-Repo kommt
deshalb aus CLAUDE_PROJECT_DIR, sonst aus dem cwd des Hook-Payloads.

Grundregel: Dieses Skript darf eine Session nie stoeren. Jeder Fehler wird
verschluckt, der Exit-Code ist immer 0.
"""
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from handoff_parse import handoffs, response_text  # noqa: E402
import usage_parse  # noqa: E402

MAX_CHARS = 200_000  # Kappung pro Feld, damit ein Ausreisser das Repo nicht sprengt


def runs_base(payload):
    root = os.environ.get("CLAUDE_PROJECT_DIR") or payload.get("cwd") or os.getcwd()
    return Path(root) / ".claude" / "runs"


def now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def clip(text):
    text = text if isinstance(text, str) else json.dumps(text, ensure_ascii=False)
    if len(text) > MAX_CHARS:
        return text[:MAX_CHARS] + f"\n[... {len(text) - MAX_CHARS} Zeichen gekappt]"
    return text


def run_dir(base, session_id):
    """Ein Verzeichnis je Sitzung. Das Datum stammt vom ersten Ereignis der
    Sitzung: Ein vorhandenes Verzeichnis derselben Sitzung wird weiterbenutzt,
    auch ueber Mitternacht UTC hinaus (sonst zerfiele eine Sitzung in mehrere
    Verzeichnisse mit neu beginnender Nummerierung)."""
    short = re.sub(r"[^A-Za-z0-9_-]", "", str(session_id))[-12:] or "unbekannt"
    base.mkdir(parents=True, exist_ok=True)
    vorhanden = sorted(p for p in base.glob(f"*_{short}") if p.is_dir())
    if vorhanden:
        return vorhanden[0]
    d = base / f"{datetime.now(timezone.utc):%Y-%m-%d}_{short}"
    d.mkdir(exist_ok=True)
    return d


def claim_file(d, role, suffix=""):
    """Vergibt die naechste Nummer atomar: Die Datei wird exklusiv angelegt
    (O_EXCL). Zwei gleichzeitige Hook-Laeufe (parallele Subagents) bekommen so
    nie dieselbe Nummer; wer verliert, versucht die naechste."""
    safe_role = re.sub(r"[^A-Za-z0-9_-]", "_", str(role))[:40]
    used = [int(m.group(1)) for p in d.glob("[0-9][0-9][0-9]-*.json")
            if (m := re.match(r"(\d{3})-", p.name))]
    n = max(used, default=0) + 1
    for _ in range(1000):
        path = d / f"{n:03d}-{safe_role}{suffix}.json"
        try:
            fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o644)
        except FileExistsError:
            n += 1
            continue
        os.close(fd)
        return n, path
    raise RuntimeError("keine freie Nummer gefunden")


def append_index(d, line):
    idx = d / "index.md"
    try:  # exklusiv anlegen: bei parallelen Hooks schreibt nur einer den Kopf
        fh = idx.open("x", encoding="utf-8")
    except FileExistsError:
        fh = None
    if fh:
        with fh:
            fh.write(
                f"# Durchlauf-Protokoll {d.name}\n\n"
                "Automatisch erzeugt vom `agent-team`-Hook `log-agent-run.py`.\n"
                "Je Zeile ein Ereignis; die vollstaendigen Ein-/Ausgaben liegen in\n"
                "den JSON-Dateien daneben.\n\n"
                "| Zeit (UTC) | Nr. | Rolle | task_id | status | offene Fragen | "
                "Schleifen (d/b/r) | Tokens ein/aus | Tools | Dauer | Datei |\n"
                "|---|---|---|---|---|---|---|---|---|---|---|\n")
    with idx.open("a", encoding="utf-8") as fh:
        fh.write(line + "\n")


def nutzung_spalten(n):
    """Index-Spalten 'Tokens ein/aus | Tools | Dauer' (leer: —).
    Eingabeseite = Eingabe + Cache schreiben + Cache lesen."""
    if not n:
        return "— | — | —"
    if n.get("tokens_out") is None:
        tok = f"{n['tokens_gesamt']:,}".replace(",", ".") if n.get("tokens_gesamt") is not None else "—"
    else:
        ein = n["tokens_in"] + n["tokens_cache_schreiben"] + n["tokens_cache_lesen"]
        tok = f"{ein:,} / {n['tokens_out']:,}".replace(",", ".")
    d = n.get("dauer_ms")
    dauer = f"{d // 1000}s" if isinstance(d, int) else "—"
    tools = n.get("tool_uses") if n.get("tool_uses") is not None else "—"
    return f"{tok} | {tools} | {dauer}"


def loops(objs):
    """Schleifenzaehler je Paket als d/b/r, damit Ueberschreitungen der
    Obergrenzen im Protokoll sichtbar sind statt nur im Handoff."""
    out = []
    for o in objs:
        r = o.get("roundtrips")
        if isinstance(r, dict):
            out.append("/".join(str(r.get(k, 0)) for k in ("design", "blocked", "review")))
    return ", ".join(out) or "—"


def ist_start_quittung(text):
    """Ein asynchron gestarteter Agent meldet an PostToolUse nur den Start.
    Das echte Ergebnis kommt spaeter ueber SubagentStop (siehe on_stop)."""
    return '"async_launched"' in text or '"isAsync": true' in text


def on_tool(base, payload):
    ti = payload.get("tool_input") or {}
    role = ti.get("subagent_type") or ti.get("agent_type") or payload.get("tool_name") or "unbekannt"
    d = run_dir(base, payload.get("session_id"))
    n, path = claim_file(d, role)
    text = response_text(payload.get("tool_response"))
    objs = handoffs(text)

    record = {
        "zeit": now(),
        "session_id": payload.get("session_id"),
        "ereignis": payload.get("hook_event_name"),
        "tool": payload.get("tool_name"),
        "rolle": role,
        "beschreibung": ti.get("description"),
        "modell": ti.get("model"),
        "eingabe_prompt": clip(ti.get("prompt", "")),
        "ausgabe": clip(text),
        "handoffs": objs,
    }
    antworten = [a for o in handoffs(str(ti.get("prompt", ""))) for a in (o.get("user_answers") or [])]
    if antworten:
        record["antworten"] = antworten  # welche Nutzer-Antwort ging an diesen Aufruf (Frage-ID -> Antwort)
    nutzung = usage_parse.aus_antwort(payload.get("tool_response"))
    if nutzung and not ist_start_quittung(text):
        record["nutzung"] = nutzung
    path.write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8")

    task_ids = ", ".join(str(o.get("task_id", "")) for o in objs) or "—"
    status = ", ".join(str(o.get("status", "")) for o in objs if o.get("status")) or "—"
    if ist_start_quittung(text):
        status = "gestartet (Ergebnis folgt)"
    fragen = sum(len(o.get("user_questions") or []) for o in objs)
    append_index(d, f"| {now()} | {n:03d} | `{role}` | {task_ids} | {status} | "
                    f"{fragen or '—'} | {loops(objs)} | "
                    f"{nutzung_spalten(record.get('nutzung'))} | `{path.name}` |")


def on_stop(base, payload):
    """Ein Subagent ist fertig: sein finaler Text ist das eigentliche Ergebnis.

    Bei asynchron gestarteten Agents sieht PostToolUse nur die Start-Quittung;
    ohne diesen Zweig enthielte das Protokoll zwar jede Eingabe, aber keine
    einzige Ausgabe im strukturierten Teil."""
    role = payload.get("agent_type") or "unbekannt"
    d = run_dir(base, payload.get("session_id"))
    n, path = claim_file(d, role, "-ergebnis")
    text = str(payload.get("last_assistant_message") or "")
    objs = handoffs(text)
    record = {
        "zeit": now(),
        "session_id": payload.get("session_id"),
        "ereignis": "SubagentStop",
        "rolle": role,
        "agent_id": payload.get("agent_id"),
        "ausgabe": clip(text),
        "handoffs": objs,
        # Diagnose: welche Felder lieferte der Harness? Macht den ersten Echtlauf
        # auswertbar, falls die Transkript-Suche nichts findet.
        "payload_felder": sorted(payload.keys()),
    }
    tpfad, quelle = usage_parse.transkript_pfad(payload)
    if tpfad:
        n_ = usage_parse.auswerten(tpfad)
        if n_:
            n_["quelle"] = quelle
            record["nutzung"] = n_
    name = path.name
    path.write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8")
    task_ids = ", ".join(str(o.get("task_id", "")) for o in objs) or "—"
    status = ", ".join(str(o.get("status", "")) for o in objs if o.get("status")) or "—"
    fragen = sum(len(o.get("user_questions") or []) for o in objs)
    append_index(d, f"| {now()} | {n:03d} | `{role}` (Ergebnis) | {task_ids} | {status} | "
                    f"{fragen or '—'} | {loops(objs)} | "
                    f"{nutzung_spalten(record.get('nutzung'))} | `{name}` |")


SYSTEM_MARKER = {
    "<agent-message": "Subagent-Bericht",
    "<task-notification": "System (Task-Meldung)",
    "<system-reminder": "System",
    "<system-notice": "System",
}
SYSTEM_KURZ = 500  # Systemmeldungen: nur der Kopf; der volle Bericht liegt im Ergebnis-Eintrag


def herkunft(prompt):
    """Vom Harness eingespeiste Meldung statt Nutzer-Eingabe? Entscheidend ist
    der Anfang: echte Eingaben beginnen nicht mit solchen Tags."""
    kopf = prompt.lstrip()[:40]
    for marker, name in SYSTEM_MARKER.items():
        if kopf.startswith(marker):
            return name
    return None


def on_prompt(base, payload):
    """UserPromptSubmit feuert auch fuer Berichte von Subagents und
    Systemmeldungen. Nur echte Nutzer-Eingaben gehoeren in prompts.md; alles
    andere wird mit Herkunft im Index ausgewiesen und nur im Kopf in
    meldungen.md festgehalten, weil der volle Bericht ohnehin als Ergebnis
    des Aufrufs protokolliert wird."""
    d = run_dir(base, payload.get("session_id"))
    prompt = str(payload.get("prompt", ""))
    first = prompt.strip().splitlines()[0] if prompt.strip() else ""
    quelle = herkunft(prompt)
    if quelle:
        with (d / "meldungen.md").open("a", encoding="utf-8") as fh:
            fh.write(f"\n## {now()} — {quelle}\n\n```\n{prompt[:SYSTEM_KURZ]}\n```\n")
        append_index(d, f"| {now()} | — | _{quelle}_ | — | — | — | — | — | — | — | "
                        f"`meldungen.md` ({first[:60].replace('|', '/')}) |")
        return
    with (d / "prompts.md").open("a", encoding="utf-8") as fh:
        fh.write(f"\n## {now()}\n\n```\n{clip(prompt)}\n```\n")
    append_index(d, f"| {now()} | — | _Nutzer-Eingabe_ | — | — | — | — | — | — | — | "
                    f"`prompts.md` ({first[:60].replace('|', '/')}) |")


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return
    base = runs_base(payload)
    try:
        ereignis = payload.get("hook_event_name")
        if ereignis == "UserPromptSubmit":
            on_prompt(base, payload)
        elif ereignis == "SubagentStop":
            on_stop(base, payload)
        else:
            on_tool(base, payload)
    except Exception as exc:  # nie die Session blockieren
        try:
            base.mkdir(parents=True, exist_ok=True)
            with (base / "hook-errors.log").open("a", encoding="utf-8") as fh:
                fh.write(f"{now()} {type(exc).__name__}: {exc}\n")
        except Exception:
            pass


if __name__ == "__main__":
    main()
    sys.exit(0)
