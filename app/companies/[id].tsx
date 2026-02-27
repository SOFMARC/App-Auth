import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companiesApi, appsApi, usersApi, rolesApi, iamApi, extractErrorMessage } from "@/lib/api";
import { useColors } from "@/hooks/use-colors";
import { useToast } from "@/lib/toast-context";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/ui/screen-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { App, AppRole, User } from "@/lib/types/api";

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type Tab = "info" | "apps" | "users";

// ─── GrantModal ───────────────────────────────────────────────────────────────
function GrantAccessModal({
  visible,
  companyId,
  user,
  apps,
  onClose,
}: {
  visible: boolean;
  companyId: number;
  user: User | null;
  apps: App[];
  onClose: () => void;
}) {
  const colors = useColors();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);

  const { data: roles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ["roles", selectedApp?.id],
    queryFn: () => rolesApi.list(selectedApp!.id),
    enabled: !!selectedApp,
  });

  const grant = useMutation({
    mutationFn: () =>
      iamApi.grant({
        userId: user!.id,
        companyId,
        appKey: selectedApp!.key,
        roleKey: selectedRole!.key,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-users", companyId] });
      showSuccess(`Acesso concedido: ${user?.nome} → ${selectedApp?.name} (${selectedRole?.name})`);
      setSelectedApp(null);
      setSelectedRole(null);
      onClose();
    },
    onError: (err) => showError(extractErrorMessage(err)),
  });

  if (!visible || !user) return null;

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose} activeOpacity={1} />
      <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
        <Text style={[styles.modalTitle, { color: colors.foreground }]}>
          Conceder Acesso
        </Text>
        <Text style={[styles.modalSubtitle, { color: colors.muted }]}>
          Usuário: <Text style={{ fontWeight: "700", color: colors.foreground }}>{user.nome}</Text>
        </Text>

        <Text style={[styles.modalLabel, { color: colors.muted }]}>Selecione o App</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {apps.map((app) => (
            <TouchableOpacity
              key={app.id}
              style={[
                styles.chip,
                { borderColor: colors.border, backgroundColor: colors.background },
                selectedApp?.id === app.id && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => { setSelectedApp(app); setSelectedRole(null); }}
            >
              <Text style={[styles.chipText, { color: selectedApp?.id === app.id ? "#fff" : colors.foreground }]}>
                {app.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedApp && (
          <>
            <Text style={[styles.modalLabel, { color: colors.muted }]}>Selecione o Perfil (Role)</Text>
            {loadingRoles ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {roles.map((role) => (
                  <TouchableOpacity
                    key={role.id}
                    style={[
                      styles.chip,
                      { borderColor: colors.border, backgroundColor: colors.background },
                      selectedRole?.id === role.id && { backgroundColor: "#8B5CF6", borderColor: "#8B5CF6" },
                    ]}
                    onPress={() => setSelectedRole(role)}
                  >
                    <Text style={[styles.chipText, { color: selectedRole?.id === role.id ? "#fff" : colors.foreground }]}>
                      {role.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </>
        )}

        <TouchableOpacity
          style={[
            styles.modalBtn,
            { backgroundColor: colors.primary },
            (!selectedApp || !selectedRole || grant.isPending) && { opacity: 0.5 },
          ]}
          onPress={() => grant.mutate()}
          disabled={!selectedApp || !selectedRole || grant.isPending}
          activeOpacity={0.8}
        >
          {grant.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.modalBtnText}>Conceder Acesso</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CompanyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [confirmToggle, setConfirmToggle] = useState(false);
  const [grantUser, setGrantUser] = useState<User | null>(null);

  const { data: company, isLoading } = useQuery({
    queryKey: ["company", id],
    queryFn: () => companiesApi.get(Number(id)),
    enabled: !!id,
  });

  const { data: apps = [], isLoading: loadingApps } = useQuery({
    queryKey: ["apps"],
    queryFn: () => appsApi.list(),
    enabled: activeTab === "apps",
  });

  const { data: users = [], isLoading: loadingUsers, refetch: refetchUsers, isRefetching: isRefetchingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list({ take: 200 }),
    enabled: activeTab === "users",
  });

  const toggleStatus = useMutation({
    mutationFn: () => companiesApi.setStatus(Number(id), !company?.ativo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company", id] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      showSuccess(company?.ativo ? "Empresa inativada." : "Empresa ativada.");
      setConfirmToggle(false);
    },
    onError: (err) => {
      showError(extractErrorMessage(err));
      setConfirmToggle(false);
    },
  });

  const removeUser = useMutation({
    mutationFn: (userId: number) => companiesApi.removeUser(Number(id), userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showSuccess("Usuário removido da empresa.");
    },
    onError: (err) => showError(extractErrorMessage(err)),
  });

  const addUser = useMutation({
    mutationFn: (userId: number) => companiesApi.addUser(Number(id), userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showSuccess("Usuário vinculado à empresa.");
    },
    onError: (err) => showError(extractErrorMessage(err)),
  });

  const renderUserItem = useCallback(({ item }: { item: User }) => {
    const displayName = item.nome ?? (item as User & { name?: string }).name ?? "(sem nome)";
    const initials = displayName.split(" ").slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? "").join("") || "?";
    return (
      <View style={[styles.userItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.userAvatar, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[styles.userInitials, { color: colors.primary }]}>{initials}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.foreground }]} numberOfLines={1}>{displayName}</Text>
          <Text style={[styles.userEmail, { color: colors.muted }]} numberOfLines={1}>{item.email}</Text>
          {item.globalRoles && (
            <Text style={[styles.userRole, { color: colors.primary }]} numberOfLines={1}>{item.globalRoles}</Text>
          )}
        </View>
        <View style={styles.userActions}>
          <TouchableOpacity
            style={[styles.userActionBtn, { backgroundColor: colors.primary + "15" }]}
            onPress={() => setGrantUser(item)}
          >
            <IconSymbol name="key.fill" size={14} color={colors.primary} />
            <Text style={[styles.userActionText, { color: colors.primary }]}>Acesso</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.userActionBtn, { backgroundColor: colors.error + "15" }]}
            onPress={() => removeUser.mutate(item.id)}
          >
            <IconSymbol name="xmark" size={14} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [colors, removeUser]);

  if (isLoading) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Empresa" />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!company) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Empresa" />
        <View style={styles.loading}>
          <Text style={{ color: colors.muted }}>Empresa não encontrada.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScreenHeader
        title={company.name}
        rightAction={{
          icon: "pencil",
          onPress: () => router.push(`/companies/${id}/edit` as never),
        }}
      />

      {/* Hero */}
      <View style={[styles.heroSection, { backgroundColor: "#8B5CF6" }]}>
        <View style={styles.heroIcon}>
          <IconSymbol name="building.fill" size={36} color="#fff" />
        </View>
        <Text style={styles.heroName}>{company.name}</Text>
        <View style={styles.heroMeta}>
          <Text style={styles.heroId}>ID: {company.id}</Text>
          <StatusBadge active={company.ativo} />
        </View>
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(["info", "apps", "users"] as Tab[]).map((tab) => {
          const labels: Record<Tab, string> = { info: "Informações", apps: "Apps", users: "Usuários" };
          const icons: Record<Tab, string> = { info: "info.circle.fill", apps: "square.grid.2x2.fill", users: "person.2.fill" };
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, active && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <IconSymbol name={icons[tab] as never} size={16} color={active ? colors.primary : colors.muted} />
              <Text style={[styles.tabLabel, { color: active ? colors.primary : colors.muted }]}>
                {labels[tab]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tab Content */}
      {activeTab === "info" && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Detalhes</Text>
            <InfoRow label="ID" value={String(company.id)} colors={colors} />
            <InfoRow label="Nome" value={company.name} colors={colors} />
            <InfoRow label="Status" value={company.ativo ? "Ativa" : "Inativa"} colors={colors} />
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Ações</Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#8B5CF615", borderColor: "#8B5CF630" }]}
                onPress={() => router.push(`/companies/${id}/edit` as never)}
                activeOpacity={0.7}
              >
                <IconSymbol name="pencil" size={20} color="#8B5CF6" />
                <Text style={[styles.actionLabel, { color: "#8B5CF6" }]}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, {
                  backgroundColor: (company.ativo ? colors.error : colors.success) + "15",
                  borderColor: (company.ativo ? colors.error : colors.success) + "30",
                }]}
                onPress={() => setConfirmToggle(true)}
                disabled={toggleStatus.isPending}
                activeOpacity={0.7}
              >
                {toggleStatus.isPending ? (
                  <ActivityIndicator size="small" color={company.ativo ? colors.error : colors.success} />
                ) : (
                  <IconSymbol
                    name={company.ativo ? "xmark.circle.fill" : "checkmark.circle.fill"}
                    size={20}
                    color={company.ativo ? colors.error : colors.success}
                  />
                )}
                <Text style={[styles.actionLabel, { color: company.ativo ? colors.error : colors.success }]}>
                  {company.ativo ? "Inativar" : "Ativar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {activeTab === "apps" && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.infoBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
            <IconSymbol name="info.circle.fill" size={16} color={colors.primary} />
            <Text style={[styles.infoBoxText, { color: colors.primary }]}>
              Apps disponíveis no sistema. Para vincular um usuário a um app nesta empresa, vá à aba Usuários e toque em "Acesso".
            </Text>
          </View>
          {loadingApps ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : apps.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="square.grid.2x2.fill" size={40} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.muted }]}>Nenhum app cadastrado</Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/apps/new" as never)}
              >
                <Text style={styles.emptyBtnText}>Criar App</Text>
              </TouchableOpacity>
            </View>
          ) : (
            apps.map((app) => (
              <TouchableOpacity
                key={app.id}
                style={[styles.appItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => router.push(`/apps/${app.id}` as never)}
                activeOpacity={0.7}
              >
                <View style={[styles.appIcon, { backgroundColor: colors.primary + "15" }]}>
                  <IconSymbol name="square.grid.2x2.fill" size={22} color={colors.primary} />
                </View>
                <View style={styles.appInfo}>
                  <Text style={[styles.appName, { color: colors.foreground }]}>{app.name}</Text>
                  <Text style={[styles.appKey, { color: colors.muted }]}>{app.key}</Text>
                </View>
                <View style={styles.appRight}>
                  <StatusBadge active={app.ativo} size="sm" />
                  <IconSymbol name="chevron.right" size={14} color={colors.muted} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {activeTab === "users" && (
        <View style={{ flex: 1 }}>
          <View style={[styles.usersHeader, { borderBottomColor: colors.border }]}>
            <View style={[styles.infoBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30", margin: 0, flex: 1 }]}>
              <IconSymbol name="info.circle.fill" size={14} color={colors.primary} />
              <Text style={[styles.infoBoxText, { color: colors.primary, fontSize: 12 }]}>
                Toque em "Acesso" para conceder permissão a um app desta empresa.
              </Text>
            </View>
          </View>
          {loadingUsers ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={users}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderUserItem}
              contentContainerStyle={styles.userList}
              refreshControl={
                <RefreshControl refreshing={isRefetchingUsers} onRefresh={refetchUsers} tintColor={colors.primary} />
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <IconSymbol name="person.2.fill" size={40} color={colors.muted} />
                  <Text style={[styles.emptyTitle, { color: colors.muted }]}>Nenhum usuário</Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            />
          )}
        </View>
      )}

      <ConfirmDialog
        visible={confirmToggle}
        title={company.ativo ? "Inativar Empresa" : "Ativar Empresa"}
        message={`Deseja ${company.ativo ? "inativar" : "ativar"} a empresa "${company.name}"?`}
        confirmLabel={company.ativo ? "Inativar" : "Ativar"}
        destructive={company.ativo}
        loading={toggleStatus.isPending}
        onConfirm={() => toggleStatus.mutate()}
        onCancel={() => setConfirmToggle(false)}
      />

      <GrantAccessModal
        visible={!!grantUser}
        companyId={Number(id)}
        user={grantUser}
        apps={apps.length > 0 ? apps : []}
        onClose={() => setGrantUser(null)}
      />
    </ScreenContainer>
  );
}

function InfoRow({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  heroSection: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 6,
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  heroName: { color: "#fff", fontSize: 20, fontWeight: "700" },
  heroMeta: { flexDirection: "row", alignItems: "center", gap: 10 },
  heroId: { color: "rgba(255,255,255,0.7)", fontSize: 12 },

  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabLabel: { fontSize: 12, fontWeight: "600" },

  content: { gap: 16, padding: 16, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: "600" },
  actionsRow: { flexDirection: "row", gap: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionLabel: { fontSize: 13, fontWeight: "600" },

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    margin: 16,
  },
  infoBoxText: { flex: 1, fontSize: 13, lineHeight: 18 },

  appItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  appIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  appInfo: { flex: 1, gap: 3 },
  appName: { fontSize: 15, fontWeight: "600" },
  appKey: { fontSize: 12 },
  appRight: { alignItems: "center", gap: 6 },

  usersHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    gap: 8,
  },
  userList: { padding: 16, paddingBottom: 100 },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  userInitials: { fontSize: 15, fontWeight: "700" },
  userInfo: { flex: 1, gap: 2 },
  userName: { fontSize: 14, fontWeight: "600" },
  userEmail: { fontSize: 12 },
  userRole: { fontSize: 11, fontWeight: "600" },
  userActions: { flexDirection: "row", gap: 6 },
  userActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  userActionText: { fontSize: 12, fontWeight: "600" },

  emptyState: { alignItems: "center", gap: 12, paddingTop: 40 },
  emptyTitle: { fontSize: 15, fontWeight: "600" },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  emptyBtnText: { color: "#fff", fontWeight: "600" },

  // Modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 14,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalSubtitle: { fontSize: 14, marginTop: -6 },
  modalLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  chipRow: { flexGrow: 0 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  modalBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  modalBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
