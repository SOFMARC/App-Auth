/**
 * Tela de Diagnóstico Nativo
 * Acessível sem autenticação em: /diagnostic
 * Exibe informações do ambiente e últimos logs do Cloudflare D1
 */
import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from "react-native";
import Constants from "expo-constants";
import { ScreenContainer } from "@/components/screen-container";

const LOGS_WORKER_URL = "https://iam-admin-logs.sofmarc-silva.workers.dev";

interface LogEntry {
  id: number;
  level: string;
  category: string;
  message: string;
  platform: string;
  app_version: string;
  created_at: string;
  metadata?: string;
}

export default function DiagnosticScreen() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ total: number; by_platform: { platform: string; count: number }[] } | null>(null);
  const [testStatus, setTestStatus] = useState<string>("");

  const envInfo = {
    platform: Platform.OS,
    os_version: String(Platform.Version),
    app_version: Constants.expoConfig?.version ?? "unknown",
    expo_sdk: Constants.expoConfig?.sdkVersion ?? "unknown",
    is_device: String(Constants.isDevice),
    device_name: Constants.deviceName ?? "unknown",
    execution_env: Constants.executionEnvironment ?? "unknown",
  };

  async function fetchLogs() {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        fetch(`${LOGS_WORKER_URL}/logs?limit=50`),
        fetch(`${LOGS_WORKER_URL}/logs/stats`),
      ]);
      const logsData = await logsRes.json();
      const statsData = await statsRes.json();
      setLogs(logsData.logs ?? []);
      setStats(statsData.stats ?? null);
    } catch (err) {
      setTestStatus(`Erro ao buscar logs: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function sendTestLog() {
    setTestStatus("Enviando log de teste...");
    try {
      const res = await fetch(`${LOGS_WORKER_URL}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{
          level: "info",
          category: "crash",
          message: `[DIAGNOSTIC] Teste de conectividade — ${Platform.OS} v${Constants.expoConfig?.version}`,
          metadata: JSON.stringify(envInfo),
          app_version: Constants.expoConfig?.version ?? "unknown",
          platform: Platform.OS,
          created_at: new Date().toISOString(),
        }]),
      });
      const data = await res.json();
      setTestStatus(data.success ? "✅ Log enviado com sucesso!" : `❌ Erro: ${JSON.stringify(data)}`);
      await fetchLogs();
    } catch (err) {
      setTestStatus(`❌ Falha de rede: ${String(err)}`);
    }
  }

  useEffect(() => {
    fetchLogs();
  }, []);

  const levelColor = (level: string) => {
    switch (level) {
      case "fatal": return "#FF0000";
      case "error": return "#EF4444";
      case "warn": return "#F59E0B";
      case "info": return "#3B82F6";
      default: return "#9CA3AF";
    }
  };

  return (
    <ScreenContainer>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🔍 Diagnóstico Nativo</Text>
          <Text style={styles.subtitle}>IAM Admin — Debug Mode</Text>
        </View>

        {/* Informações do Ambiente */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📱 Ambiente</Text>
          {Object.entries(envInfo).map(([key, value]) => (
            <View key={key} style={styles.row}>
              <Text style={styles.rowKey}>{key}</Text>
              <Text style={styles.rowValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Teste de Conectividade */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌐 Cloudflare D1</Text>
          <TouchableOpacity style={styles.button} onPress={sendTestLog}>
            <Text style={styles.buttonText}>Enviar Log de Teste</Text>
          </TouchableOpacity>
          {testStatus ? (
            <Text style={styles.testStatus}>{testStatus}</Text>
          ) : null}
        </View>

        {/* Estatísticas */}
        {stats && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 Estatísticas D1</Text>
            <View style={styles.row}>
              <Text style={styles.rowKey}>Total de logs</Text>
              <Text style={styles.rowValue}>{stats.total}</Text>
            </View>
            {stats.by_platform?.map((p) => (
              <View key={p.platform} style={styles.row}>
                <Text style={styles.rowKey}>Plataforma: {p.platform}</Text>
                <Text style={styles.rowValue}>{p.count}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Logs Recentes */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📋 Últimos Logs</Text>
            <TouchableOpacity onPress={fetchLogs} style={styles.refreshBtn}>
              <Text style={styles.refreshText}>↻ Atualizar</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator color="#3B82F6" style={{ marginVertical: 16 }} />
          ) : logs.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum log encontrado</Text>
          ) : (
            logs.map((log) => (
              <View key={log.id} style={styles.logEntry}>
                <View style={styles.logHeader}>
                  <View style={[styles.levelBadge, { backgroundColor: levelColor(log.level) }]}>
                    <Text style={styles.levelText}>{log.level.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.logPlatform}>[{log.platform}]</Text>
                  <Text style={styles.logCategory}>[{log.category}]</Text>
                </View>
                <Text style={styles.logMessage}>{log.message}</Text>
                <Text style={styles.logTime}>{log.created_at?.substring(0, 19)}</Text>
                {log.metadata && log.metadata !== "{}" && (
                  <Text style={styles.logMeta} numberOfLines={3}>
                    {typeof log.metadata === "string" ? log.metadata : JSON.stringify(log.metadata)}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  content: { padding: 16, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 20, paddingTop: 8 },
  title: { fontSize: 22, fontWeight: "bold", color: "#F1F5F9" },
  subtitle: { fontSize: 13, color: "#94A3B8", marginTop: 4 },
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#E2E8F0", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: "#1E293B" },
  rowKey: { fontSize: 12, color: "#94A3B8", flex: 1 },
  rowValue: { fontSize: 12, color: "#F1F5F9", flex: 2, textAlign: "right" },
  button: { backgroundColor: "#3B82F6", borderRadius: 8, padding: 12, alignItems: "center" },
  buttonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
  testStatus: { marginTop: 10, fontSize: 13, color: "#94A3B8", textAlign: "center" },
  refreshBtn: { padding: 6 },
  refreshText: { color: "#3B82F6", fontSize: 13 },
  emptyText: { color: "#64748B", textAlign: "center", paddingVertical: 16 },
  logEntry: {
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    paddingVertical: 8,
  },
  logHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  levelBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  levelText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
  logPlatform: { fontSize: 11, color: "#64748B" },
  logCategory: { fontSize: 11, color: "#64748B" },
  logMessage: { fontSize: 12, color: "#CBD5E1", lineHeight: 18 },
  logTime: { fontSize: 10, color: "#475569", marginTop: 2 },
  logMeta: { fontSize: 10, color: "#64748B", marginTop: 4, fontFamily: "monospace" },
});
