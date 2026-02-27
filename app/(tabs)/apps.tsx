import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { appsApi } from "@/lib/api";
import { useColors } from "@/hooks/use-colors";
import { useCompany } from "@/lib/company-context";
import { useAuth } from "@/lib/auth-context";
import { ScreenContainer } from "@/components/screen-container";
import { SearchBar } from "@/components/ui/search-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FAB } from "@/components/ui/fab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { CompanySelectorButton, CompanySelectorModal } from "@/components/ui/company-selector";
import type { App } from "@/lib/types/api";

const APP_COLORS = ["#F59E0B", "#3B82F6", "#10B981", "#EF4444", "#8B5CF6", "#EC4899"];

function AppItem({
  app,
  hasAccess,
  onPress,
}: {
  app: App;
  hasAccess: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const appColor = APP_COLORS[app.id % APP_COLORS.length];

  return (
    <TouchableOpacity
      style={[
        styles.item,
        {
          backgroundColor: colors.surface,
          borderColor: hasAccess ? appColor + "40" : colors.border,
          borderWidth: hasAccess ? 1.5 : 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.itemIcon, { backgroundColor: appColor + "20" }]}>
        <Text style={[styles.itemKey, { color: appColor }]}>
          {app.key.slice(0, 2).toUpperCase()}
        </Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
          {app.name}
        </Text>
        <Text style={[styles.itemKeyFull, { color: colors.muted }]}>{app.key}</Text>
      </View>
      <View style={styles.itemRight}>
        <StatusBadge active={app.ativo} size="sm" />
        {hasAccess && (
          <View style={[styles.accessBadge, { backgroundColor: appColor + "20" }]}>
            <IconSymbol name="key.fill" size={10} color={appColor} />
            <Text style={[styles.accessBadgeText, { color: appColor }]}>Acesso</Text>
          </View>
        )}
        <IconSymbol name="chevron.right" size={16} color={colors.muted} />
      </View>
    </TouchableOpacity>
  );
}

export default function AppsScreen() {
  const [search, setSearch] = useState("");
  const [selectorVisible, setSelectorVisible] = useState(false);
  const router = useRouter();
  const colors = useColors();
  const { selectedCompany } = useCompany();
  const { access } = useAuth();

  const { data: apps = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["apps", search],
    queryFn: () => appsApi.list({ q: search || undefined }),
  });

  // Determinar quais apps têm acesso na empresa selecionada
  const accessibleAppKeys = selectedCompany
    ? new Set(
        access
          .filter((a) => a.companyId === selectedCompany.id)
          .map((a) => a.appKey)
      )
    : new Set<string>();

  // Quando há empresa selecionada, ordenar: apps com acesso primeiro
  const sortedApps = selectedCompany
    ? [
        ...apps.filter((a) => accessibleAppKeys.has(a.key)),
        ...apps.filter((a) => !accessibleAppKeys.has(a.key)),
      ]
    : apps;

  const renderItem = useCallback(
    ({ item }: { item: App }) => (
      <AppItem
        app={item}
        hasAccess={accessibleAppKeys.has(item.key)}
        onPress={() => router.push(`/apps/${item.id}` as never)}
      />
    ),
    [router, accessibleAppKeys]
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.foreground }]}>Apps</Text>
          <View style={[styles.countBadge, { backgroundColor: "#F59E0B20" }]}>
            <Text style={[styles.countText, { color: "#F59E0B" }]}>{sortedApps.length}</Text>
          </View>
        </View>
        <CompanySelectorButton onPress={() => setSelectorVisible(true)} />
      </View>

      {/* Indicador de empresa ativa */}
      {selectedCompany && (
        <View style={[styles.filterBar, { backgroundColor: colors.primary + "10", borderBottomColor: colors.primary + "20" }]}>
          <IconSymbol name="building.fill" size={13} color={colors.primary} />
          <Text style={[styles.filterBarText, { color: colors.primary }]} numberOfLines={1}>
            Acessos em: <Text style={{ fontWeight: "700" }}>{selectedCompany.name}</Text>
          </Text>
          {accessibleAppKeys.size > 0 && (
            <View style={[styles.accessCountBadge, { backgroundColor: colors.primary + "20" }]}>
              <Text style={[styles.accessCountText, { color: colors.primary }]}>
                {accessibleAppKeys.size} com acesso
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Busca */}
      <View style={styles.searchContainer}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar app..." />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={sortedApps}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, sortedApps.length === 0 && styles.listEmpty]}
          ListEmptyComponent={
            <EmptyState
              icon="square.grid.2x2.fill"
              title="Nenhum app encontrado"
              subtitle={search ? `Sem resultados para "${search}"` : "Crie o primeiro app"}
            />
          }
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}

      <FAB onPress={() => router.push("/apps/new" as never)} color="#F59E0B" />

      <CompanySelectorModal
        visible={selectorVisible}
        onClose={() => setSelectorVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    gap: 10,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: { fontSize: 22, fontWeight: "700" },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countText: { fontSize: 13, fontWeight: "700" },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    flexWrap: "wrap",
  },
  filterBarText: { fontSize: 12 },
  accessCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  accessCountText: { fontSize: 11, fontWeight: "700" },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  listEmpty: { flexGrow: 1 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  itemKey: { fontSize: 16, fontWeight: "800" },
  itemInfo: { flex: 1, gap: 3 },
  itemName: { fontSize: 15, fontWeight: "600" },
  itemKeyFull: { fontSize: 12 },
  itemRight: { alignItems: "center", gap: 4 },
  accessBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  accessBadgeText: { fontSize: 10, fontWeight: "700" },
});
