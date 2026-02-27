/**
 * IAM Admin — Capturador de Crash Nativo
 *
 * Este módulo instala handlers de erro ANTES do React montar,
 * capturando crashes nativos e enviando ao Cloudflare D1.
 *
 * Deve ser importado como o PRIMEIRO import do app (em app/_layout.tsx).
 */
import { Platform } from "react-native";
import Constants from "expo-constants";

const LOGS_WORKER_URL = "https://iam-admin-logs.sofmarc-silva.workers.dev/logs";
const APP_VERSION = Constants.expoConfig?.version ?? "unknown";
const PLATFORM = Platform.OS;

/**
 * Envia um log de crash diretamente ao Cloudflare D1.
 * Usa fetch nativo — sem dependências de React ou contexto.
 */
function sendCrashLog(level: string, message: string, metadata?: object): void {
  const entry = {
    level,
    category: "crash",
    message,
    metadata: {
      ...metadata,
      platform: PLATFORM,
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
    },
    app_version: APP_VERSION,
    platform: PLATFORM,
    created_at: new Date().toISOString(),
  };

  // Fire-and-forget — não aguardar resposta
  fetch(LOGS_WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify([entry]),
  }).catch(() => {
    // Silencioso — não podemos logar o erro do logger
  });
}

/**
 * Instala o handler global de erros não tratados.
 * ErrorUtils é a API interna do React Native para capturar
 * erros JS antes de qualquer componente React.
 */
function installGlobalErrorHandler(): void {
  // Verificar se ErrorUtils está disponível (React Native)
  const ErrorUtils = (global as unknown as { ErrorUtils?: {
    getGlobalHandler: () => (error: Error, isFatal: boolean) => void;
    setGlobalHandler: (handler: (error: Error, isFatal: boolean) => void) => void;
  } }).ErrorUtils;

  if (!ErrorUtils) {
    sendCrashLog("warn", "[NATIVE] ErrorUtils não disponível nesta plataforma", {
      platform: PLATFORM,
    });
    return;
  }

  const previousHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
    const level = isFatal ? "fatal" : "error";
    sendCrashLog(level, `[NATIVE] ${isFatal ? "FATAL" : "ERROR"}: ${error?.message ?? "Unknown error"}`, {
      name: error?.name,
      stack: error?.stack?.substring(0, 1000), // Limitar tamanho do stack
      isFatal,
    });

    // Chamar o handler anterior (React Native default)
    if (previousHandler) {
      previousHandler(error, isFatal);
    }
  });

  sendCrashLog("info", "[NATIVE] GlobalErrorHandler instalado com sucesso", {
    platform: PLATFORM,
    version: APP_VERSION,
  });
}

/**
 * Captura promises rejeitadas não tratadas.
 */
function installUnhandledRejectionHandler(): void {
  const originalHandler = (global as unknown as {
    onunhandledrejection?: (event: { reason?: unknown }) => void;
  }).onunhandledrejection;

  (global as unknown as {
    onunhandledrejection: (event: { reason?: unknown }) => void;
  }).onunhandledrejection = (event: { reason?: unknown }) => {
    const reason = event?.reason;
    const message = reason instanceof Error
      ? reason.message
      : String(reason ?? "Unknown rejection");

    sendCrashLog("error", `[NATIVE] UnhandledRejection: ${message}`, {
      stack: reason instanceof Error ? reason.stack?.substring(0, 1000) : undefined,
    });

    if (originalHandler) {
      originalHandler(event);
    }
  };
}

/**
 * Envia informações de diagnóstico do ambiente nativo.
 */
function sendEnvironmentDiagnostics(): void {
  sendCrashLog("info", "[NATIVE] App iniciando — diagnóstico do ambiente", {
    platform: PLATFORM,
    os_version: Platform.Version,
    app_version: APP_VERSION,
    expo_sdk: Constants.expoConfig?.sdkVersion ?? "unknown",
    is_device: Constants.isDevice,
    device_name: Constants.deviceName ?? "unknown",
    execution_environment: Constants.executionEnvironment ?? "unknown",
    react_native_version: Platform.constants?.reactNativeVersion
      ? `${Platform.constants.reactNativeVersion.major}.${Platform.constants.reactNativeVersion.minor}.${Platform.constants.reactNativeVersion.patch}`
      : "unknown",
  });
}

/**
 * Ponto de entrada principal — instala todos os handlers.
 * Chamado automaticamente ao importar este módulo.
 */
function initNativeCrashReporter(): void {
  try {
    sendEnvironmentDiagnostics();
    installGlobalErrorHandler();
    installUnhandledRejectionHandler();
  } catch (err) {
    // Se o próprio reporter falhar, tentar enviar um log de último recurso
    sendCrashLog("fatal", "[NATIVE] Falha ao inicializar CrashReporter", {
      error: String(err),
    });
  }
}

// Executar imediatamente ao importar o módulo
initNativeCrashReporter();

export { sendCrashLog };
