import "@/global.css";
// PRIMEIRO import — instala handlers de crash antes de qualquer React
import "@/lib/native-crash-reporter";
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Platform, View, ActivityIndicator } from "react-native";
import "@/lib/_core/nativewind-pressable";

import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ToastProvider } from "@/lib/toast-context";
import { CompanyProvider } from "@/lib/company-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/error-boundary";
import { logger } from "@/lib/logger";

// Log imediato ao carregar o módulo (antes de qualquer React)
logger.info('init', `[LAYOUT] Módulo _layout.tsx carregado — plataforma: ${Platform.OS}`);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export const unstable_settings = {
  anchor: "(auth)",
};

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    logger.info('init', `[AUTHGUARD] Estado: isLoading=${isLoading} isAuthenticated=${isAuthenticated} segments=${JSON.stringify(segments)}`);

    if (isLoading) return;

    const firstSegment = (segments as string[])[0];
    const inAuthGroup = firstSegment === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      logger.info('init', '[AUTHGUARD] Redirecionando para /(auth)/login');
      router.replace("/(auth)/login" as never);
    } else if (isAuthenticated && inAuthGroup) {
      logger.info('init', '[AUTHGUARD] Redirecionando para /(tabs)');
      router.replace("/(tabs)" as never);
    } else {
      logger.info('init', `[AUTHGUARD] Sem redirecionamento necessário — inAuthGroup=${inAuthGroup}`);
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    logger.info('init', '[AUTHGUARD] Exibindo tela de loading...');
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1A3A5C",
        }}
      >
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  logger.info('init', '[AUTHGUARD] Montando CompanyProvider + ToastProvider + children');

  return (
    <CompanyProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </CompanyProvider>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    logger.info('init', '[ROOT] RootLayout montado com sucesso');
    return () => {
      logger.info('init', '[ROOT] RootLayout desmontado');
    };
  }, []);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <AuthProvider>
                <AuthGuard>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="settings-url" />
                    <Stack.Screen name="users/[id]" />
                    <Stack.Screen name="users/new" />
                    <Stack.Screen name="users/[id]/edit" />
                    <Stack.Screen name="users/[id]/permissions" />
                    <Stack.Screen name="companies/[id]" />
                    <Stack.Screen name="companies/new" />
                    <Stack.Screen name="companies/[id]/edit" />
                    <Stack.Screen name="apps/[id]" />
                    <Stack.Screen name="apps/new" />
                    <Stack.Screen name="apps/[id]/edit" />
                    <Stack.Screen name="apps/[id]/roles" />
                    <Stack.Screen name="oauth/callback" />
                    <Stack.Screen name="diagnostic" />
                  </Stack>
                </AuthGuard>
                <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
              </AuthProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
