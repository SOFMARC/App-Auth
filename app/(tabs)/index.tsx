import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCompany } from "@/lib/company-context";
import { useToast } from "@/lib/toast-context";
import { useColors } from "@/hooks/use-colors";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { CompanySelectorButton, CompanySelectorModal } from "@/components/ui/company-selector";

function Avatar({ name, size = 48 }: { name: string; size?: number }) {
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
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primary },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.38, color: "#fff" }]}>{initials}</Text>
    </View>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: string;
  color: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <IconSymbol name={icon as never} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

function AccessCard({
  companyName,
  appKey,
  roleName,
}: {
  companyName: string;
  appKey: string;
  roleName: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.accessCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.accessRow}>
        <View style={[styles.accessBadge, { backgroundColor: colors.primary + "15" }]}>
          <Text style={[styles.accessBadgeText, { color: colors.primary }]}>{appKey}</Text>
        </View>
        <Text style={[styles.accessRole, { color: colors.foreground }]}>{roleName}</Text>
      </View>
      <Text style={[styles.accessCompany, { color: colors.muted }]}>{companyName}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { user, companies: authCompanies, access, logout, isMaster } = useAuth();
  const { selectedCompany, refresh: refreshCompanies } = useCompany();
  const { showError } = useToast();
  const router = useRouter();
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [selectorVisible, setSelectorVisible] = useState(false);

  // Filtrar acessos pela empresa selecionada
  const filteredAccess = selectedCompany
    ? access.filter((a) => a.companyId === selectedCompany.id)
    : access;

  // Filtrar empresas do snapshot pela empresa selecionada
  const filteredCompanies = selectedCompany
    ? authCompanies.filter((c) => c.companyId === selectedCompany.id)
    : authCompanies;

  // Apps únicos nos acessos filtrados
  const uniqueApps = [...new Set(filteredAccess.map((a) => a.appKey))].length;

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      showError("Erro ao sair.");
    } finally {
      setLoggingOut(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await refreshCompanies();
    setTimeout(() => setRefreshing(false), 600);
  }

  const roles = user?.roles?.split(";").filter(Boolean) ?? [];

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.muted }]}>Bem-vindo,</Text>
            <Text style={[styles.userName, { color: colors.foreground }]}>
              {user?.nome ?? "Administrador"}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: colors.error + "15" }]}
            onPress={handleLogout}
            disabled={loggingOut}
            activeOpacity={0.7}
          >
            <IconSymbol name="arrow.right.square.fill" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>

        {/* Seletor de Empresa */}
        <View style={[styles.companySelectorRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.companySelectorLeft}>
            <IconSymbol name="building.2.fill" size={16} color={colors.muted} />
            <Text style={[styles.companySelectorLabel, { color: colors.muted }]}>Empresa ativa:</Text>
          </View>
          <CompanySelectorButton onPress={() => setSelectorVisible(true)} />
        </View>

        {/* Filtro ativo — indicador visual */}
        {selectedCompany && (
          <View style={[styles.filterBanner, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
            <IconSymbol name="building.fill" size={14} color={colors.primary} />
            <Text style={[styles.filterBannerText, { color: colors.primary }]} numberOfLines={1}>
              Filtrando por: <Text style={{ fontWeight: "700" }}>{selectedCompany.name}</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setSelectorVisible(true)}
              activeOpacity={0.7}
            >
              <IconSymbol name="pencil" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Perfil */}
        <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
          <Avatar name={user?.nome ?? "A"} size={56} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.nome}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.rolesRow}>
              {roles.map((role) => (
                <View key={role} style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{role}</Text>
                </View>
              ))}
            </View>
          </View>
          {isMaster && (
            <View style={styles.masterBadge}>
              <IconSymbol name="shield.fill" size={14} color="#FFD700" />
              <Text style={styles.masterBadgeText}>MASTER</Text>
            </View>
          )}
        </View>

        {/* Stats rápidas — baseadas nos dados filtrados */}
        <View style={styles.statsRow}>
          <StatCard
            label="Empresas"
            value={filteredCompanies.length}
            icon="building.2.fill"
            color={colors.primary}
          />
          <StatCard
            label="Acessos"
            value={filteredAccess.length}
            icon="key.fill"
            color={colors.success}
          />
          <StatCard
            label="Apps"
            value={uniqueApps}
            icon="square.grid.2x2.fill"
            color={colors.warning}
          />
        </View>

        {/* Empresas do snapshot filtradas */}
        {filteredCompanies.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {selectedCompany ? "Empresa Selecionada" : "Suas Empresas"}
            </Text>
            {filteredCompanies.map((c) => (
              <View
                key={c.companyId}
                style={[styles.companyItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[styles.companyIcon, { backgroundColor: colors.primary + "15" }]}>
                  <IconSymbol name="building.fill" size={18} color={colors.primary} />
                </View>
                <Text style={[styles.companyName, { color: colors.foreground }]}>{c.name}</Text>
                <Text style={[styles.companyId, { color: colors.muted }]}>ID: {c.companyId}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Acessos filtrados */}
        {filteredAccess.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {selectedCompany ? `Acessos em ${selectedCompany.name}` : "Seus Acessos"}
            </Text>
            {filteredAccess.map((a, idx) => (
              <AccessCard
                key={idx}
                companyName={a.companyName}
                appKey={a.appKey}
                roleName={a.roleName}
              />
            ))}
          </View>
        )}

        {/* Mensagem quando filtro não tem dados */}
        {selectedCompany && filteredAccess.length === 0 && filteredCompanies.length === 0 && (
          <View style={[styles.emptyFilter, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="building.fill" size={32} color={colors.muted} />
            <Text style={[styles.emptyFilterTitle, { color: colors.foreground }]}>
              Sem dados para esta empresa
            </Text>
            <Text style={[styles.emptyFilterSub, { color: colors.muted }]}>
              Você não possui acessos em {selectedCompany.name}
            </Text>
          </View>
        )}

        {/* Atalhos */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Gerenciar</Text>
          <View style={styles.shortcuts}>
            {[
              { label: "Usuários", icon: "person.2.fill", tab: "/(tabs)/users", color: "#3B82F6" },
              { label: "Empresas", icon: "building.2.fill", tab: "/(tabs)/companies", color: "#8B5CF6" },
              { label: "Apps", icon: "square.grid.2x2.fill", tab: "/(tabs)/apps", color: "#F59E0B" },
              { label: "Config", icon: "gearshape.fill", tab: "/(tabs)/settings", color: "#6B7280" },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.shortcut, { backgroundColor: item.color + "15", borderColor: item.color + "30" }]}
                onPress={() => router.push(item.tab as never)}
                activeOpacity={0.7}
              >
                <IconSymbol name={item.icon as never} size={26} color={item.color} />
                <Text style={[styles.shortcutLabel, { color: item.color }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Modal do seletor de empresa */}
      <CompanySelectorModal
        visible={selectorVisible}
        onClose={() => setSelectorVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { gap: 2 },
  greeting: { fontSize: 13 },
  userName: { fontSize: 22, fontWeight: "700" },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  companySelectorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  companySelectorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  companySelectorLabel: { fontSize: 13 },
  filterBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterBannerText: { flex: 1, fontSize: 13 },
  profileCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    position: "relative",
  },
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontWeight: "700" },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 17, fontWeight: "700", color: "#fff" },
  profileEmail: { fontSize: 12, color: "rgba(255,255,255,0.75)" },
  rolesRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  roleBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  masterBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  masterBadgeText: { color: "#FFD700", fontSize: 11, fontWeight: "700" },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { fontSize: 20, fontWeight: "700" },
  statLabel: { fontSize: 11, textAlign: "center" },
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  companyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  companyIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  companyName: { flex: 1, fontSize: 15, fontWeight: "600" },
  companyId: { fontSize: 12 },
  accessCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  accessRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  accessBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  accessBadgeText: { fontSize: 12, fontWeight: "700" },
  accessRole: { fontSize: 14, fontWeight: "600" },
  accessCompany: { fontSize: 12 },
  emptyFilter: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 10,
  },
  emptyFilterTitle: { fontSize: 16, fontWeight: "700" },
  emptyFilterSub: { fontSize: 13, textAlign: "center" },
  shortcuts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  shortcut: {
    width: "47%",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
  },
  shortcutLabel: { fontSize: 13, fontWeight: "600" },
});
