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
import { usersApi } from "@/lib/api";
import { useColors } from "@/hooks/use-colors";
import { ScreenContainer } from "@/components/screen-container";
import { SearchBar } from "@/components/ui/search-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FAB } from "@/components/ui/fab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { User } from "@/lib/types/api";

function UserAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const colors = useColors();
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primary + "20" },
      ]}
    >
      <Text style={[styles.avatarText, { color: colors.primary, fontSize: size * 0.38 }]}>
        {initials}
      </Text>
    </View>
  );
}

function UserItem({ user, onPress }: { user: User; onPress: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <UserAvatar name={user.nome} />
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
          {user.nome}
        </Text>
        <Text style={[styles.itemEmail, { color: colors.muted }]} numberOfLines={1}>
          {user.email}
        </Text>
        {user.globalRoles && (
          <Text style={[styles.itemRoles, { color: colors.primary }]} numberOfLines={1}>
            {user.globalRoles}
          </Text>
        )}
      </View>
      <View style={styles.itemRight}>
        <StatusBadge active={user.ativo} size="sm" />
        <IconSymbol name="chevron.right" size={16} color={colors.muted} />
      </View>
    </TouchableOpacity>
  );
}

export default function UsersScreen() {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const colors = useColors();

  const { data: users = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["users", search],
    queryFn: () => usersApi.list({ q: search || undefined, take: 100 }),
  });

  const renderItem = useCallback(
    ({ item }: { item: User }) => (
      <UserItem
        user={item}
        onPress={() => router.push(`/users/${item.id}` as never)}
      />
    ),
    [router]
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Usuários</Text>
        <View style={[styles.countBadge, { backgroundColor: colors.primary + "15" }]}>
          <Text style={[styles.countText, { color: colors.primary }]}>{users.length}</Text>
        </View>
      </View>

      {/* Busca */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nome ou e-mail..."
        />
      </View>

      {/* Lista */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            users.length === 0 && styles.listEmpty,
          ]}
          ListEmptyComponent={
            <EmptyState
              icon="person.2.fill"
              title="Nenhum usuário encontrado"
              subtitle={search ? `Sem resultados para "${search}"` : "Crie o primeiro usuário"}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}

      <FAB onPress={() => router.push("/users/new" as never)} />
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
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: { fontSize: 13, fontWeight: "700" },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  listEmpty: {
    flexGrow: 1,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontWeight: "700" },
  itemInfo: { flex: 1, gap: 3 },
  itemName: { fontSize: 15, fontWeight: "600" },
  itemEmail: { fontSize: 12 },
  itemRoles: { fontSize: 11, fontWeight: "600" },
  itemRight: {
    alignItems: "center",
    gap: 6,
  },
});
