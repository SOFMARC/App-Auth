import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  TextInput,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { logger } from "@/lib/logger";

const LOGS_WORKER_URL = "https://iam-admin-logs.sofmarc-silva.workers.dev";

type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
type LogCategory = "auth" | "navigation" | "api" | "crash" | "permission" | "user" | "company" | "app" | "general";

interface LogEntry {
  id: number;
  level: LogLevel;
  category: LogCategory;
  message: string;
  metadata: Record<string, unknown> | null;
  user_id: string | null;
  user_email: string | null;
  company_id: string | null;
  company_name: string | null;
  app_version: string | null;
  platform: string | null;
  screen: string | null;
  created_at: string;
}

interface LogStats {
  by_level: { level: string; count: number }[];
  by_category: { category: string; count: number }[];
  by_platform: { platform: string; count: number }[];
  last_24h: number;
}

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: "#94A3B8",
  info: "#3B82F6",
  warn: "#F59E0B",
  error: "#EF4444",
  fatal: "#7C3AED",
};

const LEVEL_BG: Record<LogLevel, string> = {
  debug: "#F1F5F9",
  info: "#EFF6FF",
  warn: "#FFFBEB",
  error: "#FEF2F2",
  fatal: "#F5F3FF",
};

const LEVELS: LogLevel[] = ["debug", "info", "warn", "error", "fatal"];
const CATEGORIES: LogCategory[] = ["auth", "navigation", "api", "crash", "permission", "user", "company", "app", "general"];

async function fetchLogs(params: {
  level?: string;
  category?: string;
  q?: string;
  offset?: number;
  limit?: number;
}) {
  const url = new URL(`${LOGS_WORKER_URL}/logs`);
  if (params.level) url.searchParams.set("level", params.level);
  if (params.category) url.searchParams.set("category", params.category);
  if (params.q) url.searchParams.set("q", params.q);
  url.searchParams.set("offset", String(params.offset ?? 0));
  url.searchParams.set("limit", String(params.limit ?? 50));

  const res = await fetch(url.toString());
  const data = await res.json();
  return data as { success: boolean; data: LogEntry[]; total: number };
}

async function fetchStats() {
  const res = await fetch(`${LOGS_WORKER_URL}/logs/stats`);
  const data = await res.json();
  return data as { success: boolean; stats: LogStats };
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function LogItem({ log, onPress }: { log: LogEntry; onPress: () => void }) {
  const level = log.level as LogLevel;
  const color = LEVEL_COLORS[level] ?? "#687076";
  const bg = LEVEL_BG[level] ?? "#F5F5F5";

  return (
    <TouchableOpacity
      style={[styles.logItem, { backgroundColor: bg, borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.logHeader}>
        <View style={[styles.levelBadge, { backgroundColor: color }]}>
          <Text style={styles.levelText}>{level.toUpperCase()}</Text>
        </View>
        <View style={[styles.categoryBadge]}>
          <Text style={styles.categoryText}>{log.category}</Text>
        </View>
        {log.platform && (
          <View style={styles.platformBadge}>
            <Text style={styles.platformText}>{log.platform}</Text>
          </View>
        )}
        <Text style={styles.logTime}>{formatDate(log.created_at)}</Text>
      </View>
      <Text style={styles.logMessage} numberOfLines={2}>{log.message}</Text>
      {log.user_email && (
        <Text style={styles.logMeta}>👤 {log.user_email}</Text>
      )}
    </TouchableOpacity>
  );
}

function LogDetailModal({
  log,
  visible,
  onClose,
}: {
  log: LogEntry | null;
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  if (!log) return null;

  const level = log.level as LogLevel;
  const color = LEVEL_COLORS[level] ?? "#687076";

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Detalhe do Log</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <IconSymbol name="xmark" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Level + Category */}
          <View style={styles.detailRow}>
            <View style={[styles.levelBadge, { backgroundColor: color }]}>
              <Text style={styles.levelText}>{log.level.toUpperCase()}</Text>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{log.category}</Text>
            </View>
          </View>

          {/* Message */}
          <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.detailLabel, { color: colors.muted }]}>Mensagem</Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>{log.message}</Text>
          </View>

          {/* Timestamp */}
          <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.detailLabel, { color: colors.muted }]}>Data/Hora</Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>{formatDate(log.created_at)}</Text>
          </View>

          {/* User */}
          {(log.user_email || log.user_id) && (
            <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.detailLabel, { color: colors.muted }]}>Usuário</Text>
              {log.user_email && <Text style={[styles.detailValue, { color: colors.foreground }]}>{log.user_email}</Text>}
              {log.user_id && <Text style={[styles.detailSubValue, { color: colors.muted }]}>ID: {log.user_id}</Text>}
            </View>
          )}

          {/* Platform / Version / Screen */}
          <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.detailLabel, { color: colors.muted }]}>Ambiente</Text>
            <View style={styles.envGrid}>
              {log.platform && (
                <View style={styles.envItem}>
                  <Text style={[styles.envKey, { color: colors.muted }]}>Plataforma</Text>
                  <Text style={[styles.envVal, { color: colors.foreground }]}>{log.platform}</Text>
                </View>
              )}
              {log.app_version && (
                <View style={styles.envItem}>
                  <Text style={[styles.envKey, { color: colors.muted }]}>Versão</Text>
                  <Text style={[styles.envVal, { color: colors.foreground }]}>{log.app_version}</Text>
                </View>
              )}
              {log.screen && (
                <View style={styles.envItem}>
                  <Text style={[styles.envKey, { color: colors.muted }]}>Tela</Text>
                  <Text style={[styles.envVal, { color: colors.foreground }]}>{log.screen}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Metadata */}
          {log.metadata && (
            <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.detailLabel, { color: colors.muted }]}>Metadata</Text>
              <Text style={[styles.metadataText, { color: colors.foreground }]}>
                {JSON.stringify(log.metadata, null, 2)}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function LogsScreen() {
  const colors = useColors();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filtros
  const [filterLevel, setFilterLevel] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeSearch, setActiveSearch] = useState("");

  const LIMIT = 50;

  const loadLogs = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    if (!reset && isLoadingMore) return;

    if (reset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const [logsRes, statsRes] = await Promise.all([
        fetchLogs({
          level: filterLevel || undefined,
          category: filterCategory || undefined,
          q: activeSearch || undefined,
          offset: currentOffset,
          limit: LIMIT,
        }),
        reset ? fetchStats() : Promise.resolve(null),
      ]);

      if (logsRes.success) {
        if (reset) {
          setLogs(logsRes.data);
          setOffset(logsRes.data.length);
        } else {
          setLogs((prev) => [...prev, ...logsRes.data]);
          setOffset((prev) => prev + logsRes.data.length);
        }
        setTotal(logsRes.total);
      }

      if (statsRes?.success) {
        setStats(statsRes.stats);
      }
    } catch (err) {
      logger.captureError("api", err, { context: "LogsScreen.loadLogs" });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [filterLevel, filterCategory, activeSearch, offset, isLoadingMore]);

  useEffect(() => {
    loadLogs(true);
    logger.screen("Logs");
  }, [filterLevel, filterCategory, activeSearch]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setOffset(0);
    try {
      const [logsRes, statsRes] = await Promise.all([
        fetchLogs({ level: filterLevel || undefined, category: filterCategory || undefined, q: activeSearch || undefined, offset: 0, limit: LIMIT }),
        fetchStats(),
      ]);
      if (logsRes.success) { setLogs(logsRes.data); setOffset(logsRes.data.length); setTotal(logsRes.total); }
      if (statsRes.success) setStats(statsRes.stats);
    } catch (err) {
      logger.captureError("api", err, { context: "LogsScreen.refresh" });
    } finally {
      setIsRefreshing(false);
    }
  }, [filterLevel, filterCategory, activeSearch]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setActiveSearch(text);
      setOffset(0);
    }, 500);
  };

  const handleLoadMore = () => {
    if (logs.length < total && !isLoadingMore) {
      loadLogs(false);
    }
  };

  const hasFilters = filterLevel || filterCategory || activeSearch;

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Logs do App</Text>
            <Text style={[styles.headerSub, { color: colors.muted }]}>
              {total} registros {hasFilters ? "(filtrado)" : "total"}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.filterBtn, hasFilters && { backgroundColor: colors.primary }]}
              onPress={() => setShowFilters(!showFilters)}
            >
              <IconSymbol name="filter.fill" size={18} color={hasFilters ? "#fff" : colors.muted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterBtn} onPress={handleRefresh}>
              <IconSymbol name="arrow.clockwise" size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <IconSymbol name="magnifyingglass" size={16} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Buscar nos logs..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={handleSearchChange}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(""); setActiveSearch(""); setOffset(0); }}>
              <IconSymbol name="xmark" size={16} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        {showFilters && (
          <View style={styles.filtersPanel}>
            {/* Level filter */}
            <Text style={[styles.filterLabel, { color: colors.muted }]}>Nível:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterChip, !filterLevel && { backgroundColor: colors.primary }]}
                onPress={() => { setFilterLevel(""); setOffset(0); }}
              >
                <Text style={[styles.filterChipText, !filterLevel && { color: "#fff" }]}>Todos</Text>
              </TouchableOpacity>
              {LEVELS.map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[styles.filterChip, filterLevel === l && { backgroundColor: LEVEL_COLORS[l] }]}
                  onPress={() => { setFilterLevel(filterLevel === l ? "" : l); setOffset(0); }}
                >
                  <Text style={[styles.filterChipText, filterLevel === l && { color: "#fff" }]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Category filter */}
            <Text style={[styles.filterLabel, { color: colors.muted }]}>Categoria:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterChip, !filterCategory && { backgroundColor: colors.primary }]}
                onPress={() => { setFilterCategory(""); setOffset(0); }}
              >
                <Text style={[styles.filterChipText, !filterCategory && { color: "#fff" }]}>Todas</Text>
              </TouchableOpacity>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.filterChip, filterCategory === c && { backgroundColor: colors.primary }]}
                  onPress={() => { setFilterCategory(filterCategory === c ? "" : c); setOffset(0); }}
                >
                  <Text style={[styles.filterChipText, filterCategory === c && { color: "#fff" }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Stats bar */}
        {stats && !showFilters && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsBar}>
            <View style={[styles.statChip, { backgroundColor: "#EFF6FF" }]}>
              <Text style={[styles.statValue, { color: "#3B82F6" }]}>{stats.last_24h}</Text>
              <Text style={[styles.statLabel, { color: "#3B82F6" }]}>24h</Text>
            </View>
            {stats.by_level.map((s) => (
              <View key={s.level} style={[styles.statChip, { backgroundColor: LEVEL_BG[s.level as LogLevel] ?? "#F5F5F5" }]}>
                <Text style={[styles.statValue, { color: LEVEL_COLORS[s.level as LogLevel] ?? "#687076" }]}>{s.count}</Text>
                <Text style={[styles.statLabel, { color: LEVEL_COLORS[s.level as LogLevel] ?? "#687076" }]}>{s.level}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Log list */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Carregando logs...</Text>
        </View>
      ) : logs.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nenhum log encontrado</Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            {hasFilters ? "Tente ajustar os filtros" : "Os logs aparecerão aqui conforme o app for usado"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <LogItem
              log={item}
              onPress={() => {
                setSelectedLog(item);
                setShowDetail(true);
              }}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : logs.length < total ? (
              <TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore}>
                <Text style={[styles.loadMoreText, { color: colors.primary }]}>
                  Carregar mais ({total - logs.length} restantes)
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.endText, { color: colors.muted }]}>
                {total} log{total !== 1 ? "s" : ""} no total
              </Text>
            )
          }
        />
      )}

      {/* Detail Modal */}
      <LogDetailModal
        log={selectedLog}
        visible={showDetail}
        onClose={() => setShowDetail(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  headerSub: {
    fontSize: 13,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  filtersPanel: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 4,
  },
  filterRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#687076",
  },
  statsBar: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  statChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    alignItems: "center",
    minWidth: 52,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  listContent: {
    padding: 12,
    gap: 8,
  },
  logItem: {
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    marginBottom: 8,
  },
  logHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
    flexWrap: "wrap",
  },
  levelBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  levelText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  categoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: "rgba(0,0,0,0.07)",
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#374151",
  },
  platformBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  platformText: {
    fontSize: 10,
    color: "#6B7280",
  },
  logTime: {
    fontSize: 10,
    color: "#9CA3AF",
    marginLeft: "auto",
  },
  logMessage: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
  },
  logMeta: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 4,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: "center",
  },
  loadMoreBtn: {
    paddingVertical: 16,
    alignItems: "center",
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: "600",
  },
  endText: {
    textAlign: "center",
    fontSize: 12,
    paddingVertical: 16,
  },
  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  detailCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 14,
    lineHeight: 20,
  },
  detailSubValue: {
    fontSize: 12,
    marginTop: 2,
  },
  envGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  envItem: {
    minWidth: 80,
  },
  envKey: {
    fontSize: 11,
    marginBottom: 2,
  },
  envVal: {
    fontSize: 13,
    fontWeight: "600",
  },
  metadataText: {
    fontSize: 12,
    fontFamily: "monospace",
    lineHeight: 18,
  },
});
