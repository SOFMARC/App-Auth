import "@/global.css";
// PRIMEIRO import — instala handlers de crash antes de qualquer React
import "@/lib/native-crash-reporter";
import { sendCrashLog } from "@/lib/native-crash-reporter";
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
sendCrashLog("info", "[LAYOUT-1] Módulo _layout.tsx carregado — plataforma: " + Platform.OS);

// Log após imports
sendCrashLog("info", "[LAYOUT-2] Todos os imports carregados com sucesso");

let queryClient: QueryClient;
try {
  sendCrashLog("info", "[LAYOUT-3] Criando QueryClient...");
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 30_000,
      },
    },
  });
  sendCrashLog("info", "[LAYOUT-4] QueryClient criado com sucesso");
} catch (err) {
  sendCrashLog("fatal", "[LAYOUT-3-ERR] Falha ao criar QueryClient: " + String(err));
  throw err;
}

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

  return (
    <CompanyProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </CompanyProvider>
  );
}

export default function RootLayout() {
  sendCrashLog("info", "[LAYOUT-5] RootLayout() chamado — iniciando render");

  const colorScheme = useColorScheme();

  useEffect(() => {
    sendCrashLog("info", "[LAYOUT-6] RootLayout useEffect — componente montado com sucesso!");
    logger.info('init', '[ROOT] RootLayout montado com sucesso');
    return () => {
      logger.info('init', '[ROOT] RootLayout desmontado');
    };
  }, []);

  sendCrashLog("info", "[LAYOUT-7] Iniciando render da árvore de providers...");

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
