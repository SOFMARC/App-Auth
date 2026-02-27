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
import { companiesApi } from "@/lib/api";
import { useColors } from "@/hooks/use-colors";
import { ScreenContainer } from "@/components/screen-container";
import { SearchBar } from "@/components/ui/search-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FAB } from "@/components/ui/fab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { Company } from "@/lib/types/api";

function CompanyItem({ company, onPress }: { company: Company; onPress: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.itemIcon, { backgroundColor: colors.primary + "15" }]}>
        <IconSymbol name="building.fill" size={22} color={colors.primary} />
      </View>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
          {company.name}
        </Text>
        <Text style={[styles.itemId, { color: colors.muted }]}>ID: {company.id}</Text>
      </View>
      <View style={styles.itemRight}>
        <StatusBadge active={company.ativo} size="sm" />
        <IconSymbol name="chevron.right" size={16} color={colors.muted} />
      </View>
    </TouchableOpacity>
  );
}

export default function CompaniesScreen() {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const colors = useColors();

  const { data: companies = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["companies", search],
    queryFn: () => companiesApi.list({ q: search || undefined }),
  });

  const renderItem = useCallback(
    ({ item }: { item: Company }) => (
      <CompanyItem
        company={item}
        onPress={() => router.push(`/companies/${item.id}` as never)}
      />
    ),
    [router]
  );

  return (
    <ScreenContainer>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Empresas</Text>
        <View style={[styles.countBadge, { backgroundColor: colors.primary + "15" }]}>
          <Text style={[styles.countText, { color: colors.primary }]}>{companies.length}</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar empresa..." />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={companies}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, companies.length === 0 && styles.listEmpty]}
          ListEmptyComponent={
            <EmptyState
              icon="building.2.fill"
              title="Nenhuma empresa encontrada"
              subtitle={search ? `Sem resultados para "${search}"` : "Crie a primeira empresa"}
            />
          }
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}

      <FAB onPress={() => router.push("/companies/new" as never)} />
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
  itemInfo: { flex: 1, gap: 3 },
  itemName: { fontSize: 15, fontWeight: "600" },
  itemId: { fontSize: 12 },
  itemRight: { alignItems: "center", gap: 6 },
});
