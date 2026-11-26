# Vendored: agent-team

**Generiert — nicht von Hand bearbeiten.** Aenderungen gehoeren ins
Marketplace-Repo; danach hier `./.claude/scripts/sync-agent-team.sh` laufen
lassen. Dieses Verzeichnis und `.claude/agents/` werden dabei komplett
ersetzt.

- **Quelle**: https://github.com/quancel/agent-team-marketplace
- **Ref**: main
- **Commit**: 6bc954917eb65d9b9d9b185befea29681b5258ef
- **Synchronisiert am**: 2026-11-26

## Was beim Kopieren geaendert wurde

In `.claude/agents/*.md` wurde `${CLAUDE_PLUGIN_ROOT}/` durch
`.claude/agent-team/` ersetzt (39 Verweise). Grund: Die
Platzhalter-Ersetzung greift nur bei Plugin-Agents, nicht bei Projekt-Agents
unter `.claude/agents/`. Ohne das Umschreiben laeden die Agents ihre Regel-
und Vorlagendateien nicht und arbeiten stillschweigend ohne Regelwerk weiter.

Sonst ist nichts veraendert: `rules/`, `context-templates/` und
`scripts/` sind unveraenderte Kopien, die Dateien aus `commands/`
ebenfalls (sie enthalten laut Pfad-Konvention keine plugin-internen Pfade).

## Was hier NICHT herkommt

`.claude/context/` (das echte Projektgedaechtnis), `.claude/settings.json`
und `.claude/scripts/sync-agent-team.sh` gehoeren dem Ziel-Repo und werden
vom Sync nicht angefasst. Die Liste der zuletzt erzeugten Befehle steht in
`GENERATED-COMMANDS` — daran erkennt der naechste Lauf, welche Dateien in
`.claude/commands/` ihm gehoeren.
