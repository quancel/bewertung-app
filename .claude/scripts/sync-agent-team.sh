#!/usr/bin/env bash
# Holt das agent-team-Plugin aus dem Marketplace-Repo und legt es als
# Projekt-Agents/-Commands unter .claude/ ab ("vendoring").
#
# Warum nicht einfach kopieren: In Projekt-Agents ersetzt Claude Code
# ${CLAUDE_PLUGIN_ROOT} NICHT. Ein roher Kopiervorgang liefert Agents, deren
# Verweise auf rules/ und context-templates/ ins Leere zeigen — sie laufen
# dann ohne ihr Regelwerk weiter, ohne dass es auffaellt. Dieses Skript
# schreibt die Praefixe deshalb auf .claude/agent-team/ um.
#
#   ./.claude/scripts/sync-agent-team.sh                      # von GitHub
#   ./.claude/scripts/sync-agent-team.sh --from ../marketplace # lokaler Klon
#   ./.claude/scripts/sync-agent-team.sh --ref mein-branch
set -euo pipefail

REPO_URL="https://github.com/quancel/agent-team-marketplace"
REF=""
FROM=""

while [ $# -gt 0 ]; do
  case "$1" in
    --from) FROM="${2:?--from braucht einen Pfad}"; shift 2 ;;
    --ref)  REF="${2:?--ref braucht einen Branch/Tag}"; shift 2 ;;
    -h|--help) sed -n '2,14p' "$0"; exit 0 ;;
    *) echo "Unbekannte Option: $1" >&2; exit 2 ;;
  esac
done

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

TMP=""
cleanup() { if [ -n "$TMP" ]; then rm -rf "$TMP"; fi; }
trap cleanup EXIT

if [ -n "$FROM" ]; then
  SRC="$(cd "$FROM" && pwd)"
else
  TMP="$(mktemp -d)"
  echo "Klone $REPO_URL${REF:+ (ref: $REF)} ..."
  git clone --quiet --depth 1 ${REF:+--branch "$REF"} "$REPO_URL" "$TMP/mp"
  SRC="$TMP/mp"
fi

PLUGIN="$SRC/agent-team"
[ -d "$PLUGIN/agents" ] || { echo "Kein agent-team/agents in $SRC" >&2; exit 1; }

SRC_COMMIT="$(git -C "$SRC" rev-parse HEAD 2>/dev/null || echo unbekannt)"
SRC_REF="$(git -C "$SRC" rev-parse --abbrev-ref HEAD 2>/dev/null || echo unbekannt)"

# Generierte Verzeichnisse vollstaendig ersetzen, damit geloeschte
# Upstream-Dateien nicht als Leichen zurueckbleiben.
rm -rf .claude/agent-team .claude/agents
mkdir -p .claude/agent-team .claude/agents .claude/commands

cp -R "$PLUGIN/rules" .claude/agent-team/rules
cp -R "$PLUGIN/context-templates" .claude/agent-team/context-templates
cp "$PLUGIN/agents/"*.md .claude/agents/
cp "$PLUGIN/commands/orchestrate.md" .claude/commands/orchestrate.md

# Der eine Eingriff: Plugin-Pfade -> Repo-Pfade.
REWRITTEN=0
for f in .claude/agents/*.md; do
  before="$(grep -c 'CLAUDE_PLUGIN_ROOT' "$f" || true)"
  perl -pi -e 's/\$\{CLAUDE_PLUGIN_ROOT\}\//.claude\/agent-team\//g' "$f"
  REWRITTEN=$((REWRITTEN + before))
done

if grep -rq 'CLAUDE_PLUGIN_ROOT' .claude/agents .claude/commands; then
  echo "FEHLER: nicht umgeschriebene CLAUDE_PLUGIN_ROOT-Verweise:" >&2
  grep -rn 'CLAUDE_PLUGIN_ROOT' .claude/agents .claude/commands >&2
  exit 1
fi

# Jeder umgeschriebene Pfad muss auch existieren — sonst laeuft ein Agent
# wieder ohne sein Regelwerk, nur diesmal unbemerkt auf anderem Weg.
MISSING=0
while read -r p; do
  [ -e "$p" ] || { echo "FEHLER: Verweis zeigt ins Leere: $p" >&2; MISSING=1; }
done < <(grep -rho '\.claude/agent-team/[A-Za-z0-9_./-]*\.md' .claude/agents | sort -u)
[ "$MISSING" -eq 0 ] || exit 1

cat > .claude/agent-team/VENDORED.md <<EOF
# Vendored: agent-team

**Generiert — nicht von Hand bearbeiten.** Aenderungen gehoeren ins
Marketplace-Repo; danach hier \`./.claude/scripts/sync-agent-team.sh\` laufen
lassen. Dieses Verzeichnis und \`.claude/agents/\` werden dabei komplett
ersetzt.

- **Quelle**: $REPO_URL
- **Ref**: $SRC_REF
- **Commit**: $SRC_COMMIT
- **Synchronisiert am**: $(date -u +%Y-%m-%d)

## Was beim Kopieren geaendert wurde

In \`.claude/agents/*.md\` wurde \`\${CLAUDE_PLUGIN_ROOT}/\` durch
\`.claude/agent-team/\` ersetzt ($REWRITTEN Verweise). Grund: Die
Platzhalter-Ersetzung greift nur bei Plugin-Agents, nicht bei Projekt-Agents
unter \`.claude/agents/\`. Ohne das Umschreiben laeden die Agents ihre Regel-
und Vorlagendateien nicht und arbeiten stillschweigend ohne Regelwerk weiter.

Sonst ist nichts veraendert: \`rules/\` und \`context-templates/\` sind
unveraenderte Kopien, \`commands/orchestrate.md\` ebenfalls (es enthaelt
keine plugin-internen Pfade).
EOF

echo "OK — agent-team aus $SRC_REF ($SRC_COMMIT) uebernommen, $REWRITTEN Pfade umgeschrieben."
