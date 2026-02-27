/**
 * IAM Admin — Serviço de Logging Remoto
 *
 * Regras:
 * - Apenas níveis warn, error e fatal são enviados ao Cloudflare D1
 * - debug e info ficam apenas no console local (desenvolvimento)
 * - Erros são enviados imediatamente (sem batching)
 * - Falhas de envio são silenciosas para não impactar a UI
 */
import { Platform } from "react-native";
import Constants from "expo-constants";

const LOGS_WORKER_URL = "https://iam-admin-logs.sofmarc-silva.workers.dev/logs";

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
export type LogCategory =
  | "auth"
  | "navigation"
  | "api"
  | "crash"
  | "permission"
  | "user"
  | "company"
  | "app"
  | "general";

export interface LogEntry {
  level: LogLevel;
  category: LogCategory;
  message: string;
  metadata?: Record<string, unknown>;
  user_id?: string;
  user_email?: string;
  company_id?: string;
  company_name?: string;
  screen?: string;
  created_at?: string;
}

interface RemoteLog extends LogEntry {
  app_version: string;
  platform: string;
  created_at: string;
}

// Contexto do usuário atual
let _userId: string | undefined;
let _userEmail: string | undefined;
let _companyId: string | undefined;
let _companyName: string | undefined;

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
const PLATFORM = Platform.OS;

// Níveis que são enviados remotamente
const REMOTE_LEVELS: LogLevel[] = ["warn", "error", "fatal"];

/** Define o contexto do usuário atual para todos os logs subsequentes */
export function setLoggerUser(opts: {
  userId?: string;
  userEmail?: string;
  companyId?: string;
  companyName?: string;
}) {
  _userId = opts.userId;
  _userEmail = opts.userEmail;
  _companyId = opts.companyId;
  _companyName = opts.companyName;
}

/** Limpa o contexto do usuário (ao fazer logout) */
export function clearLoggerUser() {
  _userId = undefined;
  _userEmail = undefined;
  _companyId = undefined;
  _companyName = undefined;
}

/** Envia um único log para o Cloudflare Worker (apenas warn/error/fatal) */
async function sendRemote(entry: RemoteLog): Promise<void> {
  try {
    await fetch(LOGS_WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([entry]),
    });
  } catch {
    // Falha silenciosa — nunca bloquear a UI por causa de logging
  }
}

/** Registra um log. Apenas warn/error/fatal são enviados ao Cloudflare. */
export function log(entry: LogEntry): void {
  const isDev =
    typeof __DEV__ !== "undefined" ? __DEV__ : process.env.NODE_ENV !== "production";

  // Console local em desenvolvimento
  if (isDev) {
    const prefix = `[${entry.level.toUpperCase()}][${entry.category}]`;
    if (entry.level === "error" || entry.level === "fatal") {
      console.error(prefix, entry.message, entry.metadata ?? "");
    } else if (entry.level === "warn") {
      console.warn(prefix, entry.message, entry.metadata ?? "");
    } else {
      // debug/info: apenas console, nunca remoto
      console.log(prefix, entry.message, entry.metadata ?? "");
      return; // Sai aqui — não envia remotamente
    }
  }

  // Envio remoto apenas para warn, error e fatal
  if (!REMOTE_LEVELS.includes(entry.level)) return;

  const remote: RemoteLog = {
    ...entry,
    user_id: entry.user_id ?? _userId,
    user_email: entry.user_email ?? _userEmail,
    company_id: entry.company_id ?? _companyId,
    company_name: entry.company_name ?? _companyName,
    app_version: APP_VERSION,
    platform: PLATFORM,
    created_at: entry.created_at ?? new Date().toISOString(),
  };

  // Envio imediato — sem batching para não perder erros
  sendRemote(remote);
}

/** Flush manual (compatibilidade — não faz nada pois não há fila) */
export async function flushLogs(): Promise<void> {
  // Sem fila — cada log é enviado imediatamente
}

// Atalhos convenientes
export const logger = {
  /** Apenas console local, nunca enviado remotamente */
  debug: (category: LogCategory, message: string, metadata?: Record<string, unknown>) =>
    log({ level: "debug", category, message, metadata }),

  /** Apenas console local, nunca enviado remotamente */
  info: (category: LogCategory, message: string, metadata?: Record<string, unknown>) =>
    log({ level: "info", category, message, metadata }),

  /** Enviado ao Cloudflare D1 */
  warn: (category: LogCategory, message: string, metadata?: Record<string, unknown>) =>
    log({ level: "warn", category, message, metadata }),

  /** Enviado ao Cloudflare D1 imediatamente */
  error: (category: LogCategory, message: string, metadata?: Record<string, unknown>) =>
    log({ level: "error", category, message, metadata }),

  /** Enviado ao Cloudflare D1 imediatamente */
  fatal: (category: LogCategory, message: string, metadata?: Record<string, unknown>) =>
    log({ level: "fatal", category, message, metadata }),

  /** Captura um objeto Error e envia como log de erro */
  captureError: (
    category: LogCategory,
    error: unknown,
    context?: Record<string, unknown>
  ) => {
    const err = error instanceof Error ? error : new Error(String(error));
    log({
      level: "error",
      category,
      message: err.message,
      metadata: {
        stack: err.stack,
        name: err.name,
        ...context,
      },
    });
  },

  /** Log de navegação — apenas local, não enviado */
  screen: (screenName: string) => {
    const isDev =
      typeof __DEV__ !== "undefined" ? __DEV__ : process.env.NODE_ENV !== "production";
    if (isDev) console.log(`[INFO][navigation] Navegou para ${screenName}`);
  },

  /** Log de chamada de API — apenas erros 4xx/5xx são enviados remotamente */
  apiCall: (method: string, endpoint: string, status: number, durationMs?: number) => {
    const level: LogLevel = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
    log({
      level,
      category: "api",
      message: `${method} ${endpoint} → ${status}`,
      metadata: { method, endpoint, status, duration_ms: durationMs },
    });
  },
};
