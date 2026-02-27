import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/lib/auth-context";

/**
 * Ponto de entrada raiz do app.
 * Aguarda a restauração da sessão e redireciona para o destino correto.
 */
export default function Index() {
  const { isLoading, isAuthenticated } = useAuth();

  // Mostrar loading enquanto a sessão está sendo restaurada
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1A3A5C" }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  // Redirecionar para o destino correto após a restauração
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
