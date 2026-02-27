#!/bin/bash
# ============================================================
# IAM Admin — Consultar Logs no Cloudflare D1
# Requer: curl (já instalado na maioria dos sistemas)
# Execute: chmod +x scripts/query-logs.sh && ./scripts/query-logs.sh
# ============================================================

WORKER_URL="https://iam-admin-logs.sofmarc-silva.workers.dev"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║    IAM Admin — Logs Cloudflare D1        ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Menu de opções
echo "Escolha o tipo de consulta:"
echo ""
echo "  1) Últimos 20 logs (todos os níveis)"
echo "  2) Apenas erros (warn/error/fatal)"
echo "  3) Logs de inicialização (categoria: init)"
echo "  4) Logs dos últimos 5 minutos"
echo "  5) Estatísticas gerais"
echo "  6) Limpar TODOS os logs"
echo ""
read -p "Opção [1-6]: " OPCAO

case $OPCAO in
  1)
    echo ""
    echo "📋 Últimos 20 logs:"
    echo "════════════════════════════════════════════"
    curl -s "$WORKER_URL/logs?limit=20" | python3 -c "
import json, sys
data = json.load(sys.stdin)
logs = data.get('logs', [])
if not logs:
    print('  Nenhum log encontrado.')
else:
    for log in logs:
        level = log.get('level','?').upper()
        cat = log.get('category','?')
        msg = log.get('message','')
        ts = log.get('created_at','')[:19]
        print(f'  [{ts}] [{level}][{cat}] {msg}')
print(f'\n  Total: {len(logs)} logs')
"
    ;;
  2)
    echo ""
    echo "🔴 Logs de erro (warn/error/fatal):"
    echo "════════════════════════════════════════════"
    curl -s "$WORKER_URL/logs?level=error&limit=30" | python3 -c "
import json, sys
data = json.load(sys.stdin)
logs = data.get('logs', [])
if not logs:
    print('  Nenhum erro encontrado. ✅')
else:
    for log in logs:
        level = log.get('level','?').upper()
        cat = log.get('category','?')
        msg = log.get('message','')
        ts = log.get('created_at','')[:19]
        meta = log.get('metadata','')
        print(f'  [{ts}] [{level}][{cat}] {msg}')
        if meta and meta != '{}' and meta != 'null':
            try:
                m = json.loads(meta) if isinstance(meta, str) else meta
                print(f'    → {json.dumps(m, ensure_ascii=False)[:200]}')
            except:
                print(f'    → {str(meta)[:200]}')
print(f'\n  Total: {len(logs)} erros')
"
    ;;
  3)
    echo ""
    echo "🚀 Logs de inicialização (categoria: init):"
    echo "════════════════════════════════════════════"
    curl -s "$WORKER_URL/logs?category=init&limit=50" | python3 -c "
import json, sys
data = json.load(sys.stdin)
logs = data.get('logs', [])
if not logs:
    print('  Nenhum log de inicialização encontrado.')
    print('  Instale o app e abra-o para gerar logs.')
else:
    for log in logs:
        level = log.get('level','?').upper()
        msg = log.get('message','')
        ts = log.get('created_at','')[:19]
        platform = log.get('platform','?')
        print(f'  [{ts}] [{platform}] {msg}')
print(f'\n  Total: {len(logs)} logs de init')
"
    ;;
  4)
    echo ""
    echo "⏱️  Logs dos últimos 5 minutos:"
    echo "════════════════════════════════════════════"
    curl -s "$WORKER_URL/logs?limit=50" | python3 -c "
import json, sys
from datetime import datetime, timezone, timedelta
data = json.load(sys.stdin)
logs = data.get('logs', [])
now = datetime.now(timezone.utc)
cutoff = now - timedelta(minutes=5)
recent = []
for log in logs:
    ts_str = log.get('created_at','')
    try:
        ts = datetime.fromisoformat(ts_str.replace('Z','+00:00'))
        if ts >= cutoff:
            recent.append(log)
    except:
        pass
if not recent:
    print('  Nenhum log nos últimos 5 minutos.')
else:
    for log in recent:
        level = log.get('level','?').upper()
        cat = log.get('category','?')
        msg = log.get('message','')
        ts = log.get('created_at','')[:19]
        print(f'  [{ts}] [{level}][{cat}] {msg}')
print(f'\n  Total: {len(recent)} logs recentes')
"
    ;;
  5)
    echo ""
    echo "📊 Estatísticas gerais:"
    echo "════════════════════════════════════════════"
    curl -s "$WORKER_URL/logs/stats" | python3 -c "
import json, sys
data = json.load(sys.stdin)
stats = data.get('stats', {})
total = stats.get('total', 0)
by_level = stats.get('by_level', [])
by_category = stats.get('by_category', [])
print(f'  Total de logs: {total}')
print()
print('  Por nível:')
for item in by_level:
    print(f'    {item.get(\"level\",\"?\"):10} → {item.get(\"count\",0)}')
print()
print('  Por categoria:')
for item in by_category:
    print(f'    {item.get(\"category\",\"?\"):15} → {item.get(\"count\",0)}')
"
    ;;
  6)
    echo ""
    read -p "⚠️  Tem certeza que deseja APAGAR todos os logs? [s/N]: " CONFIRM
    if [ "$CONFIRM" = "s" ] || [ "$CONFIRM" = "S" ]; then
      curl -s -X DELETE "$WORKER_URL/logs" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print('  ✅', data.get('message', 'Logs apagados'))
"
    else
      echo "  Operação cancelada."
    fi
    ;;
  *)
    echo "  Opção inválida."
    ;;
esac

echo ""
