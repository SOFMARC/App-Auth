import { Redirect } from "expo-router";

/**
 * Ponto de entrada raiz do app.
 * O AuthGuard em _layout.tsx vai redirecionar para /(tabs) se o usuário já estiver autenticado.
 * Caso contrário, cai aqui e redireciona para a tela de login.
 */
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
