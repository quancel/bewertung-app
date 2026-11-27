"""Gemeinsames Lesen von Subagent-Antworten.

Zwei Hooks brauchen dasselbe: das Durchlauf-Protokoll (log-agent-run.py) und
das Schema-Gate (validate-handoff.py). Der Parser steht deshalb genau einmal
hier — dieselbe Regel, die im Plugin fuer das Regelwerk gilt: ein Belang, eine
Stelle, sonst driften die Kopien auseinander.
"""

import json
import re


def response_text(resp):
    """Aus der Tool-Antwort den Text des Subagenten ziehen (Form variiert)."""
    if isinstance(resp, str):
        return resp
    if isinstance(resp, dict):
        for key in ("content", "output", "result", "text"):
            if key in resp:
                return response_text(resp[key])
        return json.dumps(resp, ensure_ascii=False, indent=2)
    if isinstance(resp, list):
        parts = []
        for item in resp:
            if isinstance(item, dict) and "text" in item:
                parts.append(str(item["text"]))
            else:
                parts.append(response_text(item))
        return "\n".join(parts)
    return "" if resp is None else str(resp)


def handoffs(text):
    """Handoff-Objekte aus dem Text fischen.

    Gesucht wird nach Objekten mit task_id; erst in ```json-Bloecken, sonst in
    allen balancierten {...}-Kandidaten. Findet nichts: auch eine Aussage —
    fuer die Leads ist genau das ein Befund, siehe validate-handoff.py.
    """
    found = []
    blocks = re.findall(r"```(?:json)?\s*(.*?)```", text, re.S)
    for raw in blocks + ([text] if not blocks else []):
        for start in (m.start() for m in re.finditer(r"\{", raw)):
            depth, in_str, esc = 0, False, False
            for i, ch in enumerate(raw[start:start + 100_000]):
                if in_str:
                    if esc:
                        esc = False
                    elif ch == "\\":
                        esc = True
                    elif ch == '"':
                        in_str = False
                    continue
                if ch == '"':
                    in_str = True
                elif ch == "{":
                    depth += 1
                elif ch == "}":
                    depth -= 1
                    if depth == 0:
                        try:
                            obj = json.loads(raw[start:start + i + 1])
                        except ValueError:
                            pass
                        else:
                            if isinstance(obj, dict) and "task_id" in obj:
                                found.append(obj)
                        break
    seen, unique = set(), []
    for obj in found:
        key = json.dumps(obj, sort_keys=True)
        if key not in seen:
            seen.add(key)
            unique.append(obj)
    return unique
