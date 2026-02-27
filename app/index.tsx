import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/lib/auth-context";
import { logger } from "@/lib/logger";

/**
 * Ponto de entrada raiz do app.
 * Aguarda a restauração da sessão e redireciona para o destino correto.
 */
export default function Index() {
  const { isLoading, isAuthenticated } = useAuth();

  logger.info('init', `[INDEX] Renderizando: isLoading=${isLoading} isAuthenticated=${isAuthenticated}`);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1A3A5C" }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (isAuthenticated) {
    logger.info('init', '[INDEX] Redirecionando para /(tabs)');
    return <Redirect href="/(tabs)" />;
  }

  logger.info('init', '[INDEX] Redirecionando para /(auth)/login');
  return <Redirect href="/(auth)/login" />;
}
