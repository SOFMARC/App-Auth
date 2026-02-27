import { useState } from "react";
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
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { appsApi, extractErrorMessage } from "@/lib/api";
import { useColors } from "@/hooks/use-colors";
import { useToast } from "@/lib/toast-context";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/ui/screen-header";

export default function NewAppScreen() {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [ativo, setAtivo] = useState(true);
  const router = useRouter();
  const colors = useColors();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const createApp = useMutation({
    mutationFn: () => appsApi.create({ name: name.trim(), key: key.trim().toUpperCase(), ativo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      showSuccess("App criado com sucesso!");
      router.back();
    },
    onError: (err) => showError(extractErrorMessage(err)),
  });

  function handleSave() {
    if (!name.trim()) { showError("Nome é obrigatório."); return; }
    if (!key.trim()) { showError("Chave (Key) é obrigatória."); return; }
    if (!/^[A-Z0-9_-]+$/.test(key.trim().toUpperCase())) {
      showError("Key deve conter apenas letras, números, _ e -");
      return;
    }
    createApp.mutate();
  }

  return (
    <ScreenContainer>
      <ScreenHeader title="Novo App" />
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

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Chave (Key) <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                value={key}
                onChangeText={(t) => setKey(t.toUpperCase())}
                placeholder="EX: MEUAPP"
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <Text style={[styles.hint, { color: colors.muted }]}>
                Identificador único. Use apenas letras maiúsculas, números, _ e -
              </Text>
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
            style={[styles.saveButton, { backgroundColor: "#F59E0B" }, createApp.isPending && styles.disabled]}
            onPress={handleSave}
            disabled={createApp.isPending}
            activeOpacity={0.8}
          >
            {createApp.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Criar App</Text>
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
  hint: { fontSize: 11, lineHeight: 16 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 },
  switchDesc: { fontSize: 12, marginTop: 2 },
  saveButton: { borderRadius: 14, paddingVertical: 16, alignItems: "center", justifyContent: "center", minHeight: 52 },
  disabled: { opacity: 0.7 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
