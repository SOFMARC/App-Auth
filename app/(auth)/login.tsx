import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { extractErrorMessage } from "@/lib/api";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenContainer } from "@/components/screen-container";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, sessionExpiredMessage, clearSessionMessage } = useAuth();
  const { showError, showWarning } = useToast();
  const router = useRouter();
  const colors = useColors();

  useEffect(() => {
    if (sessionExpiredMessage) {
      showWarning(sessionExpiredMessage);
      clearSessionMessage();
    }
  }, [sessionExpiredMessage]);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      showError("Preencha e-mail e senha.");
      return;
    }

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      // AuthGuard vai redirecionar automaticamente
    } catch (err) {
      showError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer
      edges={["top", "bottom", "left", "right"]}
      containerClassName="bg-primary"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header com logo */}
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
              <Image
                source={require("@/assets/images/icon.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>IAM Admin</Text>
            <Text style={styles.appSubtitle}>Painel de Gerenciamento de Identidade</Text>
          </View>

          {/* Card de login */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Entrar</Text>
            <Text style={[styles.cardSubtitle, { color: colors.muted }]}>
              Acesso exclusivo para administradores
            </Text>

            {/* Campo e-mail */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: colors.foreground }]}>E-mail</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <IconSymbol name="person.fill" size={18} color={colors.muted} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="admin@empresa.com"
                  placeholderTextColor={colors.muted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Campo senha */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: colors.foreground }]}>Senha</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <IconSymbol name="lock.fill" size={18} color={colors.muted} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <IconSymbol
                    name={showPassword ? "eye.slash.fill" : "eye.fill"}
                    size={18}
                    color={colors.muted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Botão Entrar */}
            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            {/* Link para configurações */}
            <TouchableOpacity
              style={styles.settingsLink}
              onPress={() => router.push("/settings-url" as never)}
            >
              <IconSymbol name="gearshape.fill" size={14} color={colors.muted} />
              <Text style={[styles.settingsLinkText, { color: colors.muted }]}>
                Configurar URL da API
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 32,
  },
  header: {
    alignItems: "center",
    gap: 12,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logo: {
    width: 80,
    height: 80,
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
  },
  card: {
    borderRadius: 20,
    padding: 24,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: -8,
  },
  fieldContainer: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  loginButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    minHeight: 50,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  settingsLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
  },
  settingsLinkText: {
    fontSize: 13,
  },
});
