#!/bin/bash
# ============================================================
# IAM Admin — Script de Debug Local
# Execute: chmod +x scripts/debug-start.sh && ./scripts/debug-start.sh
# ============================================================

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║       IAM Admin — Debug Local            ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js não encontrado. Instale em: https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js v18+ necessário. Versão atual: $(node --version)"
  exit 1
fi
echo "✅ Node.js $(node --version)"

# Verificar pnpm
if ! command -v pnpm &> /dev/null; then
  echo "⚠️  pnpm não encontrado. Instalando..."
  npm install -g pnpm
fi
echo "✅ pnpm $(pnpm --version)"

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
  echo ""
  echo "📦 Instalando dependências..."
  pnpm install
fi

# Criar .env se não existir
if [ ! -f ".env" ]; then
  echo ""
  echo "📝 Criando arquivo .env..."
  cat > .env << 'EOF'
# IAM Admin — Variáveis de Ambiente
EXPO_PUBLIC_API_URL=https://auth.cndtax.com.br
EXPO_PUBLIC_LOGS_WORKER_URL=https://iam-admin-logs.sofmarc-silva.workers.dev/logs
EOF
  echo "✅ .env criado com URL da API padrão"
fi

echo ""
echo "════════════════════════════════════════════"
echo "  Como debugar:"
echo ""
echo "  1. Escaneie o QR code com o Expo Go"
echo "  2. Observe os logs neste terminal"
echo "  3. Procure por linhas [INFO][init] PASSO X"
echo "  4. Se o app fechar, veja em qual PASSO parou"
echo ""
echo "  Para ver logs nativos Android (USB):"
echo "  adb logcat | grep ReactNativeJS"
echo "════════════════════════════════════════════"
echo ""

# Iniciar Metro com cache limpo
EXPO_DEBUG=true npx expo start --clear 2>&1 | tee /tmp/iam-admin-debug.log
