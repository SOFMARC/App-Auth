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
import { usersApi, extractErrorMessage } from "@/lib/api";
import { useColors } from "@/hooks/use-colors";
import { useToast } from "@/lib/toast-context";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/ui/screen-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconSymbol } from "@/components/ui/icon-symbol";

function InfoRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  color,
  loading,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
  loading?: boolean;
}) {
  const colors = useColors();
  const btnColor = color ?? colors.primary;
  return (
    <TouchableOpacity
      style={[styles.actionBtn, { backgroundColor: btnColor + "15", borderColor: btnColor + "30" }]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={btnColor} />
      ) : (
        <IconSymbol name={icon as never} size={20} color={btnColor} />
      )}
      <Text style={[styles.actionLabel, { color: btnColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const [confirmToggle, setConfirmToggle] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => usersApi.get(Number(id)),
    enabled: !!id,
  });

  const toggleStatus = useMutation({
    mutationFn: () => usersApi.setStatus(Number(id), !user?.ativo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showSuccess(user?.ativo ? "Usuário inativado." : "Usuário ativado.");
      setConfirmToggle(false);
    },
    onError: (err) => {
      showError(extractErrorMessage(err));
      setConfirmToggle(false);
    },
  });

  const resetPassword = useMutation({
    mutationFn: () => usersApi.resetPassword(Number(id), { newPassword: "Mudar@123" }),
    onSuccess: () => {
      showSuccess("Senha redefinida para: Mudar@123");
      setConfirmReset(false);
    },
    onError: (err) => {
      showError(extractErrorMessage(err));
      setConfirmReset(false);
    },
  });

  if (isLoading) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Usuário" />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!user) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Usuário" />
        <View style={styles.loading}>
          <Text style={{ color: colors.muted }}>Usuário não encontrado.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const roles = user.globalRoles?.split(";").filter(Boolean) ?? [];

  return (
    <ScreenContainer>
      <ScreenHeader
        title={user.nome}
        subtitle={user.email}
        rightAction={{
          icon: "pencil",
          onPress: () => router.push(`/users/${id}/edit` as never),
        }}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar e status */}
        <View style={[styles.profileSection, { backgroundColor: colors.primary }]}>
          <View style={[styles.bigAvatar, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Text style={styles.bigAvatarText}>
              {user.nome
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase() ?? "")
                .join("")}
            </Text>
          </View>
          <Text style={styles.profileName}>{user.nome}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
          <StatusBadge active={user.ativo} />
        </View>

        {/* Informações */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Informações</Text>
          <InfoRow label="ID" value={String(user.id)} />
          <InfoRow label="Nome" value={user.nome} />
          <InfoRow label="E-mail" value={user.email} />
          <InfoRow label="Status" value={user.ativo ? "Ativo" : "Inativo"} />
          {user.globalRoles && <InfoRow label="Roles Globais" value={user.globalRoles} />}
        </View>

        {/* Roles */}
        {roles.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Roles Globais</Text>
            <View style={styles.rolesRow}>
              {roles.map((role) => (
                <View
                  key={role}
                  style={[styles.roleBadge, { backgroundColor: colors.primary + "15" }]}
                >
                  <Text style={[styles.roleBadgeText, { color: colors.primary }]}>{role}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Ações */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Ações</Text>
          <View style={styles.actionsGrid}>
            <ActionButton
              icon="key.fill"
              label="Permissões"
              onPress={() => router.push(`/users/${id}/permissions` as never)}
              color={colors.primary}
            />
            <ActionButton
              icon="pencil"
              label="Editar"
              onPress={() => router.push(`/users/${id}/edit` as never)}
              color="#8B5CF6"
            />
            <ActionButton
              icon="lock.fill"
              label="Reset Senha"
              onPress={() => setConfirmReset(true)}
              color={colors.warning}
            />
            <ActionButton
              icon={user.ativo ? "xmark.circle.fill" : "checkmark.circle.fill"}
              label={user.ativo ? "Inativar" : "Ativar"}
              onPress={() => setConfirmToggle(true)}
              color={user.ativo ? colors.error : colors.success}
            />
          </View>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmToggle}
        title={user.ativo ? "Inativar Usuário" : "Ativar Usuário"}
        message={`Deseja ${user.ativo ? "inativar" : "ativar"} o usuário "${user.nome}"?`}
        confirmLabel={user.ativo ? "Inativar" : "Ativar"}
        destructive={user.ativo}
        loading={toggleStatus.isPending}
        onConfirm={() => toggleStatus.mutate()}
        onCancel={() => setConfirmToggle(false)}
      />

      <ConfirmDialog
        visible={confirmReset}
        title="Redefinir Senha"
        message={`A senha de "${user.nome}" será redefinida para "Mudar@123". O usuário deverá alterá-la no próximo acesso.`}
        confirmLabel="Redefinir"
        destructive
        loading={resetPassword.isPending}
        onConfirm={() => resetPassword.mutate()}
        onCancel={() => setConfirmReset(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    gap: 16,
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: "center",
    padding: 28,
    gap: 8,
  },
  bigAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  bigAvatarText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "700",
  },
  profileName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  profileEmail: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    maxWidth: "60%",
    textAlign: "right",
  },
  rolesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionBtn: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
});
