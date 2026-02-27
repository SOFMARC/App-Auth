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
import { appsApi, extractErrorMessage } from "@/lib/api";
import { useColors } from "@/hooks/use-colors";
import { useToast } from "@/lib/toast-context";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/ui/screen-header";

export default function EditAppScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [ativo, setAtivo] = useState(true);

  const { data: app, isLoading } = useQuery({
    queryKey: ["app", id],
    queryFn: () => appsApi.get(Number(id)),
    enabled: !!id,
  });

  useEffect(() => {
    if (app) {
      setName(app.name);
      setAtivo(app.ativo);
    }
  }, [app]);

  const updateApp = useMutation({
    mutationFn: () => appsApi.update(Number(id), { name: name.trim(), key: app?.key ?? "", ativo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app", id] });
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      showSuccess("App atualizado!");
      router.back();
    },
    onError: (err) => showError(extractErrorMessage(err)),
  });

  function handleSave() {
    if (!name.trim()) { showError("Nome é obrigatório."); return; }
    updateApp.mutate();
  }

  if (isLoading) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Editar App" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScreenHeader title="Editar App" subtitle={app?.name} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Dados do App</Text>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Nome <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                value={name}
                onChangeText={setName}
                placeholder="Nome do app"
                placeholderTextColor={colors.muted}
                autoCapitalize="words"
              />
            </View>

            {/* Key é somente leitura */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Chave (Key)</Text>
              <View style={[styles.readonlyInput, { backgroundColor: colors.border + "40", borderColor: colors.border }]}>
                <Text style={[styles.readonlyText, { color: colors.muted }]}>{app?.key}</Text>
              </View>
              <Text style={[styles.hint, { color: colors.muted }]}>A chave não pode ser alterada após a criação.</Text>
            </View>

            <View style={styles.switchRow}>
              <View>
                <Text style={[styles.label, { color: colors.foreground }]}>App Ativo</Text>
                <Text style={[styles.switchDesc, { color: colors.muted }]}>Habilita o uso do app</Text>
              </View>
              <Switch
                value={ativo}
                onValueChange={setAtivo}
                trackColor={{ false: colors.border, true: "#F59E0B80" }}
                thumbColor={ativo ? "#F59E0B" : colors.muted}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: "#F59E0B" }, updateApp.isPending && styles.disabled]}
            onPress={handleSave}
            disabled={updateApp.isPending}
            activeOpacity={0.8}
          >
            {updateApp.isPending ? (
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
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, lineHeight: 20 },
  readonlyInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  readonlyText: { fontSize: 15, lineHeight: 20 },
  hint: { fontSize: 11, lineHeight: 16 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 },
  switchDesc: { fontSize: 12, marginTop: 2 },
  saveButton: { borderRadius: 14, paddingVertical: 16, alignItems: "center", justifyContent: "center", minHeight: 52 },
  disabled: { opacity: 0.7 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
