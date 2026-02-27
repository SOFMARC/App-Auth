/**
 * IAM Admin — Serviço de Logging Remoto
 *
 * Envia logs para o Cloudflare Worker (D1) em background.
 * Faz batching automático para evitar muitas requisições.
 * Nunca bloqueia a UI — falhas são silenciosas.
 */
import { Platform } from "react-native";
import Constants from "expo-constants";

// URL do Cloudflare Worker de logs
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

interface QueuedLog extends LogEntry {
  app_version: string;
  platform: string;
  created_at: string;
}

// Estado interno do logger
let _userId: string | undefined;
let _userEmail: string | undefined;
let _companyId: string | undefined;
let _companyName: string | undefined;

const APP_VERSION =
  Constants.expoConfig?.version ?? "1.0.0";
const PLATFORM = Platform.OS;

// Fila de logs para batching
const queue: QueuedLog[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const BATCH_SIZE = 20;
const FLUSH_INTERVAL_MS = 5000; // 5 segundos

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

/** Enfileira um log para envio em batch */
export function log(entry: LogEntry) {
  const queued: QueuedLog = {
    ...entry,
    user_id: entry.user_id ?? _userId,
    user_email: entry.user_email ?? _userEmail,
    company_id: entry.company_id ?? _companyId,
    company_name: entry.company_name ?? _companyName,
    app_version: APP_VERSION,
    platform: PLATFORM,
    created_at: entry.created_at ?? new Date().toISOString(),
  };

  queue.push(queued);

  // Log no console em desenvolvimento
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';
  if (isDev) {
    const prefix = `[${queued.level.toUpperCase()}][${queued.category}]`;
    if (queued.level === "error" || queued.level === "fatal") {
      console.error(prefix, queued.message, queued.metadata ?? "");
    } else if (queued.level === "warn") {
      console.warn(prefix, queued.message, queued.metadata ?? "");
    } else {
      console.log(prefix, queued.message, queued.metadata ?? "");
    }
  }

  // Flush imediato para erros críticos
  if (queued.level === "fatal" || queued.level === "error") {
    flushLogs();
    return;
  }

  // Flush quando atingir tamanho do batch
  if (queue.length >= BATCH_SIZE) {
    flushLogs();
    return;
  }

  // Agendar flush periódico
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushLogs();
    }, FLUSH_INTERVAL_MS);
  }
}

/** Envia todos os logs enfileirados para o Worker */
export async function flushLogs(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (queue.length === 0) return;

  const batch = queue.splice(0, BATCH_SIZE);

  try {
    await fetch(LOGS_WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batch),
    });
  } catch {
    // Falha silenciosa — logs não críticos são descartados
    // Para não perder logs de erro, podemos recolocar na fila
    const errorLogs = batch.filter((l) => l.level === "error" || l.level === "fatal");
    if (errorLogs.length > 0 && queue.length < 100) {
      queue.unshift(...errorLogs);
    }
  }
}

// Atalhos convenientes
export const logger = {
  debug: (category: LogCategory, message: string, metadata?: Record<string, unknown>) =>
    log({ level: "debug", category, message, metadata }),

  info: (category: LogCategory, message: string, metadata?: Record<string, unknown>) =>
    log({ level: "info", category, message, metadata }),

  warn: (category: LogCategory, message: string, metadata?: Record<string, unknown>) =>
    log({ level: "warn", category, message, metadata }),

  error: (category: LogCategory, message: string, metadata?: Record<string, unknown>) =>
    log({ level: "error", category, message, metadata }),

  fatal: (category: LogCategory, message: string, metadata?: Record<string, unknown>) =>
    log({ level: "fatal", category, message, metadata }),

  /** Captura um objeto Error e envia como log */
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

  /** Log de navegação entre telas */
  screen: (screenName: string) =>
    log({ level: "info", category: "navigation", message: `Navegou para ${screenName}`, screen: screenName }),

  /** Log de chamada de API */
  apiCall: (method: string, endpoint: string, status: number, durationMs?: number) =>
    log({
      level: status >= 400 ? "warn" : "info",
      category: "api",
      message: `${method} ${endpoint} → ${status}`,
      metadata: { method, endpoint, status, duration_ms: durationMs },
    }),
};
