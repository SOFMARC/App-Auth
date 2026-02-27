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
import { companiesApi, extractErrorMessage } from "@/lib/api";
import { useColors } from "@/hooks/use-colors";
import { useToast } from "@/lib/toast-context";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/ui/screen-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function CompanyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const [confirmToggle, setConfirmToggle] = useState(false);

  const { data: company, isLoading } = useQuery({
    queryKey: ["company", id],
    queryFn: () => companiesApi.get(Number(id)),
    enabled: !!id,
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header visual */}
        <View style={[styles.heroSection, { backgroundColor: "#8B5CF6" }]}>
          <View style={styles.heroIcon}>
            <IconSymbol name="building.fill" size={40} color="#fff" />
          </View>
          <Text style={styles.heroName}>{company.name}</Text>
          <Text style={styles.heroId}>ID: {company.id}</Text>
          <StatusBadge active={company.ativo} />
        </View>

        {/* Informações */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Informações</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>ID</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{company.id}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>Nome</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{company.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>Status</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>
              {company.ativo ? "Ativa" : "Inativa"}
            </Text>
          </View>
        </View>

        {/* Ações */}
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
              style={[
                styles.actionBtn,
                {
                  backgroundColor: (company.ativo ? colors.error : colors.success) + "15",
                  borderColor: (company.ativo ? colors.error : colors.success) + "30",
                },
              ]}
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
              <Text
                style={[
                  styles.actionLabel,
                  { color: company.ativo ? colors.error : colors.success },
                ]}
              >
                {company.ativo ? "Inativar" : "Ativar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { gap: 16, paddingBottom: 40 },
  heroSection: {
    alignItems: "center",
    padding: 28,
    gap: 8,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  heroName: { color: "#fff", fontSize: 22, fontWeight: "700" },
  heroId: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
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
});
