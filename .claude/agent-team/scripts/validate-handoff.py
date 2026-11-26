#!/usr/bin/env python3
"""Schema-Gate: prueft die Rueckgabe der Agent-Team-Rollen.

Haengt an zwei Hook-Ereignissen (siehe ../hooks/hooks.json):

  PostToolUse (Task|Agent)  beim AUFRUF. Prueft, ob der Aufrufer den Modus
                            genannt hat (steht nur im Prompt, den es an
                            SubagentStop nicht mehr gibt). Bei synchronen
                            Agents zusaetzlich das Ergebnis.
  SubagentStop              wenn ein Agent FERTIG ist. Bei asynchron
                            gestarteten Agents die einzige Stelle, an der das
                            Ergebnis ueberhaupt sichtbar wird.

**Wie das Gate meldet.** Bei PostToolUse als `systemMessage` an den
Orchestrator. Bei SubagentStop mit Exit 2 — das haelt den Agent am Beenden und
gibt ihm die Meldung mit, er korrigiert seine Rueckgabe also selbst, bevor
sie beim Orchestrator ankommt. Damit geht keine Arbeit verloren: Exit 2 heisst
hier "noch nicht fertig", nicht "Ergebnis verwerfen". Pro Agent wird genau
**einmal** blockiert; beim zweiten Mal geht die Rueckgabe durch, damit ein
Agent, der die Vorgabe nicht erfuellen kann, nie in einer Schleife haengt.

**Warum ein Hook und nicht noch eine Regel im Prompt.** Drei Testlaeufe haben
gemessen, dass Form-Regeln in Prosa nicht durchgehend tragen. Ein Hook laeuft
unabhaengig davon, ob das Modell gerade daran denkt.

**Nur Eindeutiges wird gemeldet.** Jede Pruefung haengt an einem Punkt, den
`rules/HANDOFF_SCHEMA.md` ausdruecklich als Pflicht fuehrt. Ein Gate mit
Fehlalarmen wird ignoriert und ist dann schlechter als keins.

Abschalten: Umgebungsvariable AGENT_TEAM_GATE=off.
"""
import json
import os
import re
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from handoff_parse import handoffs, response_text  # noqa: E402

PLANER = {"product-owner", "architekt", "design-concept"}
DESIGNER = {"ux-ui-designer"}
LEADS = {"frontend-lead", "backend-lead"}
MIT_MODI = PLANER | DESIGNER
ALLE = PLANER | DESIGNER | LEADS

FRAGE_FELDER = ("frage", "optionen", "warum", "annahme")
PRUEFARTEN = ("test", "code", "manuell")
KONTEXT_MAX_SAETZE = 10

# Punkte, die kein Satzende sind — sonst zaehlt "z.B." als Satz.
_ABKUERZUNGEN = ("z.B.", "z. B.", "d.h.", "d. h.", "u.a.", "u. a.", "bzw.", "ca.",
                 "Nr.", "Abb.", "vgl.", "ggf.", "inkl.", "evtl.", "etc.", "max.", "min.")


def rolle_name(roh):
    """Installierte Plugin-Agents heissen `agent-team:product-owner`.

    Ohne diese Normalisierung schweigt das Gate fuer jeden installierten Agent:
    der Vergleich gegen `product-owner` schlaegt nie an."""
    return str(roh or "").strip().rsplit(":", 1)[-1]


def rolle(payload):
    ti = payload.get("tool_input") or {}
    return rolle_name(payload.get("agent_type")
                      or ti.get("subagent_type") or ti.get("agent_type"))


def ist_start_quittung(text):
    """Asynchron gestarteter Agent: PostToolUse sieht nur den Start, kein Ergebnis."""
    return '"async_launched"' in text or '"isAsync": true' in text


def saetze(text):
    t = text
    for a in _ABKUERZUNGEN:
        t = t.replace(a, a.replace(".", "").replace(" ", ""))
    teile = re.split(r"(?<=[.!?])\s+(?=[A-ZÄÖÜ\"„(*`])", t.strip())
    return [x for x in teile if x.strip()]


def pruefe_aufruf(rolle_, prompt):
    """Verstoesse, die nur am Aufruf sichtbar sind."""
    if rolle_ in MIT_MODI and "modus:" not in (prompt or "").lower():
        return [f"`{rolle_}` wurde ohne `Modus:` aufgerufen — die Rolle hat "
                "mehrere Modi und muss ihn sonst raten."]
    return []


def pruefe_ergebnis(rolle_, objs):
    """Verstoesse in der Rueckgabe. Leer = alles in Ordnung."""
    m = []

    # Leads MUESSEN ein Handoff-Objekt liefern; design-concept gibt bewusst
    # keins zurueck (schreibt eine Datei).
    if rolle_ in LEADS and not objs:
        m.append(f"`{rolle_}` hat kein Handoff-Objekt zurueckgegeben (nur "
                 "Fliesstext). Der Aufrufer liest `status` daraus.")

    for o in objs:
        tid = o.get("task_id", "?")

        # --- user_questions: Feld da, je Eintrag vier Felder, Kontext dabei
        if rolle_ in PLANER:
            uq = o.get("user_questions")
            if uq is None:
                m.append(f"{tid}: `user_questions` fehlt — bei nichts Offenem "
                         "gehoert dort `[]` hin.")
            elif isinstance(uq, list):
                for i, e in enumerate(uq, 1):
                    fehlt = [f for f in FRAGE_FELDER
                             if not (isinstance(e, dict) and e.get(f))]
                    if fehlt:
                        m.append(f"{tid}: `user_questions`[{i}] fehlt "
                                 + ", ".join(f"`{f}`" for f in fehlt))
                if uq:
                    ctx = o.get("frage_kontext")
                    if not isinstance(ctx, str) or not ctx.strip():
                        m.append(f"{tid}: `user_questions` ist gefuellt, aber "
                                 "`frage_kontext` fehlt — der Nutzer sieht die "
                                 "Frage sonst ohne Ausgangslage.")
                    elif len(saetze(ctx)) > KONTEXT_MAX_SAETZE:
                        m.append(f"{tid}: `frage_kontext` hat {len(saetze(ctx))} "
                                 f"Saetze, erlaubt sind {KONTEXT_MAX_SAETZE}.")

        # --- Akzeptanzkriterien: Form nur beim Autor pruefen
        krit = o.get("acceptance_criteria")
        if isinstance(krit, list):
            for i, k in enumerate(krit, 1):
                if not isinstance(k, dict):
                    continue  # reine Strings sind Altbestand, kein Befund
                if rolle_ == "product-owner":
                    if not k.get("kriterium"):
                        m.append(f"{tid}: `acceptance_criteria`[{i}] ohne `kriterium`.")
                    if k.get("pruefung") not in PRUEFARTEN:
                        m.append(f"{tid}: `acceptance_criteria`[{i}] hat "
                                 f"`pruefung`={k.get('pruefung')!r} — erlaubt "
                                 "sind test, code, manuell.")
                    if not k.get("ziel"):
                        m.append(f"{tid}: `acceptance_criteria`[{i}] ohne `ziel`.")
                if (rolle_ in LEADS and o.get("status") == "done"
                        and k.get("pruefung") == "test" and not k.get("ergebnis")):
                    m.append(f"{tid}: `acceptance_criteria`[{i}] ist `pruefung: "
                             "test`, aber `ergebnis` ist leer — die Abnahme "
                             "wertet das als nicht erfuellt.")

        # --- Pflichtfelder, die an einem Zustand haengen
        if o.get("status") == "blocked" and not o.get("blocked_reason"):
            m.append(f"{tid}: `status: blocked` ohne `blocked_reason`.")
        if o.get("accepted") is False and not o.get("review_findings"):
            m.append(f"{tid}: `accepted: false` ohne `review_findings`.")
        if o.get("frontend_start") == "against_contract" and not o.get("backend_contract"):
            m.append(f"{tid}: `against_contract` ohne `backend_contract`.")

        # --- Schleifenzaehler: wer zurueckgibt, muss zaehlen. Ein `blocked`
        #     ohne target_role ist Warten auf ein Paket, kein Roundtrip.
        zaehlt = ((rolle_ in LEADS and o.get("status") == "blocked"
                   and o.get("target_role"))
                  or (rolle_ == "product-owner" and o.get("accepted") is False)
                  or rolle_ in DESIGNER)
        if zaehlt and not isinstance(o.get("roundtrips"), dict):
            m.append(f"{tid}: `roundtrips` fehlt, obwohl `{rolle_}` hier "
                     "zurueckgibt — die Obergrenze greift sonst nie.")
    return m


def melde_an_orchestrator(rolle_, verstoesse):
    text = ("Schema-Gate `agent-team` — `" + rolle_ + "`:\n"
            + "\n".join("- " + v for v in verstoesse)
            + "\n\nGib das Paket **einmal** an die Rolle zurueck und nenne die "
              "fehlenden Angaben. Ergaenze sie nicht selbst: Wer die `optionen` "
              "oder den Kontext erfindet, trifft die Vorentscheidung, die der "
              "Agent abgeben sollte.")
    # Doppelt ausgegeben: die Hook-Referenz fuehrt `systemMessage` sowohl als
    # Top-Level-Feld als auch unter hookSpecificOutput auf. Unbekannte Felder
    # werden ignoriert, also landet genau eine Variante.
    print(json.dumps({"systemMessage": text,
                      "hookSpecificOutput": {"hookEventName": "PostToolUse",
                                             "systemMessage": text}},
                     ensure_ascii=False))


def blockiere_agent(payload, rolle_, verstoesse):
    """Exit 2 auf SubagentStop: der Agent macht weiter und korrigiert sich.

    Genau einmal pro agent_id. Der Marker liegt im Temp-Verzeichnis, damit
    kein Zustand im Projekt entsteht."""
    agent_id = re.sub(r"[^A-Za-z0-9_-]", "_", str(payload.get("agent_id") or ""))
    if not agent_id:
        return False  # ohne Kennung laesst sich "einmal" nicht garantieren
    marker = Path(tempfile.gettempdir()) / f"agent-team-gate-{agent_id}"
    if marker.exists():
        return False
    marker.write_text("1")
    sys.stderr.write(
        "Schema-Gate `agent-team` — deine Rueckgabe ist unvollstaendig:\n"
        + "\n".join("- " + v for v in verstoesse)
        + "\n\nKorrigiere das und gib dein Ergebnis erneut aus. Das Handoff-Objekt "
          "gehoert als JSON-Codeblock in deine Antwort, nicht nur als Beschreibung.\n")
    return True


def main():
    if os.environ.get("AGENT_TEAM_GATE", "").lower() == "off":
        return 0
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0
    r = rolle(payload)
    if r not in ALLE:
        return 0  # fremde Subagents folgen dem Schema nicht
    ereignis = payload.get("hook_event_name")

    if ereignis == "SubagentStop":
        objs = handoffs(str(payload.get("last_assistant_message") or ""))
        v = pruefe_ergebnis(r, objs)
        return 2 if v and blockiere_agent(payload, r, v) else 0

    if ereignis == "PostToolUse":
        ti = payload.get("tool_input") or {}
        text = response_text(payload.get("tool_response"))
        v = pruefe_aufruf(r, str(ti.get("prompt", "")))
        if not ist_start_quittung(text):       # synchron: Ergebnis liegt schon vor
            v += pruefe_ergebnis(r, handoffs(text))
        if v:
            melde_an_orchestrator(r, v)
    return 0


if __name__ == "__main__":
    try:
        code = main()
    except Exception:
        code = 0  # ein Gate darf eine Session nie stoeren
    sys.exit(code)
