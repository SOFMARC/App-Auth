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
import { ScreenContainer } from "@/components/screen-container";
import { SearchBar } from "@/components/ui/search-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FAB } from "@/components/ui/fab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { App } from "@/lib/types/api";

function AppItem({ app, onPress }: { app: App; onPress: () => void }) {
  const colors = useColors();
  const appColors = ["#F59E0B", "#3B82F6", "#10B981", "#EF4444", "#8B5CF6", "#EC4899"];
  const colorIndex = app.id % appColors.length;
  const appColor = appColors[colorIndex];

  return (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
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
        <IconSymbol name="chevron.right" size={16} color={colors.muted} />
      </View>
    </TouchableOpacity>
  );
}

export default function AppsScreen() {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const colors = useColors();

  const { data: apps = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["apps", search],
    queryFn: () => appsApi.list({ q: search || undefined }),
  });

  const renderItem = useCallback(
    ({ item }: { item: App }) => (
      <AppItem app={item} onPress={() => router.push(`/apps/${item.id}` as never)} />
    ),
    [router]
  );

  return (
    <ScreenContainer>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Apps</Text>
        <View style={[styles.countBadge, { backgroundColor: "#F59E0B20" }]}>
          <Text style={[styles.countText, { color: "#F59E0B" }]}>{apps.length}</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar app..." />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={apps}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, apps.length === 0 && styles.listEmpty]}
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    gap: 10,
  },
  title: { fontSize: 22, fontWeight: "700", flex: 1 },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countText: { fontSize: 13, fontWeight: "700" },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  listEmpty: { flexGrow: 1 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
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
  itemRight: { alignItems: "center", gap: 6 },
});
