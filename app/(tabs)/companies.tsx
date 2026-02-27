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
import { useCompany } from "@/lib/company-context";
import { ScreenContainer } from "@/components/screen-container";
import { SearchBar } from "@/components/ui/search-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FAB } from "@/components/ui/fab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { CompanySelectorButton, CompanySelectorModal } from "@/components/ui/company-selector";
import type { Company } from "@/lib/types/api";

function CompanyItem({
  company,
  isActive,
  onPress,
}: {
  company: Company;
  isActive: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[
        styles.item,
        {
          backgroundColor: isActive ? colors.primary + "10" : colors.surface,
          borderColor: isActive ? colors.primary + "50" : colors.border,
          borderWidth: isActive ? 1.5 : 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.itemIcon,
          { backgroundColor: isActive ? colors.primary + "25" : colors.primary + "15" },
        ]}
      >
        <IconSymbol name="building.fill" size={22} color={colors.primary} />
      </View>
      <View style={styles.itemInfo}>
        <Text
          style={[styles.itemName, { color: colors.foreground, fontWeight: isActive ? "700" : "600" }]}
          numberOfLines={1}
        >
          {company.name}
        </Text>
        <Text style={[styles.itemId, { color: colors.muted }]}>ID: {company.id}</Text>
      </View>
      <View style={styles.itemRight}>
        <StatusBadge active={company.ativo} size="sm" />
        {isActive ? (
          <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.activeBadgeText}>Ativa</Text>
          </View>
        ) : (
          <IconSymbol name="chevron.right" size={16} color={colors.muted} />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function CompaniesScreen() {
  const [search, setSearch] = useState("");
  const [selectorVisible, setSelectorVisible] = useState(false);
  const router = useRouter();
  const colors = useColors();
  const { selectedCompany } = useCompany();

  const { data: allCompanies = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["companies", search],
    queryFn: () => companiesApi.list({ q: search || undefined }),
  });

  // Quando há empresa selecionada, exibir apenas ela no topo + restante abaixo
  const companies = selectedCompany
    ? [
        ...allCompanies.filter((c) => c.id === selectedCompany.id),
        ...allCompanies.filter((c) => c.id !== selectedCompany.id),
      ]
    : allCompanies;

  const renderItem = useCallback(
    ({ item }: { item: Company }) => (
      <CompanyItem
        company={item}
        isActive={selectedCompany?.id === item.id}
        onPress={() => router.push(`/companies/${item.id}` as never)}
      />
    ),
    [router, selectedCompany]
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.foreground }]}>Empresas</Text>
          <View style={[styles.countBadge, { backgroundColor: colors.primary + "15" }]}>
            <Text style={[styles.countText, { color: colors.primary }]}>{companies.length}</Text>
          </View>
        </View>
        <CompanySelectorButton onPress={() => setSelectorVisible(true)} />
      </View>

      {/* Indicador de empresa ativa */}
      {selectedCompany && (
        <View style={[styles.filterBar, { backgroundColor: colors.primary + "10", borderBottomColor: colors.primary + "20" }]}>
          <IconSymbol name="building.fill" size={13} color={colors.primary} />
          <Text style={[styles.filterBarText, { color: colors.primary }]} numberOfLines={1}>
            Empresa ativa: <Text style={{ fontWeight: "700" }}>{selectedCompany.name}</Text>
          </Text>
        </View>
      )}

      {/* Busca */}
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
  },
  filterBarText: { fontSize: 12 },
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
  itemInfo: { flex: 1, gap: 3 },
  itemName: { fontSize: 15 },
  itemId: { fontSize: 12 },
  itemRight: { alignItems: "center", gap: 6 },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activeBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
});
