#!/usr/bin/env bash
# ============================================================
# Project Hub — aplica a migration de Conexões / Tynk / Ideias
#   (supabase/migrations/20260617000000_conexoes_tynk_ideias.sql)
#
# Adiciona em `projects` as colunas conexoes/tynk/ideias e cria a tabela `ideas`.
# É IDEMPOTENTE: pode rodar mais de uma vez sem quebrar nada.
#
# Três formas de usar (escolha UMA):
#
#   A) Supabase CLI  (recomendado, se o projeto já está linkado)
#        supabase db push
#
#   B) Este script + connection string do banco
#        export SUPABASE_DB_URL="postgresql://postgres:SENHA@db.XXXX.supabase.co:5432/postgres"
#        bash scripts/apply-migration.sh
#      (ou passando direto:  bash scripts/apply-migration.sh "postgresql://...")
#      Pegue a URL em: Supabase > Project Settings > Database > Connection string (URI)
#
#   C) Manual (sem ferramenta): abra o SQL Editor no painel do Supabase,
#      cole o conteúdo do arquivo .sql acima e clique em Run.
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SQL="$ROOT/supabase/migrations/20260617000000_conexoes_tynk_ideias.sql"
DB_URL="${1:-${SUPABASE_DB_URL:-}}"

if [ ! -f "$SQL" ]; then
  echo "✗ Migration não encontrada: $SQL"
  exit 1
fi

if [ -z "$DB_URL" ]; then
  cat <<'MSG'
✗ Falta a connection string do banco.

  Pegue em: Supabase > Project Settings > Database > Connection string (URI)
  e rode:

    bash scripts/apply-migration.sh "postgresql://postgres:SENHA@db.XXXX.supabase.co:5432/postgres"

  Ou, se você usa o Supabase CLI com o projeto linkado, basta:

    supabase db push
MSG
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "✗ psql não encontrado. Instale o PostgreSQL client, use 'supabase db push',"
  echo "  ou cole o SQL no SQL Editor do painel (opção C no cabeçalho deste script)."
  exit 1
fi

echo "→ Aplicando migration no Supabase…"
psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$SQL"
echo "✓ Migration aplicada com sucesso."
echo "  Colunas projects.conexoes/tynk/ideias + tabela ideas estão prontas."
