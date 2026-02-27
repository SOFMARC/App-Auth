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
import { companiesApi, extractErrorMessage } from "@/lib/api";
import { useColors } from "@/hooks/use-colors";
import { useToast } from "@/lib/toast-context";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/ui/screen-header";

export default function EditCompanyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [ativo, setAtivo] = useState(true);

  const { data: company, isLoading } = useQuery({
    queryKey: ["company", id],
    queryFn: () => companiesApi.get(Number(id)),
    enabled: !!id,
  });

  useEffect(() => {
    if (company) {
      setName(company.name);
      setAtivo(company.ativo);
    }
  }, [company]);

  const updateCompany = useMutation({
    mutationFn: () => companiesApi.update(Number(id), { name: name.trim(), ativo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company", id] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      showSuccess("Empresa atualizada!");
      router.back();
    },
    onError: (err) => showError(extractErrorMessage(err)),
  });

  function handleSave() {
    if (!name.trim()) { showError("Nome é obrigatório."); return; }
    updateCompany.mutate();
  }

  if (isLoading) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Editar Empresa" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScreenHeader title="Editar Empresa" subtitle={company?.name} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Dados da Empresa</Text>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Nome <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                value={name}
                onChangeText={setName}
                placeholder="Nome da empresa"
                placeholderTextColor={colors.muted}
                autoCapitalize="words"
                returnKeyType="done"
              />
            </View>

            <View style={styles.switchRow}>
              <View>
                <Text style={[styles.label, { color: colors.foreground }]}>Empresa Ativa</Text>
                <Text style={[styles.switchDesc, { color: colors.muted }]}>Habilita o uso da empresa</Text>
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
            style={[styles.saveButton, { backgroundColor: "#8B5CF6" }, updateCompany.isPending && styles.disabled]}
            onPress={handleSave}
            disabled={updateCompany.isPending}
            activeOpacity={0.8}
          >
            {updateCompany.isPending ? (
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
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 },
  switchDesc: { fontSize: 12, marginTop: 2 },
  saveButton: { borderRadius: 14, paddingVertical: 16, alignItems: "center", justifyContent: "center", minHeight: 52 },
  disabled: { opacity: 0.7 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
