import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appsApi, extractErrorMessage } from "@/lib/api";
import { useColors } from "@/hooks/use-colors";
import { useToast } from "@/lib/toast-context";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/ui/screen-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function AppDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const [confirmToggle, setConfirmToggle] = useState(false);

  const { data: app, isLoading } = useQuery({
    queryKey: ["app", id],
    queryFn: () => appsApi.get(Number(id)),
    enabled: !!id,
  });

  const toggleStatus = useMutation({
    mutationFn: () => appsApi.setStatus(Number(id), !app?.ativo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app", id] });
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      showSuccess(app?.ativo ? "App inativado." : "App ativado.");
      setConfirmToggle(false);
    },
    onError: (err) => {
      showError(extractErrorMessage(err));
      setConfirmToggle(false);
    },
  });

  if (isLoading) {
    return (
      <ScreenContainer>
        <ScreenHeader title="App" />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!app) {
    return (
      <ScreenContainer>
        <ScreenHeader title="App" />
        <View style={styles.loading}>
          <Text style={{ color: colors.muted }}>App não encontrado.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const appColors = ["#F59E0B", "#3B82F6", "#10B981", "#EF4444", "#8B5CF6", "#EC4899"];
  const appColor = appColors[app.id % appColors.length];

  return (
    <ScreenContainer>
      <ScreenHeader
        title={app.name}
        rightAction={{
          icon: "pencil",
          onPress: () => router.push(`/apps/${id}/edit` as never),
        }}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.heroSection, { backgroundColor: appColor }]}>
          <View style={[styles.heroIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Text style={styles.heroKey}>{app.key.slice(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={styles.heroName}>{app.name}</Text>
          <Text style={styles.heroKeyFull}>{app.key}</Text>
          <StatusBadge active={app.ativo} />
        </View>

        {/* Informações */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Informações</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>ID</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{app.id}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>Nome</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{app.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>Chave (Key)</Text>
            <Text style={[styles.infoValue, { color: appColor, fontWeight: "700" }]}>{app.key}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>Status</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>
              {app.ativo ? "Ativo" : "Inativo"}
            </Text>
          </View>
        </View>

        {/* Ações */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Ações</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: appColor + "15", borderColor: appColor + "30" }]}
              onPress={() => router.push(`/apps/${id}/edit` as never)}
              activeOpacity={0.7}
            >
              <IconSymbol name="pencil" size={20} color={appColor} />
              <Text style={[styles.actionLabel, { color: appColor }]}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}
              onPress={() => router.push(`/apps/${id}/roles` as never)}
              activeOpacity={0.7}
            >
              <IconSymbol name="shield.fill" size={20} color={colors.primary} />
              <Text style={[styles.actionLabel, { color: colors.primary }]}>Roles</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: (app.ativo ? colors.error : colors.success) + "15",
                  borderColor: (app.ativo ? colors.error : colors.success) + "30",
                },
              ]}
              onPress={() => setConfirmToggle(true)}
              disabled={toggleStatus.isPending}
              activeOpacity={0.7}
            >
              {toggleStatus.isPending ? (
                <ActivityIndicator size="small" color={app.ativo ? colors.error : colors.success} />
              ) : (
                <IconSymbol
                  name={app.ativo ? "xmark.circle.fill" : "checkmark.circle.fill"}
                  size={20}
                  color={app.ativo ? colors.error : colors.success}
                />
              )}
              <Text style={[styles.actionLabel, { color: app.ativo ? colors.error : colors.success }]}>
                {app.ativo ? "Inativar" : "Ativar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmToggle}
        title={app.ativo ? "Inativar App" : "Ativar App"}
        message={`Deseja ${app.ativo ? "inativar" : "ativar"} o app "${app.name}"?`}
        confirmLabel={app.ativo ? "Inativar" : "Ativar"}
        destructive={app.ativo}
        loading={toggleStatus.isPending}
        onConfirm={() => toggleStatus.mutate()}
        onCancel={() => setConfirmToggle(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { gap: 16, paddingBottom: 40 },
  heroSection: { alignItems: "center", padding: 28, gap: 8 },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  heroKey: { color: "#fff", fontSize: 28, fontWeight: "800" },
  heroName: { color: "#fff", fontSize: 22, fontWeight: "700" },
  heroKeyFull: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  card: { marginHorizontal: 16, borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: "600" },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionBtn: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionLabel: { fontSize: 13, fontWeight: "600" },
});
