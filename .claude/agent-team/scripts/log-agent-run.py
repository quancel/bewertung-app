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
    short = re.sub(r"[^A-Za-z0-9_-]", "", str(session_id))[-12:] or "unbekannt"
    d = base / f"{datetime.now(timezone.utc):%Y-%m-%d}_{short}"
    d.mkdir(parents=True, exist_ok=True)
    return d


def next_index(d):
    used = [int(m.group(1)) for p in d.glob("[0-9][0-9][0-9]-*.json")
            if (m := re.match(r"(\d{3})-", p.name))]
    return max(used, default=0) + 1


def append_index(d, line):
    idx = d / "index.md"
    if not idx.exists():
        idx.write_text(
            f"# Durchlauf-Protokoll {d.name}\n\n"
            "Automatisch erzeugt vom `agent-team`-Hook `log-agent-run.py`.\n"
            "Je Zeile ein Ereignis; die vollstaendigen Ein-/Ausgaben liegen in\n"
            "den JSON-Dateien daneben.\n\n"
            "| Zeit (UTC) | Nr. | Rolle | task_id | status | offene Fragen | "
            "Schleifen (d/b/r) | Datei |\n"
            "|---|---|---|---|---|---|---|---|\n",
            encoding="utf-8",
        )
    with idx.open("a", encoding="utf-8") as fh:
        fh.write(line + "\n")


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
    n = next_index(d)
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
    safe_role = re.sub(r"[^A-Za-z0-9_-]", "_", str(role))[:40]
    (d / f"{n:03d}-{safe_role}.json").write_text(
        json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8")

    task_ids = ", ".join(str(o.get("task_id", "")) for o in objs) or "—"
    status = ", ".join(str(o.get("status", "")) for o in objs if o.get("status")) or "—"
    if ist_start_quittung(text):
        status = "gestartet (Ergebnis folgt)"
    fragen = sum(len(o.get("user_questions") or []) for o in objs)
    append_index(d, f"| {now()} | {n:03d} | `{role}` | {task_ids} | {status} | "
                    f"{fragen or '—'} | {loops(objs)} | `{n:03d}-{safe_role}.json` |")


def on_stop(base, payload):
    """Ein Subagent ist fertig: sein finaler Text ist das eigentliche Ergebnis.

    Bei asynchron gestarteten Agents sieht PostToolUse nur die Start-Quittung;
    ohne diesen Zweig enthielte das Protokoll zwar jede Eingabe, aber keine
    einzige Ausgabe im strukturierten Teil."""
    role = payload.get("agent_type") or "unbekannt"
    d = run_dir(base, payload.get("session_id"))
    n = next_index(d)
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
    }
    safe_role = re.sub(r"[^A-Za-z0-9_-]", "_", str(role))[:40]
    name = f"{n:03d}-{safe_role}-ergebnis.json"
    (d / name).write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8")
    task_ids = ", ".join(str(o.get("task_id", "")) for o in objs) or "—"
    status = ", ".join(str(o.get("status", "")) for o in objs if o.get("status")) or "—"
    fragen = sum(len(o.get("user_questions") or []) for o in objs)
    append_index(d, f"| {now()} | {n:03d} | `{role}` (Ergebnis) | {task_ids} | {status} | "
                    f"{fragen or '—'} | {loops(objs)} | `{name}` |")


def on_prompt(base, payload):
    d = run_dir(base, payload.get("session_id"))
    prompt = str(payload.get("prompt", ""))
    with (d / "prompts.md").open("a", encoding="utf-8") as fh:
        fh.write(f"\n## {now()}\n\n```\n{clip(prompt)}\n```\n")
    first = prompt.strip().splitlines()[0] if prompt.strip() else ""
    append_index(d, f"| {now()} | — | _Nutzer-Eingabe_ | — | — | — | "
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
