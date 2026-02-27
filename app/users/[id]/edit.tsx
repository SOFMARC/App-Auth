import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, extractErrorMessage } from "@/lib/api";
import { useColors } from "@/hooks/use-colors";
import { useToast } from "@/lib/toast-context";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/ui/screen-header";

export default function EditUserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [globalRoles, setGlobalRoles] = useState("");

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => usersApi.get(Number(id)),
    enabled: !!id,
  });

  useEffect(() => {
    if (user) {
      setNome(user.nome);
      setEmail(user.email);
      setAtivo(user.ativo);
      setGlobalRoles(user.globalRoles ?? "");
    }
  }, [user]);

  const updateUser = useMutation({
    mutationFn: () =>
      usersApi.update(Number(id), {
        nome: nome.trim(),
        email: email.trim(),
        ativo,
        globalRoles: globalRoles.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showSuccess("Usuário atualizado!");
      router.back();
    },
    onError: (err) => {
      showError(extractErrorMessage(err));
    },
  });

  function handleSave() {
    if (!nome.trim()) { showError("Nome é obrigatório."); return; }
    if (!email.trim()) { showError("E-mail é obrigatório."); return; }
    updateUser.mutate();
  }

  if (isLoading) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Editar Usuário" />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScreenHeader title="Editar Usuário" subtitle={user?.nome} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Dados do Usuário</Text>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Nome <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                value={nome}
                onChangeText={setNome}
                placeholder="Nome completo"
                placeholderTextColor={colors.muted}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                E-mail <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                value={email}
                onChangeText={setEmail}
                placeholder="email@empresa.com"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Roles Globais</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                value={globalRoles}
                onChangeText={setGlobalRoles}
                placeholder="Ex: Master;User (separar por ;)"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.switchRow}>
              <View>
                <Text style={[styles.label, { color: colors.foreground }]}>Usuário Ativo</Text>
                <Text style={[styles.switchDesc, { color: colors.muted }]}>
                  Permite acesso ao sistema
                </Text>
              </View>
              <Switch
                value={ativo}
                onValueChange={setAtivo}
                trackColor={{ false: colors.border, true: colors.primary + "80" }}
                thumbColor={ativo ? colors.primary : colors.muted}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }, updateUser.isPending && styles.disabled]}
            onPress={handleSave}
            disabled={updateUser.isPending}
            activeOpacity={0.8}
          >
            {updateUser.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Salvar Alterações</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 20,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  switchDesc: { fontSize: 12, marginTop: 2 },
  saveButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  disabled: { opacity: 0.7 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
