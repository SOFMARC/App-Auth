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
import { usersApi, extractErrorMessage } from "@/lib/api";
import { useColors } from "@/hooks/use-colors";
import { useToast } from "@/lib/toast-context";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/ui/screen-header";
import { IconSymbol } from "@/components/ui/icon-symbol";

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  required,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "words";
  required?: boolean;
}) {
  const colors = useColors();
  const [showSecret, setShowSecret] = useState(false);
  const isPassword = secureTextEntry === true;

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.foreground }]}>
        {label}
        {required && <Text style={{ color: colors.error }}> *</Text>}
      </Text>
      <View style={[
        styles.inputWrapper,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}>
        <TextInput
          style={[styles.inputFlex, { color: colors.foreground }]}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !showSecret}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? "none"}
          returnKeyType="next"
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowSecret(!showSecret)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <IconSymbol
              name={showSecret ? "eye.slash.fill" : "eye.fill"}
              size={18}
              color={colors.muted}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function NewUserScreen() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [globalRoles, setGlobalRoles] = useState("");

  const router = useRouter();
  const colors = useColors();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const createUser = useMutation({
    mutationFn: () =>
      usersApi.create({
        nome: nome.trim(),
        email: email.trim(),
        password,
        ativo,
        globalRoles: globalRoles.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showSuccess("Usuário criado com sucesso!");
      router.back();
    },
    onError: (err) => {
      showError(extractErrorMessage(err));
    },
  });

  function handleSave() {
    if (!nome.trim()) { showError("Nome é obrigatório."); return; }
    if (!email.trim()) { showError("E-mail é obrigatório."); return; }
    if (!password) { showError("Senha é obrigatória."); return; }
    if (password.length < 6) { showError("Senha deve ter no mínimo 6 caracteres."); return; }
    createUser.mutate();
  }

  return (
    <ScreenContainer>
      <ScreenHeader title="Novo Usuário" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Dados do Usuário</Text>

            <FormField
              label="Nome"
              value={nome}
              onChangeText={setNome}
              placeholder="Nome completo"
              autoCapitalize="words"
              required
            />
            <FormField
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="email@empresa.com"
              keyboardType="email-address"
              required
            />
            <FormField
              label="Senha"
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
              required
            />
            <FormField
              label="Roles Globais"
              value={globalRoles}
              onChangeText={setGlobalRoles}
              placeholder="Ex: Master;User (separar por ;)"
            />

            {/* Status */}
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

          {/* Botão Salvar */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: colors.primary },
              createUser.isPending && styles.disabled,
            ]}
            onPress={handleSave}
            disabled={createUser.isPending}
            activeOpacity={0.8}
          >
            {createUser.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Criar Usuário</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  inputFlex: {
    flex: 1,
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
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
