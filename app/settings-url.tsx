import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { configApi } from "@/lib/api";
import { DEFAULT_API_URL } from "@/lib/storage";
import { useToast } from "@/lib/toast-context";
import { useColors } from "@/hooks/use-colors";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function SettingsUrlScreen() {
  const [url, setUrl] = useState("");
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const colors = useColors();

  useEffect(() => {
    configApi.getBaseUrl().then(setUrl);
  }, []);

  async function handleTest() {
    if (!url.trim()) {
      showError("Informe a URL da API.");
      return;
    }
    setTesting(true);
    try {
      await configApi.setBaseUrl(url.trim());
      const ok = await configApi.testConnection();
      if (ok) {
        showSuccess("Conexão bem-sucedida!");
      } else {
        showError("Não foi possível conectar à API. Verifique a URL.");
      }
    } catch {
      showError("Erro ao testar conexão.");
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    if (!url.trim()) {
      showError("Informe a URL da API.");
      return;
    }
    setSaving(true);
    try {
      await configApi.setBaseUrl(url.trim());
      showSuccess("URL salva com sucesso!");
      router.back();
    } catch {
      showError("Erro ao salvar URL.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <IconSymbol name="chevron.left" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.foreground }]}>Configurações da API</Text>
          </View>

          {/* Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.iconRow}>
              <IconSymbol name="wifi" size={24} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>URL Base da API</Text>
            </View>
            <Text style={[styles.cardDesc, { color: colors.muted }]}>
              Configure o endereço do servidor da Auth API. Padrão: {DEFAULT_API_URL}
            </Text>

            <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder={DEFAULT_API_URL}
                placeholderTextColor={colors.muted}
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="done"
              />
            </View>

            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.testButton, { borderColor: colors.primary }]}
                onPress={handleTest}
                disabled={testing}
                activeOpacity={0.8}
              >
                {testing ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <IconSymbol name="wifi" size={16} color={colors.primary} />
                    <Text style={[styles.testButtonText, { color: colors.primary }]}>
                      Testar Conexão
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: 20,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    gap: 16,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
  },
  testButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 12,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
