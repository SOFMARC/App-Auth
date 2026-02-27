import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { authApi, extractErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ScreenContainer } from "@/components/screen-container";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconSymbol } from "@/components/ui/icon-symbol";

function SettingsRow({
  icon,
  label,
  subtitle,
  onPress,
  iconColor,
  rightElement,
  destructive,
}: {
  icon: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  iconColor?: string;
  rightElement?: React.ReactNode;
  destructive?: boolean;
}) {
  const colors = useColors();
  const color = iconColor ?? colors.primary;
  const textColor = destructive ? colors.error : colors.foreground;

  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress && !rightElement}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.rowIcon, { backgroundColor: color + "15" }]}>
        <IconSymbol name={icon as never} size={18} color={color} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: textColor }]}>{label}</Text>
        {subtitle && <Text style={[styles.rowSubtitle, { color: colors.muted }]}>{subtitle}</Text>}
      </View>
      {rightElement ?? (onPress && (
        <IconSymbol name="chevron.right" size={16} color={colors.muted} />
      ))}
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  const colors = useColors();
  return (
    <Text style={[styles.sectionHeader, { color: colors.muted }]}>{title.toUpperCase()}</Text>
  );
}

export default function SettingsScreen() {
  const { user, logout, isMaster } = useAuth();
  const { showSuccess, showError } = useToast();
  const router = useRouter();
  const colors = useColors();
  const colorScheme = useColorScheme();

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const changePassword = useMutation({
    mutationFn: () =>
      authApi.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword,
      }),
    onSuccess: () => {
      showSuccess("Senha alterada com sucesso!");
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err) => showError(extractErrorMessage(err)),
  });

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      showError("Erro ao sair.");
    } finally {
      setLoggingOut(false);
      setConfirmLogout(false);
    }
  }

  function handleChangePassword() {
    if (!currentPassword) { showError("Informe a senha atual."); return; }
    if (!newPassword) { showError("Informe a nova senha."); return; }
    if (newPassword.length < 6) { showError("Nova senha deve ter no mínimo 6 caracteres."); return; }
    if (newPassword !== confirmPassword) { showError("As senhas não coincidem."); return; }
    changePassword.mutate();
  }

  const roles = user?.roles?.split(";").filter(Boolean) ?? [];

  return (
    <ScreenContainer>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Configurações</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Perfil */}
        <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
          <View style={[styles.avatar, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Text style={styles.avatarText}>
              {(user?.nome ?? "A")
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase() ?? "")
                .join("")}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.nome}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.rolesRow}>
              {roles.map((role) => (
                <View key={role} style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{role}</Text>
                </View>
              ))}
              {isMaster && (
                <View style={[styles.roleBadge, { backgroundColor: "rgba(255,215,0,0.25)" }]}>
                  <Text style={[styles.roleBadgeText, { color: "#FFD700" }]}>MASTER</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Conta */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SectionHeader title="Conta" />
          <SettingsRow
            icon="lock.fill"
            label="Alterar Senha"
            subtitle="Modifique sua senha de acesso"
            onPress={() => setShowPasswordForm(!showPasswordForm)}
            iconColor="#8B5CF6"
          />
          {showPasswordForm && (
            <View style={[styles.passwordForm, { borderTopColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Senha atual"
                placeholderTextColor={colors.muted}
                secureTextEntry
              />
              <TextInput
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Nova senha (mín. 6 caracteres)"
                placeholderTextColor={colors.muted}
                secureTextEntry
              />
              <TextInput
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirmar nova senha"
                placeholderTextColor={colors.muted}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleChangePassword}
              />
              <TouchableOpacity
                style={[styles.changePasswordBtn, { backgroundColor: "#8B5CF6" }, changePassword.isPending && styles.disabled]}
                onPress={handleChangePassword}
                disabled={changePassword.isPending}
                activeOpacity={0.8}
              >
                {changePassword.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.changePasswordBtnText}>Alterar Senha</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* API */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SectionHeader title="Conexão" />
          <SettingsRow
            icon="wifi"
            label="URL da API"
            subtitle="Configurar endereço do servidor"
            onPress={() => router.push("/settings-url" as never)}
            iconColor={colors.primary}
          />
        </View>

        {/* Sobre */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SectionHeader title="Sobre" />
          <SettingsRow
            icon="shield.fill"
            label="IAM Admin"
            subtitle="Painel de Gerenciamento de Identidade"
            iconColor={colors.primary}
          />
          <SettingsRow
            icon="info.circle.fill"
            label="Versão"
            subtitle="1.0.0"
            iconColor={colors.muted}
          />
        </View>

        {/* Sair */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingsRow
            icon="arrow.right.square.fill"
            label="Sair"
            subtitle="Encerrar sessão"
            onPress={() => setConfirmLogout(true)}
            iconColor={colors.error}
            destructive
          />
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmLogout}
        title="Sair"
        message="Deseja encerrar sua sessão?"
        confirmLabel="Sair"
        destructive
        loading={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  title: { fontSize: 22, fontWeight: "700" },
  content: {
    gap: 16,
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 22, fontWeight: "700" },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { color: "#fff", fontSize: 17, fontWeight: "700" },
  profileEmail: { color: "rgba(255,255,255,0.75)", fontSize: 12 },
  rolesRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  roleBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 0.5,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 15, fontWeight: "500" },
  rowSubtitle: { fontSize: 12 },
  passwordForm: {
    padding: 16,
    gap: 12,
    borderTopWidth: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 20,
  },
  changePasswordBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
  },
  disabled: { opacity: 0.7 },
  changePasswordBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
