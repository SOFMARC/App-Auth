#!/bin/bash
# ============================================================
# IAM Admin — Captura de Logs Android via ADB
# Requer: cabo USB + Depuração USB ativada no celular
# Execute: chmod +x scripts/adb-debug.sh && ./scripts/adb-debug.sh
# ============================================================

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║    IAM Admin — ADB Debug (Android)       ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Verificar ADB
if ! command -v adb &> /dev/null; then
  echo "❌ ADB não encontrado."
  echo "   Instale o Android Studio ou adicione platform-tools ao PATH"
  echo "   Download: https://developer.android.com/studio/releases/platform-tools"
  exit 1
fi

echo "✅ ADB encontrado: $(adb version | head -1)"
echo ""

# Verificar dispositivos conectados
DEVICES=$(adb devices | grep -v "List of devices" | grep "device$" | wc -l)
if [ "$DEVICES" -eq 0 ]; then
  echo "❌ Nenhum dispositivo Android conectado."
  echo ""
  echo "  Como conectar:"
  echo "  1. Ative 'Depuração USB' em Configurações → Opções do desenvolvedor"
  echo "  2. Conecte o cabo USB"
  echo "  3. Aceite a permissão de depuração no celular"
  echo "  4. Execute: adb devices (deve mostrar o dispositivo)"
  exit 1
fi

echo "✅ $DEVICES dispositivo(s) conectado(s):"
adb devices | grep "device$"
echo ""

# Limpar log anterior
adb logcat -c
echo "🧹 Buffer de logs limpo"
echo ""

# Criar arquivo de saída
LOG_FILE="/tmp/iam-admin-adb-$(date +%Y%m%d_%H%M%S).log"
echo "📝 Salvando logs em: $LOG_FILE"
echo ""

echo "════════════════════════════════════════════"
echo "  Abra o app no celular agora..."
echo "  Pressione Ctrl+C para parar a captura"
echo "════════════════════════════════════════════"
echo ""

# Capturar logs relevantes
adb logcat \
  ReactNativeJS:V \
  ReactNative:V \
  ExpoModulesCore:V \
  expo:V \
  AndroidRuntime:E \
  FATAL:E \
  *:S \
  2>&1 | tee "$LOG_FILE" | while IFS= read -r line; do
    # Colorir saída por tipo
    if echo "$line" | grep -q "FATAL\|AndroidRuntime\|CRASH"; then
      echo -e "\033[0;31m$line\033[0m"  # Vermelho para crashes
    elif echo "$line" | grep -q "\[ERROR\]\|\[FATAL\]"; then
      echo -e "\033[0;31m$line\033[0m"  # Vermelho para erros
    elif echo "$line" | grep -q "\[WARN\]"; then
      echo -e "\033[0;33m$line\033[0m"  # Amarelo para warnings
    elif echo "$line" | grep -q "PASSO\|AuthProvider\|AuthGuard\|CompanyProvider\|RootLayout"; then
      echo -e "\033[0;32m$line\033[0m"  # Verde para logs de init
    else
      echo "$line"
    fi
  done

echo ""
echo "════════════════════════════════════════════"
echo "  Log salvo em: $LOG_FILE"
echo "  Compartilhe este arquivo para análise"
echo "════════════════════════════════════════════"
