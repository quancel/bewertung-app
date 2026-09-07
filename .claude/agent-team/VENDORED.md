# Vendored: agent-team

**Generiert — nicht von Hand bearbeiten.** Aenderungen gehoeren ins
Marketplace-Repo; danach hier `./.claude/scripts/sync-agent-team.sh` laufen
lassen. Dieses Verzeichnis und `.claude/agents/` werden dabei komplett
ersetzt.

- **Quelle**: https://github.com/quancel/agent-team-marketplace
- **Ref**: claude/ki-project-init-cv29p0
- **Commit**: b641f92dc04c8dbf35358fa19ea83d1b2000c3c9
- **Synchronisiert am**: 2026-09-07

## Was beim Kopieren geaendert wurde

In `.claude/agents/*.md` wurde `${CLAUDE_PLUGIN_ROOT}/` durch
`.claude/agent-team/` ersetzt (33 Verweise). Grund: Die
Platzhalter-Ersetzung greift nur bei Plugin-Agents, nicht bei Projekt-Agents
unter `.claude/agents/`. Ohne das Umschreiben laeden die Agents ihre Regel-
und Vorlagendateien nicht und arbeiten stillschweigend ohne Regelwerk weiter.

Sonst ist nichts veraendert: `rules/` und `context-templates/` sind
unveraenderte Kopien, `commands/orchestrate.md` ebenfalls (es enthaelt
keine plugin-internen Pfade).
