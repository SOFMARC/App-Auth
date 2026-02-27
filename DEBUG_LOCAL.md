# IAM Admin — Guia de Debug Local

Este guia explica como rodar o app localmente no seu computador e conectar ao dispositivo Android para ver os logs em tempo real.

---

## Pré-requisitos

| Ferramenta | Versão mínima | Download |
|------------|---------------|----------|
| Node.js | 18+ | https://nodejs.org |
| pnpm | 9+ | `npm install -g pnpm` |
| Expo Go | Última | Play Store / App Store |
| Android Studio (opcional) | Qualquer | Para emulador |
| ADB (opcional) | Qualquer | Incluído no Android Studio |

---

## 1. Instalar dependências

```bash
# Na pasta do projeto
cd iam-admin-app
pnpm install
```

---

## 2. Configurar variáveis de ambiente

Crie o arquivo `.env` na raiz do projeto:

```bash
# .env
EXPO_PUBLIC_API_URL=https://auth.cndtax.com.br
EXPO_PUBLIC_LOGS_WORKER_URL=https://iam-admin-logs.sofmarc-silva.workers.dev/logs
```

---

## 3. Iniciar o servidor Metro

```bash
# Modo desenvolvimento com logs detalhados
pnpm dev:metro

# OU diretamente:
npx expo start --clear
```

Você verá um QR code no terminal. Escaneie com o Expo Go no celular.

---

## 4. Ver logs em tempo real

### Opção A — Terminal (mais simples)

Com o app aberto no celular via Expo Go, todos os `console.log` aparecem no terminal onde você rodou `expo start`.

Procure por linhas como:
```
LOG  [INFO][init] [LAYOUT] Módulo _layout.tsx carregado — plataforma: android
LOG  [INFO][init] [ROOT] RootLayout montado com sucesso
LOG  [INFO][init] PASSO 1: Iniciando restoreSession
LOG  [INFO][init] PASSO 2: Lendo token do SecureStore...
LOG  [INFO][init] PASSO 3: Token encontrado: NÃO
...
```

Se o app fechar antes de chegar ao PASSO 5, o problema é no bundle/import nativo.
Se chegar ao PASSO 5 mas fechar depois, é na lógica de navegação.

### Opção B — React Native Debugger (mais completo)

1. Instale: https://github.com/jhen0409/react-native-debugger/releases
2. Abra o React Native Debugger
3. No Expo Go, agite o celular → "Open JS Debugger"
4. Veja o Console com todos os logs e stack traces

### Opção C — ADB Logcat (logs nativos Android)

```bash
# Conecte o celular via USB com depuração USB ativada
adb logcat | grep -E "ReactNative|expo|iam-admin|FATAL|ERROR"

# Para ver apenas erros do JavaScript:
adb logcat | grep "ReactNativeJS"

# Para ver crashes nativos:
adb logcat | grep -E "FATAL|AndroidRuntime|CRASH"
```

### Opção D — Expo Dev Client (melhor para crashes nativos)

Se o Expo Go não conseguir abrir o app, o problema é em código nativo.
Nesse caso, use o `expo-dev-client`:

```bash
# Instalar expo-dev-client
pnpm add expo-dev-client

# Buildar o APK de desenvolvimento (requer Android Studio)
npx expo run:android

# OU gerar o APK via EAS Build (sem Android Studio)
npm install -g eas-cli
eas build --platform android --profile development
```

---

## 5. Verificar logs no Cloudflare D1

Após qualquer tentativa de abrir o app, consulte os logs remotos:

```bash
# Instalar Wrangler CLI
npm install -g wrangler

# Fazer login
wrangler login

# Consultar logs
wrangler d1 execute iam-admin-logs --command "SELECT level, category, message, platform, app_version, created_at FROM app_logs ORDER BY created_at DESC LIMIT 30"

# Filtrar apenas erros
wrangler d1 execute iam-admin-logs --command "SELECT * FROM app_logs WHERE level IN ('error','fatal','warn') ORDER BY created_at DESC LIMIT 20"

# Filtrar logs de inicialização
wrangler d1 execute iam-admin-logs --command "SELECT level, message, created_at FROM app_logs WHERE category='init' ORDER BY created_at DESC LIMIT 20"
```

---

## 6. Diagnóstico por sintoma

### App fecha imediatamente (antes de qualquer tela)

**Causa mais provável:** erro de import de módulo nativo.

```bash
# Verificar se há imports problemáticos
grep -rn "expo-symbols\|react-native-worklets" app/ lib/ components/

# Limpar cache e reiniciar
npx expo start --clear

# Ver logs nativos
adb logcat | grep -E "FATAL|AndroidRuntime" | head -20
```

### App mostra tela branca e fecha

**Causa mais provável:** erro JavaScript no bundle.

```bash
# Verificar TypeScript
pnpm check

# Verificar bundle
npx expo export --platform android 2>&1 | grep -i error
```

### App abre mas não vai para login

**Causa mais provável:** problema no AuthGuard ou redirect.

Procure nos logs do terminal:
```
[AUTHGUARD] Estado: isLoading=false isAuthenticated=false
[AUTHGUARD] Redirecionando para /(auth)/login
[INDEX] Renderizando: isLoading=false isAuthenticated=false
```

Se esses logs não aparecerem, o crash é antes do React montar.

### App abre login mas não autentica

**Causa mais provável:** CORS (no browser) ou URL da API errada.

```bash
# Testar a API diretamente
curl -X POST https://auth.cndtax.com.br/api/Auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sofmarc.silva@gmail.com","password":"060187thi@GOa"}'
```

---

## 7. Estrutura de logs esperada ao abrir o app

Se tudo estiver funcionando, você deve ver esta sequência no terminal:

```
[INFO][init] [LAYOUT] Módulo _layout.tsx carregado — plataforma: android
[INFO][init] [ROOT] RootLayout montado com sucesso
[INFO][init] AuthProvider montado — iniciando restauração de sessão
[INFO][init] PASSO 1: Iniciando restoreSession
[INFO][init] PASSO 2: Lendo token do SecureStore...
[INFO][init] PASSO 3: Token encontrado: NÃO
[INFO][init] PASSO 4: ExpiresAt: null
[INFO][init] PASSO 5: Sem sessão salva → redirecionando para login
[INFO][init] PASSO 9: restoreSession finalizado — liberando guard de 401
[INFO][init] [AUTHGUARD] Estado: isLoading=false isAuthenticated=false segments=["index"]
[INFO][init] [AUTHGUARD] Redirecionando para /(auth)/login
[INFO][init] [INDEX] Renderizando: isLoading=false isAuthenticated=false
[INFO][init] [INDEX] Redirecionando para /(auth)/login
```

Se a sequência parar em algum passo, esse é o ponto do crash.

---

## 8. Comandos úteis

```bash
# Limpar cache completo
npx expo start --clear

# Verificar TypeScript sem compilar
pnpm check

# Rodar testes unitários
pnpm test

# Ver dependências com problemas
pnpm why expo-symbols

# Verificar se há módulos nativos problemáticos
npx expo-doctor

# Gerar APK de produção (requer EAS)
eas build --platform android --profile production
```

---

## 9. Configuração do Android para debug USB

1. No celular: **Configurações → Sobre o telefone → Número da versão** (toque 7x)
2. **Configurações → Opções do desenvolvedor → Depuração USB** (ativar)
3. Conecte o cabo USB
4. No terminal: `adb devices` (deve mostrar o dispositivo)
5. Rode: `npx expo start` e pressione `a` para abrir no Android conectado

---

## 10. Reportar o problema

Após identificar o erro, copie:
1. Os últimos 20 logs do terminal
2. O resultado do `adb logcat` (se disponível)
3. O resultado da query no D1: `SELECT * FROM app_logs ORDER BY created_at DESC LIMIT 20`

E compartilhe aqui para que eu possa corrigir.
