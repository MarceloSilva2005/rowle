#!/usr/bin/env bash
# Roda os fluxos Maestro do app no emulador, contra o Supabase local.
# Antes: `npm run db:start`, emulador aberto e o APK instalado (release, com o JS embutido).
# Uso: bash apps/mobile/maestro/run.sh [pasta-de-saida]
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="${1:-$DIR/../../../build/maestro}"
# O Maestro 2.11 no Windows não lista emuladores quando há outro aparelho não autorizado
# no adb; por isso conecta direto na porta do adbd do emulador (console + 1).
DEVICE="${ANDROID_SERIAL:-emulator-5554}"
ADB_PORT=$(( ${DEVICE#emulator-} + 1 ))
PROJECT="$(sed -n 's/^project_id *= *"\(.*\)"/\1/p' "$DIR/../../../supabase/config.toml")"
mkdir -p "$OUT"
export MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true

echo "== dados de teste"
docker exec -i "supabase_db_$PROJECT" psql -U postgres -v ON_ERROR_STOP=1 -q < "$DIR/fixtures.sql"

# Dia do mês de amanhã em Brasília, para escolher o dia na Agenda.
AMANHA="$(TZ=America/Sao_Paulo date -d tomorrow +%-d)"
run() { maestro --host localhost --port "$ADB_PORT" test -e AMANHA="$AMANHA" --test-output-dir "$OUT" "$@"; }

echo "== fluxos"
run --exclude-tags servidor-fora "$DIR/fluxos"

echo "== servidor fora do ar"
trap 'docker unpause "supabase_kong_$PROJECT" > /dev/null 2>&1 || true' EXIT
docker pause "supabase_kong_$PROJECT" > /dev/null
run "$DIR/fluxos/07-servidor-fora.yaml"
docker unpause "supabase_kong_$PROJECT" > /dev/null
run "$DIR/fluxos/08-servidor-volta.yaml"
echo "== tudo certo"
