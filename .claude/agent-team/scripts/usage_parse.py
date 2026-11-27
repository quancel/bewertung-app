"""Verbrauch eines Subagent-Aufrufs aus seinem Transkript (JSONL).

Genutzt von log-agent-run.py. Keine Abhaengigkeiten, wirft nie: bei jedem
Problem kommt None zurueck, der Aufrufer protokolliert dann ohne Zahlen.

Format (am echten Transkript einer Sitzung geprueft): Eine Zeile je Inhalts-
block; `type: assistant` traegt `message.id`, `message.model` und
`message.usage`. **Dieselbe message.id steht in mehreren Zeilen** (je
Inhaltsblock eine) — summiert man naiv, zaehlt man doppelt oder dreifach.
Je id zaehlt deshalb nur die letzte Zeile. Werkzeugaufrufe sind
`tool_use`-Bloecke in `message.content`.
"""
import json
import os
from datetime import datetime
from pathlib import Path


def transkript_pfad(payload):
    """Pfad zum Transkript des Subagents. Reihenfolge: ausdrueckliches Feld der
    Payload, sonst die Ablage neben dem Sitzungs-Transkript
    (<sitzung>/subagents/agent-<id>.jsonl). Das Feld ist nicht gegen eine
    echte SubagentStop-Payload verifiziert; `quelle` im Ergebnis zeigt, was
    gegriffen hat."""
    for key in ("agent_transcript_path", "subagent_transcript_path"):
        p = payload.get(key)
        if p and os.path.isfile(p):
            return Path(p), key
    tp, aid, sid = payload.get("transcript_path"), payload.get("agent_id"), payload.get("session_id")
    if tp and aid:
        base = Path(tp).parent / (sid or Path(tp).stem) / "subagents"
        for name in (f"agent-{aid}.jsonl", f"{aid}.jsonl"):
            if (base / name).is_file():
                return base / name, "abgeleitet"
    return None, None


def _zeit(s):
    try:
        return datetime.fromisoformat(str(s).replace("Z", "+00:00"))
    except Exception:
        return None


def auswerten(path):
    try:
        letzte, tools, zeiten = {}, 0, []
        with open(path, encoding="utf-8") as fh:
            for zeile in fh:
                try:
                    r = json.loads(zeile)
                except ValueError:
                    continue
                t = _zeit(r.get("timestamp"))
                if t:
                    zeiten.append(t)
                m = r.get("message")
                if r.get("type") != "assistant" or not isinstance(m, dict):
                    continue
                if m.get("id") and isinstance(m.get("usage"), dict):
                    letzte[m["id"]] = (m["usage"], m.get("model"))
                for b in m.get("content") or []:
                    if isinstance(b, dict) and b.get("type") == "tool_use":
                        tools += 1
        if not letzte:
            return None
        summe = {"input_tokens": 0, "cache_creation_input_tokens": 0,
                 "cache_read_input_tokens": 0, "output_tokens": 0}
        for u, _ in letzte.values():
            for k in summe:
                summe[k] += int(u.get(k) or 0)
        modelle = sorted({m for _, m in letzte.values() if m})
        return {
            "tokens_in": summe["input_tokens"],
            "tokens_cache_schreiben": summe["cache_creation_input_tokens"],
            "tokens_cache_lesen": summe["cache_read_input_tokens"],
            "tokens_out": summe["output_tokens"],
            "tool_uses": tools,
            "nachrichten": len(letzte),
            "dauer_ms": int((max(zeiten) - min(zeiten)).total_seconds() * 1000) if len(zeiten) > 1 else None,
            "modell": ", ".join(modelle) or None,
        }
    except Exception:
        return None


def aus_antwort(resp):
    """Synchrone Aufrufe: Das Agent-Tool meldet Summen teils in der Antwort
    (totalTokens/totalDurationMs/totalToolUseCount). Nicht verifiziert; fehlen
    die Felder, kommt None."""
    if not isinstance(resp, dict):
        return None
    out = {"tokens_gesamt": resp.get("totalTokens"), "dauer_ms": resp.get("totalDurationMs"),
           "tool_uses": resp.get("totalToolUseCount")}
    return out if any(v is not None for v in out.values()) else None
